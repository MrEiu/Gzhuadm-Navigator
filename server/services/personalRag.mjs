import fs from 'fs';
import path from 'path';
import { dataDir } from '../config/env.mjs';
import { pgPool, usePostgres } from './postgres.mjs';
import { getEmbedding, cosineSimilarity } from './embedding.mjs';
import { extractMeaningfulTokens } from './ragEngine.mjs';

const userProfilesFilePath = path.join(dataDir, 'user_profiles.json');
const userPersonalRagFilePath = path.join(dataDir, 'user_personal_rag.json');

export const loadJsonProfiles = () => {
    if (!fs.existsSync(userProfilesFilePath)) return {};
    try { return JSON.parse(fs.readFileSync(userProfilesFilePath, 'utf8')); } catch { return {}; }
};

export const saveJsonProfiles = (data) => {
    try { fs.writeFileSync(userProfilesFilePath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) { console.error('Profile save err:', e); }
};

export const loadJsonPersonalRag = () => {
    if (!fs.existsSync(userPersonalRagFilePath)) return {};
    try { return JSON.parse(fs.readFileSync(userPersonalRagFilePath, 'utf8')); } catch { return {}; }
};

export const saveJsonPersonalRag = (data) => {
    try { fs.writeFileSync(userPersonalRagFilePath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) { console.error('Personal RAG save err:', e); }
};

export const getUserProfile = async (username) => {
    if (!username) return null;
    if (usePostgres) {
        try {
            const res = await pgPool.query('SELECT profile FROM users WHERE username = $1', [username]);
            if (res.rows.length && res.rows[0].profile) {
                return res.rows[0].profile;
            }
        } catch (e) {
            console.warn('PG profile fetch error, fallback:', e.message);
        }
    }
    const profiles = loadJsonProfiles();
    return profiles[username] || null;
};

export const searchUserPersonalRagEngine = async (username, query = '', topK = 3) => {
    if (!username || !query || !query.trim()) return [];
    const queryVector = await getEmbedding(query);
    const qTokens = extractMeaningfulTokens(query);

    let personalStore = [];
    if (usePostgres) {
        try {
            const res = await pgPool.query('SELECT * FROM user_personal_rag WHERE username = $1 ORDER BY created_at DESC', [username]);
            personalStore = res.rows.map(r => ({
                id: r.id,
                username: r.username,
                title: r.title,
                category: r.category,
                type: r.type,
                content: r.content,
                tags: r.tags || [],
                embedding: r.embedding ? (typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding) : null,
                createdAt: r.created_at
            }));
        } catch (e) {
            const allRag = loadJsonPersonalRag();
            personalStore = allRag[username] || [];
        }
    } else {
        const allRag = loadJsonPersonalRag();
        personalStore = allRag[username] || [];
    }

    if (!personalStore.length) return [];

    const scored = personalStore.map(item => {
        let score = 0;
        if (queryVector && item.embedding) {
            const vecSim = cosineSimilarity(queryVector, item.embedding);
            if (vecSim >= 0.50) {
                score += ((vecSim - 0.50) / 0.50) * 8.0;
            }
        }
        const docTokens = extractMeaningfulTokens(`${item.title} ${item.content}`);
        let matchedTokenCount = 0;
        for (const qt of qTokens) {
            if (docTokens.includes(qt)) matchedTokenCount++;
        }
        score += matchedTokenCount * 2.5;

        return { item, score: Math.max(0, score) };
    });

    const MIN_ABSOLUTE_SCORE = 4.5;
    const validMatches = scored
        .filter(s => s.score >= MIN_ABSOLUTE_SCORE)
        .sort((a, b) => b.score - a.score);

    if (validMatches.length === 0) return [];

    const maxScore = validMatches[0].score;
    return validMatches
        .filter(s => s.score >= maxScore * 0.70)
        .slice(0, topK);
};

export const saveUserPersonalMemory = async (username, content, title = '对话偏好提炼', category = '个人偏好') => {
    if (!username || !content || content.length < 5) return;
    const textToEmbed = `${title} ${category} ${content}`;
    const vec = await getEmbedding(textToEmbed);

    const newItem = {
        id: `personal-rag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username,
        title,
        category,
        type: 'text',
        content,
        tags: ['个人档案', category],
        embedding: vec,
        createdAt: new Date().toISOString()
    };

    if (usePostgres) {
        try {
            const vecStr = vec ? `[${vec.join(',')}]` : null;
            await pgPool.query(
                `INSERT INTO user_personal_rag (id, username, title, category, type, content, tags, embedding, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [newItem.id, username, newItem.title, newItem.category, newItem.type, newItem.content, JSON.stringify(newItem.tags), vecStr, newItem.createdAt]
            );
        } catch (e) {
            console.warn('PG personal RAG insert warning:', e.message);
        }
    }

    const allRag = loadJsonPersonalRag();
    if (!allRag[username]) allRag[username] = [];
    allRag[username].unshift(newItem);
    saveJsonPersonalRag(allRag);
    return newItem;
};
