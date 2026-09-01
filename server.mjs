import http from 'http';
import { createApp } from './server/app.mjs';
import { initEmbedder } from './server/services/embedding.mjs';
import { initPostgres } from './server/services/postgres.mjs';
import { initRedis } from './server/services/redis.mjs';
import { autoSyncOnStartup } from './server/services/cloudSyncClient.mjs';
import { freePortProcess } from './scripts/free-port.mjs';

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [Unhandled Rejection]:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('⚠️ [Uncaught Exception]:', error);
});

const app = createApp();
const port = Number(process.env.PORT || 3001);
const server = http.createServer(app);

let retryCount = 0;
const MAX_PORT_RETRIES = 2;

function startListening() {
    server.listen(port, () => {
        console.log(`🚀 Gzadm Navigator Admissions AI Engine listening instantly on http://localhost:${port} & http://127.0.0.1:${port}`);

        // Asynchronous background non-blocking initializations for high concurrency
        (async () => {
            const isFastMode = process.env.FAST_STARTUP === 'true' || process.env.FAST_MODE === 'true';

            if (isFastMode) {
                console.log(`⚡ [Fast Mode Active (FAST_STARTUP=true)] Only initializing local Vector Embedder (Service 1); skipping PostgreSQL, Redis and Cloud Sync probes.`);
                await initEmbedder();
            } else {
                await initEmbedder();
                await initPostgres();
                await initRedis();
                await autoSyncOnStartup();
            }
        })();
    });
}

// 端口占用自愈拦截器 (Port Auto-Heal & Conflict Recovery)
server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
        if (retryCount < MAX_PORT_RETRIES) {
            retryCount++;
            console.warn(`⚠️ [Port Auto-Heal] 检测到端口 ${port} 被残留进程占用，正在自动强杀释放并重试 (${retryCount}/${MAX_PORT_RETRIES})...`);
            freePortProcess(port);
            setTimeout(() => {
                startListening();
            }, 350);
        } else {
            console.error(`❌ [Port Error] 端口 ${port} 连续被占且自愈重试超限，请检查其他系统占用！`);
            process.exit(1);
        }
    } else {
        console.error('❌ [Server Error]:', err);
    }
});

// 优雅退出处理器 (Graceful Shutdown - 释放 TCP 端口句柄，防止残留僵尸进程)
const handleGracefulShutdown = (signal) => {
    console.log(`\n🛑 收到 ${signal} 退出信号，正在安全释放端口 ${port} 与关闭服务...`);
    try {
        server.close(() => {
            console.log(`✅ 服务已安全停止，端口 ${port} 已释放。`);
            process.exit(0);
        });
    } catch {
        process.exit(0);
    }
    // 强制兜底超时 (1秒)
    setTimeout(() => process.exit(0), 1000).unref();
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startListening();

// Prevent event loop from prematurely exiting in daemon mode
setInterval(() => { }, 1000 * 60 * 60);