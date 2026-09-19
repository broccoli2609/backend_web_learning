/**
 * SERVICE — Health check.
 *
 * Đúng như chương 7 nói, tách hai loại:
 *   - liveness : tiến trình còn sống không — phải rất nhẹ, không chạm phụ thuộc
 *   - readiness: đã sẵn sàng nhận traffic chưa — mới kiểm tra nơi lưu trữ
 * Nếu liveness cũng đi kiểm tra ổ đĩa, một sự cố ngắn sẽ khiến container tự
 * khởi động lại liên tục, biến sự cố nhỏ thành sự cố lớn.
 */
import { access, constants } from 'node:fs/promises';
import { config } from '../config/index.js';
import { contentRepository } from '../models/content.model.js';
import { progressRepository } from '../models/progress.model.js';

const startedAt = Date.now();

async function checkStorage() {
  try {
    await progressRepository.init();
    await access(config.paths.storage, constants.W_OK);
    return { status: 'healthy', critical: true };
  } catch (err) {
    return { status: 'down', critical: true, error: err.code ?? 'unknown' };
  }
}

function checkContent() {
  const loaded = contentRepository.chapters().length > 0 && contentRepository.exercises().length > 0;
  return { status: loaded ? 'healthy' : 'down', critical: true };
}

/** Gom trạng thái từng phần thành một kết luận — giống bài tập node-25. */
function combine(checks) {
  const summary = {};
  const failing = [];
  let criticalDown = false;

  for (const [name, info] of Object.entries(checks)) {
    summary[name] = info.status;
    if (info.status !== 'healthy') {
      failing.push(name);
      if (info.critical) criticalDown = true;
    }
  }
  failing.sort();

  const status = criticalDown ? 'unhealthy' : failing.length ? 'degraded' : 'healthy';
  return { status, httpStatus: criticalDown ? 503 : 200, checks: summary, failing };
}

export const healthService = {
  liveness() {
    return {
      status: 'healthy',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      env: config.env
    };
  },

  async readiness() {
    const checks = { content: checkContent(), storage: await checkStorage() };
    return {
      ...combine(checks),
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      env: config.env
    };
  }
};
