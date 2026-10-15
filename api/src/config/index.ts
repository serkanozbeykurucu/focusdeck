import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: required('JWT_SECRET'),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  jwtExpiresIn: '7d' as const,
};
