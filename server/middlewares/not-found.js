/**
 * MIDDLEWARE — Không khớp route nào.
 *
 * Đặt sau toàn bộ route, trước middleware xử lý lỗi. Nó không tự trả response
 * mà ném lỗi, để mọi lỗi đi chung một đường và có cùng định dạng.
 */
import { AppError } from '../utils/app-error.js';

export function notFound(req, _res, next) {
  next(AppError.notFound(`Không có endpoint ${req.method} ${req.originalUrl}`));
}
