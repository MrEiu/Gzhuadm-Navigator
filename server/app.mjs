import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { uploadsDir, distDir } from './config/env.mjs';
import { embedder } from './services/embedding.mjs';
import { usePostgres } from './services/postgres.mjs';
import { useRedis } from './services/redis.mjs';

import authRouter from './routes/auth.mjs';
import chatRouter from './routes/chat.mjs';
import userRouter from './routes/user.mjs';
import ragRouter from './routes/rag.mjs';
import adminRouter from './routes/admin.mjs';

export const createApp = () => {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    // Static upload assets
    app.use('/uploads', (req, res, next) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        next();
    }, express.static(uploadsDir));

    // Static production frontend bundle (if built)
    if (fs.existsSync(distDir)) {
        app.use(express.static(distDir, {
            maxAge: '1y',
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.html')) {
                    res.setHeader('Cache-Control', 'no-cache');
                }
            }
        }));
    }

    // Health check endpoint
    app.get('/api/health', (_req, res) => {
        res.json({
            ok: true,
            system: 'Gzadm Navigator Admissions AI + Local BGE RAG DB',
            embeddingModel: embedder ? 'Local BGE-small-zh 512-dim' : 'Fallback Keyword Engine',
            database: usePostgres ? 'PostgreSQL pgvector' : 'JSON Persistence',
            cache: useRedis ? 'Redis' : 'Memory Cache'
        });
    });

    // Mount Modular Routes
    app.use('/api/auth', authRouter);
    app.use('/api/aura', chatRouter);
    app.use('/api/user', userRouter);
    app.use('/api/admin', ragRouter);
    app.use('/api/admin', adminRouter);

    // SPA fallback route
    if (fs.existsSync(distDir)) {
        app.use((req, res, next) => {
            if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
                return res.sendFile(path.join(distDir, 'index.html'));
            }
            next();
        });
    }

    return app;
};
