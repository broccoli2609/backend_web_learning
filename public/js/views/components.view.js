/**
 * VIEW — Những mảnh HTML dùng lại ở nhiều màn hình.
 *
 * View chỉ nhận dữ liệu và trả về chuỗi HTML. Chúng không đọc model, không gắn
 * sự kiện, không gọi mạng — việc đó thuộc về controller.
 */

/** Chống XSS: mọi thứ do người dùng hoặc Claude sinh ra đều phải đi qua đây. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const LANG_LABEL = { node: 'Node.js', dotnet: 'ASP.NET Core' };

/**
 * Mã trạng thái HTTP dùng làm ngôn ngữ trạng thái của cả trang:
 * 200 là xong, 422 là còn sai, 102 là đang chạy, 503 là không gọi được.
 */
export function statusChip(kind, text) {
  return `<span class="status ${kind}">${esc(text)}</span>`;
}

export function exerciseStatusChip(record) {
  if (!record) return statusChip('todo', '—');
  if (record.status === 'passed') return statusChip('pass', '200 OK');
  return statusChip('fail', '422');
}

export function pill(text, kind = '') {
  return `<span class="pill ${kind}">${esc(text)}</span>`;
}

export function langPill(lang) {
  return pill(LANG_LABEL[lang] ?? lang, lang === 'node' ? 'node' : 'dotnet');
}

export function progressBar(percent, kind = '') {
  const width = Math.max(0, Math.min(100, percent));
  return `<div class="bar ${kind}"><span style="width:${width}%"></span></div>`;
}

export function statTile(label, value, sub) {
  return `<div class="stat">
    <span class="k">${esc(label)}</span>
    <span class="v">${esc(value)}</span>
    <span class="s">${esc(sub)}</span>
  </div>`;
}

export function pageHead({ eyebrow, title, lead, extra = '' }) {
  return `<div class="page-head">
    ${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}
    <h1>${esc(title)}</h1>
    ${lead ? `<p>${esc(lead)}</p>` : ''}
    ${extra}
  </div>`;
}

export function sectionTitle(title, aside = '') {
  return `<div class="section-title"><h2>${esc(title)}</h2>${aside}</div>`;
}

export function banner(html) {
  return `<div class="banner">${html}</div>`;
}

export function emptyState(message) {
  return `<div class="empty">${esc(message)}</div>`;
}

export function selectField(id, value, options) {
  const body = options
    .map(([optValue, label]) =>
      `<option value="${esc(optValue)}"${optValue === value ? ' selected' : ''}>${esc(label)}</option>`
    )
    .join('');
  return `<select id="${esc(id)}">${body}</select>`;
}

/** Bọc mọi bảng trong khung cuộn ngang để trang không vỡ trên điện thoại. */
export function wrapTables(root) {
  for (const table of root.querySelectorAll('.lesson-body table')) {
    if (table.parentElement?.classList.contains('table-scroll')) continue;
    const scroller = document.createElement('div');
    scroller.className = 'table-scroll';
    table.parentElement.insertBefore(scroller, table);
    scroller.appendChild(table);
  }
}
