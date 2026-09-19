/**
 * MODEL — Tiến độ, lưu thành file JSON.
 *
 * Đây là lớp repository: nó là nơi DUY NHẤT biết dữ liệu nằm ở đâu và có hình
 * dạng gì trên đĩa. Service phía trên chỉ gọi `findByUser` / `save` và không
 * biết đó là file hay database — đổi sang PostgreSQL sau này chỉ phải viết lại
 * file này.
 *
 * Mỗi người dùng một file để hai người ghi cùng lúc không đè nhau. Ghi theo
 * kiểu "ghi file tạm rồi đổi tên": nếu tiến trình chết giữa chừng, file cũ vẫn
 * nguyên vẹn thay vì thành một nửa JSON hỏng.
 */
import { readFile, writeFile, rename, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';

const dir = join(config.paths.storage, 'progress');

const emptyProgress = () => ({ lessons: {}, quizzes: {}, exercises: {}, roadmap: {} });

function fileFor(userId) {
  return join(dir, `${userId}.json`);
}

async function ensureDir() {
  await mkdir(dir, { recursive: true });
}

export const progressRepository = {
  async init() {
    await ensureDir();
  },

  /** Trả về bản ghi của người dùng, hoặc bản rỗng nếu chưa có. */
  async findByUser(userId) {
    try {
      const raw = await readFile(fileFor(userId), 'utf8');
      const parsed = JSON.parse(raw);
      return {
        userId,
        data: { ...emptyProgress(), ...(parsed.data ?? {}) },
        submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
        updatedAt: parsed.updatedAt ?? null
      };
    } catch (err) {
      if (err.code === 'ENOENT') {
        return { userId, data: emptyProgress(), submissions: [], updatedAt: null };
      }
      throw err;
    }
  },

  async save(record) {
    await ensureDir();

    const payload = { ...record, updatedAt: new Date().toISOString() };
    const temp = join(dir, `.${record.userId}.${randomUUID()}.tmp`);

    await writeFile(temp, JSON.stringify(payload, null, 2), 'utf8');
    await rename(temp, fileFor(record.userId));

    return payload;
  },

  async countUsers() {
    try {
      const files = await readdir(dir);
      return files.filter((name) => name.endsWith('.json')).length;
    } catch (err) {
      if (err.code === 'ENOENT') return 0;
      throw err;
    }
  },

  emptyProgress
};
