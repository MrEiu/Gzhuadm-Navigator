import { env, pipeline } from '@xenova/transformers';
import { modelsCacheDir } from '../config/env.mjs';

// Configure persistent local cache directory & HF Mirror for Transformers.js ONNX models
env.cacheDir = modelsCacheDir;
env.remoteHost = 'https://hf-mirror.com';
env.remotePathTemplate = '{model}/resolve/{revision}/';

export let embedder = null;

export const initEmbedder = async () => {
    const modelName = 'Xenova/bge-small-zh-v1.5';
    console.log(`⏳ [ONNX Model] Checking local model cache in: ${modelsCacheDir}`);
    try {
        const startTime = Date.now();
        embedder = await pipeline('feature-extraction', modelName, {
            progress_callback: (info) => {
                if (info.status === 'initiate') {
                    console.log(`  🔍 [Model Check] Initiating ${info.file || info.name || ''}...`);
                } else if (info.status === 'downloading') {
                    const pct = typeof info.progress === 'number' ? info.progress.toFixed(1) : '0.0';
                    console.log(`  📥 [Model Downloading] ${info.file || ''}: ${pct}%`);
                } else if (info.status === 'done') {
                    console.log(`  ✅ [Model File Loaded] ${info.file || ''}`);
                }
            }
        });
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [ONNX Model Ready] Local BGE 512-dim embedding loaded in ${elapsed}s! (Cache: ./data/models_cache)`);
    } catch (err) {
        console.warn(`⚠️ [ONNX Model Warning] Failed to load ${modelName}:`, err.message);
        console.warn(`  👉 Fallback keyword similarity engine will be used.`);
    }
};

export const getEmbedding = async (text = '') => {
    if (!embedder) return null;
    try {
        const cleanText = String(text || '').replace(/\s+/g, ' ').slice(0, 500);
        if (!cleanText) return null;
        const output = await embedder(cleanText, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (err) {
        console.error('Embedding generation error:', err);
        return null;
    }
};

export const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
