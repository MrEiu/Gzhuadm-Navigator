import { createClient } from 'redis';

export let redisClient = null;
export let useRedis = false;
const memoryCache = new Map();

export const initRedis = async () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`⏳ [Redis Cache] Connecting to ${redisUrl}...`);
    try {
        redisClient = createClient({ url: redisUrl, socket: { connectTimeout: 3000 } });
        redisClient.on('error', (err) => console.warn('  ⚠️ [Redis Socket Warning]:', err.message));
        await redisClient.connect();
        useRedis = true;
        console.log(`✅ [Redis Cache Ready] High-speed cache active at ${redisUrl}`);
    } catch (err) {
        console.warn(`⚠️ [Redis Cache Warning] Failed to connect to ${redisUrl} (${err.message}).`);
        console.warn(`  👉 Fallback in-memory Map cache activated.`);
        useRedis = false;
    }
};

export const withTimeout = (promise, ms = 250) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis operation timed out')), ms))
    ]);
};

export const getCache = async (key) => {
    if (useRedis && redisClient?.isOpen) {
        try {
            const val = await withTimeout(redisClient.get(key), 250);
            return val ? JSON.parse(val) : null;
        } catch {
            // fallback to memory cache seamlessly
        }
    }
    const mem = memoryCache.get(key);
    if (mem && mem.expire > Date.now()) return mem.value;
    return null;
};

export const setCache = async (key, val, ttlSeconds = 600) => {
    if (useRedis && redisClient?.isOpen) {
        try {
            await withTimeout(redisClient.set(key, JSON.stringify(val), { EX: ttlSeconds }), 250);
        } catch { }
    }
    memoryCache.set(key, { value: val, expire: Date.now() + ttlSeconds * 1000 });
};

export const invalidateRagCache = async () => {
    if (useRedis && redisClient?.isOpen) {
        try {
            const keys = await withTimeout(redisClient.keys('rag:*'), 250);
            if (keys && keys.length) await withTimeout(redisClient.del(keys), 250);
        } catch { }
    }
    memoryCache.clear();
};
