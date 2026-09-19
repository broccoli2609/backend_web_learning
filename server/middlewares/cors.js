/**
 * MIDDLEWARE — CORS viết tay.
 *
 * Dùng thư viện `cors` cũng được, nhưng viết tay một lần giúp thấy rõ điều mà
 * chương 2 nói: trình duyệt chỉ cho phép khi SERVER trả đúng header, và
 * `Access-Control-Allow-Origin: *` không đi cùng credentials được.
 */
import { config } from '../config/index.js';

export function cors(req, res, next) {
  const origin = req.get('Origin');

  if (origin && config.cors.allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
    // Origin thay đổi thì nội dung trả về cũng khác — nói cho cache biết.
    res.set('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Trace-Id');
    res.set('Access-Control-Max-Age', '600');
    res.status(204).end();
    return;
  }

  next();
}
