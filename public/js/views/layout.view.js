/**
 * VIEW — Khung ngoài: thanh điều hướng và thanh tiến độ ở cột trái.
 */
import { esc } from './components.view.js';

export const NAV_ITEMS = [
  { route: '', hash: '#/', label: 'Lộ trình' },
  { route: 'theory', hash: '#/theory', label: 'Lý thuyết', alias: ['lesson'] },
  { route: 'exercises', hash: '#/exercises', label: 'Bài tập', alias: ['ex'] },
  { route: 'libs', hash: '#/libs', label: 'Thư viện' },
  { route: 'glossary', hash: '#/glossary', label: 'Thuật ngữ' }
];

export function navHtml(activeRoute, counts) {
  return NAV_ITEMS.map((item) => {
    const active = item.route === activeRoute || (item.alias ?? []).includes(activeRoute);
    return `<a href="${item.hash}" class="${active ? 'active' : ''}">
      <span>${esc(item.label)}</span>
      <span class="count num">${esc(counts[item.route] ?? '')}</span>
    </a>`;
  }).join('');
}

export function sidebarProgressText(stats, storageLabel) {
  return `${stats.overall}% · ${stats.doneUnits}/${stats.totalUnits} mục · lưu ở ${storageLabel}`;
}
