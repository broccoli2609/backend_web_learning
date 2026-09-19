/**
 * MIDDLEWARE — Gắn traceId và ghi log có cấu trúc cho mỗi request.
 *
 * Mỗi request được cấp một mã riêng, trả về trong header `X-Trace-Id` và xuất
 * hiện trong mọi dòng log của chính nó. Khi người dùng báo lỗi kèm mã đó, bạn
 * lọc log theo một chuỗi là thấy toàn bộ hành trình.
 */
import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(level) {
  return LEVELS[level] >= (LEVELS[config.logLevel] ?? LEVELS.info);
}

export function log(level, fields) {
  if (!shouldLog(level)) return;

  const line = { level, time: new Date().toISOString(), ...fields };
  const text = config.isProduction
    ? JSON.stringify(line)
    : `[${line.time.slice(11, 19)}] ${level.toUpperCase().padEnd(5)} ${fields.msg ?? ''} ${
        fields.traceId ? `(${fields.traceId.slice(0, 8)})` : ''
      }`;

  if (level === 'error') console.error(text);
  else console.log(text);
}

export function requestContext(req, res, next) {
  req.traceId = req.get('X-Trace-Id') ?? randomUUID();
  res.set('X-Trace-Id', req.traceId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    log(level, {
      msg: `${req.method} ${req.originalUrl} → ${res.statusCode}`,
      traceId: req.traceId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(ms * 10) / 10
    });
  });

  next();
}
