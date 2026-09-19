/**
 * VIEW — Danh sách chương và trang một bài học.
 */
import {
  esc, pageHead, sectionTitle, banner, statusChip, emptyState
} from './components.view.js';

export function renderChapterList({ chapters, stats, isLessonDone, openChapters }) {
  let html = pageHead({
    eyebrow: `${chapters.length} chương · ${stats.lessonsTotal} bài học`,
    title: 'Lý thuyết',
    lead: 'Mỗi bài học kết thúc bằng một câu hỏi hoặc một bài code để bạn kiểm tra xem mình có thực sự hiểu không.'
  });

  html += banner(
    `Đã hoàn thành <strong class="num">${stats.lessonsDone}/${stats.lessonsTotal}</strong> bài học. ` +
    'Bài học chỉ được tính là xong khi bạn trả lời đúng câu hỏi cuối bài.'
  );

  html += '<div class="chapter-list">';
  for (const chapter of chapters) {
    const done = chapter.lessons.filter((l) => isLessonDone(l.id)).length;
    const open = openChapters.has(chapter.id);

    const lessons = chapter.lessons
      .map((lesson) => {
        const lessonDone = isLessonDone(lesson.id);
        return `<a class="lesson-link" href="#/lesson/${esc(lesson.id)}">
          ${statusChip(lessonDone ? 'pass' : 'todo', lessonDone ? '200' : '—')}
          <span class="ln">${esc(lesson.title)}</span>
        </a>`;
      })
      .join('');

    html += `<div class="chapter">
      <button class="chapter-head" data-chapter="${esc(chapter.id)}" aria-expanded="${open}" aria-controls="lessons-${esc(chapter.id)}">
        <span class="chapter-num">${String(chapter.num).padStart(2, '0')}</span>
        <span class="t">
          <strong>${esc(chapter.title)}</strong>
          <em>${esc(chapter.summary)}</em>
        </span>
        ${statusChip(done === chapter.lessons.length ? 'pass' : 'todo', `${done}/${chapter.lessons.length}`)}
      </button>
      <div class="chapter-lessons" id="lessons-${esc(chapter.id)}"${open ? '' : ' hidden'}>${lessons}</div>
    </div>`;
  }
  html += '</div>';

  return html;
}

export function renderQuiz(lessonId, check, saved) {
  const options = check.options
    .map((option, i) => {
      let cls = '';
      if (saved) {
        if (i === check.answer) cls = ' correct';
        else if (i === saved.picked) cls = ' wrong';
      }
      return `<label class="quiz-opt${cls}">
        <input type="radio" name="q-${esc(lessonId)}" value="${i}"${saved?.picked === i ? ' checked' : ''}${saved ? ' disabled' : ''}>
        <span>${esc(option)}</span>
      </label>`;
    })
    .join('');

  const footer = saved
    ? `<div class="explain">
         <strong>${saved.correct ? 'Chính xác. ' : 'Chưa đúng. '}</strong>${esc(check.explain)}
       </div>
       <div class="btn-row" style="margin-top:12px">
         <button class="btn ghost small" data-quiz-reset="${esc(lessonId)}">Làm lại</button>
       </div>`
    : `<button class="btn" data-quiz-submit="${esc(lessonId)}">Kiểm tra</button>
       <p class="quiz-warn tiny" id="quiz-warn" hidden>Hãy chọn một đáp án trước đã.</p>`;

  return `<div class="quiz">
    <h4>${esc(check.q)}</h4>
    <div class="quiz-options">${options}</div>
    ${footer}
  </div>`;
}

export function renderLesson({ entry, done, quizAnswer, linkedExercise }) {
  if (!entry) return emptyState('Không tìm thấy bài học này.');

  const { chapter, lesson, prev, next } = entry;

  let html = pageHead({
    eyebrow: `Chương ${chapter.num} · ${chapter.title}`,
    title: lesson.title
  });

  html += `<article class="card lesson-body">${lesson.body}</article>`;

  html += sectionTitle(
    'Kiểm tra nhanh',
    done ? statusChip('pass', '200 OK') : statusChip('todo', 'chưa làm')
  );

  if (lesson.check.type === 'quiz') {
    html += renderQuiz(lesson.id, lesson.check, quizAnswer);
  } else {
    html += `<div class="card">
      <p style="margin:0 0 12px">Bài học này đi kèm một bài code. Làm xong bài đó, bài học sẽ được tính là hoàn thành.</p>
      <a class="btn" href="#/ex/${esc(lesson.check.exId)}">Mở bài tập: ${esc(linkedExercise?.title ?? lesson.check.exId)}</a>
    </div>`;
  }

  html += `<nav class="lesson-nav">
    ${prev ? `<a class="btn ghost" href="#/lesson/${esc(prev.lesson.id)}">← ${esc(prev.lesson.title)}</a>` : '<span></span>'}
    ${next ? `<a class="btn ghost" href="#/lesson/${esc(next.lesson.id)}">${esc(next.lesson.title)} →</a>` : '<span></span>'}
  </nav>`;

  return html;
}
