/**
 * VIEW — Trang chủ: tiến độ tổng quan, chỗ học tiếp, lộ trình năm giai đoạn.
 */
import { esc, pageHead, sectionTitle, statTile, LANG_LABEL } from './components.view.js';

function continueCard(eyebrow, href, title, sub) {
  return `<a class="card continue-card" href="${href}">
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h3>${esc(title)}</h3>
    <p class="tiny muted">${esc(sub)}</p>
  </a>`;
}

function stageHtml(stage, isDone) {
  const doneCount = stage.items.filter((_, i) => isDone(`${stage.id}:${i}`)).length;
  const complete = doneCount === stage.items.length;

  const items = stage.items
    .map((item, i) => {
      const key = `${stage.id}:${i}`;
      const done = isDone(key);
      return `<label class="checkitem${done ? ' done' : ''}">
        <input type="checkbox" data-roadmap="${esc(key)}"${done ? ' checked' : ''}>
        <span>${esc(item)}</span>
      </label>`;
    })
    .join('');

  return `<div class="stage${complete ? ' done' : ''}">
    <h3>${esc(stage.title)}</h3>
    <p class="goal">${esc(stage.goal)}</p>
    ${items}
    <p class="project"><strong>Dự án:</strong> ${esc(stage.project)}</p>
  </div>`;
}

export function renderHome({ stats, roadmap, nextLesson, nextExercise, isRoadmapItemDone }) {
  let html = pageHead({
    eyebrow: 'Học backend từ đầu',
    title: 'Lộ trình năm giai đoạn',
    lead: 'Mỗi giai đoạn cần giai đoạn trước. Đọc lý thuyết, làm bài tập ngay sau đó, và đánh dấu việc đã làm được để biết mình đang ở đâu.'
  });

  html += `<div class="stat-row">
    ${statTile('Tiến độ chung', `${stats.overall}%`, `${stats.doneUnits} / ${stats.totalUnits} mục`)}
    ${statTile('Lý thuyết', `${stats.lessonsDone}/${stats.lessonsTotal}`, 'bài học đã xong')}
    ${statTile('Bài Node.js', `${stats.nodeDone}/${stats.nodeTotal}`, 'chạy test trong trình duyệt')}
    ${statTile('Bài ASP.NET', `${stats.dotnetDone}/${stats.dotnetTotal}`, 'chấm theo tiêu chí')}
  </div>`;

  if (nextLesson || nextExercise) {
    html += sectionTitle('Tiếp tục ở đâu');
    html += '<div class="grid two">';
    if (nextLesson) {
      html += continueCard(
        'Bài học tiếp theo',
        `#/lesson/${nextLesson.lesson.id}`,
        nextLesson.lesson.title,
        `Chương ${nextLesson.chapter.num} — ${nextLesson.chapter.title}`
      );
    }
    if (nextExercise) {
      html += continueCard(
        'Bài tập tiếp theo',
        `#/ex/${nextExercise.id}`,
        nextExercise.title,
        `${LANG_LABEL[nextExercise.lang]} · ${nextExercise.level} · ${nextExercise.topic}`
      );
    }
    html += '</div>';
  }

  html += sectionTitle(
    'Năm giai đoạn',
    `<span class="tiny muted num">${stats.roadmapDone}/${stats.roadmapTotal} việc đã xong</span>`
  );
  html += roadmap.map((stage) => stageHtml(stage, isRoadmapItemDone)).join('');

  return html;
}
