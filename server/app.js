/**
 * Lắp ráp ứng dụng Express.
 *
 * Thứ tự middleware ở đây không tuỳ tiện — nó đúng bằng thứ tự chương 11 mô tả:
 *   1. gắn traceId và log     → để mọi thứ sau đó đều có mã để lần lại
 *   2. CORS                   → phải chạy trước route, kể cả request OPTIONS
 *   3. parse JSON             → đặt sau route thì req.body luôn undefined
 *   4. file tĩnh              → trả nhanh, không cần đi qua router
 *   5. route /api             → phần việc chính
 *   6. not found              → không khớp gì thì ném lỗi 404
 *   7. xử lý lỗi              → LUÔN đặt cuối cùng
 */
import express from 'express';
import { config } from './config/index.js';
import { apiRoutes } from './routes/index.js';
import { requestContext } from './middlewares/request-context.js';
import { cors } from './middlewares/cors.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestContext);
  app.use(cors);
  app.use(express.json({ limit: '1mb' }));

  app.use(
    express.static(config.paths.public, {
      // HTML luôn hỏi lại server; file tĩnh khác cache ngắn cho đỡ tải lại.
      setHeaders(res, filePath) {
        res.set('Cache-Control', filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=300');
      }
    })
  );

  app.use('/api', apiRoutes);

  // Mọi đường dẫn khác không phải /api thì trả về trang chính, để router phía
  // trình duyệt tự xử lý (ứng dụng một trang).
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile('index.html', { root: config.paths.public });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
