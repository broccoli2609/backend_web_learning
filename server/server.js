/**
 * Điểm vào của server.
 *
 * Tách khỏi `app.js` có lý do thật: integration test import `createApp()` và
 * gọi thẳng vào app mà không cần mở cổng mạng nào.
 */
import { createApp } from './app.js';
import { config, assertConfig } from './config/index.js';
import { progressRepository } from './models/progress.model.js';
import { log } from './middlewares/request-context.js';

async function main() {
  assertConfig();
  await progressRepository.init();

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    log('info', {
      msg: `Server chạy ở http://localhost:${config.port} (${config.env})`,
      port: config.port
    });
  });

  // Tắt êm: ngừng nhận request mới, chờ request đang chạy xong rồi mới thoát.
  const shutdown = (signal) => {
    log('info', { msg: `Nhận ${signal}, đang tắt server…` });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Không khởi động được server:', err.message);
  process.exit(1);
});
