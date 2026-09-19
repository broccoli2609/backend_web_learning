/**
 * MIDDLEWARE — Xử lý lỗi tập trung, đặt cuối pipeline.
 *
 * Quy tắc của chương 7 áp dụng nguyên văn:
 *   - lỗi nghiệp vụ dự đoán được → 4xx kèm thông điệp rõ ràng
 *   - lỗi ngoài dự kiến          → 500 với thông điệp chung, chi tiết chỉ vào log
 * Stack trace không bao giờ ra tới client: nó tiết lộ đường dẫn file, tên thư
 * viện và đôi khi cả cấu trúc bảng.
 *
 * Express nhận ra đây là middleware lỗi nhờ BỐN tham số — thiếu một là nó bị
 * coi như middleware thường và không bao giờ chạy.
 */
import { AppError } from '../utils/app-error.js';
import { log } from './request-context.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const known = err instanceof AppError;
  const status = known ? err.status : 500;

  if (!known || status >= 500) {
    log('error', {
      msg: err.message,
      traceId: req.traceId,
      path: req.originalUrl,
      stack: err.stack
    });
  }

  res.status(status).json({
    type: known ? err.type : 'server_error',
    message: known ? err.message : 'Lỗi hệ thống',
    details: known ? err.details : [],
    traceId: req.traceId
  });
}
