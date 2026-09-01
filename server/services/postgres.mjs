import pg from 'pg';
import fs from 'fs';
import { ragFilePath } from '../config/env.mjs';
import { DEFAULT_RAG_KNOWLEDGE } from '../config/constants.mjs';
import { getEmbedding } from './embedding.mjs';

const { Pool } = pg;
export let pgPool = null;
export let usePostgres = false;

export const initPostgres = async () => {
    let targetPort = Number(process.env.POSTGRES_PORT || process.env.PGPORT || 35432);
    const pgConfig = {
        host: process.env.POSTGRES_HOST || process.env.PGHOST || 'localhost',
        port: targetPort,
        user: process.env.POSTGRES_USER || process.env.PGUSER || 'aurasense',
        password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || 'aurasensepass',
        database: process.env.POSTGRES_DB || process.env.PGDATABASE || 'aurasense',
        connectionTimeoutMillis: 600,
    };

    try {
        pgPool = new Pool(pgConfig);
        let client;
        try {
            client = await pgPool.connect();
        } catch (firstErr) {
            if (!process.env.POSTGRES_PORT && targetPort === 35432) {
                pgConfig.port = 5432;
                pgPool = new Pool(pgConfig);
                client = await pgPool.connect();
            } else {
                throw firstErr;
            }
        }
        client.release();
        usePostgres = true;
        console.log(`✅ [PostgreSQL Ready] Successfully connected to ${pgConfig.host}:${pgConfig.port}/${pgConfig.database} (pgvector active)`);

        // Create Extension & Tables
        await pgPool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        profile JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB;

      CREATE TABLE IF NOT EXISTS user_personal_rag (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT '个人偏好',
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        content TEXT NOT NULL,
        tags JSONB,
        embedding vector(512),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_personal_rag_username ON user_personal_rag(username);

      CREATE TABLE IF NOT EXISTS rag_knowledge (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        target_agent VARCHAR(50) DEFAULT 'all',
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        content TEXT,
        table_data JSONB,
        image_attachments JSONB,
        tags JSONB,
        embedding vector(512),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE rag_knowledge ADD COLUMN IF NOT EXISTS target_agent VARCHAR(50) DEFAULT 'all';

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        mode VARCHAR(20) DEFAULT 'admissions',
        messages JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'admissions';
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_username ON chat_sessions(username);
    `);

        // Seed admin user
        await pgPool.query(`
      INSERT INTO users (username, password, role)
      VALUES ('admin', 'admin123', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);

        // Upsert seed multi-agent RAG items with embeddings
        for (const item of DEFAULT_RAG_KNOWLEDGE) {
            const textToEmbed = `${item.title} ${item.category} ${item.content} ${(item.tags || []).join(' ')}`;
            const vec = await getEmbedding(textToEmbed);
            const vecStr = vec ? `[${vec.join(',')}]` : null;

            await pgPool.query(
                `INSERT INTO rag_knowledge (id, title, category, target_agent, type, content, table_data, image_attachments, tags, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title, category = EXCLUDED.category, target_agent = EXCLUDED.target_agent,
             type = EXCLUDED.type, content = EXCLUDED.content, table_data = EXCLUDED.table_data,
             tags = EXCLUDED.tags, embedding = EXCLUDED.embedding, updated_at = EXCLUDED.updated_at`,
                [
                    item.id, item.title, item.category, item.targetAgent || 'all', item.type, item.content,
                    JSON.stringify(item.tableData), JSON.stringify(item.imageAttachments),
                    JSON.stringify(item.tags), vecStr, item.updatedAt
                ]
            );
        }
    } catch (err) {
        console.warn(`⚠️ PostgreSQL connection failed (${err.message}). Falling back to local JSON persistence.`);
        usePostgres = false;
    }
};

// Local JSON fallback helpers
export const loadJsonRag = () => {
    if (!fs.existsSync(ragFilePath)) {
        fs.writeFileSync(ragFilePath, JSON.stringify(DEFAULT_RAG_KNOWLEDGE, null, 2), 'utf8');
        return DEFAULT_RAG_KNOWLEDGE;
    }
    try {
        return JSON.parse(fs.readFileSync(ragFilePath, 'utf8'));
    } catch {
        return DEFAULT_RAG_KNOWLEDGE;
    }
};

export const saveJsonRag = (data) => {
    fs.writeFileSync(ragFilePath, JSON.stringify(data, null, 2), 'utf8');
};

export const getRagStore = async () => {
    if (usePostgres) {
        try {
            const res = await pgPool.query('SELECT * FROM rag_knowledge ORDER BY updated_at DESC');
            return res.rows.map(r => ({
                id: r.id,
                title: r.title,
                category: r.category,
                targetAgent: r.target_agent || 'all',
                type: r.type,
                content: r.content,
                tableData: r.table_data,
                imageAttachments: r.image_attachments || [],
                tags: r.tags || [],
                embedding: r.embedding ? (typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding) : null,
                updatedAt: r.updated_at
            }));
        } catch (e) {
            console.error('PostgreSQL query error, using JSON fallback:', e);
            return loadJsonRag();
        }
    }
    return loadJsonRag();
};
