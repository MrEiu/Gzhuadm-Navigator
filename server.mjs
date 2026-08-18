import { createApp } from './server/app.mjs';
import { initEmbedder } from './server/services/embedding.mjs';
import { initPostgres } from './server/services/postgres.mjs';
import { initRedis } from './server/services/redis.mjs';

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [Unhandled Rejection]:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('⚠️ [Uncaught Exception]:', error);
});

const app = createApp();
const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
    console.log(`🚀 Gzadm Navigator Admissions AI Engine listening instantly on http://localhost:${port} & http://127.0.0.1:${port}`);

    // Asynchronous background non-blocking initializations for high concurrency
    (async () => {
        await initEmbedder();
        await initPostgres();
        await initRedis();
    })();
});

// Prevent event loop from prematurely exiting in daemon mode
setInterval(() => { }, 1000 * 60 * 60);