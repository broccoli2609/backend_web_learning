/**
 * Bọc một handler async để lỗi tự chảy về middleware xử lý lỗi.
 *
 * Express 5 đã tự bắt lỗi từ handler async, nhưng viết rõ ràng như thế này giúp
 * ý đồ dễ đọc và code chạy được cả trên Express 4.
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
