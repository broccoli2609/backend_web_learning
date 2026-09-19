/**
 * SERVICE — Biến một <textarea> thường thành khung viết code dùng được.
 *
 * Không dùng thư viện nào. Thêm đúng những hành vi mà người viết code mong đợi:
 *   Tab / Shift+Tab   thụt lề, chọn nhiều dòng thì thụt cả khối
 *   Enter             tự canh lề theo dòng trên, mở ngoặc thì thụt thêm một cấp
 *   ( [ { " ' `       tự đóng; đang bôi đen thì bọc quanh phần đã chọn
 *   ) ] } " ' `       gõ đúng ký tự đóng đang có sẵn thì nhảy qua, không nhân đôi
 *   Backspace         xoá cả cặp rỗng (), xoá nguyên một cấp thụt lề
 *
 * Điểm quan trọng: mọi thay đổi đi qua `document.execCommand('insertText')`.
 * Gán thẳng `textarea.value` cũng chạy, nhưng xoá sạch lịch sử hoàn tác của
 * trình duyệt — người dùng bấm Ctrl+Z sẽ mất hết. execCommand tuy đã cũ nhưng
 * là cách duy nhất còn giữ được Ctrl+Z trên <textarea>.
 */

const INDENT = '  ';

const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
const CLOSERS = new Set([')', ']', '}', '"', "'", '`']);
const QUOTES = new Set(['"', "'", '`']);

/* ---------- ghi vào textarea mà vẫn giữ Ctrl+Z ---------- */

function typeText(textarea, text) {
  textarea.focus();
  try {
    if (document.execCommand('insertText', false, text)) return;
  } catch {
    /* trình duyệt không hỗ trợ — dùng cách thủ công bên dưới */
  }
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  textarea.value = value.slice(0, start) + text + value.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

function removeRange(textarea, from, to) {
  textarea.setSelectionRange(from, to);
  try {
    if (document.execCommand('delete')) return;
  } catch {
    /* rơi xuống cách thủ công */
  }
  const { value } = textarea;
  textarea.value = value.slice(0, from) + value.slice(to);
  textarea.setSelectionRange(from, from);
}

function setCaret(textarea, position) {
  textarea.setSelectionRange(position, position);
}

/* ---------- đọc ngữ cảnh quanh con trỏ ---------- */

function lineStartIndex(value, position) {
  return value.lastIndexOf('\n', position - 1) + 1;
}

function indentOf(line) {
  return (line.match(/^[ \t]*/) ?? [''])[0];
}

/* ---------- Tab và Shift+Tab ---------- */

function handleTab(event, textarea) {
  event.preventDefault();

  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const spansLines = value.slice(start, end).includes('\n');

  // Không bôi đen nhiều dòng: chèn một cấp, hoặc bỏ một cấp ở ĐẦU DÒNG.
  // Bỏ thụt tính theo cả dòng chứ không theo vị trí con trỏ — đó là cách mọi
  // editor làm, và là điều người dùng mong đợi khi con trỏ đang ở giữa dòng.
  if (!spansLines) {
    if (!event.shiftKey) {
      typeText(textarea, INDENT);
      return;
    }

    const lineStart = lineStartIndex(value, start);
    const lineEnd = value.indexOf('\n', lineStart) === -1 ? value.length : value.indexOf('\n', lineStart);
    const line = value.slice(lineStart, lineEnd);

    let cut = 0;
    if (line.startsWith(INDENT)) cut = INDENT.length;
    else if (/^[ \t]/.test(line)) cut = 1;
    if (cut === 0) return;

    removeRange(textarea, lineStart, lineStart + cut);
    setCaret(textarea, Math.max(lineStart, start - cut));
    return;
  }

  // Bôi đen nhiều dòng: thụt hoặc bỏ thụt cả khối, giữ nguyên vùng chọn
  const blockStart = lineStartIndex(value, start);
  const blockEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);

  const lines = value.slice(blockStart, blockEnd).split('\n');
  const updated = lines.map((line) => {
    if (!event.shiftKey) return INDENT + line;
    if (line.startsWith(INDENT)) return line.slice(INDENT.length);
    return line.replace(/^[ \t]/, '');
  });

  const shiftFirst = updated[0].length - lines[0].length;
  const shiftTotal = updated.join('\n').length - lines.join('\n').length;

  textarea.setSelectionRange(blockStart, blockEnd);
  typeText(textarea, updated.join('\n'));
  textarea.setSelectionRange(Math.max(blockStart, start + shiftFirst), end + shiftTotal);
}

