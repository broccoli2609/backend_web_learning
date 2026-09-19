/**
 * CONFIG — Đọc cấu hình từ biến môi trường.
 *
 * Đây chính là bài tập node-22 áp dụng vào thật: mọi thứ khác nhau giữa máy cá
 * nhân và máy chủ đều nằm ngoài code, và ứng dụng chết ngay lúc khởi động nếu
 * thiếu cấu hình bắt buộc — tốt hơn nhiều so với hỏng lúc nửa đêm.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..', '..');

function readNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} không phải số: ${raw}`);
  return value;
}

function readList(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

const env = process.env.NODE_ENV ?? 'development';

export const config = {
  env,
  isProduction: env === 'production',
  port: readNumber('PORT', 3000),
  host: process.env.HOST ?? '0.0.0.0',

  paths: {
    root: projectRoot,
    public: join(projectRoot, 'public'),
    data: join(projectRoot, 'public', 'data'),
    storage: process.env.STORAGE_DIR
      ? resolve(process.env.STORAGE_DIR)
      : join(projectRoot, 'server', 'storage')
  },

  cors: {
    // Mặc định chỉ cho origin của máy phát triển. Ở production phải khai báo rõ.
    allowedOrigins: readList('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:3000'])
  },

  pagination: {
    defaultSize: 20,
    maxSize: 100
  },

  logLevel: process.env.LOG_LEVEL ?? (env === 'production' ? 'info' : 'debug')
};

/** Gọi lúc khởi động: kêu to nếu cấu hình production còn thiếu. */
export function assertConfig() {
  if (config.isProduction && config.cors.allowedOrigins.length === 0) {
    throw new Error('Thiếu CORS_ORIGINS ở môi trường production');
  }
}
