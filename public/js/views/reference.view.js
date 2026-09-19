/**
 * VIEW — Bảng phiên bản thư viện và từ điển thuật ngữ.
 */
import { esc, pageHead, sectionTitle, banner, pill, emptyState } from './components.view.js';

const ECOSYSTEMS = [
  { key: 'node', title: 'Hệ sinh thái Node.js' },
  { key: 'dotnet', title: 'Hệ sinh thái .NET' }
];

export function renderLibraries({ updatedAt, note, itemsByEco, sourceLabel }) {
  let html = pageHead({
    eyebrow: 'Theo dõi phiên bản',
    title: 'Phiên bản thư viện',
    lead: 'Những thư viện bạn sẽ gặp trong hầu hết dự án backend, kèm phiên bản hiện hành và điều đáng chú ý ở mỗi bản.'
  });

  html += banner(
    `Cập nhật lần cuối: <strong>${esc(updatedAt || 'chưa rõ')}</strong>` +
    (note ? ` — ${esc(note)}` : '') +
    `<br><span class="tiny">${esc(sourceLabel)}</span>`
  );

  for (const { key, title } of ECOSYSTEMS) {
    const items = itemsByEco(key);
    if (!items.length) continue;

    const rows = items
      .map((item) => `<tr>
        <td><strong>${item.url
          ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)}</a>`
          : esc(item.name)}</strong></td>
        <td class="ver">${esc(item.version)}</td>
        <td>${item.channel ? pill(item.channel) : ''}</td>
        <td class="note">${esc(item.note ?? '')}</td>
      </tr>`)
      .join('');

    html += sectionTitle(title);
    html += `<div class="card table-card"><div class="table-scroll">
      <table class="lib-table">
        <thead><tr><th>Thư viện</th><th>Phiên bản</th><th>Kênh</th><th>Ghi chú</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div></div>`;
  }

  return html;
}

export function renderGlossary({ terms, total, query }) {
  let html = pageHead({
    eyebrow: `${total} thuật ngữ`,
    title: 'Thuật ngữ',
    lead: 'Những từ bạn sẽ gặp hằng ngày khi đọc tài liệu và code của người khác.'
  });

  html += `<div class="filters">
    <input type="search" id="gloss-q" placeholder="Tìm thuật ngữ…" value="${esc(query)}" aria-label="Tìm thuật ngữ">
  </div>`;

  if (!terms.length) return html + emptyState('Không tìm thấy thuật ngữ nào.');

  html += '<dl class="gloss-list">';
  for (const term of terms) {
    html += `<div class="gloss">
      <dt>${esc(term.term)} ${pill(term.tag, 'tag')}</dt>
      <dd>${esc(term.def)}</dd>
    </div>`;
  }
  html += '</dl>';

  return html;
}