/* ---------- Enter: giữ lề, thụt thêm sau dấu mở ---------- */

function handleEnter(event, textarea) {
  if (event.shiftKey) return; // Shift+Enter giữ nguyên hành vi mặc định

  const { selectionStart: start, value } = textarea;
  const lineStart = lineStartIndex(value, start);
  const indent = indentOf(value.slice(lineStart, start));

  const charBefore = value[start - 1] ?? '';
  const charAfter = value[textarea.selectionEnd] ?? '';
  const opensBlock = charBefore === '{' || charBefore === '[' || charBefore === '(';

  if (!opensBlock && indent === '') return; // không có gì để canh, để mặc định

  event.preventDefault();

  // Con trỏ đang nằm giữa một cặp vừa mở: đẩy dấu đóng xuống dòng riêng
  if (opensBlock && PAIRS[charBefore] === charAfter) {
    typeText(textarea, `\n${indent}${INDENT}\n${indent}`);
    setCaret(textarea, start + 1 + indent.length + INDENT.length);
    return;
  }

  typeText(textarea, `\n${indent}${opensBlock ? INDENT : ''}`);
}

/* ---------- gõ dấu mở: tự đóng, hoặc bọc phần đang chọn ---------- */

function handleOpening(event, textarea) {
  const open = event.key;
  const close = PAIRS[open];
  const { selectionStart: start, selectionEnd: end, value } = textarea;

  // Đang bôi đen: bọc phần đã chọn thay vì thay thế nó
  if (start !== end) {
    event.preventDefault();
    const selected = value.slice(start, end);
    typeText(textarea, open + selected + close);
    textarea.setSelectionRange(start + 1, end + 1);
    return;
  }

  const charAfter = value[start] ?? '';

  // Dấu nháy vừa là dấu mở vừa là dấu đóng. Gõ đúng dấu nháy đang đứng ngay
  // sau con trỏ thì nhảy qua nó, đừng thêm cái thứ hai.
  if (QUOTES.has(open) && charAfter === open) {
    event.preventDefault();
    setCaret(textarea, start + 1);
    return;
  }

  // Với dấu nháy, không tự đóng khi đang dính vào một từ — dễ gây khó chịu
  // khi gõ những chữ như don't, hoặc thêm nháy vào cuối một chuỗi có sẵn.
  if (QUOTES.has(open)) {
    const charBefore = value[start - 1] ?? '';
    if (/[\w"'`]/.test(charBefore) || /[\w]/.test(charAfter)) return;
  }

  // Không tự đóng khi ngay sau con trỏ còn chữ — người dùng đang chèn vào giữa
  if (/[\w]/.test(charAfter)) return;

  event.preventDefault();
  typeText(textarea, open + close);
  setCaret(textarea, start + 1);
}

/* ---------- gõ dấu đóng: nhảy qua dấu đã có sẵn ---------- */

function handleClosing(event, textarea) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  if (start !== end) return;

  if (value[start] === event.key) {
    event.preventDefault();
    setCaret(textarea, start + 1);
  }
}

/* ---------- Backspace: xoá cặp rỗng, xoá nguyên cấp thụt lề ---------- */

function handleBackspace(event, textarea) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  if (start !== end || start === 0) return;

  const charBefore = value[start - 1];
  const charAfter = value[start];

  // Con trỏ nằm giữa một cặp rỗng: xoá cả hai
  if (PAIRS[charBefore] && PAIRS[charBefore] === charAfter) {
    event.preventDefault();
    removeRange(textarea, start - 1, start + 1);
    return;
  }

  // Trước con trỏ chỉ toàn khoảng trắng: xoá trọn một cấp thụt lề
  const lineStart = lineStartIndex(value, start);
  const before = value.slice(lineStart, start);
  if (before.length > 0 && before.trim() === '' && before.endsWith(INDENT)) {
    event.preventDefault();
    removeRange(textarea, start - INDENT.length, start);
  }
}

/* ---------- lắp vào ---------- */

export function enhanceEditor(textarea) {
  if (!textarea || textarea.dataset.enhanced === 'true') return;
  textarea.dataset.enhanced = 'true';

  textarea.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    switch (true) {
      case event.key === 'Tab':
        handleTab(event, textarea);
        break;
      case event.key === 'Enter':
        handleEnter(event, textarea);
        break;
      case event.key === 'Backspace':
        handleBackspace(event, textarea);
        break;
      case Boolean(PAIRS[event.key]):
        handleOpening(event, textarea);
        break;
      case CLOSERS.has(event.key):
        handleClosing(event, textarea);
        break;
      default:
        break;
    }
  });
}
