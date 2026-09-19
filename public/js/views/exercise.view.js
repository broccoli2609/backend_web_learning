/**
 * VIEW — Danh sách bài tập, trang làm bài, và các khối kết quả.
 */
import {
  esc, pageHead, banner, emptyState, selectField,
  langPill, pill, statusChip, exerciseStatusChip, LANG_LABEL
} from './components.view.js';

export function renderExerciseList({ exercises, totals, filters, topics, recordOf }) {
  let html = pageHead({
    eyebrow: `${totals.exercises} bài tập`,
    title: 'Bài tập',
    lead: 'Bài Node.js chạy test thật ngay trong trình duyệt. Bài ASP.NET Core được chấm theo danh sách tiêu chí của từng bài.'
  });

  html += `<div class="filters">
    <input type="search" id="ex-q" placeholder="Tìm theo tên hoặc chủ đề…" value="${esc(filters.q)}" aria-label="Tìm bài tập">
    ${selectField('ex-lang', filters.lang, [['', 'Mọi ngôn ngữ'], ['node', 'Node.js'], ['dotnet', 'ASP.NET Core']])}
    ${selectField('ex-level', filters.level, [['', 'Mọi mức'], ['Cơ bản', 'Cơ bản'], ['Trung bình', 'Trung bình'], ['Nâng cao', 'Nâng cao']])}
    ${selectField('ex-topic', filters.topic, [['', 'Mọi chủ đề'], ...topics.map((t) => [t, t])])}
    ${selectField('ex-status', filters.status, [['', 'Mọi trạng thái'], ['todo', 'Chưa làm'], ['passed', 'Đã đạt']])}
  </div>`;

  if (!exercises.length) return html + emptyState('Không có bài nào khớp bộ lọc.');

  html += '<div class="ex-list">';
  for (const exercise of exercises) {
    html += `<a class="ex-row" href="#/ex/${esc(exercise.id)}">
      <span class="id">${esc(exercise.id)}</span>
      <span class="title">${esc(exercise.title)}</span>
      <span class="meta">
        ${langPill(exercise.lang)}
        ${pill(exercise.level, 'level')}
        ${exerciseStatusChip(recordOf(exercise.id))}
      </span>
    </a>`;
  }
  html += '</div>';

  return html;
}

export function renderExercise({ exercise, record, graderAvailable }) {
  if (!exercise) return emptyState('Không tìm thấy bài tập này.');

  const isNode = exercise.lang === 'node';
  const code = record?.code ?? exercise.starter;

  let html = pageHead({
    eyebrow: `${exercise.id} · ${exercise.topic}`,
    title: exercise.title,
    extra: `<div class="btn-row" style="margin-top:4px">
      ${langPill(exercise.lang)}
      ${pill(exercise.level, 'level')}
      ${record?.status === 'passed' ? statusChip('pass', '200 OK') : ''}
    </div>`
  });

  html += '<div class="ex-layout">';

  /* --- cột trái: đề bài --- */
  html += `<section>
    <div class="card lesson-body">${exercise.brief}</div>`;

  if (exercise.hints?.length) {
    html += `<details class="solution" style="margin-top:12px">
      <summary>Gợi ý (${exercise.hints.length})</summary>
      <div class="hint-list">${exercise.hints.map((h) => `<div class="hint">${esc(h)}</div>`).join('')}</div>
    </details>`;
  }

  if (!isNode && exercise.rubric?.length) {
    html += `<div class="card" style="margin-top:12px">
      <span class="eyebrow">Sẽ được chấm theo</span>
      <ul class="rubric-list muted">${exercise.rubric.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    </div>`;
  }

  html += `<details class="solution">
      <summary>Xem lời giải mẫu</summary>
      <pre><code>${esc(exercise.solution)}</code></pre>
    </details>
  </section>`;

  /* --- cột phải: khung code và kết quả --- */
  html += `<section>
    <div class="editor-wrap">
      <div class="editor-head">
        <span>${isNode ? 'solution.js' : 'Solution.cs'}</span>
        <span>${isNode ? 'javascript' : 'csharp'}</span>
      </div>
      <textarea class="code-input" id="code-input" spellcheck="false" aria-label="Khung viết code">${esc(code)}</textarea>
    </div>

    <div class="btn-row" style="margin-top:12px">
      ${isNode
        ? '<button class="btn" id="run-tests" type="button">Chạy test</button>'
        : '<button class="btn" id="grade-code" type="button">Nộp bài cho Claude chấm</button>'}
      <button class="btn ghost" id="reset-code" type="button">Khôi phục code mẫu</button>
      ${isNode ? '<button class="btn ghost" id="review-code" type="button">Nhờ Claude nhận xét</button>' : ''}
    </div>`;

  if (!graderAvailable) {
    html += banner(
      'Bản này không gọi được Claude để chấm bài. ' +
      (isNode
        ? 'Test vẫn chạy bình thường, chỉ phần nhận xét là không dùng được.'
        : 'Bạn vẫn tự đối chiếu được với danh sách tiêu chí bên trái và lời giải mẫu.')
    );
  }

  html += `<div id="ex-output">${record?.feedback ? renderGrade(record.feedback) : ''}</div>
  </section></div>`;

  return html;
}

