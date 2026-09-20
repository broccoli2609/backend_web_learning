/* Bài tự luyện Node.js — không gắn với bài học nào.
 * Dùng để luyện lại từng chủ đề sau khi đã học xong chương tương ứng.
 * Một số bài lấy ý ngoài khoá video: header HTTP nâng cao, xử lý lỗi
 * bất đồng bộ, vận hành và kiểm thử. */

export default [
{
  id: 'node-73', lang: 'node', level: 'Trung bình', topic: 'HTTP', fn: 'parseAccept',
  title: 'Đọc header Accept và độ ưu tiên',
  io: {
    signature: 'parseAccept(value) → Array<string>',
    params: [
      ['value', "string · mặc định ''",
       'Giá trị header Accept, ví dụ "text/html,application/json;q=0.9,*/*;q=0.1". Mỗi mục có thể kèm tham số q từ 0 tới 1.']
    ],
    returns: ['Array<string>',
      'Danh sách kiểu nội dung, sắp theo độ ưu tiên giảm dần. Cùng q thì giữ thứ tự xuất hiện. q bằng 0 nghĩa là từ chối, bị loại hẳn.'],
    example: `parseAccept('text/html,application/json;q=0.9,*/*;q=0.1')
// → ['text/html', 'application/json', '*/*']`
  },
  brief: `<p>Trình duyệt nói cho server biết nó muốn nhận loại nội dung gì, và muốn tới mức nào, qua header <code>Accept</code>:</p>
<pre>Accept: text/html,application/json;q=0.9,*/*;q=0.1</pre>
<p>Tham số <code>q</code> (quality) từ 0 tới 1 là độ ưu tiên; không ghi thì mặc định là 1. Đây là cách một endpoint trả HTML cho trình duyệt và JSON cho code mà không cần hai đường dẫn khác nhau.</p>
<ul>
<li>Tách theo dấu phẩy, cắt khoảng trắng</li>
<li>Mục có <code>;q=0.5</code> thì lấy số đó; không có thì là 1</li>
<li>Sắp giảm dần theo q; <strong>cùng q thì giữ nguyên thứ tự xuất hiện</strong></li>
<li><code>q=0</code> nghĩa là "tôi từ chối loại này" — loại khỏi kết quả</li>
<li>Mục rỗng bị bỏ qua; chuỗi rỗng cho mảng rỗng</li>
</ul>`,
  starter: `function parseAccept(value = '') {
  // Viết code ở đây
}`,
  hints: [
    'Ghi lại chỉ số xuất hiện để làm tiêu chí phụ khi sắp xếp.',
    'split(";") rồi tìm mảnh bắt đầu bằng "q=".',
    'Hàm so sánh trả về (b.q - a.q) hoặc (a.index - b.index) khi q bằng nhau.'
  ],
  tests: [
    { label: 'không có q', args: ['text/html'], expect: ['text/html'] },
    { label: 'sắp theo q', args: ['application/json;q=0.5,text/html'], expect: ['text/html', 'application/json'] },
    { label: 'ví dụ đầy đủ', args: ['text/html,application/json;q=0.9,*/*;q=0.1'], expect: ['text/html', 'application/json', '*/*'] },
    { label: 'cùng q giữ thứ tự xuất hiện', args: ['a/b;q=0.5,c/d;q=0.5'], expect: ['a/b', 'c/d'] },
    { label: 'q bằng 0 bị loại', args: ['text/html,image/png;q=0'], expect: ['text/html'] },
    { label: 'có khoảng trắng', args: ['text/html , application/json ; q=0.8'], expect: ['text/html', 'application/json'] },
    { label: 'chuỗi rỗng', args: [''], expect: [] }
  ],
  solution: `function parseAccept(value = '') {
  const items = [];

  String(value).split(',').forEach((raw, index) => {
    const parts = raw.split(';').map((s) => s.trim());
    const type = parts[0];
    if (!type) return;

    const qPart = parts.slice(1).find((s) => s.startsWith('q='));
    const q = qPart ? Number(qPart.slice(2)) : 1;
    if (!(q > 0)) return;

    items.push({ type, q, index });
  });

  return items
    .sort((a, b) => (b.q - a.q) || (a.index - b.index))
    .map((item) => item.type);
}`
},
{
  id: 'node-74', lang: 'node', level: 'Cơ bản', topic: 'HTTP', fn: 'parseCookies',
  title: 'Đọc header Cookie',
  io: {
    signature: 'parseCookies(header) → object',
    params: [
      ['header', "string · mặc định ''",
       'Giá trị header Cookie, các cặp ngăn bởi dấu chấm phẩy: "sid=abc; theme=dark". Giá trị có thể được mã hoá URL.']
    ],
    returns: ['object', 'Tên cookie → giá trị đã giải mã URL. Header rỗng cho {}.'],
    example: `parseCookies('sid=abc123; theme=dark; name=Nguy%E1%BB%85n')
// → { sid: 'abc123', theme: 'dark', name: 'Nguyễn' }`
  },
  brief: `<p>Cookie đi lên server trong một header duy nhất, mọi cặp gộp chung:</p>
<pre>Cookie: sid=abc123; theme=dark</pre>
<ul>
<li>Tách theo dấu chấm phẩy, cắt khoảng trắng</li>
<li>Chỉ tách ở dấu <code>=</code> <strong>đầu tiên</strong> — giá trị có thể chứa thêm dấu bằng</li>
<li>Giải mã URL cho giá trị; giải mã lỗi thì giữ nguyên chuỗi gốc</li>
<li>Mục không có dấu <code>=</code> hoặc tên rỗng thì bỏ qua</li>
<li>Tên trùng thì cặp <strong>đầu tiên</strong> thắng — đây là hành vi của trình duyệt</li>
</ul>`,
  starter: `function parseCookies(header = '') {
  // Viết code ở đây
}`,
  hints: [
    'decodeURIComponent ném lỗi với chuỗi như "%zz" — bọc try/catch.',
    'Cặp đầu tiên thắng: chỉ gán khi khoá chưa tồn tại.',
    'indexOf("=") cho vị trí dấu bằng đầu tiên.'
  ],
  tests: [
    { label: 'một cookie', args: ['sid=abc123'], expect: { sid: 'abc123' } },
    { label: 'nhiều cookie', args: ['sid=abc123; theme=dark'], expect: { sid: 'abc123', theme: 'dark' } },
    { label: 'giải mã URL', args: ['name=Nguy%E1%BB%85n'], expect: { name: 'Nguyễn' } },
    { label: 'giá trị chứa dấu bằng', args: ['token=a=b=c'], expect: { token: 'a=b=c' } },
    { label: 'khoảng trắng thừa', args: ['  sid = abc ;  theme=dark '], expect: { sid: 'abc', theme: 'dark' } },
    { label: 'mục không có dấu bằng bị bỏ qua', args: ['sid=abc; linhtinh'], expect: { sid: 'abc' } },
    { label: 'trùng tên thì cặp đầu thắng', args: ['sid=dau; sid=sau'], expect: { sid: 'dau' } },
    { label: 'giải mã lỗi thì giữ nguyên', args: ['x=%zz'], expect: { x: '%zz' } },
    { label: 'header rỗng', args: [''], expect: {} }
  ],
  solution: `function parseCookies(header = '') {
  const result = {};

  for (const raw of String(header).split(';')) {
    const pair = raw.trim();
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;

    const name = pair.slice(0, eq).trim();
    const rawValue = pair.slice(eq + 1).trim();
    if (!name || name in result) continue;

    let value = rawValue;
    try {
      value = decodeURIComponent(rawValue);
    } catch {
      /* chuỗi mã hoá hỏng — giữ nguyên bản gốc */
    }
    result[name] = value;
  }

  return result;
}`
},
{
  id: 'node-75', lang: 'node', level: 'Trung bình', topic: 'HTTP', fn: 'serializeCookie',
  title: 'Dựng header Set-Cookie an toàn',
  io: {
    signature: 'serializeCookie(name, value, options) → string',
    params: [
      ['name', 'string', 'Tên cookie. Chỉ được gồm chữ, số, gạch dưới và gạch ngang; sai thì ném lỗi.'],
      ['value', 'string', 'Giá trị, sẽ được mã hoá URL.'],
      ['options', 'object · mặc định {}',
       '{ maxAge: number giây, path: string, httpOnly: boolean, secure: boolean, sameSite: "Strict" | "Lax" | "None" }.']
    ],
    returns: ['string', 'Giá trị đặt vào header Set-Cookie. Tên sai định dạng → ném Error("tên cookie không hợp lệ").'],
    example: `serializeCookie('refresh', 'abc', { httpOnly: true, sameSite: 'Strict', maxAge: 604800 })
// → 'refresh=abc; Max-Age=604800; Path=/; HttpOnly; SameSite=Strict'`
  },
  brief: `<p>Đặt cookie là một dòng, nhưng các thuộc tính đi kèm mới quyết định an toàn.</p>
<table><thead><tr><th>Thuộc tính</th><th>Tác dụng</th></tr></thead><tbody>
<tr><td><code>HttpOnly</code></td><td>JavaScript <strong>không</strong> đọc được — XSS không lấy được token</td></tr>
<tr><td><code>Secure</code></td><td>Chỉ gửi qua HTTPS</td></tr>
<tr><td><code>SameSite</code></td><td>Chặn CSRF: không đính cookie khi request đến từ site khác</td></tr>
<tr><td><code>Max-Age</code></td><td>Sống bao nhiêu giây</td></tr>
<tr><td><code>Path</code></td><td>Đường dẫn nào thì gửi kèm</td></tr>
</tbody></table>
<p>Ghép theo đúng thứ tự sau, các phần ngăn bởi dấu chấm phẩy và một dấu cách:</p>
<pre>&lt;tên&gt;=&lt;giá trị đã mã hoá&gt;[; Max-Age=N]; Path=&lt;path&gt;[; HttpOnly][; Secure][; SameSite=X]</pre>
<ul>
<li><code>path</code> mặc định <code>'/'</code> và <strong>luôn</strong> xuất hiện</li>
<li><code>maxAge</code> chỉ xuất hiện khi là số</li>
<li>Ba thuộc tính cờ chỉ xuất hiện khi giá trị là true</li>
<li>Tên cookie không khớp <code>/^[A-Za-z0-9_-]+$/</code> → ném <code>Error('tên cookie không hợp lệ')</code></li>
</ul>`,
  starter: `function serializeCookie(name, value, options = {}) {
  // Viết code ở đây
}`,
  hints: [
    'encodeURIComponent cho giá trị; tên thì kiểm tra chứ không mã hoá.',
    'Dựng mảng các mảnh rồi join("; ").',
    'Number.isFinite phân biệt maxAge thật với undefined.'
  ],
  tests: [
    { label: 'tối giản', args: ['sid', 'abc', {}], expect: 'sid=abc; Path=/' },
    { label: 'đủ thuộc tính bảo mật', args: ['refresh', 'abc', { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 604800 }], expect: 'refresh=abc; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Strict' },
    { label: 'mã hoá giá trị', args: ['name', 'Nguyễn', {}], expect: 'name=Nguy%E1%BB%85n; Path=/' },
    { label: 'path tuỳ chỉnh', args: ['sid', 'abc', { path: '/auth' }], expect: 'sid=abc; Path=/auth' },
    { label: 'chỉ HttpOnly', args: ['sid', 'abc', { httpOnly: true }], expect: 'sid=abc; Path=/; HttpOnly' },
    { label: 'maxAge bằng 0 vẫn ghi', args: ['sid', '', { maxAge: 0 }], expect: 'sid=; Max-Age=0; Path=/' },
    { label: 'tên có ký tự lạ', script: `try { fn('a b', 'x', {}); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên cookie không hợp lệ' }
  ],
  solution: `function serializeCookie(name, value, options = {}) {
  if (!/^[A-Za-z0-9_-]+$/.test(String(name))) throw new Error('tên cookie không hợp lệ');

  const parts = [name + '=' + encodeURIComponent(value)];

  if (Number.isFinite(options.maxAge)) parts.push('Max-Age=' + options.maxAge);
  parts.push('Path=' + (options.path ?? '/'));
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push('SameSite=' + options.sameSite);

  return parts.join('; ');
}`
},
{
  id: 'node-76', lang: 'node', level: 'Cơ bản', topic: 'HTTP', fn: 'cacheHeadersFor',
  title: 'Chọn Cache-Control theo loại tài nguyên',
  io: {
    signature: 'cacheHeadersFor(kind) → object',
    params: [
      ['kind', 'string', 'Loại tài nguyên: "immutable", "html", "api", "private", "no-store". Giá trị lạ hoặc thiếu → coi như "no-store".']
    ],
    returns: ['object', '{ "Cache-Control": string } — giá trị header tương ứng.'],
    example: `cacheHeadersFor('immutable')
// → { 'Cache-Control': 'public, max-age=31536000, immutable' }`
  },
  brief: `<p>Cache sai là một trong hai cách nhanh nhất làm hỏng trải nghiệm: cache quá lâu thì người dùng thấy bản cũ, không cache gì thì server gánh hết.</p>
<table><thead><tr><th>kind</th><th>Cache-Control</th><th>Dùng cho</th></tr></thead><tbody>
<tr><td><code>'immutable'</code></td><td><code>public, max-age=31536000, immutable</code></td><td>File có mã băm trong tên: <code>app.7f3a.js</code></td></tr>
<tr><td><code>'html'</code></td><td><code>no-cache</code></td><td>Trang HTML — luôn hỏi lại nhưng dùng lại được nếu chưa đổi</td></tr>
<tr><td><code>'api'</code></td><td><code>public, max-age=60, stale-while-revalidate=300</code></td><td>API đọc nhiều, chịu được dữ liệu cũ một phút</td></tr>
<tr><td><code>'private'</code></td><td><code>private, max-age=0, must-revalidate</code></td><td>Dữ liệu riêng của từng người</td></tr>
<tr><td><code>'no-store'</code></td><td><code>no-store</code></td><td>Thông tin nhạy cảm — không lưu ở bất kỳ đâu</td></tr>
</tbody></table>
<p class="warn">Phân biệt <code>no-cache</code> với <code>no-store</code>: <code>no-cache</code> vẫn <em>lưu</em>, chỉ bắt hỏi lại server xem có mới không. <code>no-store</code> mới là không lưu gì cả. Nhầm hai cái này thì sao kê ngân hàng của người dùng nằm lại trong cache máy công cộng.</p>
<p class="callout">Quên <code>private</code> cũng nguy hiểm: cache dùng chung (CDN, proxy công ty) sẽ lưu response của người này rồi trả cho người khác.</p>`,
  starter: `function cacheHeadersFor(kind) {
  // Viết code ở đây
}`,
  hints: [
    'Một object tra cứu là đủ, không cần switch.',
    'Giá trị lạ rơi về "no-store" — dùng ?? cho nhánh mặc định.',
    'Trả về object mới, đừng trả về chính object tra cứu.'
  ],
  tests: [
    { label: 'immutable', args: ['immutable'], expect: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    { label: 'html', args: ['html'], expect: { 'Cache-Control': 'no-cache' } },
    { label: 'api', args: ['api'], expect: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    { label: 'private', args: ['private'], expect: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    { label: 'no-store', args: ['no-store'], expect: { 'Cache-Control': 'no-store' } },
    { label: 'giá trị lạ về no-store', args: ['linh-tinh'], expect: { 'Cache-Control': 'no-store' } },
    { label: 'thiếu tham số', args: [undefined], expect: { 'Cache-Control': 'no-store' } }
  ],
  solution: `function cacheHeadersFor(kind) {
  const TABLE = {
    immutable: 'public, max-age=31536000, immutable',
    html: 'no-cache',
    api: 'public, max-age=60, stale-while-revalidate=300',
    private: 'private, max-age=0, must-revalidate',
    'no-store': 'no-store',
  };

  return { 'Cache-Control': TABLE[kind] ?? 'no-store' };
}`
},
{
  id: 'node-77', lang: 'node', level: 'Trung bình', topic: 'HTTP', fn: 'conditionalStatus',
  title: 'ETag và câu trả lời 304',
  io: {
    signature: 'conditionalStatus(req, etag) → number',
    params: [
      ['req', 'object', 'Request đang xử lý: { method: string, headers: object }. Header quan tâm là if-none-match (đã viết thường), có thể chứa nhiều ETag ngăn bởi dấu phẩy, hoặc dấu sao.'],
      ['etag', 'string', 'ETag hiện tại của tài nguyên, ví dụ chuỗi có nháy kép bao quanh.']
    ],
    returns: ['number', '304 khi client đã có bản mới nhất, ngược lại 200.'],
    example: `conditionalStatus({ method: 'GET', headers: { 'if-none-match': '"v3"' } }, '"v3"')   // → 304
conditionalStatus({ method: 'GET', headers: { 'if-none-match': '"v2"' } }, '"v3"')   // → 200`
  },
  brief: `<p><strong>ETag</strong> là dấu vân tay của một phiên bản nội dung. Server gửi kèm response; lần sau client hỏi lại kèm <code>If-None-Match</code>, và nếu nội dung chưa đổi, server trả <strong>304 Not Modified</strong> với body rỗng — tiết kiệm băng thông cho cả hai bên.</p>
<ul>
<li>Method không phải <code>GET</code> hoặc <code>HEAD</code> → luôn <code>200</code>; cache có điều kiện chỉ áp dụng cho đọc</li>
<li>Không có header <code>if-none-match</code> → <code>200</code></li>
<li>Header là <code>'*'</code> → <code>304</code></li>
<li>Header chứa nhiều ETag ngăn bởi dấu phẩy; khớp <strong>bất kỳ</strong> cái nào → <code>304</code></li>
<li>Tiền tố <code>W/</code> đánh dấu ETag yếu, phải bỏ đi trước khi so sánh</li>
</ul>`,
  starter: `function conditionalStatus(req = {}, etag) {
  // Viết code ở đây
}`,
  hints: [
    'Viết một hàm phụ bỏ tiền tố W/ rồi dùng cho cả hai bên so sánh.',
    'split(",").map(trim) rồi some() là đủ.',
    'Xử lý dấu sao trước khi tách theo dấu phẩy.'
  ],
  tests: [
    { label: 'khớp ETag', args: [{ method: 'GET', headers: { 'if-none-match': '"v3"' } }, '"v3"'], expect: 304 },
    { label: 'không khớp', args: [{ method: 'GET', headers: { 'if-none-match': '"v2"' } }, '"v3"'], expect: 200 },
    { label: 'không có header', args: [{ method: 'GET', headers: {} }, '"v3"'], expect: 200 },
    { label: 'dấu sao khớp mọi thứ', args: [{ method: 'GET', headers: { 'if-none-match': '*' } }, '"v3"'], expect: 304 },
    { label: 'nhiều ETag, khớp một cái', args: [{ method: 'GET', headers: { 'if-none-match': '"v1", "v3", "v5"' } }, '"v3"'], expect: 304 },
    { label: 'ETag yếu vẫn khớp', args: [{ method: 'GET', headers: { 'if-none-match': 'W/"v3"' } }, '"v3"'], expect: 304 },
    { label: 'HEAD cũng được', args: [{ method: 'HEAD', headers: { 'if-none-match': '"v3"' } }, '"v3"'], expect: 304 },
    { label: 'POST luôn 200', args: [{ method: 'POST', headers: { 'if-none-match': '"v3"' } }, '"v3"'], expect: 200 }
  ],
  solution: `function conditionalStatus(req = {}, etag) {
  const method = String(req.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return 200;

  const header = (req.headers || {})['if-none-match'];
  if (!header) return 200;
  if (String(header).trim() === '*') return 304;

  const strip = (tag) => String(tag).trim().replace(/^W\\//, '');
  const current = strip(etag);

  const matched = String(header)
    .split(',')
    .some((candidate) => strip(candidate) === current);

  return matched ? 304 : 200;
}`
},
{
  id: 'node-78', lang: 'node', level: 'Cơ bản', topic: 'Express', fn: 'normalizePath',
  title: 'Chuẩn hoá đường dẫn',
  io: {
    signature: 'normalizePath(path) → string',
    params: [
      ['path', 'string', 'Đường dẫn thô từ request. Có thể thiếu dấu gạch chéo đầu, có gạch chéo lặp, có gạch chéo thừa ở cuối, có query hoặc fragment, hoặc viết HOA.']
    ],
    returns: ['string', 'Đường dẫn đã chuẩn hoá: luôn bắt đầu bằng dấu gạch chéo, không kết thúc bằng nó trừ đường dẫn gốc.'],
    example: `normalizePath('//API//Todos//')   // → '/api/todos'`
  },
  brief: `<p><code>/todos</code>, <code>/todos/</code> và <code>//todos</code> là ba chuỗi khác nhau nhưng người dùng nghĩ chúng là một. Không chuẩn hoá thì route khớp lúc được lúc không, và cache lưu ba bản cho cùng một trang.</p>
<ul>
<li>Bỏ phần query và fragment (từ <code>?</code> hoặc <code>#</code> trở đi)</li>
<li>Chuyển về chữ thường</li>
<li>Gộp nhiều dấu gạch chéo liên tiếp thành một</li>
<li>Bảo đảm bắt đầu bằng đúng một dấu gạch chéo</li>
<li>Bỏ dấu gạch chéo ở cuối, <strong>trừ khi</strong> kết quả chỉ còn <code>'/'</code></li>
<li>Chuỗi rỗng → <code>'/'</code></li>
</ul>
<p class="callout">Chỉ chuyển chữ thường cho <em>đường dẫn</em>, và cũng chỉ đúng khi bạn quy ước đường dẫn không phân biệt hoa thường. Query string thì tuyệt đối không đụng vào — với người dùng, hai từ khoá khác hoa thường là hai từ khoá khác nhau.</p>`,
  starter: `function normalizePath(path) {
  // Viết code ở đây
}`,
  hints: [
    'Cắt query và fragment trước, bằng cách tìm ký tự ? và # sớm nhất.',
    'Một biểu thức chính quy gộp được mọi dấu gạch chéo lặp.',
    'Xử lý trường hợp chỉ còn "/" sau cùng.'
  ],
  tests: [
    { label: 'đã chuẩn', args: ['/api/todos'], expect: '/api/todos' },
    { label: 'bỏ gạch chéo cuối', args: ['/api/todos/'], expect: '/api/todos' },
    { label: 'gộp gạch chéo lặp', args: ['//api//todos'], expect: '/api/todos' },
    { label: 'thêm gạch chéo đầu', args: ['api/todos'], expect: '/api/todos' },
    { label: 'chữ HOA thành thường', args: ['/API/Todos'], expect: '/api/todos' },
    { label: 'bỏ query', args: ['/api/todos?page=2'], expect: '/api/todos' },
    { label: 'bỏ fragment', args: ['/api/todos#top'], expect: '/api/todos' },
    { label: 'đường dẫn gốc giữ nguyên', args: ['/'], expect: '/' },
    { label: 'chuỗi rỗng', args: [''], expect: '/' },
    { label: 'tất cả cùng lúc', args: ['//API//Todos//?x=1#y'], expect: '/api/todos' }
  ],
  solution: `function normalizePath(path) {
  let text = String(path ?? '');

  const cut = [text.indexOf('?'), text.indexOf('#')].filter((i) => i !== -1);
  if (cut.length) text = text.slice(0, Math.min(...cut));

  text = text.toLowerCase().replace(/\\/+/g, '/');
  if (!text.startsWith('/')) text = '/' + text;
  if (text.length > 1 && text.endsWith('/')) text = text.slice(0, -1);

  return text;
}`
},
{
  id: 'node-79', lang: 'node', level: 'Trung bình', topic: 'Router', fn: 'resolveStatus',
  title: '404 hay 405',
  io: {
    signature: 'resolveStatus(routes, method, path) → number',
    params: [
      ['routes', 'Array<object> · mặc định []', 'Bảng route: { method: string, path: string }. path có thể chứa đoạn tham số dạng hai chấm cộng tên.'],
      ['method', 'string', 'Method của request, không phân biệt hoa thường.'],
      ['path', 'string', 'Đường dẫn của request.']
    ],
    returns: ['number', '200 khi có route khớp cả method lẫn đường dẫn; 405 khi đường dẫn tồn tại nhưng method không được hỗ trợ; 404 khi không đường dẫn nào khớp.'],
    example: `resolveStatus([{ method: 'GET', path: '/todos' }], 'POST', '/todos')   // → 405
resolveStatus([{ method: 'GET', path: '/todos' }], 'GET', '/users')   // → 404`
  },
  brief: `<p>Client gọi <code>DELETE /todos</code> trong khi bạn chỉ hỗ trợ <code>GET</code> và <code>POST</code>. Trả 404 là sai: đường dẫn <em>có</em> tồn tại, chỉ là method không được phép. Câu trả lời đúng là <strong>405 Method Not Allowed</strong>.</p>
<p>Khác biệt không phải chuyện câu chữ: 404 khiến người gọi đi tìm xem có viết sai URL không, còn 405 chỉ thẳng vào vấn đề.</p>
<ol>
<li>Có route khớp <strong>cả</strong> method và đường dẫn → <code>200</code></li>
<li>Có route khớp đường dẫn nhưng khác method → <code>405</code></li>
<li>Không route nào khớp đường dẫn → <code>404</code></li>
</ol>
<p>Khớp đường dẫn nghĩa là cùng số đoạn, và mỗi đoạn hoặc giống hệt hoặc là tham số.</p>`,
  starter: `function resolveStatus(routes = [], method, path) {
  // Viết code ở đây
}`,
  hints: [
    'Tách thành hai bước: lọc route khớp đường dẫn trước, rồi mới xét method.',
    'Viết hàm phụ trả về boolean cho phép so khớp đường dẫn.',
    'Danh sách khớp đường dẫn rỗng là 404; không rỗng mà không khớp method là 405.'
  ],
  tests: [
    { label: 'khớp hoàn toàn', args: [[{ method: 'GET', path: '/todos' }], 'GET', '/todos'], expect: 200 },
    { label: 'sai method', args: [[{ method: 'GET', path: '/todos' }], 'POST', '/todos'], expect: 405 },
    { label: 'không có đường dẫn', args: [[{ method: 'GET', path: '/todos' }], 'GET', '/users'], expect: 404 },
    { label: 'khớp qua tham số', args: [[{ method: 'PUT', path: '/todos/:id' }], 'PUT', '/todos/42'], expect: 200 },
    { label: 'tham số khớp nhưng sai method', args: [[{ method: 'PUT', path: '/todos/:id' }], 'DELETE', '/todos/42'], expect: 405 },
    { label: 'nhiều method cho cùng đường dẫn', args: [[{ method: 'GET', path: '/todos' }, { method: 'POST', path: '/todos' }], 'POST', '/todos'], expect: 200 },
    { label: 'method viết thường', args: [[{ method: 'GET', path: '/todos' }], 'get', '/todos'], expect: 200 },
    { label: 'khác số đoạn', args: [[{ method: 'GET', path: '/todos/:id' }], 'GET', '/todos'], expect: 404 },
    { label: 'bảng rỗng', args: [[], 'GET', '/'], expect: 404 }
  ],
  solution: `function resolveStatus(routes = [], method, path) {
  const parts = String(path).split('/');

  const matchesPath = (routePath) => {
    const segments = String(routePath).split('/');
    if (segments.length !== parts.length) return false;
    return segments.every((segment, i) => segment.startsWith(':') || segment === parts[i]);
  };

  const samePath = routes.filter((route) => matchesPath(route.path));
  if (samePath.length === 0) return 404;

  const wanted = String(method).toUpperCase();
  const allowed = samePath.some((route) => String(route.method).toUpperCase() === wanted);

  return allowed ? 200 : 405;
}`
},
{
  id: 'node-80', lang: 'node', level: 'Cơ bản', topic: 'Validation', fn: 'asArray',
  title: 'Query param khi có khi không phải mảng',
  io: {
    signature: 'asArray(value) → Array',
    params: [
      ['value', 'bất kỳ', 'Giá trị lấy từ req.query. Có thể là undefined (không truyền), chuỗi (truyền một lần), hoặc mảng (truyền nhiều lần).']
    ],
    returns: ['Array', 'Luôn là mảng. undefined và null cho mảng rỗng; giá trị đơn được bọc thành mảng một phần tử.'],
    example: `asArray(undefined)      // → []
asArray('a')            // → ['a']
asArray(['a', 'b'])     // → ['a', 'b']`
  },
  brief: `<p>Đây là cái bẫy kinh điển của Express. Cùng một tham số, ba hình dạng khác nhau:</p>
<table><thead><tr><th>URL</th><th><code>req.query.tag</code></th></tr></thead><tbody>
<tr><td><code>/todos</code></td><td><code>undefined</code></td></tr>
<tr><td><code>/todos?tag=a</code></td><td><code>'a'</code></td></tr>
<tr><td><code>/todos?tag=a&amp;tag=b</code></td><td><code>['a', 'b']</code></td></tr>
</tbody></table>
<p>Code thường chỉ được thử với trường hợp thứ ba, rồi hỏng lặng lẽ ở trường hợp thứ hai — <code>'a'.map</code> không tồn tại, hoặc tệ hơn, <code>'abc'.length</code> trả về 3 và bạn tưởng có ba thẻ.</p>
<ul>
<li>Đã là mảng → trả về <strong>chính nó</strong>, không sao chép</li>
<li><code>undefined</code> hoặc <code>null</code> → mảng rỗng</li>
<li>Còn lại → bọc thành mảng một phần tử, kể cả chuỗi rỗng, số 0 và <code>false</code></li>
</ul>`,
  starter: `function asArray(value) {
  // Viết code ở đây
}`,
  hints: [
    'Array.isArray là phép kiểm tra đầu tiên.',
    'value == null bắt cả undefined lẫn null.',
    'Đừng dùng if (!value) — như vậy số 0 và chuỗi rỗng bị nuốt mất.'
  ],
  tests: [
    { label: 'undefined', args: [undefined], expect: [] },
    { label: 'null', args: [null], expect: [] },
    { label: 'một chuỗi', args: ['a'], expect: ['a'] },
    { label: 'đã là mảng', args: [['a', 'b']], expect: ['a', 'b'] },
    { label: 'mảng rỗng giữ nguyên', args: [[]], expect: [] },
    { label: 'chuỗi rỗng vẫn là một phần tử', args: [''], expect: [''] },
    { label: 'số 0 vẫn là một phần tử', args: [0], expect: [0] },
    { label: 'false vẫn là một phần tử', args: [false], expect: [false] },
    { label: 'mảng trả về chính nó', script: `const input = ['a'];
return fn(input) === input;`, expect: true }
  ],
  solution: `function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}`
},
{
  id: 'node-81', lang: 'node', level: 'Trung bình', topic: 'Bảo mật', fn: 'pickAllowed',
  title: 'Chặn mass assignment',
  io: {
    signature: 'pickAllowed(body, allowed) → object',
    params: [
      ['body', 'object · mặc định {}', 'req.body do client gửi lên. Có thể chứa bất kỳ trường nào, kể cả những trường chỉ server mới được đặt.'],
      ['allowed', 'Array<string> · mặc định []', 'Danh sách trường được phép nhận từ client.']
    ],
    returns: ['object', 'Object mới chỉ chứa các trường có trong allowed và thực sự có mặt trong body.'],
    example: `pickAllowed({ task: 'hoc', completed: true, userId: 99, isAdmin: true }, ['task', 'completed'])
// → { task: 'hoc', completed: true }`
  },
  brief: `<p>Dòng code trông vô hại này là một lỗ hổng:</p>
<pre><code>await prisma.user.update({ where: { id }, data: req.body })</code></pre>
<p>Client gửi thêm trường <code>role</code> và vừa tự phong chức cho mình. Lỗ hổng có tên: <strong>mass assignment</strong> — đổ thẳng dữ liệu người dùng vào bản ghi.</p>
<ul>
<li>Chỉ giữ những khoá có trong <code>allowed</code> <em>và</em> thực sự có mặt trong <code>body</code></li>
<li>Giá trị <code>undefined</code> được khai rõ trong body vẫn tính là có mặt</li>
<li>Không thêm khoá nào không có trong body, kể cả khi nó nằm trong <code>allowed</code></li>
<li>Không đụng vào <code>body</code> gốc</li>
</ul>
<p class="warn">Vì sao phải là danh sách cho phép chứ không phải danh sách cấm? Vì danh sách cấm cần được cập nhật mỗi lần model thêm trường mới — và người thêm trường <code>isSuperAdmin</code> vào tháng sau sẽ không nhớ tới file này.</p>
<p>Chú ý: <code>'key' in obj</code> đúng ngay cả khi giá trị là <code>undefined</code>, còn <code>obj[key] !== undefined</code> thì không.</p>`,
  starter: `function pickAllowed(body = {}, allowed = []) {
  // Viết code ở đây
}`,
  hints: [
    'Duyệt allowed chứ không duyệt body — như vậy khoá lạ không có cơ hội lọt.',
    'Object.hasOwn(body, key) hoặc key in body đều dùng được.',
    'Dựng object mới, đừng xoá khoá khỏi body gốc.'
  ],
  tests: [
    { label: 'lọc trường lạ', args: [{ task: 'hoc', userId: 99, isAdmin: true }, ['task']], expect: { task: 'hoc' } },
    { label: 'giữ nhiều trường', args: [{ task: 'hoc', completed: true }, ['task', 'completed']], expect: { task: 'hoc', completed: true } },
    { label: 'trường được phép nhưng không gửi', args: [{ task: 'hoc' }, ['task', 'completed']], expect: { task: 'hoc' } },
    { label: 'body rỗng', args: [{}, ['task']], expect: {} },
    { label: 'danh sách cho phép rỗng', args: [{ task: 'hoc' }, []], expect: {} },
    { label: 'giá trị false vẫn giữ', args: [{ completed: false }, ['completed']], expect: { completed: false } },
    { label: 'khai rõ undefined vẫn tính là có mặt', script: `const out = fn({ task: undefined }, ['task']);
return 'task' in out;`, expect: true },
    { label: 'không đụng vào body gốc', script: `const body = { task: 'hoc', isAdmin: true };
fn(body, ['task']);
return Object.keys(body).sort();`, expect: ['isAdmin', 'task'] }
  ],
  solution: `function pickAllowed(body = {}, allowed = []) {
  const result = {};

  for (const key of allowed) {
    if (Object.hasOwn(body, key)) result[key] = body[key];
  }

  return result;
}`
},
{
  id: 'node-82', lang: 'node', level: 'Trung bình', topic: 'Vận hành', fn: 'maskSecrets',
  title: 'Che dữ liệu nhạy cảm trước khi ghi log',
  io: {
    signature: 'maskSecrets(value, keys) → bất kỳ',
    params: [
      ['value', 'bất kỳ', 'Dữ liệu sắp ghi log: object, mảng, hoặc giá trị đơn. Có thể lồng nhiều tầng.'],
      ['keys', 'Array<string> · mặc định []', 'Tên các trường cần che. So sánh KHÔNG phân biệt hoa thường.']
    ],
    returns: ['bất kỳ', 'Bản sao với mọi trường trong danh sách được thay bằng ba dấu sao. Dữ liệu gốc không bị thay đổi.'],
    example: `maskSecrets({ username: 'kiet', password: '123', nested: { token: 'abc' } }, ['password', 'token'])
// → { username: 'kiet', password: '***', nested: { token: '***' } }`
  },
  brief: `<p>Ghi log nguyên <code>req.body</code> là cách nhanh nhất để mật khẩu người dùng nằm vĩnh viễn trong file log — nơi có nhiều người đọc được hơn database rất nhiều.</p>
<ul>
<li>Trường có tên nằm trong <code>keys</code> → giá trị thành chuỗi ba dấu sao, bất kể kiểu gì</li>
<li>So sánh tên trường <strong>không phân biệt hoa thường</strong></li>
<li>Đệ quy vào object lồng nhau và vào phần tử của mảng</li>
<li><strong>Không thay đổi dữ liệu gốc</strong> — trả về bản sao</li>
<li>Giá trị không phải object (chuỗi, số, null) thì trả về nguyên vẹn</li>
</ul>
<p class="callout">Danh sách nên có sẵn trong mọi dự án: <code>password</code>, <code>token</code>, <code>accessToken</code>, <code>refreshToken</code>, <code>authorization</code>, <code>secret</code>, <code>apiKey</code>.</p>`,
  starter: `function maskSecrets(value, keys = []) {
  // Viết code ở đây
}`,
  hints: [
    'Chuyển keys thành một Set các tên viết thường để tra nhanh.',
    'Array.isArray phải kiểm tra trước typeof === "object", vì mảng cũng là object.',
    'null có typeof là "object" — nhớ loại nó ra.'
  ],
  tests: [
    { label: 'che một trường', args: [{ username: 'kiet', password: '123' }, ['password']], expect: { username: 'kiet', password: '***' } },
    { label: 'object lồng nhau', args: [{ user: { name: 'kiet', token: 'abc' } }, ['token']], expect: { user: { name: 'kiet', token: '***' } } },
    { label: 'trong mảng', args: [[{ password: 'a' }, { password: 'b' }], ['password']], expect: [{ password: '***' }, { password: '***' }] },
    { label: 'không phân biệt hoa thường', args: [{ Password: '123', TOKEN: 'abc' }, ['password', 'token']], expect: { Password: '***', TOKEN: '***' } },
    { label: 'không có gì để che', args: [{ a: 1 }, ['password']], expect: { a: 1 } },
    { label: 'giá trị đơn trả nguyên', args: ['xin chao', ['password']], expect: 'xin chao' },
    { label: 'null trả nguyên', args: [null, ['password']], expect: null },
    { label: 'che cả object con', args: [{ token: { a: 1 } }, ['token']], expect: { token: '***' } },
    { label: 'không đụng vào dữ liệu gốc', script: `const data = { password: '123' };
fn(data, ['password']);
return data.password;`, expect: '123' }
  ],
  solution: `function maskSecrets(value, keys = []) {
  const secret = new Set(keys.map((key) => String(key).toLowerCase()));

  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node === null || typeof node !== 'object') return node;

    const copy = {};
    for (const [key, child] of Object.entries(node)) {
      copy[key] = secret.has(key.toLowerCase()) ? '***' : walk(child);
    }
    return copy;
  };

  return walk(value);
}`
}
];
