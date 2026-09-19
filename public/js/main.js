/**
 * Điểm vào của ứng dụng phía trình duyệt.
 *
 * Luồng khởi động:
 *   1. Đặt giao diện sáng/tối trước khi vẽ, để không nháy sai màu
 *   2. Vẽ ngay màn hình với dữ liệu đi kèm — người dùng không phải chờ mạng
 *   3. Hỏi xem có Claude hoặc có server không, nạp tiến độ rồi vẽ lại
 */
import { themeService } from './services/theme.service.js';
import { claudeService } from './services/claude.service.js';
import { apiService } from './services/api.service.js';
import { contentModel } from './models/content.model.js';
import { progressModel } from './models/progress.model.js';
import { libraryModel } from './models/library.model.js';
import { router } from './controllers/router.js';
import { homeController } from './controllers/home.controller.js';
import { chapterListController, lessonController } from './controllers/theory.controller.js';
import { exerciseListController, exerciseController } from './controllers/exercise.controller.js';
import { libraryController, glossaryController } from './controllers/reference.controller.js';
import { onProgressChanged } from './controllers/events.js';
import { navHtml, sidebarProgressText } from './views/layout.view.js';

function refreshLayout() {
  const stats = progressModel.stats();
  const { route } = router.current();

  const counts = {
    '': `${stats.roadmapDone}/${stats.roadmapTotal}`,
    theory: `${stats.lessonsDone}/${stats.lessonsTotal}`,
    exercises: `${stats.exercisesDone}/${stats.exercisesTotal}`,
    libs: String(libraryModel.all().items.length),
    glossary: String(contentModel.glossary().length)
  };

  const html = navHtml(route, counts);
  for (const id of ['nav-desktop', 'nav-mobile']) {
    const nav = document.getElementById(id);
    if (nav) nav.innerHTML = html;
  }

  const bar = document.getElementById('side-bar');
  if (bar) bar.style.width = `${stats.overall}%`;

  const text = document.getElementById('side-text');
  if (text) text.textContent = sidebarProgressText(stats, progressModel.storageLabel());
}

function bindThemeButtons() {
  for (const id of ['theme-desktop', 'theme-mobile']) {
    document.getElementById(id)?.addEventListener('click', () => themeService.toggle());
  }
}

async function start() {
  themeService.init();
  bindThemeButtons();

  router
    .register('', homeController)
    .register('theory', chapterListController)
    .register('lesson', lessonController)
    .register('exercises', exerciseListController)
    .register('ex', exerciseController)
    .register('libs', libraryController)
    .register('glossary', glossaryController)
    .onAfterRender(refreshLayout)
    .start();

  onProgressChanged(refreshLayout);

  // Những thứ cần mạng chạy sau khi trang đã hiện.
  await Promise.all([claudeService.init(), apiService.probe()]);
  await Promise.all([progressModel.load(), libraryModel.load()]);

  router.render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