export function renderPending(message) {
  return `<div class="card feedback">
    ${statusChip('wait', '102 Processing')}
    <span class="tiny muted">${esc(message)}</span>
  </div>`;
}

export function renderFailure(message) {
  return `<div class="card feedback">
    <div class="btn-row">${statusChip('fail', '503')}<strong>Chưa chấm được</strong></div>
    <p class="feedback-text">${esc(message)}</p>
  </div>`;
}

export function renderTestResults(outcome) {
  if (outcome.fatal) {
    return `<div class="card feedback">
      <div class="btn-row">${statusChip('fail', '500')}<strong>Không chạy được</strong></div>
      <p class="feedback-text">${esc(outcome.fatal)}</p>
    </div>`;
  }

  const results = outcome.results ?? [];
  const passed = results.filter((r) => r.ok).length;
  const allPassed = passed === results.length && results.length > 0;

  const rows = results
    .map((r) => `<div class="test-row ${r.ok ? 'pass' : 'fail'}">
      <span class="mono tick">${r.ok ? '✓' : '✕'}</span>
      <span class="tname">${esc(r.label)}${
        r.ok ? '' : `<div class="test-detail">mong đợi: ${esc(r.expected)}\nnhận được: ${esc(r.actual)}</div>`
      }</span>
    </div>`)
    .join('');

  return `<div class="card feedback">
    <div class="btn-row feedback-head">
      <strong>${allPassed ? 'Qua hết test' : 'Còn test chưa qua'}</strong>
      ${statusChip(allPassed ? 'pass' : 'fail', `${allPassed ? '200 OK' : '422'} · ${passed}/${results.length}`)}
    </div>
    <div class="results">${rows}</div>
  </div>`;
}

export function renderGrade(grade) {
  if (!grade) return '';

  const criteria = grade.criteria?.length
    ? `<div class="criteria">${grade.criteria
        .map((c) => `<div class="crit ${c.ok ? 'ok' : 'no'}">
          <span class="mark">${c.ok ? '✓' : '✕'}</span>
          <span>${esc(c.name)}${c.note ? `<br><span class="note">${esc(c.note)}</span>` : ''}</span>
        </div>`)
        .join('')}</div>`
    : '';

  const improvements = grade.improvements?.length
    ? `<p class="eyebrow improve-head">Nên sửa</p>
       <ul class="improve-list">${grade.improvements.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : '';

  return `<div class="card feedback">
    <div class="btn-row feedback-head">
      <strong>${grade.passed ? 'Đạt yêu cầu' : 'Chưa đạt'}</strong>
      ${statusChip(grade.passed ? 'pass' : 'fail', `${grade.passed ? '200 OK' : '422'} · ${grade.score ?? '?'}/100`)}
    </div>
    ${criteria}
    ${grade.summary ? `<p class="feedback-text">${esc(grade.summary)}</p>` : ''}
    ${improvements}
  </div>`;
}

export function renderReviewShell() {
  return `<div class="card feedback">
    <span class="eyebrow">Nhận xét của Claude</span>
    <div class="streaming" id="review-text">Đang suy nghĩ…</div>
  </div>`;
}

export { LANG_LABEL };
