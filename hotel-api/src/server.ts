import { config } from './config/index.js';
import { dbManager } from './database/connection.js';
import { createApp } from './app.js';

async function bootstrap() {
  try {
    // 1. Establish database connection
    await dbManager.connect();
    const asOf = dbManager.getAsOfDate();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`\n🏨 Hotel Intelligence API is running!`);
      console.log(`   ➜ Local:   http://localhost:${config.port}`);
      console.log(`   ➜ Health:  http://localhost:${config.port}/api/health`);
      console.log(`   ➜ Dash:    http://localhost:${config.port}/api/dashboard`);
      console.log(`   ➜ Chat:    http://localhost:${config.port}/api/chat`);
      console.log(`   ➜ DB:      ${config.dbName} (Data as of: ${asOf})`);
      console.log(`   ➜ Model:   ${config.model} @ ${config.ollamaHost}\n`);
    });

    // 4. Graceful shutdown handler
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Commencing graceful shutdown...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed.');
        await dbManager.close();
        console.log('👋 Process terminated successfully.');
        process.exit(0);
      });

      // Force close if graceful shutdown hangs
      const forceTimer = setTimeout(() => {
        console.error('⚠️ Force shutdown timed out after 5s. Exiting.');
        process.exit(1);
      }, 5000);
      if (forceTimer && typeof forceTimer === 'object' && 'unref' in forceTimer) {
        (forceTimer as any).unref();
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('💥 Fatal error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();
