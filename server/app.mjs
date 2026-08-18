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
import adminRouter, { loadCampusMapData, loadAgentConfig } from './routes/admin.mjs';
import { loadTtsConfig, synthesizeTTS, MSEDGE_PRESET_VOICES } from './services/ttsService.mjs';

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

    app.get('/api/campus-map', (_req, res) => {
        const data = loadCampusMapData();
        res.json({ ok: true, data });
    });

    app.get('/api/agent-config', (_req, res) => {
        const data = loadAgentConfig();
        res.json({ ok: true, data });
    });

    app.get('/api/tts-config', (_req, res) => {
        const data = loadTtsConfig();
        res.json({ ok: true, data, presetVoices: MSEDGE_PRESET_VOICES });
    });

    app.post('/api/tts/synthesize', async (req, res) => {
        try {
            const { text, voice, rate, pitch, engine, options } = req.body || {};
            if (!text || typeof text !== 'string') {
                return res.status(400).json({ ok: false, error: '缺少待合成文本 (text)' });
            }
            const audioBuffer = await synthesizeTTS(text, { voice, rate, pitch, engine, ...(options || {}) });
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', audioBuffer.length);
            res.send(audioBuffer);
        } catch (err) {
            console.error('TTS Synthesize Route Error:', err);
            res.status(500).json({ ok: false, error: err.message || '语音合成失败' });
        }
    });

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
