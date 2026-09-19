/**
 * Lỗi nghiệp vụ có mã HTTP đi kèm.
 *
 * Service ném lỗi loại này; middleware xử lý lỗi ở cuối pipeline dịch nó thành
 * response. Nhờ vậy service không cần biết gì về HTTP, còn controller không
 * phải viết try/catch ở mọi nơi.
 */
export class AppError extends Error {
  constructor(status, message, { type = 'client_error', details = [] } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.type = type;
    this.details = details;
  }

  static badRequest(message, details = []) {
    return new AppError(400, message, { type: 'validation_error', details });
  }

  static notFound(message = 'Không tìm thấy tài nguyên') {
    return new AppError(404, message, { type: 'not_found' });
  }

  static unprocessable(message, details = []) {
    return new AppError(422, message, { type: 'validation_error', details });
  }

  static conflict(message) {
    return new AppError(409, message, { type: 'conflict' });
  }
}
