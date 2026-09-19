/**
 * MIDDLEWARE — Validate đầu vào.
 *
 * Không dùng thư viện để thấy rõ việc đang làm: kiểm tra ở SERVER là bắt buộc,
 * vì ai cũng gọi thẳng API bằng curl, bỏ qua toàn bộ giao diện.
 */
import { AppError } from '../utils/app-error.js';
import { config } from '../config/index.js';

const ID_PATTERN = /^[A-Za-z0-9_.:@+-]{1,64}$/;

/** Id trên đường dẫn phải sạch — nó sẽ trở thành tên file khi lưu tiến độ. */
export function validateIdParam(name) {
  return (req, _res, next) => {
    const value = req.params[name];
    if (!ID_PATTERN.test(value ?? '')) {
      next(AppError.badRequest(`Tham số ${name} không hợp lệ`, [
        { field: name, error: 'chỉ gồm chữ, số và _ . : @ + -' }
      ]));
      return;
    }
    next();
  };
}

/** Kẹp page/size vào khoảng cho phép và gắn vào req.pagination. */
export function parsePagination(req, _res, next) {
  const { defaultSize, maxSize } = config.pagination;

  const toInt = (raw, fallback) => {
    if (raw === undefined || raw === '') return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  };

  const page = Math.max(1, toInt(req.query.page, 1));
  const size = Math.min(maxSize, Math.max(1, toInt(req.query.size, defaultSize)));

  req.pagination = { page, size, skip: (page - 1) * size, take: size };
  next();
}

/** Body phải là object thuần và có đủ các khoá bắt buộc. */
export function requireBodyFields(...fields) {
  return (req, _res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      next(AppError.badRequest('Body phải là một đối tượng JSON'));
      return;
    }

    const missing = fields
      .filter((field) => body[field] === undefined)
      .map((field) => ({ field, error: 'bắt buộc' }));

    if (missing.length > 0) {
      next(AppError.unprocessable('Thiếu trường bắt buộc', missing));
      return;
    }
    next();
  };
}
