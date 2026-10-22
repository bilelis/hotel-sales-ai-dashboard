import { env } from './env.js';

export const config = {
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  dbName: env.DB_NAME,
  ollamaHost: env.OLLAMA_HOST,
  model: env.OLLAMA_MODEL,
  corsOrigin: env.CORS_ORIGIN,
};

export type AppConfig = typeof config;

// Backward compatibility with legacy cfg import
export const cfg = config;
