/* Bài tập Node.js phần 2 — bám theo mạch khoá học backend của Smoljames
 * (Internet → Node → Express → Middleware → Router → SQLite → JWT → Prisma → Docker).
 * Bài có `tests` thì chạy test thật; bài viết cấu hình thì chấm theo `rubric`. */

export default [
{
  id: 'node-26', lang: 'node', level: 'Cơ bản', topic: 'Internet', fn: 'parseUrlParts',
  title: 'Mổ xẻ một URL',
  io: {
    signature: 'parseUrlParts(url) → object',
    params: [
      ['url', 'string',
       'Một URL đầy đủ, ví dụ "https://store.example.com:8080/api/orders?page=2#top". Có thể thiếu port, path, query hoặc fragment. Nếu thiếu "://" thì phải ném lỗi.']
    ],
    returns: ['object',
      'Bảy trường: protocol, subdomain, domain, path, query, fragment là chuỗi; port là number hoặc null.'],
    example: `parseUrlParts('https://www.youtube.com')
// → { protocol: 'https', subdomain: 'www', domain: 'youtube.com',
//      port: null, path: '/', query: '', fragment: '' }`
  },
  brief: `<p>URL không phải một khối liền. Nó là địa chỉ có nhiều phần, và mỗi phần có việc riêng. Viết hàm <code>parseUrlParts(url)</code> tách chúng ra.</p>
<table><thead><tr><th>Phần</th><th>Lấy ở đâu</th><th>Khi không có</th></tr></thead><tbody>
<tr><td><code>protocol</code></td><td>Trước <code>://</code></td><td>Ném <code>Error('URL thiếu protocol')</code></td></tr>
<tr><td><code>subdomain</code></td><td>Các nhãn đầu của host, nếu host có từ 3 nhãn trở lên</td><td>Chuỗi rỗng</td></tr>
<tr><td><code>domain</code></td><td>Hai nhãn cuối của host. Host chỉ có một nhãn (<code>localhost</code>) thì lấy nguyên</td><td>—</td></tr>
<tr><td><code>port</code></td><td>Sau dấu hai chấm trong host, đổi sang số</td><td><code>null</code></td></tr>
<tr><td><code>path</code></td><td>Từ dấu <code>/</code> đầu tiên sau host</td><td><code>'/'</code></td></tr>
<tr><td><code>query</code></td><td>Sau <code>?</code>, không gồm dấu <code>?</code></td><td>Chuỗi rỗng</td></tr>
<tr><td><code>fragment</code></td><td>Sau <code>#</code>, không gồm dấu <code>#</code></td><td>Chuỗi rỗng</td></tr>
</tbody></table>
<p>Thứ tự cắt quan trọng: <code>#</code> trước, rồi <code>?</code>, rồi <code>/</code>, rồi <code>:</code>. Cắt sai thứ tự thì dấu <code>?</code> nằm trong fragment sẽ phá kết quả.</p>`,
  starter: `function parseUrlParts(url) {
  // Viết code ở đây
}`,
  hints: [
    'indexOf("://") cho biết protocol kết thúc ở đâu.',
    'Cắt từ phải sang trái: fragment, query, path, rồi mới tới port.',
    'split(".") trên host rồi dùng slice(-2) để lấy hai nhãn cuối.'
  ],
  tests: [
    { label: 'URL tối giản', args: ['https://www.youtube.com'], expect: { protocol: 'https', subdomain: 'www', domain: 'youtube.com', port: null, path: '/', query: '', fragment: '' } },
    { label: 'localhost có port', args: ['http://localhost:3000/api/data'], expect: { protocol: 'http', subdomain: '', domain: 'localhost', port: 3000, path: '/api/data', query: '', fragment: '' } },
    { label: 'đủ mọi thành phần', args: ['https://store.example.com:8080/api/orders?page=2#top'], expect: { protocol: 'https', subdomain: 'store', domain: 'example.com', port: 8080, path: '/api/orders', query: 'page=2', fragment: 'top' } },
    { label: 'không có subdomain', args: ['https://example.com/a/b'], expect: { protocol: 'https', subdomain: '', domain: 'example.com', port: null, path: '/a/b', query: '', fragment: '' } },
    { label: 'subdomain nhiều tầng', args: ['https://api.v2.example.com/'], expect: { protocol: 'https', subdomain: 'api.v2', domain: 'example.com', port: null, path: '/', query: '', fragment: '' } },
    { label: 'thiếu protocol thì ném lỗi', script: `try { fn('example.com/a'); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'URL thiếu protocol' }
  ],
  solution: `function parseUrlParts(url) {
  const text = String(url);
  const sep = text.indexOf('://');
  if (sep === -1) throw new Error('URL thiếu protocol');

  const protocol = text.slice(0, sep);
  let rest = text.slice(sep + 3);

  let fragment = '';
  const hash = rest.indexOf('#');
  if (hash !== -1) { fragment = rest.slice(hash + 1); rest = rest.slice(0, hash); }

  let query = '';
  const mark = rest.indexOf('?');
  if (mark !== -1) { query = rest.slice(mark + 1); rest = rest.slice(0, mark); }

  let path = '/';
  const slash = rest.indexOf('/');
  if (slash !== -1) { path = rest.slice(slash) || '/'; rest = rest.slice(0, slash); }

  let port = null;
  const colon = rest.indexOf(':');
  if (colon !== -1) { port = Number(rest.slice(colon + 1)); rest = rest.slice(0, colon); }

  const labels = rest.split('.');
  const domain = labels.length >= 2 ? labels.slice(-2).join('.') : rest;
  const subdomain = labels.length >= 3 ? labels.slice(0, -2).join('.') : '';

  return { protocol, subdomain, domain, port, path, query, fragment };
}`
},
{
  id: 'node-27', lang: 'node', level: 'Cơ bản', topic: 'Internet', fn: 'summarizeRequest',
  title: 'Đọc một network request',
  io: {
    signature: 'summarizeRequest(req) → object',
    params: [
      ['req', 'object', 'Một request thô. Các trường có thể gặp: method (string, có thể viết thường hoặc thiếu), url (string, có thể kèm query), headers (object, tên header có thể viết HOA hay thường), body (object hoặc string, có thể thiếu).']
    ],
    returns: ['object',
      '{ method: string viết HOA, path: string, query: string, hasBody: boolean, hasToken: boolean }.'],
    example: `summarizeRequest({ method: 'post', url: '/api/orders?draft=1', headers: { Authorization: 'abc' }, body: { productId: 1 } })
// → { method: 'POST', path: '/api/orders', query: 'draft=1', hasBody: true, hasToken: true }`
  },
  brief: `<p>Server nhận được request dưới dạng một object thô và phải tự hiểu ý định của nó. Viết hàm <code>summarizeRequest(req)</code> rút ra năm thông tin.</p>
<ul>
<li><code>method</code> — viết HOA. Thiếu <code>method</code> thì coi như <code>'GET'</code>.</li>
<li><code>path</code> — phần <code>url</code> trước dấu <code>?</code>. Thiếu <code>url</code> thì là <code>'/'</code>.</li>
<li><code>query</code> — phần sau dấu <code>?</code>, không có thì chuỗi rỗng.</li>
<li><code>hasBody</code> — <code>true</code> khi body là object có ít nhất một khoá, hoặc là chuỗi khác rỗng.</li>
<li><code>hasToken</code> — <code>true</code> khi headers có header <code>authorization</code> với giá trị khác rỗng. Tên header <strong>không phân biệt hoa thường</strong>, vì HTTP quy định như vậy.</li>
</ul>`,
  starter: `function summarizeRequest(req = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Duyệt Object.entries(headers) và so sánh key.toLowerCase() === "authorization".',
    'Object.keys(body).length > 0 phân biệt được object rỗng với object có dữ liệu.',
    'Mảng cũng là object — nhưng bài này không cần lo, body luôn là object thường hoặc chuỗi.'
  ],
  tests: [
    { label: 'request tối giản', args: [{}], expect: { method: 'GET', path: '/', query: '', hasBody: false, hasToken: false } },
    { label: 'method viết thường', args: [{ method: 'post', url: '/api/orders' }], expect: { method: 'POST', path: '/api/orders', query: '', hasBody: false, hasToken: false } },
    { label: 'tách query', args: [{ method: 'GET', url: '/api/orders?page=2&size=20' }], expect: { method: 'GET', path: '/api/orders', query: 'page=2&size=20', hasBody: false, hasToken: false } },
    { label: 'có body', args: [{ method: 'POST', url: '/todos', body: { task: 'học' } }], expect: { method: 'POST', path: '/todos', query: '', hasBody: true, hasToken: false } },
    { label: 'body rỗng không tính', args: [{ method: 'POST', url: '/todos', body: {} }], expect: { method: 'POST', path: '/todos', query: '', hasBody: false, hasToken: false } },
    { label: 'header viết HOA vẫn nhận', args: [{ method: 'GET', url: '/todos', headers: { Authorization: 'eyJ...' } }], expect: { method: 'GET', path: '/todos', query: '', hasBody: false, hasToken: true } },
    { label: 'header rỗng không tính là có token', args: [{ method: 'GET', url: '/todos', headers: { authorization: '' } }], expect: { method: 'GET', path: '/todos', query: '', hasBody: false, hasToken: false } }
  ],
  solution: `function summarizeRequest(req = {}) {
  const method = String(req.method || 'GET').toUpperCase();
  const url = String(req.url || '/');
  const mark = url.indexOf('?');
  const path = mark === -1 ? url : url.slice(0, mark);
  const query = mark === -1 ? '' : url.slice(mark + 1);

  const body = req.body;
  const hasBody = typeof body === 'string'
    ? body.length > 0
    : Boolean(body) && typeof body === 'object' && Object.keys(body).length > 0;

  let hasToken = false;
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (key.toLowerCase() === 'authorization' && String(value || '')) hasToken = true;
  }

  return { method, path, query, hasBody, hasToken };
}`
},
{
  id: 'node-28', lang: 'node', level: 'Cơ bản', topic: 'Internet', fn: 'isValidIPv4',
  title: 'Kiểm tra địa chỉ IPv4',
  io: {
    signature: 'isValidIPv4(text) → boolean',
    params: [
      ['text', 'string (hoặc bất kỳ)', 'Chuỗi cần kiểm tra, ví dụ "192.168.1.1". Có thể là chuỗi rỗng, có khoảng trắng, thiếu nhóm, hoặc không phải chuỗi.']
    ],
    returns: ['boolean', 'true khi đúng bốn nhóm số, mỗi nhóm từ 0 đến 255 và không có số 0 thừa ở đầu.'],
    example: `isValidIPv4('192.168.1.1')   // → true
isValidIPv4('192.168.01.1')  // → false (số 0 thừa ở đầu)
isValidIPv4('256.1.1.1')     // → false`
  },
  brief: `<p>Mỗi thiết bị nối vào internet có một địa chỉ IP. Viết hàm <code>isValidIPv4(text)</code> kiểm tra một chuỗi có phải địa chỉ IPv4 hợp lệ không.</p>
<ul>
<li>Đúng bốn nhóm, ngăn nhau bởi dấu chấm</li>
<li>Mỗi nhóm chỉ gồm chữ số, giá trị từ 0 đến 255</li>
<li><code>'0'</code> hợp lệ, nhưng <code>'01'</code> và <code>'000'</code> thì không — số 0 thừa ở đầu là sai</li>
<li>Khoảng trắng ở bất kỳ đâu đều làm chuỗi thành không hợp lệ</li>
<li>Đầu vào không phải chuỗi → <code>false</code>, không được ném lỗi</li>
</ul>`,
  starter: `function isValidIPv4(text) {
  // Viết code ở đây
}`,
  hints: [
    'split(".") rồi kiểm tra length === 4 trước.',
    '/^\\d+$/.test(part) loại được cả khoảng trắng lẫn chữ cái.',
    'Số 0 thừa: part.length > 1 && part[0] === "0".'
  ],
  tests: [
    { label: 'IP thường gặp', args: ['192.168.1.1'], expect: true },
    { label: 'biên 0 và 255', args: ['0.0.0.255'], expect: true },
    { label: 'vượt 255', args: ['256.1.1.1'], expect: false },
    { label: 'số 0 thừa ở đầu', args: ['192.168.01.1'], expect: false },
    { label: 'thiếu nhóm', args: ['1.2.3'], expect: false },
    { label: 'thừa nhóm', args: ['1.2.3.4.5'], expect: false },
    { label: 'có khoảng trắng', args: ['192.168.1. 1'], expect: false },
    { label: 'chuỗi rỗng', args: [''], expect: false },
    { label: 'không phải chuỗi', args: [null], expect: false }
  ],
  solution: `function isValidIPv4(text) {
  if (typeof text !== 'string') return false;
  const parts = text.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^[0-9]+$/.test(part)) return false;
    if (part.length > 1 && part[0] === '0') return false;
    return Number(part) <= 255;
  });
}`
},
{
  id: 'node-29', lang: 'node', level: 'Trung bình', topic: 'Internet', fn: 'resolveHost',
  title: 'Tra DNS có dự phòng',
  io: {
    signature: 'resolveHost(host, dnsTable) → string | null',
    params: [
      ['host', 'string', 'Tên miền đầy đủ, ví dụ "api.v2.example.com". Có thể chỉ có một nhãn ("localhost").'],
      ['dnsTable', 'object · mặc định {}', 'Bảng tra: tên miền → địa chỉ IP (chuỗi). Bảng có thể chỉ khai báo tên miền gốc mà không khai báo từng subdomain.']
    ],
    returns: ['string | null', 'Địa chỉ IP tìm được, hoặc null khi không tra ra.'],
    example: `resolveHost('api.v2.example.com', { 'example.com': '1.2.3.4' })
// → '1.2.3.4'   (bỏ dần nhãn bên trái cho tới khi khớp)`
  },
  brief: `<p>DNS là cuốn danh bạ đổi tên miền thành địa chỉ IP. Viết hàm <code>resolveHost(host, dnsTable)</code> mô phỏng cách tra cứu đó.</p>
<ul>
<li>Thử tra <strong>nguyên host</strong> trước — khớp thì trả về ngay</li>
<li>Không khớp thì bỏ nhãn ngoài cùng bên trái rồi tra lại, lặp cho tới khi chỉ còn hai nhãn</li>
<li>Tra hết vẫn không thấy → <code>null</code></li>
<li>Host chỉ có một nhãn thì chỉ tra đúng nó</li>
</ul>
<p>Ví dụ với <code>a.b.example.com</code>, thứ tự tra là: <code>a.b.example.com</code> → <code>b.example.com</code> → <code>example.com</code>.</p>`,
  starter: `function resolveHost(host, dnsTable = {}) {
  // Viết code ở đây
}`,
  hints: [
    'labels.slice(i).join(".") sinh ra từng ứng viên khi i tăng dần.',
    'Dừng khi số nhãn còn lại nhỏ hơn 2.',
    'Object.hasOwn hoặc phép so sánh với undefined đều dùng được để biết khoá có tồn tại.'
  ],
  tests: [
    { label: 'khớp nguyên host', args: ['www.youtube.com', { 'www.youtube.com': '142.250.0.1' }], expect: '142.250.0.1' },
    { label: 'lùi về tên miền gốc', args: ['api.v2.example.com', { 'example.com': '1.2.3.4' }], expect: '1.2.3.4' },
    { label: 'ưu tiên bản khớp dài nhất', args: ['api.example.com', { 'api.example.com': '5.5.5.5', 'example.com': '1.2.3.4' }], expect: '5.5.5.5' },
    { label: 'một nhãn', args: ['localhost', { localhost: '127.0.0.1' }], expect: '127.0.0.1' },
    { label: 'một nhãn không có trong bảng', args: ['localhost', {}], expect: null },
    { label: 'không tra ra', args: ['a.b.unknown.dev', { 'example.com': '1.2.3.4' }], expect: null }
  ],
  solution: `function resolveHost(host, dnsTable = {}) {
  const labels = String(host).split('.');

  if (labels.length === 1) {
    return dnsTable[host] ?? null;
  }

  for (let i = 0; i <= labels.length - 2; i++) {
    const candidate = labels.slice(i).join('.');
    if (dnsTable[candidate] !== undefined) return dnsTable[candidate];
  }
  return null;
}`
},
{
  id: 'node-30', lang: 'node', level: 'Cơ bản', topic: 'Internet', fn: 'buildUrl',
  title: 'Dựng lại URL từ các phần',
  io: {
    signature: 'buildUrl(parts) → string',
    params: [
      ['parts', 'object', 'Các mảnh của URL: protocol (string, bắt buộc), domain (string, bắt buộc), subdomain (string, tuỳ chọn), port (number hoặc null, tuỳ chọn), path (string, tuỳ chọn), query (string, tuỳ chọn, không có dấu ?), fragment (string, tuỳ chọn, không có dấu #).']
    ],
    returns: ['string', 'URL hoàn chỉnh. Thiếu protocol hoặc domain thì ném Error("thiếu protocol hoặc domain").'],
    example: `buildUrl({ protocol: 'https', subdomain: 'store', domain: 'example.com', port: 8080, path: '/api/orders', query: 'page=2' })
// → 'https://store.example.com:8080/api/orders?page=2'`
  },
  brief: `<p>Bài này là chiều ngược của <code>parseUrlParts</code>: ghép các mảnh lại thành URL.</p>
<ul>
<li><code>protocol</code> và <code>domain</code> bắt buộc. Thiếu một trong hai → ném <code>Error('thiếu protocol hoặc domain')</code></li>
<li><code>subdomain</code> khác rỗng thì đặt trước domain, ngăn bởi dấu chấm</li>
<li><code>port</code> là số thì thêm <code>:port</code>; <code>null</code> hoặc thiếu thì bỏ qua</li>
<li><code>path</code> mặc định <code>'/'</code>. Nếu có mà không bắt đầu bằng <code>/</code> thì tự thêm vào</li>
<li><code>query</code> khác rỗng thì thêm <code>?query</code>; <code>fragment</code> khác rỗng thì thêm <code>#fragment</code></li>
</ul>
<p>Ghép xong, <code>parseUrlParts(buildUrl(x))</code> phải trả lại đúng <code>x</code> — đó là cách tự kiểm tra tốt nhất.</p>`,
  starter: `function buildUrl(parts = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Dựng host trước, rồi mới nối path, query và fragment.',
    'Number.isFinite(port) phân biệt được số thật với null và undefined.',
    'path.startsWith("/") cho biết có cần thêm dấu gạch chéo không.'
  ],
  tests: [
    { label: 'tối giản', args: [{ protocol: 'https', domain: 'youtube.com' }], expect: 'https://youtube.com/' },
    { label: 'có subdomain', args: [{ protocol: 'https', subdomain: 'www', domain: 'youtube.com' }], expect: 'https://www.youtube.com/' },
    { label: 'đủ mọi thành phần', args: [{ protocol: 'https', subdomain: 'store', domain: 'example.com', port: 8080, path: '/api/orders', query: 'page=2', fragment: 'top' }], expect: 'https://store.example.com:8080/api/orders?page=2#top' },
    { label: 'path thiếu dấu gạch chéo', args: [{ protocol: 'http', domain: 'localhost', port: 3000, path: 'api/data' }], expect: 'http://localhost:3000/api/data' },
    { label: 'thiếu domain thì ném lỗi', script: `try { fn({ protocol: 'https' }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'thiếu protocol hoặc domain' },
    { label: 'ghép rồi tách lại phải ra chính nó', script: `const parts = { protocol: 'https', subdomain: 'api', domain: 'example.com', port: 443, path: '/v1/users', query: 'page=3', fragment: 'x' };
return fn(parts);`, expect: 'https://api.example.com:443/v1/users?page=3#x' }
  ],
  solution: `function buildUrl(parts = {}) {
  const { protocol, domain, subdomain = '', port = null, query = '', fragment = '' } = parts;
  if (!protocol || !domain) throw new Error('thiếu protocol hoặc domain');

  const host = subdomain ? subdomain + '.' + domain : domain;
  const portPart = Number.isFinite(port) ? ':' + port : '';

  let path = parts.path || '/';
  if (!path.startsWith('/')) path = '/' + path;

  return protocol + '://' + host + portPart + path
    + (query ? '?' + query : '')
    + (fragment ? '#' + fragment : '');
}`
},
{
  id: 'node-31', lang: 'node', level: 'Trung bình', topic: 'Node.js', fn: 'parseDotenv',
  title: 'Đọc file .env',
  io: {
    signature: 'parseDotenv(text) → object',
    params: [
      ['text', 'string · mặc định \'\'', 'Nội dung nguyên văn của một file .env, nhiều dòng. Có thể có dòng trống, dòng chú thích bắt đầu bằng #, khoảng trắng thừa, giá trị bọc trong nháy, và giá trị chứa thêm dấu =.']
    ],
    returns: ['object', 'Tên biến → giá trị, tất cả đều là chuỗi. File rỗng thì trả {}.'],
    example: `parseDotenv('PORT=5003\\n# bi mat\\nJWT_SECRET="abc=xyz"')
// → { PORT: '5003', JWT_SECRET: 'abc=xyz' }`
  },
  brief: `<p>Node 20 trở lên chạy được <code>node --env-file=.env server.js</code> để nạp biến môi trường. Bài này viết lại phần đọc file đó.</p>
<ul>
<li>Mỗi dòng có dạng <code>KEY=VALUE</code></li>
<li>Bỏ qua dòng trống và dòng bắt đầu bằng <code>#</code> (sau khi đã cắt khoảng trắng)</li>
<li>Dòng không có dấu <code>=</code> thì bỏ qua, không ném lỗi</li>
<li>Chỉ tách ở dấu <code>=</code> <strong>đầu tiên</strong> — giá trị được phép chứa thêm dấu <code>=</code></li>
<li>Cắt khoảng trắng hai đầu của cả tên lẫn giá trị</li>
<li>Giá trị bọc trong <code>"</code> hoặc <code>'</code> thì bỏ cặp nháy đó đi</li>
<li>Tên biến lặp lại thì dòng sau thắng</li>
</ul>`,
  starter: `function parseDotenv(text = '') {
  // Viết code ở đây
}`,
  hints: [
    'indexOf("=") cho vị trí dấu bằng đầu tiên; slice hai bên nó.',
    'Bỏ nháy: kiểm tra ký tự đầu và cuối giống nhau và thuộc hai loại nháy, rồi slice(1, -1).',
    'Xử lý từng dòng bằng split("\\n") rồi gán thẳng vào object kết quả.'
  ],
  tests: [
    { label: 'một biến', args: ['PORT=5003'], expect: { PORT: '5003' } },
    { label: 'nhiều biến', args: ['PORT=5003\nNODE_ENV=development'], expect: { PORT: '5003', NODE_ENV: 'development' } },
    { label: 'bỏ qua chú thích và dòng trống', args: ['# cau hinh\n\nPORT=5003\n   # them chu thich\n'], expect: { PORT: '5003' } },
    { label: 'cắt khoảng trắng', args: ['  PORT  =  5003  '], expect: { PORT: '5003' } },
    { label: 'bỏ cặp nháy', args: ['JWT_SECRET="sieu-bi-mat"'], expect: { JWT_SECRET: 'sieu-bi-mat' } },
    { label: 'giá trị chứa dấu bằng', args: ['DATABASE_URL=postgresql://u:p@db:5432/app?schema=public'], expect: { DATABASE_URL: 'postgresql://u:p@db:5432/app?schema=public' } },
    { label: 'dòng không có dấu bằng bị bỏ qua', args: ['PORT=5003\nDONG RAC'], expect: { PORT: '5003' } },
    { label: 'khoá lặp thì dòng sau thắng', args: ['PORT=3000\nPORT=5003'], expect: { PORT: '5003' } },
    { label: 'file rỗng', args: [''], expect: {} }
  ],
  solution: `function parseDotenv(text = '') {
  const result = {};

  for (const raw of String(text).split('\\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    const first = value[0];
    if (value.length >= 2 && (first === '"' || first === "'") && value[value.length - 1] === first) {
      value = value.slice(1, -1);
    }

    if (key) result[key] = value;
  }

  return result;
}`
},
{
  id: 'node-32', lang: 'node', level: 'Trung bình', topic: 'Node.js', fn: 'detectModuleSystem',
  title: 'Nhận ra hệ module của một file',
  io: {
    signature: 'detectModuleSystem(code) → string',
    params: [
      ['code', 'string · mặc định \'\'', 'Nội dung một file JavaScript. Có thể dùng import/export (ESM), require/module.exports (CommonJS), cả hai, hoặc không dùng gì. Dòng chú thích bắt đầu bằng // không được tính.']
    ],
    returns: ['string', 'Một trong "esm", "commonjs", "unknown". Trộn cả hai thì ném Error("trộn hai hệ module").'],
    example: `detectModuleSystem("import express from 'express'")   // → 'esm'
detectModuleSystem("const express = require('express')")  // → 'commonjs'
detectModuleSystem("const a = 1")                          // → 'unknown'`
  },
  brief: `<p>Node có hai hệ module. Khoá học dùng ESM (<code>"type": "module"</code> trong package.json), nhưng rất nhiều tài liệu cũ vẫn dùng CommonJS — và trộn hai loại là lỗi kinh điển của người mới.</p>
<p>Viết hàm <code>detectModuleSystem(code)</code> đọc nội dung file và cho biết nó thuộc hệ nào.</p>
<table><thead><tr><th>Dấu hiệu</th><th>Kết luận</th></tr></thead><tbody>
<tr><td>Dòng bắt đầu bằng <code>import</code> hoặc <code>export</code></td><td>ESM</td></tr>
<tr><td>Có <code>require(</code>, <code>module.exports</code> hoặc <code>exports.</code></td><td>CommonJS</td></tr>
<tr><td>Có cả hai loại dấu hiệu</td><td>Ném <code>Error('trộn hai hệ module')</code></td></tr>
<tr><td>Không có dấu hiệu nào</td><td><code>'unknown'</code></td></tr>
</tbody></table>
<p>Dòng chú thích <code>//</code> phải bị loại bỏ trước khi xét, nếu không một dòng ghi chú cũng làm hàm kết luận sai.</p>`,
  starter: `function detectModuleSystem(code = '') {
  // Viết code ở đây
}`,
  hints: [
    'Lọc bỏ dòng chú thích trước: line.trim().startsWith("//").',
    'Dấu hiệu ESM nằm ở đầu dòng, nên xét từng dòng đã trim.',
    'Dấu hiệu CommonJS có thể nằm giữa dòng, nên xét trên cả đoạn text đã ghép lại.'
  ],
  tests: [
    { label: 'ESM', args: ["import express from 'express'\nconst app = express()"], expect: 'esm' },
    { label: 'ESM chỉ có export', args: ['export default router'], expect: 'esm' },
    { label: 'CommonJS', args: ["const express = require('express')"], expect: 'commonjs' },
    { label: 'CommonJS qua module.exports', args: ['function a() {}\nmodule.exports = a'], expect: 'commonjs' },
    { label: 'không dấu hiệu nào', args: ['const a = 1\nconsole.log(a)'], expect: 'unknown' },
    { label: 'chú thích không được tính', args: ["// import express from 'express'\nconst a = 1"], expect: 'unknown' },
    { label: 'trộn hai hệ thì ném lỗi', script: `try { fn("import a from 'a'\\nconst b = require('b')"); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'trộn hai hệ module' },
    { label: 'file rỗng', args: [''], expect: 'unknown' }
  ],
  solution: `function detectModuleSystem(code = '') {
  const lines = String(code)
    .split('\\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('//'));

  const text = lines.join('\\n');

  const isEsm = lines.some((line) => /^import\\s/.test(line) || /^export(\\s|$)/.test(line));
  const isCjs = /\\brequire\\s*\\(/.test(text) || /\\bmodule\\.exports\\b/.test(text) || /\\bexports\\./.test(text);

  if (isEsm && isCjs) throw new Error('trộn hai hệ module');
  if (isEsm) return 'esm';
  if (isCjs) return 'commonjs';
  return 'unknown';
}`
},
{
  id: 'node-33', lang: 'node', level: 'Trung bình', topic: 'Node.js', fn: 'runScripts',
  title: 'Thứ tự chạy npm script',
  io: {
    signature: 'runScripts(pkg, name) → Array<string>',
    params: [
      ['pkg', 'object · mặc định {}', 'Nội dung package.json đã parse. Chỉ quan tâm trường scripts (object: tên script → câu lệnh). Trường scripts có thể thiếu hẳn.'],
      ['name', 'string', 'Tên script người dùng gõ, ví dụ "dev" trong lệnh npm run dev.']
    ],
    returns: ['Array<string>', 'Danh sách câu lệnh theo đúng thứ tự npm sẽ chạy. Không có script chính thì ném Error(`không có script: ${name}`).'],
    example: `runScripts({ scripts: { predev: 'npx prisma generate', dev: 'node --watch src/server.js' } }, 'dev')
// → ['npx prisma generate', 'node --watch src/server.js']`
  },
  brief: `<p>Khi bạn gõ <code>npm run dev</code>, npm không chỉ chạy đúng script <code>dev</code>. Nó chạy <code>predev</code> trước và <code>postdev</code> sau, nếu hai script đó tồn tại. Đây là cách các dự án tự động sinh Prisma client hay build trước khi khởi động.</p>
<p>Viết hàm <code>runScripts(pkg, name)</code> trả về danh sách câu lệnh theo đúng thứ tự thực thi.</p>
<ul>
<li>Có <code>pre&lt;name&gt;</code> → đứng đầu danh sách</li>
<li><code>&lt;name&gt;</code> luôn ở giữa. Không tồn tại → ném <code>Error('không có script: dev')</code> (thay <code>dev</code> bằng tên thật)</li>
<li>Có <code>post&lt;name&gt;</code> → đứng cuối</li>
<li>Không có <code>scripts</code> trong package.json → vẫn ném đúng lỗi trên</li>
</ul>`,
  starter: `function runScripts(pkg = {}, name) {
  // Viết code ở đây
}`,
  hints: [
    'scripts có thể là undefined — dùng pkg.scripts ?? {} cho gọn.',
    'Ghép tên bằng "pre" + name và "post" + name.',
    'Dùng push có điều kiện thay vì dựng mảng rồi lọc.'
  ],
  tests: [
    { label: 'chỉ có script chính', args: [{ scripts: { dev: 'node src/server.js' } }, 'dev'], expect: ['node src/server.js'] },
    { label: 'có pre', args: [{ scripts: { predev: 'npx prisma generate', dev: 'node src/server.js' } }, 'dev'], expect: ['npx prisma generate', 'node src/server.js'] },
    { label: 'có cả pre và post', args: [{ scripts: { prebuild: 'rm -rf dist', build: 'tsc', postbuild: 'echo xong' } }, 'build'], expect: ['rm -rf dist', 'tsc', 'echo xong'] },
    { label: 'chỉ có post', args: [{ scripts: { test: 'node --test', posttest: 'echo da test' } }, 'test'], expect: ['node --test', 'echo da test'] },
    { label: 'không có script chính', script: `try { fn({ scripts: { predev: 'x' } }, 'dev'); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'không có script: dev' },
    { label: 'package.json không có scripts', script: `try { fn({}, 'dev'); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'không có script: dev' }
  ],
  solution: `function runScripts(pkg = {}, name) {
  const scripts = pkg.scripts ?? {};
  if (!scripts[name]) throw new Error('không có script: ' + name);

  const steps = [];
  if (scripts['pre' + name]) steps.push(scripts['pre' + name]);
  steps.push(scripts[name]);
  if (scripts['post' + name]) steps.push(scripts['post' + name]);
  return steps;
}`
},
{
  id: 'node-34', lang: 'node', level: 'Trung bình', topic: 'Node.js', fn: 'satisfiesRange',
  title: 'Dấu ^ và ~ trong package.json',
  io: {
    signature: 'satisfiesRange(range, version) → boolean',
    params: [
      ['range', 'string', 'Khoảng phiên bản ghi trong package.json: "^5.22.0", "~5.22.0" hoặc "5.22.0". Không xét trường hợp major bằng 0. Sai định dạng thì ném lỗi.'],
      ['version', 'string', 'Phiên bản cụ thể cần kiểm tra, dạng "x.y.z" với x, y, z là số.']
    ],
    returns: ['boolean', 'true khi version nằm trong khoảng mà range cho phép. range sai định dạng thì ném Error("range không hợp lệ").'],
    example: `satisfiesRange('^5.22.0', '5.23.1')   // → true  (cùng major, mới hơn)
satisfiesRange('^5.22.0', '6.0.0')    // → false (khác major)
satisfiesRange('~5.22.0', '5.23.0')   // → false (khác minor)`
  },
  brief: `<p>Trong <code>package.json</code> của khoá học có <code>"express": "^4.21.1"</code>. Dấu <code>^</code> quyết định lần <code>npm install</code> sau bạn nhận được bản nào — và đó là lý do nhóm của bạn có thể chạy hai bản express khác nhau mà không ai biết.</p>
<table><thead><tr><th>Ký hiệu</th><th>Cho phép</th><th>Ví dụ với 5.22.0</th></tr></thead><tbody>
<tr><td><code>^</code></td><td>Cùng major, và phiên bản không nhỏ hơn mốc</td><td>5.22.0 → 5.99.99 được; 6.0.0 không</td></tr>
<tr><td><code>~</code></td><td>Cùng major <em>và</em> cùng minor, patch không nhỏ hơn mốc</td><td>5.22.9 được; 5.23.0 không</td></tr>
<tr><td>không ký hiệu</td><td>Đúng y hệt</td><td>chỉ 5.22.0</td></tr>
</tbody></table>
<p>Không xét trường hợp major bằng 0 (npm có quy tắc riêng cho thư viện chưa ổn định). Chuỗi không khớp ba dạng trên → ném <code>Error('range không hợp lệ')</code>.</p>`,
  starter: `function satisfiesRange(range, version) {
  // Viết code ở đây
}`,
  hints: [
    'Tách ký hiệu đầu tiên ra trước rồi mới parse ba số.',
    'Dùng một biểu thức chính quy có nhóm bắt để lấy cả ký hiệu lẫn ba số một lượt.',
    'So sánh "không nhỏ hơn" trên ba số: so major trước, rồi minor, rồi patch.'
  ],
  tests: [
    { label: 'caret cùng major mới hơn', args: ['^5.22.0', '5.23.1'], expect: true },
    { label: 'caret đúng mốc', args: ['^5.22.0', '5.22.0'], expect: true },
    { label: 'caret cũ hơn mốc', args: ['^5.22.0', '5.21.9'], expect: false },
    { label: 'caret khác major', args: ['^5.22.0', '6.0.0'], expect: false },
    { label: 'tilde cùng minor', args: ['~5.22.0', '5.22.9'], expect: true },
    { label: 'tilde khác minor', args: ['~5.22.0', '5.23.0'], expect: false },
    { label: 'không ký hiệu phải khớp y hệt', args: ['5.22.0', '5.22.1'], expect: false },
    { label: 'không ký hiệu khớp đúng', args: ['5.22.0', '5.22.0'], expect: true },
    { label: 'range sai định dạng', script: `try { fn('>=5', '5.22.0'); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'range không hợp lệ' }
  ],
  solution: `function satisfiesRange(range, version) {
  const match = /^([\\^~]?)(\\d+)\\.(\\d+)\\.(\\d+)$/.exec(String(range));
  if (!match) throw new Error('range không hợp lệ');

  const [, mark, rMajor, rMinor, rPatch] = match.map((x, i) => (i > 1 ? Number(x) : x));
  const parts = String(version).split('.').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return false;

  const [major, minor, patch] = parts;
  const notOlder =
    major > rMajor ||
    (major === rMajor && (minor > rMinor || (minor === rMinor && patch >= rPatch)));

  if (mark === '^') return major === rMajor && notOlder;
  if (mark === '~') return major === rMajor && minor === rMinor && patch >= rPatch;
  return major === rMajor && minor === rMinor && patch === rPatch;
}`
},
{
  id: 'node-35', lang: 'node', level: 'Cơ bản', topic: 'Node.js', fn: 'sortVersions',
  title: 'Sắp xếp phiên bản đúng cách',
  io: {
    signature: 'sortVersions(list) → Array<string>',
    params: [
      ['list', 'Array<string> · mặc định []', 'Danh sách phiên bản dạng "x.y.z". Không thay đổi mảng gốc.']
    ],
    returns: ['Array<string>', 'Mảng mới, sắp tăng dần theo giá trị số của từng phần.'],
    example: `sortVersions(['1.10.0', '1.9.0', '1.2.30'])
// → ['1.2.30', '1.9.0', '1.10.0']`
  },
  brief: `<p><code>['1.10.0', '1.9.0'].sort()</code> cho ra <code>['1.10.0', '1.9.0']</code> — sai, vì <code>sort()</code> mặc định so sánh chuỗi và <code>'1'</code> đứng trước <code>'9'</code>. Viết hàm <code>sortVersions(list)</code> sắp đúng theo số.</p>
<ul>
<li>So sánh lần lượt major, minor, patch</li>
<li>Trả về <strong>mảng mới</strong>, mảng truyền vào phải giữ nguyên</li>
<li>Hai phiên bản bằng nhau thì giữ nguyên thứ tự tương đối</li>
</ul>`,
  starter: `function sortVersions(list = []) {
  // Viết code ở đây
}`,
  hints: [
    'slice() tạo bản sao trước khi sort, nếu không bạn sửa cả mảng gốc.',
    'Hàm so sánh trả về số âm, 0 hoặc dương.',
    'Duyệt ba phần, gặp phần khác nhau đầu tiên thì trả hiệu của chúng.'
  ],
  tests: [
    { label: 'minor hai chữ số', args: [['1.10.0', '1.9.0', '1.2.30']], expect: ['1.2.30', '1.9.0', '1.10.0'] },
    { label: 'khác major', args: [['2.0.0', '10.0.0', '1.0.0']], expect: ['1.0.0', '2.0.0', '10.0.0'] },
    { label: 'khác patch', args: [['1.0.2', '1.0.10', '1.0.1']], expect: ['1.0.1', '1.0.2', '1.0.10'] },
    { label: 'mảng rỗng', args: [[]], expect: [] },
    { label: 'không đụng vào mảng gốc', script: `const input = ['2.0.0', '1.0.0'];
fn(input);
return input;`, expect: ['2.0.0', '1.0.0'] }
  ],
  solution: `function sortVersions(list = []) {
  return list.slice().sort((a, b) => {
    const x = a.split('.').map(Number);
    const y = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (x[i] !== y[i]) return x[i] - y[i];
    }
    return 0;
  });
}`
},
{
  id: 'node-36', lang: 'node', level: 'Trung bình', topic: 'Node.js', fn: 'diffDependencies',
  title: 'package.json lệch với lockfile',
  io: {
    signature: 'diffDependencies(pkg, lock) → object',
    params: [
      ['pkg', 'object · mặc định {}', 'package.json đã parse. Hai trường quan tâm: dependencies và devDependencies (tên gói → range). Cả hai có thể thiếu.'],
      ['lock', 'object · mặc định {}', 'Bản rút gọn của package-lock.json: tên gói → phiên bản đã khoá (chuỗi "x.y.z").']
    ],
    returns: ['object',
      '{ missing: Array<string>, extra: Array<string>, mismatched: Array<string> }. Cả ba mảng đều sắp theo bảng chữ cái.'],
    example: `diffDependencies({ dependencies: { express: '^4.21.1' } }, { express: '5.0.0' })
// → { missing: [], extra: [], mismatched: ['express'] }`
  },
  brief: `<p><code>package.json</code> ghi <em>khoảng</em> phiên bản, <code>package-lock.json</code> ghi <em>đúng</em> phiên bản đã cài. Khi hai file lệch nhau, máy bạn chạy được mà máy đồng đội thì không.</p>
<p>Viết hàm <code>diffDependencies(pkg, lock)</code> chỉ ra ba loại lệch:</p>
<ul>
<li><code>missing</code> — gói có trong package.json nhưng lockfile không có</li>
<li><code>extra</code> — gói có trong lockfile nhưng package.json không khai báo</li>
<li><code>mismatched</code> — có ở cả hai, nhưng phiên bản trong lockfile không thoả khoảng trong package.json</li>
</ul>
<p>Gộp <code>dependencies</code> và <code>devDependencies</code> lại làm một. Để kiểm tra khoảng, dùng đúng quy tắc của bài <code>satisfiesRange</code>: <code>^</code> cùng major, <code>~</code> cùng minor, không ký hiệu thì khớp y hệt. Range lạ (không khớp ba dạng đó) thì coi như <strong>luôn thoả</strong>, đừng ném lỗi.</p>`,
  starter: `function diffDependencies(pkg = {}, lock = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Gộp hai nhóm phụ thuộc bằng { ...pkg.dependencies, ...pkg.devDependencies }.',
    'Viết một hàm phụ fits(range, version) rồi bọc nó trong try/catch để range lạ trả về true.',
    'Đừng quên sort() cả ba mảng trước khi trả về.'
  ],
  tests: [
    { label: 'khớp hoàn toàn', args: [{ dependencies: { express: '^4.21.1' } }, { express: '4.21.2' }], expect: { missing: [], extra: [], mismatched: [] } },
    { label: 'thiếu trong lockfile', args: [{ dependencies: { express: '^4.21.1', bcryptjs: '^2.4.3' } }, { express: '4.21.2' }], expect: { missing: ['bcryptjs'], extra: [], mismatched: [] } },
    { label: 'thừa trong lockfile', args: [{ dependencies: { express: '^4.21.1' } }, { express: '4.21.2', lodash: '4.17.21' }], expect: { missing: [], extra: ['lodash'], mismatched: [] } },
    { label: 'lệch phiên bản', args: [{ dependencies: { express: '^4.21.1' } }, { express: '5.0.0' }], expect: { missing: [], extra: [], mismatched: ['express'] } },
    { label: 'gộp cả devDependencies', args: [{ dependencies: { express: '^4.21.1' }, devDependencies: { nodemon: '^3.0.0' } }, { express: '4.21.2', nodemon: '3.1.0' }], expect: { missing: [], extra: [], mismatched: [] } },
    { label: 'range lạ thì bỏ qua', args: [{ dependencies: { express: 'latest' } }, { express: '5.0.0' }], expect: { missing: [], extra: [], mismatched: [] } },
    { label: 'sắp theo bảng chữ cái', args: [{ dependencies: { zod: '^3.0.0', axios: '^1.0.0' } }, {}], expect: { missing: ['axios', 'zod'], extra: [], mismatched: [] } }
  ],
  solution: `function diffDependencies(pkg = {}, lock = {}) {
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };

  const fits = (range, version) => {
    const m = /^([\\^~]?)(\\d+)\\.(\\d+)\\.(\\d+)$/.exec(String(range));
    if (!m) return true; // range lạ: không kết luận được thì coi như thoả
    const mark = m[1];
    const [rMajor, rMinor, rPatch] = [Number(m[2]), Number(m[3]), Number(m[4])];
    const [major, minor, patch] = String(version).split('.').map(Number);

    const notOlder =
      major > rMajor ||
      (major === rMajor && (minor > rMinor || (minor === rMinor && patch >= rPatch)));

    if (mark === '^') return major === rMajor && notOlder;
    if (mark === '~') return major === rMajor && minor === rMinor && patch >= rPatch;
    return major === rMajor && minor === rMinor && patch === rPatch;
  };

  const missing = [];
  const mismatched = [];
  for (const [name, range] of Object.entries(declared)) {
    if (lock[name] === undefined) missing.push(name);
    else if (!fits(range, lock[name])) mismatched.push(name);
  }

  const extra = Object.keys(lock).filter((name) => declared[name] === undefined);

  return { missing: missing.sort(), extra: extra.sort(), mismatched: mismatched.sort() };
}`
},
{
  id: 'node-37', lang: 'node', level: 'Trung bình', topic: 'Express', fn: 'createRes',
  title: 'Viết lại đối tượng res của Express',
  io: {
    signature: 'createRes() → { status, json, send, sendStatus, result }',
    params: [
      ['(không có tham số)', '—', 'Hàm tự tạo một response rỗng: status 200, body null, contentType chuỗi rỗng, sent false.']
    ],
    returns: ['object',
      'status(code) trả về chính res · json(data) · send(text) · sendStatus(code) · result() trả { status, body, contentType, sent }.'],
    example: `const res = createRes();
res.status(201).json({ id: 1 });
res.result();
// → { status: 201, body: { id: 1 }, contentType: 'application/json', sent: true }`
  },
  brief: `<p>Trong Express, <code>res</code> là một object có sẵn và bạn chỉ việc gọi <code>res.status(201).json(data)</code>. Viết lại nó một lần sẽ khiến ba thứ trở nên rõ ràng: vì sao nối chuỗi được, vì sao chỉ gửi được một lần, và status code thực ra nằm ở đâu.</p>
<table><thead><tr><th>Phương thức</th><th>Việc nó làm</th><th>Trả về</th></tr></thead><tbody>
<tr><td><code>status(code)</code></td><td>Ghi nhớ status, chưa gửi gì cả</td><td>Chính <code>res</code>, nhờ vậy mới nối chuỗi được</td></tr>
<tr><td><code>json(data)</code></td><td>body là <code>data</code> nguyên dạng, contentType <code>'application/json'</code></td><td>Chính <code>res</code></td></tr>
<tr><td><code>send(text)</code></td><td>body là <code>String(text)</code>, contentType <code>'text/html'</code></td><td>Chính <code>res</code></td></tr>
<tr><td><code>sendStatus(code)</code></td><td>Đặt status, body là chuỗi rỗng, contentType <code>'text/plain'</code></td><td>Chính <code>res</code></td></tr>
<tr><td><code>result()</code></td><td>Chỉ để test đọc kết quả</td><td><code>{ status, body, contentType, sent }</code></td></tr>
</tbody></table>
<p>Mặc định: <code>status</code> 200, <code>body</code> <code>null</code>, <code>contentType</code> chuỗi rỗng, <code>sent</code> <code>false</code>.</p>
<p class="warn">Gọi <code>json</code>, <code>send</code> hoặc <code>sendStatus</code> lần thứ hai phải ném <code>Error('response đã được gửi')</code>. Express cũng báo lỗi tương tự (<em>Cannot set headers after they are sent</em>) và đó là lỗi bạn sẽ gặp rất sớm, thường vì quên <code>return</code> trước một <code>res.status(...)</code>.</p>`,
  starter: `function createRes() {
  // Viết code ở đây
}`,
  hints: [
    'Giữ trạng thái trong biến cục bộ rồi trả về một object chứa các hàm đóng gói quanh chúng.',
    'Mỗi phương thức gửi đều bắt đầu bằng cùng một phép kiểm tra "đã gửi chưa".',
    'Để nối chuỗi được, hàm phải trả về chính object đang xây — đặt nó vào một biến trước.'
  ],
  tests: [
    { label: 'giá trị mặc định', script: `return fn().result();`, expect: { status: 200, body: null, contentType: '', sent: false } },
    { label: 'status rồi json', script: `const res = fn(); res.status(201).json({ id: 1 }); return res.result();`, expect: { status: 201, body: { id: 1 }, contentType: 'application/json', sent: true } },
    { label: 'json không kèm status thì vẫn 200', script: `const res = fn(); res.json([1, 2]); return res.result();`, expect: { status: 200, body: [1, 2], contentType: 'application/json', sent: true } },
    { label: 'send trả HTML', script: `const res = fn(); res.send('<h1>xin chao</h1>'); return res.result();`, expect: { status: 200, body: '<h1>xin chao</h1>', contentType: 'text/html', sent: true } },
    { label: 'sendStatus', script: `const res = fn(); res.sendStatus(204); return res.result();`, expect: { status: 204, body: '', contentType: 'text/plain', sent: true } },
    { label: 'status trả về chính res', script: `const res = fn(); return res.status(404) === res;`, expect: true },
    { label: 'gửi hai lần thì ném lỗi', script: `const res = fn(); res.json({});
try { res.json({}); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'response đã được gửi' },
    { label: 'status sau khi đã gửi vẫn không ném lỗi', script: `const res = fn(); res.sendStatus(204); res.status(500); return res.result().status;`, expect: 500 }
  ],
  solution: `function createRes() {
  let status = 200;
  let body = null;
  let contentType = '';
  let sent = false;

  const guard = () => {
    if (sent) throw new Error('response đã được gửi');
    sent = true;
  };

  const res = {
    status(code) { status = code; return res; },
    json(data) { guard(); body = data; contentType = 'application/json'; return res; },
    send(text) { guard(); body = String(text); contentType = 'text/html'; return res; },
    sendStatus(code) { guard(); status = code; body = ''; contentType = 'text/plain'; return res; },
    result() { return { status, body, contentType, sent }; },
  };

  return res;
}`
},
{
  id: 'node-38', lang: 'node', level: 'Cơ bản', topic: 'Express', fn: 'endpointKind',
  title: 'Endpoint trang web hay endpoint API',
  io: {
    signature: 'endpointKind(endpoint) → string',
    params: [
      ['endpoint', 'object', 'Một endpoint đã khai báo: { method: string (có thể thiếu hoặc viết thường), path: string bắt đầu bằng dấu gạch chéo }.']
    ],
    returns: ['string', 'Đúng một trong hai chuỗi: "website" hoặc "api".'],
    example: `endpointKind({ method: 'GET', path: '/dashboard' })    // → 'website'
endpointKind({ method: 'GET', path: '/api/data' })     // → 'api'
endpointKind({ method: 'POST', path: '/todos' })       // → 'api'`
  },
  brief: `<p>Một server Express phục vụ hai loại endpoint rất khác nhau, dù cùng viết bằng <code>app.get</code>:</p>
<ul>
<li><strong>Endpoint trang web</strong> — trả HTML cho trình duyệt. Người dùng gõ URL rồi nhìn thấy giao diện.</li>
<li><strong>Endpoint API</strong> — trả JSON cho code gọi. Không ai nhìn thẳng vào nó.</li>
</ul>
<p>Viết hàm <code>endpointKind(endpoint)</code> phân loại theo đúng ba quy tắc sau, xét lần lượt từ trên xuống:</p>
<ol>
<li><code>path</code> bắt đầu bằng <code>/api</code> → <code>'api'</code></li>
<li>Còn lại, <code>method</code> là <code>GET</code> hoặc <code>HEAD</code> → <code>'website'</code></li>
<li>Còn lại → <code>'api'</code></li>
</ol>
<p>Thiếu <code>method</code> thì coi như <code>GET</code>. Method có thể viết thường.</p>`,
  starter: `function endpointKind(endpoint = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Kiểm tra tiền tố đường dẫn trước, vì nó thắng mọi quy tắc còn lại.',
    'startsWith("/api") đúng cho cả "/api" lẫn "/api/data".',
    'Chuẩn hoá method về chữ HOA ngay từ đầu để chỉ so sánh một lần.'
  ],
  tests: [
    { label: 'trang chủ', args: [{ method: 'GET', path: '/' }], expect: 'website' },
    { label: 'trang dashboard', args: [{ method: 'GET', path: '/dashboard' }], expect: 'website' },
    { label: 'API đọc dữ liệu', args: [{ method: 'GET', path: '/api/data' }], expect: 'api' },
    { label: 'đúng tiền tố /api', args: [{ method: 'GET', path: '/api' }], expect: 'api' },
    { label: 'POST ngoài /api vẫn là api', args: [{ method: 'POST', path: '/todos' }], expect: 'api' },
    { label: 'HEAD là trang web', args: [{ method: 'HEAD', path: '/about' }], expect: 'website' },
    { label: 'method viết thường', args: [{ method: 'get', path: '/about' }], expect: 'website' },
    { label: 'thiếu method thì coi là GET', args: [{ path: '/about' }], expect: 'website' }
  ],
  solution: `function endpointKind(endpoint = {}) {
  const path = String(endpoint.path || '/');
  if (path.startsWith('/api')) return 'api';

  const method = String(endpoint.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') return 'website';

  return 'api';
}`
},
{
  id: 'node-39', lang: 'node', level: 'Trung bình', topic: 'Express', fn: 'parseJsonBody',
  title: 'Viết lại express.json()',
  io: {
    signature: 'parseJsonBody(raw, contentType) → object | Array | undefined',
    params: [
      ['raw', 'string · mặc định \'\'', 'Phần body thô của request, chưa parse. Có thể rỗng, chỉ có khoảng trắng, hoặc là JSON hỏng.'],
      ['contentType', 'string · mặc định \'\'', 'Giá trị header Content-Type, ví dụ "application/json; charset=utf-8". Có thể viết HOA, có thể là loại khác hẳn.']
    ],
    returns: ['object | Array | undefined',
      'Dữ liệu đã parse. Content-Type không phải JSON thì trả undefined. JSON hỏng hoặc không phải object/mảng thì ném Error("body không phải JSON hợp lệ").'],
    example: `parseJsonBody('{"task":"hoc"}', 'application/json')       // → { task: 'hoc' }
parseJsonBody('xin chao', 'text/plain')                  // → undefined
parseJsonBody('', 'application/json')                    // → {}`
  },
  brief: `<p><code>app.use(express.json())</code> là dòng mà ai cũng chép vào mà ít người biết nó làm gì. Nó là một middleware đọc body thô, và <strong>chỉ khi</strong> Content-Type là JSON thì mới parse rồi gán vào <code>req.body</code>. Quên dòng này thì <code>req.body</code> là <code>undefined</code> — lỗi số một của người mới học Express.</p>
<p>Viết hàm <code>parseJsonBody(raw, contentType)</code> làm đúng việc đó, theo thứ tự:</p>
<ol>
<li>Content-Type không chứa <code>application/json</code> → trả <code>undefined</code>, không đụng tới body</li>
<li>Body rỗng hoặc chỉ toàn khoảng trắng → trả <code>{}</code></li>
<li>Parse được, và kết quả là object hoặc mảng → trả kết quả đó</li>
<li>Mọi trường hợp còn lại (JSON hỏng, hoặc parse ra số, chuỗi, <code>null</code>) → ném <code>Error('body không phải JSON hợp lệ')</code></li>
</ol>
<p>Content-Type không phân biệt hoa thường, và thường kèm tham số phía sau dấu chấm phẩy.</p>`,
  starter: `function parseJsonBody(raw = '', contentType = '') {
  // Viết code ở đây
}`,
  hints: [
    'contentType.toLowerCase().includes("application/json") xử lý được cả phần "; charset=utf-8".',
    'JSON.parse ném lỗi riêng của nó — bọc trong try/catch rồi ném lại lỗi của đề bài.',
    'typeof null === "object", nên phải loại null ra bằng một phép kiểm tra riêng.'
  ],
  tests: [
    { label: 'JSON hợp lệ', args: ['{"task":"hoc bai"}', 'application/json'], expect: { task: 'hoc bai' } },
    { label: 'kèm charset', args: ['{"a":1}', 'application/json; charset=utf-8'], expect: { a: 1 } },
    { label: 'Content-Type viết HOA', args: ['{"a":1}', 'Application/JSON'], expect: { a: 1 } },
    { label: 'mảng cũng hợp lệ', args: ['[1,2,3]', 'application/json'], expect: [1, 2, 3] },
    { label: 'không phải JSON thì bỏ qua', args: ['xin chao', 'text/plain'], expect: undefined },
    { label: 'thiếu Content-Type', args: ['{"a":1}', ''], expect: undefined },
    { label: 'body rỗng', args: ['', 'application/json'], expect: {} },
    { label: 'body toàn khoảng trắng', args: ['   ', 'application/json'], expect: {} },
    { label: 'JSON hỏng', script: `try { fn('{"a":', 'application/json'); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'body không phải JSON hợp lệ' },
    { label: 'JSON hợp lệ nhưng là số', script: `try { fn('42', 'application/json'); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'body không phải JSON hợp lệ' },
    { label: 'JSON null cũng bị từ chối', script: `try { fn('null', 'application/json'); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'body không phải JSON hợp lệ' }
  ],
  solution: `function parseJsonBody(raw = '', contentType = '') {
  if (!String(contentType).toLowerCase().includes('application/json')) return undefined;

  const text = String(raw).trim();
  if (text === '') return {};

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('body không phải JSON hợp lệ');
  }

  if (parsed === null || typeof parsed !== 'object') {
    throw new Error('body không phải JSON hợp lệ');
  }
  return parsed;
}`
},
{
  id: 'node-40', lang: 'node', level: 'Trung bình', topic: 'Express', fn: 'respondForResult',
  title: 'Từ kết quả nghiệp vụ tới response',
  io: {
    signature: 'respondForResult(res, result) → res',
    params: [
      ['res', 'object', 'Đối tượng response kiểu Express: có status(code) trả về chính nó, json(data), và sendStatus(code).'],
      ['result', 'object', 'Kết quả tầng nghiệp vụ trả về. Trường kind là một trong "created", "ok", "empty", "notFound", "invalid", hoặc một giá trị lạ. Kèm theo có thể có data, message, errors.']
    ],
    returns: ['object', 'Chính đối tượng res đã truyền vào, sau khi đã gọi đúng phương thức trên nó.'],
    example: `respondForResult(res, { kind: 'created', data: { id: 7 } })
// tương đương res.status(201).json({ id: 7 })`
  },
  brief: `<p>Tầng nghiệp vụ không nên biết gì về HTTP — nó chỉ nói "đã tạo xong", "không tìm thấy", "dữ liệu sai". Việc dịch những câu đó sang status code là của tầng route. Viết hàm <code>respondForResult(res, result)</code> làm bản dịch ấy.</p>
<table><thead><tr><th><code>kind</code></th><th>Gọi gì trên res</th></tr></thead><tbody>
<tr><td><code>'created'</code></td><td><code>res.status(201).json(result.data)</code></td></tr>
<tr><td><code>'ok'</code></td><td><code>res.status(200).json(result.data)</code></td></tr>
<tr><td><code>'empty'</code></td><td><code>res.sendStatus(204)</code></td></tr>
<tr><td><code>'notFound'</code></td><td><code>res.status(404).json({ message: result.message })</code></td></tr>
<tr><td><code>'invalid'</code></td><td><code>res.status(422).json({ message: result.message, errors: result.errors ?? [] })</code></td></tr>
<tr><td>giá trị lạ</td><td><code>res.sendStatus(500)</code></td></tr>
</tbody></table>
<p>Hàm luôn trả về chính <code>res</code>.</p>`,
  starter: `function respondForResult(res, result = {}) {
  // Viết code ở đây
}`,
  hints: [
    'switch trên result.kind đọc dễ hơn một chuỗi if lồng nhau.',
    'Nhớ return res ở cuối, kể cả nhánh đã gọi sendStatus.',
    'errors có thể thiếu — ?? [] cho giá trị mặc định.'
  ],
  tests: [
    { label: 'created', script: `const log = [];
const res = { status(c) { log.push('status:' + c); return res; }, json(d) { log.push('json:' + JSON.stringify(d)); return res; }, sendStatus(c) { log.push('sendStatus:' + c); return res; } };
fn(res, { kind: 'created', data: { id: 7 } });
return log;`, expect: ['status:201', 'json:{"id":7}'] },
    { label: 'ok', script: `const log = [];
const res = { status(c) { log.push('status:' + c); return res; }, json(d) { log.push('json:' + JSON.stringify(d)); return res; }, sendStatus(c) { log.push('sendStatus:' + c); return res; } };
fn(res, { kind: 'ok', data: [1, 2] });
return log;`, expect: ['status:200', 'json:[1,2]'] },
    { label: 'empty', script: `const log = [];
const res = { status(c) { log.push('status:' + c); return res; }, json(d) { log.push('json:' + JSON.stringify(d)); return res; }, sendStatus(c) { log.push('sendStatus:' + c); return res; } };
fn(res, { kind: 'empty' });
return log;`, expect: ['sendStatus:204'] },
    { label: 'notFound kèm message', script: `const log = [];
const res = { status(c) { log.push('status:' + c); return res; }, json(d) { log.push('json:' + JSON.stringify(d)); return res; }, sendStatus(c) { log.push('sendStatus:' + c); return res; } };
fn(res, { kind: 'notFound', message: 'Khong thay todo' });
return log;`, expect: ['status:404', 'json:{"message":"Khong thay todo"}'] },
    { label: 'invalid không có errors thì dùng mảng rỗng', script: `const log = [];
const res = { status(c) { log.push('status:' + c); return res; }, json(d) { log.push('json:' + JSON.stringify(d)); return res; }, sendStatus(c) { log.push('sendStatus:' + c); return res; } };
fn(res, { kind: 'invalid', message: 'Sai du lieu' });
return log;`, expect: ['status:422', 'json:{"message":"Sai du lieu","errors":[]}'] },
    { label: 'kind lạ thì 500', script: `const log = [];
const res = { status(c) { log.push('status:' + c); return res; }, json(d) { log.push('json:' + JSON.stringify(d)); return res; }, sendStatus(c) { log.push('sendStatus:' + c); return res; } };
fn(res, { kind: 'linh tinh' });
return log;`, expect: ['sendStatus:500'] },
    { label: 'luôn trả về chính res', script: `const res = { status() { return res; }, json() { return res; }, sendStatus() { return res; } };
return fn(res, { kind: 'empty' }) === res;`, expect: true }
  ],
  solution: `function respondForResult(res, result = {}) {
  switch (result.kind) {
    case 'created':
      res.status(201).json(result.data);
      break;
    case 'ok':
      res.status(200).json(result.data);
      break;
    case 'empty':
      res.sendStatus(204);
      break;
    case 'notFound':
      res.status(404).json({ message: result.message });
      break;
    case 'invalid':
      res.status(422).json({ message: result.message, errors: result.errors ?? [] });
      break;
    default:
      res.sendStatus(500);
  }
  return res;
}`
},
{
  id: 'node-41', lang: 'node', level: 'Cơ bản', topic: 'Express', fn: 'readPort',
  title: 'Đọc PORT từ biến môi trường',
  io: {
    signature: 'readPort(env, fallback) → number',
    params: [
      ['env', 'object · mặc định {}', 'Chính là process.env, nên PORT nếu có thì LUÔN là chuỗi. Có thể thiếu hẳn, có thể rỗng, có thể là chữ.'],
      ['fallback', 'number · mặc định 3000', 'Cổng dùng khi env.PORT không dùng được.']
    ],
    returns: ['number', 'Số cổng hợp lệ: số nguyên từ 1 đến 65535.'],
    example: `readPort({ PORT: '5003' })        // → 5003
readPort({ PORT: 'abc' }, 5003)   // → 5003
readPort({})                      // → 3000`
  },
  brief: `<p>Dòng <code>const PORT = process.env.PORT || 5003</code> xuất hiện trong mọi dự án Express — và nó có một lỗ hổng: <code>process.env.PORT</code> là <strong>chuỗi</strong>, nên <code>'abc'</code> vẫn được coi là hợp lệ và server sẽ chết khi khởi động.</p>
<p>Viết hàm <code>readPort(env, fallback)</code> chặt chẽ hơn.</p>
<ul>
<li>Giá trị hợp lệ: số nguyên trong khoảng 1–65535 (cổng 0 và cổng âm không dùng được)</li>
<li>Thiếu, rỗng, chỉ có khoảng trắng, là chữ, có phần thập phân, hoặc ngoài khoảng → dùng <code>fallback</code></li>
<li>Trả về <strong>number</strong>, không phải chuỗi</li>
</ul>`,
  starter: `function readPort(env = {}, fallback = 3000) {
  // Viết code ở đây
}`,
  hints: [
    'Number("") cho 0 chứ không phải NaN — nhớ loại chuỗi rỗng trước.',
    'Number.isInteger chặn được cả NaN lẫn số thập phân.',
    'Cắt khoảng trắng bằng trim trước khi ép kiểu.'
  ],
  tests: [
    { label: 'cổng hợp lệ', args: [{ PORT: '5003' }], expect: 5003 },
    { label: 'trả về số chứ không phải chuỗi', script: `return typeof fn({ PORT: '5003' });`, expect: 'number' },
    { label: 'thiếu PORT', args: [{}], expect: 3000 },
    { label: 'fallback tuỳ chọn', args: [{}, 5003], expect: 5003 },
    { label: 'PORT rỗng', args: [{ PORT: '' }, 5003], expect: 5003 },
    { label: 'PORT là chữ', args: [{ PORT: 'abc' }, 5003], expect: 5003 },
    { label: 'PORT thập phân', args: [{ PORT: '80.5' }, 5003], expect: 5003 },
    { label: 'cổng 0 không dùng được', args: [{ PORT: '0' }, 5003], expect: 5003 },
    { label: 'vượt 65535', args: [{ PORT: '70000' }, 5003], expect: 5003 },
    { label: 'khoảng trắng thừa vẫn nhận', args: [{ PORT: ' 8080 ' }], expect: 8080 }
  ],
  solution: `function readPort(env = {}, fallback = 3000) {
  const raw = String(env.PORT ?? '').trim();
  if (raw === '') return fallback;

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return fallback;

  return port;
}`
},
{
  id: 'node-42', lang: 'node', level: 'Nâng cao', topic: 'Express', fn: 'staticFilePath',
  title: 'Chặn đường dẫn vượt thư mục',
  io: {
    signature: 'staticFilePath(root, urlPath) → string | null',
    params: [
      ['root', 'string', 'Thư mục gốc được phép phục vụ, ví dụ "/app/public". Không có dấu gạch chéo ở cuối.'],
      ['urlPath', 'string', 'Đường dẫn trong URL mà client xin, ví dụ "/styles.css". Có thể kèm query, có thể chứa "." và ".." do client cố tình gắn vào.']
    ],
    returns: ['string | null',
      'Đường dẫn file đầy đủ. Trả null khi đường dẫn thoát ra ngoài root — đó là lúc phải từ chối request.'],
    example: `staticFilePath('/app/public', '/css/../styles.css')  // → '/app/public/styles.css'
staticFilePath('/app/public', '/../../etc/passwd')    // → null`
  },
  brief: `<p><code>app.use(express.static('public'))</code> nói với Express: mọi file trong thư mục <code>public</code> đều được phép gửi cho bất kỳ ai xin. Câu hỏi đáng sợ là: ai quyết định "trong thư mục public"?</p>
<p>Nếu ghép thẳng <code>root + urlPath</code>, thì một request tới <code>/../../etc/passwd</code> sẽ đọc được file hệ thống. Lỗ hổng này có tên: <strong>path traversal</strong>.</p>
<p>Viết hàm <code>staticFilePath(root, urlPath)</code> ghép đường dẫn một cách an toàn:</p>
<ul>
<li>Bỏ phần query (từ dấu <code>?</code> trở đi)</li>
<li>Tách đường dẫn theo dấu <code>/</code>, bỏ các đoạn rỗng và đoạn <code>.</code></li>
<li>Gặp đoạn <code>..</code> thì bỏ đoạn liền trước; nếu không còn đoạn nào để bỏ thì đường dẫn đã thoát ra ngoài root → trả <code>null</code></li>
<li>Không còn đoạn nào sau khi chuẩn hoá (tức là xin đúng thư mục gốc) → trả <code>root + '/index.html'</code></li>
<li>Còn lại → <code>root + '/' + các đoạn nối bằng dấu gạch chéo</code></li>
</ul>`,
  starter: `function staticFilePath(root, urlPath) {
  // Viết code ở đây
}`,
  hints: [
    'Dùng một mảng làm ngăn xếp: push đoạn thường, pop khi gặp "..".',
    'Pop trên mảng rỗng chính là dấu hiệu vượt ra ngoài root — trả null ngay tại đó.',
    'Đừng quên cắt query trước khi tách đoạn, nếu không "?v=2" sẽ dính vào tên file.'
  ],
  tests: [
    { label: 'file thường', args: ['/app/public', '/styles.css'], expect: '/app/public/styles.css' },
    { label: 'thư mục gốc trả index.html', args: ['/app/public', '/'], expect: '/app/public/index.html' },
    { label: 'file trong thư mục con', args: ['/app/public', '/css/fanta.css'], expect: '/app/public/css/fanta.css' },
    { label: 'bỏ query', args: ['/app/public', '/index.html?v=2'], expect: '/app/public/index.html' },
    { label: 'chuẩn hoá dấu chấm đơn', args: ['/app/public', '/./styles.css'], expect: '/app/public/styles.css' },
    { label: 'lùi một cấp vẫn trong root', args: ['/app/public', '/css/../styles.css'], expect: '/app/public/styles.css' },
    { label: 'lùi sâu hai cấp vẫn trong root', args: ['/app/public', '/a/b/../c.js'], expect: '/app/public/a/c.js' },
    { label: 'vượt ra ngoài root', args: ['/app/public', '/../../etc/passwd'], expect: null },
    { label: 'vượt ra ngoài ngay từ đoạn đầu', args: ['/app/public', '/..'], expect: null },
    { label: 'nhiều dấu gạch chéo liên tiếp', args: ['/app/public', '//css//a.css'], expect: '/app/public/css/a.css' }
  ],
  solution: `function staticFilePath(root, urlPath) {
  const mark = String(urlPath).indexOf('?');
  const clean = mark === -1 ? String(urlPath) : String(urlPath).slice(0, mark);

  const segments = [];
  for (const part of clean.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (segments.length === 0) return null; // thoát ra ngoài root
      segments.pop();
      continue;
    }
    segments.push(part);
  }

  if (segments.length === 0) return root + '/index.html';
  return root + '/' + segments.join('/');
}`
},
{
  id: 'node-43', lang: 'node', level: 'Cơ bản', topic: 'Express', fn: 'contentTypeFor',
  title: 'Chọn Content-Type theo đuôi file',
  io: {
    signature: 'contentTypeFor(fileName) → string',
    params: [
      ['fileName', 'string', 'Tên hoặc đường dẫn file, ví dụ "styles.css" hay "/app/public/index.HTML". Có thể không có đuôi, hoặc có nhiều dấu chấm.']
    ],
    returns: ['string', 'Giá trị đặt vào header Content-Type. Đuôi lạ thì trả "application/octet-stream".'],
    example: `contentTypeFor('styles.css')   // → 'text/css'
contentTypeFor('README')       // → 'application/octet-stream'`
  },
  brief: `<p>Khi <code>express.static</code> gửi một file đi, nó phải nói cho trình duyệt biết đó là loại gì. Gửi CSS mà khai là <code>text/plain</code> thì trình duyệt từ chối áp dụng — trang web hiện ra trần trụi không có style, và người mới học thường đi tìm lỗi ở nhầm chỗ.</p>
<p>Viết hàm <code>contentTypeFor(fileName)</code> tra theo bảng sau:</p>
<table><thead><tr><th>Đuôi</th><th>Content-Type</th></tr></thead><tbody>
<tr><td><code>html</code>, <code>htm</code></td><td><code>text/html</code></td></tr>
<tr><td><code>css</code></td><td><code>text/css</code></td></tr>
<tr><td><code>js</code>, <code>mjs</code></td><td><code>application/javascript</code></td></tr>
<tr><td><code>json</code></td><td><code>application/json</code></td></tr>
<tr><td><code>png</code></td><td><code>image/png</code></td></tr>
<tr><td><code>svg</code></td><td><code>image/svg+xml</code></td></tr>
<tr><td><code>ico</code></td><td><code>image/x-icon</code></td></tr>
<tr><td><code>txt</code></td><td><code>text/plain</code></td></tr>
<tr><td>còn lại, hoặc không có đuôi</td><td><code>application/octet-stream</code></td></tr>
</tbody></table>
<ul>
<li>Đuôi là phần sau dấu chấm <strong>cuối cùng</strong>: <code>archive.tar.gz</code> có đuôi là <code>gz</code></li>
<li>Không phân biệt hoa thường: <code>INDEX.HTML</code> vẫn là <code>text/html</code></li>
<li>Tên bắt đầu bằng dấu chấm mà không có phần mở rộng nào khác (<code>.env</code>) thì coi như không có đuôi</li>
</ul>`,
  starter: `function contentTypeFor(fileName) {
  // Viết code ở đây
}`,
  hints: [
    'lastIndexOf(".") cho vị trí dấu chấm cuối cùng.',
    'Dấu chấm ở vị trí 0 (như ".env") nghĩa là không có đuôi thật.',
    'Một object tra cứu gọn hơn nhiều so với chuỗi if.'
  ],
  tests: [
    { label: 'html', args: ['index.html'], expect: 'text/html' },
    { label: 'htm', args: ['old.htm'], expect: 'text/html' },
    { label: 'css', args: ['styles.css'], expect: 'text/css' },
    { label: 'js', args: ['app.js'], expect: 'application/javascript' },
    { label: 'mjs', args: ['server.mjs'], expect: 'application/javascript' },
    { label: 'json', args: ['data.json'], expect: 'application/json' },
    { label: 'svg', args: ['logo.svg'], expect: 'image/svg+xml' },
    { label: 'viết HOA vẫn nhận', args: ['/app/public/INDEX.HTML'], expect: 'text/html' },
    { label: 'nhiều dấu chấm lấy đuôi cuối', args: ['archive.tar.gz'], expect: 'application/octet-stream' },
    { label: 'không có đuôi', args: ['README'], expect: 'application/octet-stream' },
    { label: 'file ẩn không tính là có đuôi', args: ['.env'], expect: 'application/octet-stream' }
  ],
  solution: `function contentTypeFor(fileName) {
  const TYPES = {
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    mjs: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    txt: 'text/plain',
  };

  const name = String(fileName);
  const dot = name.lastIndexOf('.');
  const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\\\'));
  if (dot <= slash + 1) return 'application/octet-stream';

  const ext = name.slice(dot + 1).toLowerCase();
  return TYPES[ext] ?? 'application/octet-stream';
}`
},
{
  id: 'node-44', lang: 'node', level: 'Trung bình', topic: 'Middleware', fn: 'createPipeline',
  title: 'Dựng lại app.use của Express',
  io: {
    signature: 'createPipeline() → { use, run }',
    params: [
      ['(không có tham số)', '—', 'Hàm tự tạo một pipeline rỗng.'],
      ['use(fn)', 'function', 'Đăng ký một middleware dạng (req, res, next). Gọi được nhiều lần; thứ tự đăng ký là thứ tự chạy. Trả về chính pipeline để nối chuỗi.'],
      ['run(req, res)', 'function', 'Chạy chuỗi middleware với req và res truyền vào. Trả về số middleware đã thực sự chạy.']
    ],
    returns: ['object', 'use(fn) trả về chính pipeline · run(req, res) trả về number.'],
    example: `const app = createPipeline();
app.use((req, res, next) => { req.userId = 7; next(); });
app.use((req, res) => { res.body = req.userId; });
app.run({}, {});   // → 2`
  },
  brief: `<p><code>app.use(express.json())</code> nhìn như một lời gọi hàm bình thường, nhưng nó đang xếp hàng: mỗi <code>use</code> thêm một mắt xích vào chuỗi, và request đi qua từng mắt xích theo đúng thứ tự bạn đã xếp.</p>
<p>Viết hàm <code>createPipeline()</code> dựng lại cơ chế đó.</p>
<ul>
<li><code>use(fn)</code> thêm middleware vào cuối chuỗi và trả về chính pipeline, nhờ vậy nối được <code>p.use(a).use(b)</code></li>
<li><code>run(req, res)</code> gọi middleware đầu tiên với ba tham số <code>(req, res, next)</code></li>
<li>Middleware gọi <code>next()</code> thì mắt xích sau chạy; <strong>không</strong> gọi thì chuỗi dừng ngay tại đó</li>
<li><code>run</code> trả về <strong>số middleware đã thực sự chạy</strong></li>
<li>Chuỗi rỗng thì <code>run</code> trả về 0</li>
</ul>
<p>Mọi middleware ở bài này đều đồng bộ, nên không cần <code>async</code>.</p>`,
  starter: `function createPipeline() {
  // Viết code ở đây
}`,
  hints: [
    'Giữ một mảng middleware và một hàm đệ quy dispatch(i).',
    'Đếm số lần đã chạy bằng một biến, tăng ngay trước khi gọi middleware.',
    'next chính là () => dispatch(i + 1) — đừng truyền thẳng dispatch, nếu không middleware gọi next() sẽ chạy lại chính nó.'
  ],
  tests: [
    { label: 'chuỗi rỗng', script: `return fn().run({}, {});`, expect: 0 },
    { label: 'chạy đủ chuỗi', script: `const p = fn();
p.use((req, res, next) => next());
p.use((req, res, next) => next());
return p.run({}, {});`, expect: 2 },
    { label: 'không gọi next thì dừng', script: `const p = fn();
p.use((req, res, next) => next());
p.use(() => {});
p.use((req, res, next) => next());
return p.run({}, {});`, expect: 2 },
    { label: 'chạy đúng thứ tự', script: `const log = [];
const p = fn();
p.use((req, res, next) => { log.push('a'); next(); });
p.use((req, res, next) => { log.push('b'); next(); });
p.run({}, {});
return log;`, expect: ['a', 'b'] },
    { label: 'middleware gắn thêm dữ liệu vào req', script: `const p = fn();
p.use((req, res, next) => { req.userId = 7; next(); });
const req = {};
p.run(req, {});
return req.userId;`, expect: 7 },
    { label: 'use nối chuỗi được', script: `const p = fn();
return p.use(() => {}) === p;`, expect: true },
    { label: 'dừng ngay từ mắt xích đầu', script: `const log = [];
const p = fn();
p.use(() => { log.push('chan'); });
p.use(() => { log.push('khong-bao-gio'); });
p.run({}, {});
return log;`, expect: ['chan'] }
  ],
  solution: `function createPipeline() {
  const stack = [];

  const pipeline = {
    use(fn) { stack.push(fn); return pipeline; },
    run(req, res) {
      let ran = 0;
      const dispatch = (i) => {
        const middleware = stack[i];
        if (!middleware) return;
        ran++;
        middleware(req, res, () => dispatch(i + 1));
      };
      dispatch(0);
      return ran;
    },
  };

  return pipeline;
}`
},
{
  id: 'node-45', lang: 'node', level: 'Trung bình', topic: 'Middleware', fn: 'handleError',
  title: 'Middleware xử lý lỗi bốn tham số',
  io: {
    signature: 'handleError(err, req, res, next) → void',
    params: [
      ['err', 'object', 'Lỗi bắt được. Không có hình dạng cố định. Có thể có: status (number), name (string, ví dụ "ValidationError"), message (string), details (mảng), stack (string).'],
      ['req', 'object', 'Request đang xử lý. Chỉ cần dùng req.traceId (string, có thể thiếu).'],
      ['res', 'object', 'Response kiểu Express: status(code) trả về chính nó, json(data).'],
      ['next', 'function', 'Không dùng tới, nhưng BẮT BUỘC khai báo — Express nhận ra middleware xử lý lỗi bằng cách đếm số tham số.']
    ],
    returns: ['void', 'Hàm không trả gì; nó gọi res.status(...).json(...).'],
    example: `handleError({ status: 404, message: 'Khong thay todo' }, req, res, next)
// gọi res.status(404).json({ message: 'Khong thay todo', traceId: '...' })`
  },
  brief: `<p>Express phân biệt middleware thường với middleware xử lý lỗi bằng một chi tiết kỳ lạ: <strong>số lượng tham số</strong>. Bốn tham số <code>(err, req, res, next)</code> thì nó là bộ xử lý lỗi; ba tham số thì không. Viết thiếu <code>next</code> là middleware của bạn sẽ không bao giờ được gọi, dù code bên trong hoàn toàn đúng.</p>
<p>Viết hàm <code>handleError(err, req, res, next)</code> chuyển mọi loại lỗi thành một response thống nhất.</p>
<table><thead><tr><th>Lỗi</th><th>Status</th><th>Body</th></tr></thead><tbody>
<tr><td><code>err.name === 'ValidationError'</code></td><td>422</td><td><code>{ message: err.message, errors: err.details ?? [], traceId }</code></td></tr>
<tr><td><code>err.status</code> là số nguyên từ 400 tới 499</td><td>chính nó</td><td><code>{ message: err.message, traceId }</code></td></tr>
<tr><td>Mọi trường hợp còn lại</td><td>500</td><td><code>{ message: 'Lỗi hệ thống', traceId }</code></td></tr>
</tbody></table>
<p><code>traceId</code> lấy từ <code>req.traceId</code>, thiếu thì dùng chuỗi rỗng.</p>
<p class="warn">Nhánh 500 <strong>không</strong> được để lộ <code>err.message</code>. Thông báo lỗi nội bộ thường chứa tên bảng, đường dẫn file, có khi cả chuỗi kết nối database — đủ để người tò mò vẽ lại hệ thống của bạn. Người dùng chỉ cần biết "có lỗi"; chi tiết thì nằm trong log, tra bằng <code>traceId</code>.</p>`,
  starter: `function handleError(err, req, res, next) {
  // Viết code ở đây
}`,
  hints: [
    'Xét ValidationError trước, vì một lỗi validation cũng có thể mang status 400.',
    'Number.isInteger loại được cả undefined lẫn chuỗi "404".',
    'traceId lấy một lần ở đầu hàm rồi dùng lại cho cả ba nhánh.'
  ],
  tests: [
    { label: 'lỗi validation', script: `const log = [];
const res = { status(c) { log.push(c); return res; }, json(d) { log.push(d); return res; } };
fn({ name: 'ValidationError', message: 'Thieu truong', details: [{ field: 'task' }] }, { traceId: 't1' }, res, () => {});
return log;`, expect: [422, { message: 'Thieu truong', errors: [{ field: 'task' }], traceId: 't1' }] },
    { label: 'validation không có details', script: `const log = [];
const res = { status(c) { log.push(c); return res; }, json(d) { log.push(d); return res; } };
fn({ name: 'ValidationError', message: 'Sai' }, { traceId: 't2' }, res, () => {});
return log;`, expect: [422, { message: 'Sai', errors: [], traceId: 't2' }] },
    { label: 'lỗi 404', script: `const log = [];
const res = { status(c) { log.push(c); return res; }, json(d) { log.push(d); return res; } };
fn({ status: 404, message: 'Khong thay todo' }, { traceId: 't3' }, res, () => {});
return log;`, expect: [404, { message: 'Khong thay todo', traceId: 't3' }] },
    { label: 'lỗi lạ bị giấu chi tiết', script: `const log = [];
const res = { status(c) { log.push(c); return res; }, json(d) { log.push(d); return res; } };
fn({ message: 'connect ECONNREFUSED 10.0.0.5:5432', stack: 'at db.js:12' }, { traceId: 't4' }, res, () => {});
return log;`, expect: [500, { message: 'Lỗi hệ thống', traceId: 't4' }] },
    { label: 'status 500 khai sẵn vẫn bị giấu', script: `const log = [];
const res = { status(c) { log.push(c); return res; }, json(d) { log.push(d); return res; } };
fn({ status: 500, message: 'chi tiet noi bo' }, {}, res, () => {});
return log;`, expect: [500, { message: 'Lỗi hệ thống', traceId: '' }] },
    { label: 'thiếu traceId thì dùng chuỗi rỗng', script: `const log = [];
const res = { status(c) { log.push(c); return res; }, json(d) { log.push(d); return res; } };
fn({ status: 401, message: 'Chua dang nhap' }, {}, res, () => {});
return log;`, expect: [401, { message: 'Chua dang nhap', traceId: '' }] },
    { label: 'hàm phải khai báo đủ bốn tham số', script: `return fn.length;`, expect: 4 }
  ],
  solution: `function handleError(err, req, res, next) {
  const traceId = (req && req.traceId) || '';
  const safe = err || {};

  if (safe.name === 'ValidationError') {
    res.status(422).json({
      message: safe.message,
      errors: Array.isArray(safe.details) ? safe.details : [],
      traceId,
    });
    return;
  }

  if (Number.isInteger(safe.status) && safe.status >= 400 && safe.status <= 499) {
    res.status(safe.status).json({ message: safe.message, traceId });
    return;
  }

  res.status(500).json({ message: 'Lỗi hệ thống', traceId });
}`
},
{
  id: 'node-46', lang: 'node', level: 'Nâng cao', topic: 'Router', fn: 'createRouter',
  title: 'Dựng lại express.Router()',
  io: {
    signature: 'createRouter() → { get, post, put, delete, handle }',
    params: [
      ['(không có tham số)', '—', 'Tạo một router rỗng.'],
      ['get / post / put / delete (path, handler)', 'function', 'Đăng ký một endpoint. path là chuỗi bắt đầu bằng dấu gạch chéo, có thể chứa tham số dạng :ten. Trả về chính router để nối chuỗi.'],
      ['handle(method, path)', 'function', 'Tìm endpoint khớp rồi gọi handler của nó.']
    ],
    returns: ['object',
      'handle(method, path) trả về { handler, params } khi khớp, hoặc null khi không có endpoint nào nhận.'],
    example: `const router = createRouter();
router.get('/:id', (params) => 'todo ' + params.id);
router.handle('GET', '/7');
// → { handler: [Function], params: { id: '7' } }`
  },
  brief: `<p>Trong dự án của khoá học, <code>authRoutes.js</code> và <code>todoRoutes.js</code> đều bắt đầu bằng <code>const router = express.Router()</code>. Router là một ứng dụng thu nhỏ: nó giữ bảng endpoint riêng, và sau này được gắn vào app tại một đường dẫn gốc.</p>
<p>Viết hàm <code>createRouter()</code> dựng lại phần lõi.</p>
<ul>
<li>Bốn phương thức <code>get</code>, <code>post</code>, <code>put</code>, <code>delete</code>, mỗi cái nhận <code>(path, handler)</code> và trả về chính router</li>
<li><code>handle(method, path)</code> duyệt các endpoint theo <strong>đúng thứ tự đăng ký</strong> và lấy cái khớp <strong>đầu tiên</strong></li>
<li>Khớp nghĩa là: cùng method (không phân biệt hoa thường), cùng số đoạn đường dẫn, và mỗi đoạn hoặc giống hệt hoặc là tham số dạng <code>:ten</code></li>
<li>Khớp thì trả về <code>{ handler, params }</code>; <code>params</code> là object các tham số, giá trị luôn là chuỗi</li>
<li>Không khớp thì trả về <code>null</code></li>
</ul>
<p class="callout">Chi tiết "cái khớp đầu tiên thắng" giải thích một lỗi rất hay gặp: đăng ký <code>/:id</code> trước <code>/search</code> thì request tới <code>/search</code> sẽ rơi vào <code>/:id</code> với <code>id = 'search'</code>. Route cụ thể phải đặt trước route có tham số.</p>`,
  starter: `function createRouter() {
  // Viết code ở đây
}`,
  hints: [
    'Một mảng routes với { method, segments, handler } là đủ.',
    'Tách path bằng split("/") ngay lúc đăng ký để khỏi tách lại mỗi lần handle.',
    'Viết một hàm phụ so khớp hai mảng đoạn và trả về params hoặc null.'
  ],
  tests: [
    { label: 'route tĩnh', script: `const r = fn();
r.get('/health', () => 'ok');
const m = r.handle('GET', '/health');
return m.handler();`, expect: 'ok' },
    { label: 'không khớp trả null', script: `const r = fn();
r.get('/health', () => 'ok');
return r.handle('GET', '/healthz');`, expect: null },
    { label: 'sai method trả null', script: `const r = fn();
r.get('/health', () => 'ok');
return r.handle('POST', '/health');`, expect: null },
    { label: 'method không phân biệt hoa thường', script: `const r = fn();
r.get('/health', () => 'ok');
return r.handle('get', '/health') !== null;`, expect: true },
    { label: 'lấy tham số', script: `const r = fn();
r.put('/:id', () => 'ok');
return r.handle('PUT', '/42').params;`, expect: { id: '42' } },
    { label: 'nhiều tham số', script: `const r = fn();
r.get('/:userId/todos/:todoId', () => 'ok');
return r.handle('GET', '/7/todos/42').params;`, expect: { userId: '7', todoId: '42' } },
    { label: 'khác số đoạn thì không khớp', script: `const r = fn();
r.get('/:id', () => 'ok');
return r.handle('GET', '/7/extra');`, expect: null },
    { label: 'route đăng ký trước thắng', script: `const r = fn();
r.get('/:id', () => 'tham-so');
r.get('/search', () => 'cu-the');
return r.handle('GET', '/search').handler();`, expect: 'tham-so' },
    { label: 'nối chuỗi được', script: `const r = fn();
return r.get('/a', () => {}) === r;`, expect: true },
    { label: 'gọi handler kèm params', script: `const r = fn();
r.get('/:id', (params) => 'todo ' + params.id);
const m = r.handle('GET', '/9');
return m.handler(m.params);`, expect: 'todo 9' }
  ],
  solution: `function createRouter() {
  const routes = [];

  const match = (segments, parts) => {
    if (segments.length !== parts.length) return null;
    const params = {};
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].startsWith(':')) params[segments[i].slice(1)] = parts[i];
      else if (segments[i] !== parts[i]) return null;
    }
    return params;
  };

  const add = (method) => (path, handler) => {
    routes.push({ method, segments: path.split('/'), handler });
    return router;
  };

  const router = {
    get: add('GET'),
    post: add('POST'),
    put: add('PUT'),
    delete: add('DELETE'),
    handle(method, path) {
      const wanted = String(method).toUpperCase();
      const parts = String(path).split('/');
      for (const route of routes) {
        if (route.method !== wanted) continue;
        const params = match(route.segments, parts);
        if (params) return { handler: route.handler, params };
      }
      return null;
    },
  };

  return router;
}`
},
{
  id: 'node-47', lang: 'node', level: 'Trung bình', topic: 'Router', fn: 'mountRouter',
  title: 'Gắn router vào một tiền tố đường dẫn',
  io: {
    signature: 'mountRouter(mounts, path) → object | null',
    params: [
      ['mounts', 'Array<object> · mặc định []', 'Danh sách router đã gắn, mỗi phần tử là { prefix: string bắt đầu bằng dấu gạch chéo, router: bất kỳ }. Thứ tự trong mảng là thứ tự đăng ký.'],
      ['path', 'string', 'Đường dẫn đầy đủ của request, ví dụ "/todos/42".']
    ],
    returns: ['object | null',
      '{ router, rest } — router khớp và phần đường dẫn còn lại sau khi cắt tiền tố (luôn bắt đầu bằng dấu gạch chéo). Không khớp thì null.'],
    example: `mountRouter([{ prefix: '/todos', router: todoRoutes }], '/todos/42')
// → { router: todoRoutes, rest: '/42' }`
  },
  brief: `<p>Trong <code>server.js</code> của khoá học có hai dòng:</p>
<pre><code>app.use('/auth', authRoutes)
app.use('/todos', authMiddleware, todoRoutes)</code></pre>
<p>Chúng nói: mọi request bắt đầu bằng <code>/auth</code> thì giao cho <code>authRoutes</code>, và router đó chỉ nhìn thấy <em>phần còn lại</em> của đường dẫn. Nhờ vậy bên trong <code>authRoutes.js</code> bạn viết <code>router.post('/register')</code> chứ không phải <code>/auth/register</code>.</p>
<p>Viết hàm <code>mountRouter(mounts, path)</code> làm đúng phép cắt đó.</p>
<ul>
<li>Một mount khớp khi <code>path</code> bằng đúng <code>prefix</code>, hoặc bắt đầu bằng <code>prefix + '/'</code></li>
<li>Khớp nhiều mount thì lấy cái <strong>đăng ký trước</strong></li>
<li><code>rest</code> là phần sau tiền tố. Cắt xong mà rỗng thì <code>rest</code> là <code>'/'</code></li>
<li>Không mount nào khớp → <code>null</code></li>
</ul>
<p>Chú ý cái bẫy: <code>/todos</code> <strong>không</strong> được khớp với <code>/todosaurus</code>. Chỉ kiểm tra <code>startsWith(prefix)</code> là dính bẫy này ngay.</p>`,
  starter: `function mountRouter(mounts = [], path) {
  // Viết code ở đây
}`,
  hints: [
    'Hai điều kiện khớp: bằng đúng prefix, hoặc startsWith(prefix + "/").',
    'rest = path.slice(prefix.length) rồi kiểm tra rỗng.',
    'Dùng vòng for thường để trả về ngay khi gặp mount đầu tiên khớp.'
  ],
  tests: [
    { label: 'khớp và cắt tiền tố', script: `const r = { name: 'todos' };
return fn([{ prefix: '/todos', router: r }], '/todos/42');`, expect: { router: { name: 'todos' }, rest: '/42' } },
    { label: 'khớp đúng tiền tố thì rest là dấu gạch chéo', script: `const r = { name: 'todos' };
return fn([{ prefix: '/todos', router: r }], '/todos');`, expect: { router: { name: 'todos' }, rest: '/' } },
    { label: 'đường dẫn sâu', script: `const r = { name: 'auth' };
return fn([{ prefix: '/auth', router: r }], '/auth/login/extra').rest;`, expect: '/login/extra' },
    { label: 'không khớp tiền tố khác', script: `return fn([{ prefix: '/todos', router: {} }], '/auth/login');`, expect: null },
    { label: 'không được khớp nửa chừng một từ', script: `return fn([{ prefix: '/todos', router: {} }], '/todosaurus');`, expect: null },
    { label: 'mount đăng ký trước thắng', script: `return fn([{ prefix: '/a', router: { n: 1 } }, { prefix: '/a', router: { n: 2 } }], '/a/b').router;`, expect: { n: 1 } },
    { label: 'danh sách rỗng', script: `return fn([], '/todos');`, expect: null }
  ],
  solution: `function mountRouter(mounts = [], path) {
  const url = String(path);

  for (const mount of mounts) {
    const { prefix } = mount;
    const exact = url === prefix;
    const deeper = url.startsWith(prefix + '/');
    if (!exact && !deeper) continue;

    const rest = url.slice(prefix.length);
    return { router: mount.router, rest: rest === '' ? '/' : rest };
  }

  return null;
}`
},
{
  id: 'node-48', lang: 'node', level: 'Nâng cao', topic: 'Router', fn: 'findHandler',
  title: 'Thứ tự route và route bắt tất cả',
  io: {
    signature: 'findHandler(routes, method, path) → object | null',
    params: [
      ['routes', 'Array<object> · mặc định []', 'Bảng route theo thứ tự đăng ký. Mỗi phần tử: { method: string, path: string, handler: bất kỳ }. path có thể chứa đoạn tham số ":ten" và đoạn bắt tất cả "*" (chỉ đứng ở cuối).'],
      ['method', 'string', 'Method của request, ví dụ "GET". Không phân biệt hoa thường.'],
      ['path', 'string', 'Đường dẫn của request, ví dụ "/todos/42".']
    ],
    returns: ['object | null',
      '{ handler, params } của route khớp đầu tiên. Route có "*" đặt phần đuôi đã khớp vào params.rest. Không khớp route nào → null.'],
    example: `findHandler([{ method: 'GET', path: '/files/*', handler: 'static' }], 'GET', '/files/css/app.css')
// → { handler: 'static', params: { rest: 'css/app.css' } }`
  },
  brief: `<p>Express duyệt bảng route từ trên xuống và dừng ở cái khớp đầu tiên. Hệ quả là <strong>thứ tự khai báo quan trọng hơn độ cụ thể</strong> — khác hẳn thói quen của nhiều ngôn ngữ khác.</p>
<p>Viết hàm <code>findHandler(routes, method, path)</code> theo ba loại đoạn đường dẫn:</p>
<table><thead><tr><th>Đoạn</th><th>Khớp với</th><th>Ghi vào params</th></tr></thead><tbody>
<tr><td>Chữ thường, ví dụ <code>todos</code></td><td>Đúng chữ đó</td><td>Không</td></tr>
<tr><td><code>:ten</code></td><td>Một đoạn bất kỳ</td><td><code>params.ten</code></td></tr>
<tr><td><code>*</code> (chỉ ở cuối)</td><td>Toàn bộ phần còn lại, kể cả nhiều đoạn</td><td><code>params.rest</code></td></tr>
</tbody></table>
<ul>
<li>Không có <code>*</code> thì số đoạn phải bằng nhau</li>
<li><code>*</code> khớp cả khi phần còn lại rỗng — khi đó <code>params.rest</code> là chuỗi rỗng</li>
<li>Method phải khớp, không phân biệt hoa thường</li>
<li>Không route nào nhận → <code>null</code></li>
</ul>`,
  starter: `function findHandler(routes = [], method, path) {
  // Viết code ở đây
}`,
  hints: [
    'Bỏ đoạn rỗng đầu tiên bằng cách tách rồi filter, hoặc nhớ rằng "/a".split("/") cho ["", "a"].',
    'Gặp "*" thì ghép mọi đoạn còn lại của request bằng join("/") rồi dừng vòng lặp.',
    'Viết phép so khớp thành một hàm phụ trả về params hoặc null, vòng ngoài chỉ lo thứ tự.'
  ],
  tests: [
    { label: 'route tĩnh', script: `return fn([{ method: 'GET', path: '/health', handler: 'h' }], 'GET', '/health');`, expect: { handler: 'h', params: {} } },
    { label: 'tham số', script: `return fn([{ method: 'GET', path: '/todos/:id', handler: 'h' }], 'GET', '/todos/42').params;`, expect: { id: '42' } },
    { label: 'cụ thể đặt trước thì thắng', script: `return fn([
  { method: 'GET', path: '/todos/search', handler: 'cu-the' },
  { method: 'GET', path: '/todos/:id', handler: 'tham-so' }
], 'GET', '/todos/search').handler;`, expect: 'cu-the' },
    { label: 'tham số đặt trước thì nuốt mất route cụ thể', script: `return fn([
  { method: 'GET', path: '/todos/:id', handler: 'tham-so' },
  { method: 'GET', path: '/todos/search', handler: 'cu-the' }
], 'GET', '/todos/search').handler;`, expect: 'tham-so' },
    { label: 'sao bắt nhiều đoạn', script: `return fn([{ method: 'GET', path: '/files/*', handler: 'static' }], 'GET', '/files/css/app.css').params;`, expect: { rest: 'css/app.css' } },
    { label: 'sao khớp cả phần rỗng', script: `return fn([{ method: 'GET', path: '/files/*', handler: 'static' }], 'GET', '/files').params;`, expect: { rest: '' } },
    { label: 'sai method', script: `return fn([{ method: 'POST', path: '/todos', handler: 'h' }], 'GET', '/todos');`, expect: null },
    { label: 'khác số đoạn khi không có sao', script: `return fn([{ method: 'GET', path: '/todos/:id', handler: 'h' }], 'GET', '/todos/42/extra');`, expect: null },
    { label: 'bảng rỗng', script: `return fn([], 'GET', '/');`, expect: null },
    { label: 'route bắt tất cả đặt cuối làm trang 404', script: `return fn([
  { method: 'GET', path: '/health', handler: 'health' },
  { method: 'GET', path: '/*', handler: 'not-found' }
], 'GET', '/linh/tinh').handler;`, expect: 'not-found' }
  ],
  solution: `function findHandler(routes = [], method, path) {
  const wanted = String(method).toUpperCase();
  const parts = String(path).split('/').filter(Boolean);

  const match = (routePath) => {
    const segments = String(routePath).split('/').filter(Boolean);
    const params = {};

    for (let i = 0; i < segments.length; i++) {
      if (segments[i] === '*') {
        params.rest = parts.slice(i).join('/');
        return params;
      }
      if (i >= parts.length) return null;
      if (segments[i].startsWith(':')) params[segments[i].slice(1)] = parts[i];
      else if (segments[i] !== parts[i]) return null;
    }

    return segments.length === parts.length ? params : null;
  };

  for (const route of routes) {
    if (String(route.method).toUpperCase() !== wanted) continue;
    const params = match(route.path);
    if (params) return { handler: route.handler, params };
  }

  return null;
}`
},
{
  id: 'node-49', lang: 'node', level: 'Trung bình', topic: 'SQLite', fn: 'createTableSql',
  title: 'Sinh câu lệnh CREATE TABLE',
  io: {
    signature: 'createTableSql(table, columns) → string',
    params: [
      ['table', 'string', 'Tên bảng. Chỉ được gồm chữ, số và dấu gạch dưới, nếu không thì ném lỗi.'],
      ['columns', 'Array<object> · mặc định []', 'Danh sách cột theo thứ tự. Mỗi cột: { name: string, type: string ("INTEGER" | "TEXT" | "BOOLEAN" | "REAL"), pk: boolean tuỳ chọn, unique: boolean tuỳ chọn, notNull: boolean tuỳ chọn, default: giá trị tuỳ chọn, references: chuỗi "bang(cot)" tuỳ chọn }.']
    ],
    returns: ['string',
      'Câu lệnh CREATE TABLE một dòng. Tên bảng hoặc tên cột sai định dạng, hoặc danh sách cột rỗng → ném Error("tên không hợp lệ") hoặc Error("không có cột nào").'],
    example: `createTableSql('users', [
  { name: 'id', type: 'INTEGER', pk: true },
  { name: 'username', type: 'TEXT', unique: true }
])
// → 'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE)'`
  },
  brief: `<p>Bảng <code>users</code> và <code>todos</code> trong dự án của khoá học được tạo bằng hai câu <code>db.exec</code>. Bài này sinh những câu lệnh đó từ mô tả cột, để bạn thấy rõ từng ràng buộc làm gì.</p>
<p>Ghép các mảnh theo đúng thứ tự sau cho mỗi cột:</p>
<pre>&lt;tên&gt; &lt;KIỂU&gt; [PRIMARY KEY AUTOINCREMENT] [UNIQUE] [NOT NULL] [DEFAULT &lt;giá trị&gt;] [REFERENCES &lt;bảng(cột)&gt;]</pre>
<ul>
<li><code>pk: true</code> → thêm <code>PRIMARY KEY AUTOINCREMENT</code></li>
<li><code>unique: true</code> → thêm <code>UNIQUE</code></li>
<li><code>notNull: true</code> → thêm <code>NOT NULL</code></li>
<li><code>default</code> có mặt → thêm <code>DEFAULT x</code>. Giá trị là chuỗi thì bọc trong nháy đơn; số và boolean thì để trần (boolean viết thành 1 hoặc 0)</li>
<li><code>references</code> có mặt → thêm <code>REFERENCES bang(cot)</code></li>
</ul>
<p>Các cột nối nhau bằng dấu phẩy và một dấu cách, đặt trong ngoặc tròn sau tên bảng.</p>
<p class="warn">Tên bảng và tên cột <strong>không tham số hoá được</strong> — chúng là một phần cấu trúc câu lệnh, không phải dữ liệu. Vì vậy chúng phải được kiểm tra bằng tay: chỉ cho phép chữ, số và dấu gạch dưới. Sai thì ném <code>Error('tên không hợp lệ')</code>. Danh sách cột rỗng thì ném <code>Error('không có cột nào')</code>.</p>`,
  starter: `function createTableSql(table, columns = []) {
  // Viết code ở đây
}`,
  hints: [
    'Kiểm tra tên bảng và mọi tên cột bằng /^[A-Za-z0-9_]+$/ trước khi ghép chuỗi.',
    'Dùng "default" in column để biết cột có khai báo giá trị mặc định hay không — chỉ so sánh với undefined sẽ bỏ sót giá trị 0.',
    'Dựng mảng mảnh cho từng cột rồi join(" "), sạch hơn nối chuỗi có điều kiện.'
  ],
  tests: [
    { label: 'bảng users', args: ['users', [{ name: 'id', type: 'INTEGER', pk: true }, { name: 'username', type: 'TEXT', unique: true }, { name: 'password', type: 'TEXT' }]], expect: 'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)' },
    { label: 'khoá ngoại và giá trị mặc định', args: ['todos', [{ name: 'id', type: 'INTEGER', pk: true }, { name: 'user_id', type: 'INTEGER', references: 'users(id)' }, { name: 'task', type: 'TEXT', notNull: true }, { name: 'completed', type: 'BOOLEAN', default: false }]], expect: 'CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id), task TEXT NOT NULL, completed BOOLEAN DEFAULT 0)' },
    { label: 'mặc định là chuỗi thì bọc nháy', args: ['notes', [{ name: 'status', type: 'TEXT', default: 'moi' }]], expect: "CREATE TABLE notes (status TEXT DEFAULT 'moi')" },
    { label: 'mặc định là số 0 vẫn được ghi', args: ['stats', [{ name: 'views', type: 'INTEGER', default: 0 }]], expect: 'CREATE TABLE stats (views INTEGER DEFAULT 0)' },
    { label: 'tên bảng có ký tự lạ', script: `try { fn('users; DROP TABLE x', [{ name: 'id', type: 'INTEGER' }]); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên không hợp lệ' },
    { label: 'tên cột có ký tự lạ', script: `try { fn('users', [{ name: 'a b', type: 'TEXT' }]); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên không hợp lệ' },
    { label: 'không có cột nào', script: `try { fn('users', []); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'không có cột nào' }
  ],
  solution: `function createTableSql(table, columns = []) {
  const safe = /^[A-Za-z0-9_]+$/;
  if (!safe.test(String(table))) throw new Error('tên không hợp lệ');
  if (columns.length === 0) throw new Error('không có cột nào');

  const parts = columns.map((column) => {
    if (!safe.test(String(column.name))) throw new Error('tên không hợp lệ');

    const pieces = [column.name, column.type];
    if (column.pk) pieces.push('PRIMARY KEY AUTOINCREMENT');
    if (column.unique) pieces.push('UNIQUE');
    if (column.notNull) pieces.push('NOT NULL');
    if ('default' in column) {
      const value = column.default;
      let text;
      if (typeof value === 'string') text = "'" + value + "'";
      else if (typeof value === 'boolean') text = value ? '1' : '0';
      else text = String(value);
      pieces.push('DEFAULT ' + text);
    }
    if (column.references) pieces.push('REFERENCES ' + column.references);

    return pieces.join(' ');
  });

  return 'CREATE TABLE ' + table + ' (' + parts.join(', ') + ')';
}`
},
{
  id: 'node-50', lang: 'node', level: 'Trung bình', topic: 'SQLite', fn: 'buildSelect',
  title: 'Dựng câu SELECT tham số hoá',
  io: {
    signature: 'buildSelect(query) → { sql, values }',
    params: [
      ['query', 'object', 'Mô tả truy vấn: table (string, bắt buộc), columns (mảng tên cột, thiếu thì lấy tất cả), where (object: cột → giá trị, thiếu thì không lọc), orderBy (string tên cột, tuỳ chọn), desc (boolean, tuỳ chọn), limit (number, tuỳ chọn), offset (number, tuỳ chọn).']
    ],
    returns: ['object',
      '{ sql: string, values: Array } — giá trị lọc KHÔNG nằm trong sql mà nằm trong values, đúng chỗ của dấu hỏi.'],
    example: `buildSelect({ table: 'todos', where: { user_id: 7, completed: 0 }, orderBy: 'id', limit: 20 })
// → { sql: 'SELECT * FROM todos WHERE user_id = ? AND completed = ? ORDER BY id ASC LIMIT ?',
//      values: [7, 0, 20] }`
  },
  brief: `<p>Trong <code>todoRoutes.js</code>, mọi truy vấn đều có dạng <code>db.prepare('SELECT * FROM todos WHERE user_id = ?')</code> rồi <code>.all(req.userId)</code>. Dấu hỏi là chỗ trống, còn giá trị đi theo đường riêng — đó là <strong>tham số hoá</strong>, và là hàng phòng thủ duy nhất thật sự hiệu quả trước SQL injection.</p>
<p>Viết hàm <code>buildSelect(query)</code> sinh ra cặp <code>{ sql, values }</code> đó. Ghép theo thứ tự:</p>
<pre>SELECT &lt;cột&gt; FROM &lt;bảng&gt; [WHERE ...] [ORDER BY ... ASC|DESC] [LIMIT ?] [OFFSET ?]</pre>
<ul>
<li><code>columns</code> thiếu hoặc rỗng → dùng <code>*</code>; có thì nối bằng dấu phẩy và dấu cách</li>
<li><code>where</code> có nhiều khoá → nối bằng <code>AND</code>, mỗi điều kiện là <code>cot = ?</code>, giá trị đẩy vào <code>values</code> theo đúng thứ tự khoá</li>
<li><code>orderBy</code> có → thêm <code>ORDER BY cot ASC</code>, hoặc <code>DESC</code> khi <code>desc</code> là true</li>
<li><code>limit</code> là số → thêm <code>LIMIT ?</code> và đẩy giá trị vào <code>values</code>. <code>offset</code> tương tự, luôn đứng sau limit</li>
</ul>
<p>Tên bảng và tên cột không tham số hoá được, nên phải kiểm tra: chỉ chữ, số và gạch dưới, sai thì ném <code>Error('tên không hợp lệ')</code>. Giá trị thì ngược lại — không kiểm tra gì cả, vì chúng không bao giờ đi vào chuỗi SQL.</p>`,
  starter: `function buildSelect(query = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Gom mọi tên cần kiểm tra (bảng, columns, khoá của where, orderBy) rồi kiểm một lượt.',
    'Dựng mảng mệnh đề rồi join(" ") — dễ đọc hơn nhiều so với nối chuỗi có if.',
    'Thứ tự đẩy vào values phải khớp thứ tự dấu hỏi xuất hiện trong sql: where trước, rồi limit, rồi offset.'
  ],
  tests: [
    { label: 'truy vấn đơn giản nhất', args: [{ table: 'todos' }], expect: { sql: 'SELECT * FROM todos', values: [] } },
    { label: 'chọn cột', args: [{ table: 'users', columns: ['id', 'username'] }], expect: { sql: 'SELECT id, username FROM users', values: [] } },
    { label: 'một điều kiện', args: [{ table: 'todos', where: { user_id: 7 } }], expect: { sql: 'SELECT * FROM todos WHERE user_id = ?', values: [7] } },
    { label: 'nhiều điều kiện nối bằng AND', args: [{ table: 'todos', where: { user_id: 7, completed: 0 } }], expect: { sql: 'SELECT * FROM todos WHERE user_id = ? AND completed = ?', values: [7, 0] } },
    { label: 'sắp xếp giảm dần', args: [{ table: 'todos', orderBy: 'id', desc: true }], expect: { sql: 'SELECT * FROM todos ORDER BY id DESC', values: [] } },
    { label: 'phân trang', args: [{ table: 'todos', limit: 20, offset: 40 }], expect: { sql: 'SELECT * FROM todos LIMIT ? OFFSET ?', values: [20, 40] } },
    { label: 'đủ mọi mệnh đề', args: [{ table: 'todos', columns: ['id', 'task'], where: { user_id: 7 }, orderBy: 'id', limit: 20 }], expect: { sql: 'SELECT id, task FROM todos WHERE user_id = ? ORDER BY id ASC LIMIT ?', values: [7, 20] } },
    { label: 'giá trị nguy hiểm vẫn an toàn vì nằm ngoài sql', args: [{ table: 'users', where: { username: "' OR 1=1 --" } }], expect: { sql: 'SELECT * FROM users WHERE username = ?', values: ["' OR 1=1 --"] } },
    { label: 'tên bảng lạ bị chặn', script: `try { fn({ table: 'users; DROP TABLE x' }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên không hợp lệ' },
    { label: 'tên cột trong where bị chặn', script: `try { fn({ table: 'users', where: { 'a b': 1 } }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên không hợp lệ' }
  ],
  solution: `function buildSelect(query = {}) {
  const safe = /^[A-Za-z0-9_]+$/;
  const check = (name) => {
    if (!safe.test(String(name))) throw new Error('tên không hợp lệ');
    return name;
  };

  check(query.table);

  const columns = query.columns?.length ? query.columns.map(check).join(', ') : '*';
  const clauses = ['SELECT ' + columns + ' FROM ' + query.table];
  const values = [];

  const where = query.where ?? {};
  const keys = Object.keys(where);
  if (keys.length) {
    const conditions = keys.map((key) => check(key) + ' = ?');
    clauses.push('WHERE ' + conditions.join(' AND '));
    for (const key of keys) values.push(where[key]);
  }

  if (query.orderBy) {
    clauses.push('ORDER BY ' + check(query.orderBy) + (query.desc ? ' DESC' : ' ASC'));
  }

  if (Number.isFinite(query.limit)) {
    clauses.push('LIMIT ?');
    values.push(query.limit);
  }
  if (Number.isFinite(query.offset)) {
    clauses.push('OFFSET ?');
    values.push(query.offset);
  }

  return { sql: clauses.join(' '), values };
}`
},
{
  id: 'node-51', lang: 'node', level: 'Trung bình', topic: 'SQLite', fn: 'prepareStatement',
  title: 'Viết lại db.prepare()',
  io: {
    signature: 'prepareStatement(sql) → { sql, paramCount, bind }',
    params: [
      ['sql', 'string', 'Câu lệnh SQL có chỗ trống đánh dấu bằng dấu hỏi, ví dụ "INSERT INTO users (username, password) VALUES (?, ?)". Dấu hỏi nằm trong chuỗi nháy đơn KHÔNG được tính là chỗ trống.']
    ],
    returns: ['object',
      'sql giữ nguyên · paramCount là số chỗ trống · bind(...values) trả về mảng giá trị, hoặc ném lỗi khi số lượng không khớp.'],
    example: `const stmt = prepareStatement('SELECT * FROM todos WHERE user_id = ? AND completed = ?');
stmt.paramCount;      // → 2
stmt.bind(7, 0);      // → [7, 0]
stmt.bind(7);         // ném Error('cần 2 tham số, nhận được 1')`
  },
  brief: `<p><code>db.prepare(sql)</code> trong <code>node:sqlite</code> không chạy gì cả — nó biên dịch câu lệnh một lần rồi trả về một <em>statement</em> mà bạn gọi <code>.run()</code>, <code>.get()</code> hay <code>.all()</code> với các giá trị. Tách hai bước như vậy đem lại hai lợi ích: chạy lại nhiều lần thì nhanh hơn, và giá trị không bao giờ lẫn vào câu lệnh.</p>
<p>Viết hàm <code>prepareStatement(sql)</code> mô phỏng bước biên dịch.</p>
<ul>
<li><code>paramCount</code> — đếm số dấu <code>?</code> là chỗ trống thật</li>
<li>Dấu <code>?</code> nằm <strong>bên trong chuỗi nháy đơn</strong> là dữ liệu, không phải chỗ trống, nên không được đếm</li>
<li><code>bind(...values)</code> trả về mảng giá trị khi số lượng khớp</li>
<li>Lệch số lượng → ném <code>Error('cần N tham số, nhận được M')</code> với N và M là số thật</li>
<li>Câu lệnh không có dấu hỏi nào thì <code>bind()</code> gọi không tham số phải chạy được và trả về mảng rỗng</li>
</ul>`,
  starter: `function prepareStatement(sql) {
  // Viết code ở đây
}`,
  hints: [
    'Duyệt từng ký tự và giữ một cờ "đang ở trong chuỗi nháy đơn hay không".',
    'Gặp dấu nháy đơn thì lật cờ; chỉ đếm dấu hỏi khi cờ đang tắt.',
    'bind nhận tham số biến đổi: dùng (...values) rồi so values.length với paramCount.'
  ],
  tests: [
    { label: 'đếm hai chỗ trống', script: `return fn('SELECT * FROM todos WHERE user_id = ? AND completed = ?').paramCount;`, expect: 2 },
    { label: 'không có chỗ trống', script: `return fn('SELECT * FROM todos').paramCount;`, expect: 0 },
    { label: 'dấu hỏi trong chuỗi không tính', script: `return fn("SELECT * FROM notes WHERE title = 'sao the?' AND id = ?").paramCount;`, expect: 1 },
    { label: 'giữ nguyên sql', script: `return fn('SELECT 1').sql;`, expect: 'SELECT 1' },
    { label: 'bind đúng số lượng', script: `return fn('INSERT INTO users (username, password) VALUES (?, ?)').bind('kiet', 'hash');`, expect: ['kiet', 'hash'] },
    { label: 'bind không tham số khi không có chỗ trống', script: `return fn('SELECT * FROM todos').bind();`, expect: [] },
    { label: 'thiếu tham số', script: `try { fn('SELECT * FROM t WHERE a = ? AND b = ?').bind(7); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'cần 2 tham số, nhận được 1' },
    { label: 'thừa tham số', script: `try { fn('SELECT * FROM t WHERE a = ?').bind(7, 8, 9); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'cần 1 tham số, nhận được 3' },
    { label: 'giá trị null vẫn được tính là một tham số', script: `return fn('UPDATE t SET a = ? WHERE id = ?').bind(null, 3);`, expect: [null, 3] }
  ],
  solution: `function prepareStatement(sql) {
  const text = String(sql);

  let paramCount = 0;
  let inString = false;
  for (const char of text) {
    if (char === "'") inString = !inString;
    else if (char === '?' && !inString) paramCount++;
  }

  return {
    sql: text,
    paramCount,
    bind(...values) {
      if (values.length !== paramCount) {
        throw new Error('cần ' + paramCount + ' tham số, nhận được ' + values.length);
      }
      return values;
    },
  };
}`
},
{
  id: 'node-52', lang: 'node', level: 'Cơ bản', topic: 'SQLite', fn: 'findOrphanTodos',
  title: 'Tìm bản ghi mồ côi',
  io: {
    signature: 'findOrphanTodos(todos, users) → Array<number>',
    params: [
      ['todos', 'Array<object> · mặc định []', 'Các dòng bảng todos. Mỗi dòng có id (number) và user_id (number, có thể là null khi chưa gán ai).'],
      ['users', 'Array<object> · mặc định []', 'Các dòng bảng users. Mỗi dòng có id (number).']
    ],
    returns: ['Array<number>', 'id của những todo trỏ tới user không tồn tại, sắp tăng dần. Todo có user_id null hoặc undefined không bị tính là mồ côi.'],
    example: `findOrphanTodos([{ id: 1, user_id: 10 }, { id: 2, user_id: 99 }], [{ id: 10 }])
// → [2]`
  },
  brief: `<p>Bảng <code>todos</code> có dòng <code>FOREIGN KEY(user_id) REFERENCES users(id)</code>. Ràng buộc đó nói: mỗi todo phải thuộc về một user có thật. Nhưng SQLite <strong>mặc định không bật kiểm tra khoá ngoại</strong> — bạn phải bật bằng <code>PRAGMA foreign_keys = ON</code>. Quên bật thì database vui vẻ nhận những todo trỏ tới user không tồn tại, và bạn chỉ phát hiện ra khi báo cáo cho ra số liệu vô lý.</p>
<p>Viết hàm <code>findOrphanTodos(todos, users)</code> rà lại dữ liệu và chỉ ra những dòng hỏng.</p>
<ul>
<li>Todo <strong>mồ côi</strong> khi <code>user_id</code> của nó không có trong danh sách users</li>
<li><code>user_id</code> là <code>null</code> hoặc <code>undefined</code> nghĩa là cố ý chưa gán, <strong>không</strong> tính là mồ côi</li>
<li>Trả về mảng id, <strong>sắp tăng dần</strong></li>
<li>Không có dòng nào hỏng → mảng rỗng</li>
</ul>
<p class="callout">Độ phức tạp phải là O(n + m): dựng một Set các id user trước, đừng gọi <code>find</code> bên trong vòng lặp. Với 10 nghìn todo và 5 nghìn user, cách lồng nhau chạy 50 triệu phép so sánh.</p>`,
  starter: `function findOrphanTodos(todos = [], users = []) {
  // Viết code ở đây
}`,
  hints: [
    'new Set(users.map(u => u.id)) cho phép kiểm tra tồn tại trong thời gian hằng số.',
    'Dùng == null để bắt cả null lẫn undefined chỉ bằng một phép so sánh.',
    'sort() mặc định so chuỗi — với số phải truyền hàm so sánh (a, b) => a - b.'
  ],
  tests: [
    { label: 'dữ liệu sạch', args: [[{ id: 1, user_id: 10 }], [{ id: 10 }]], expect: [] },
    { label: 'một dòng mồ côi', args: [[{ id: 1, user_id: 10 }, { id: 2, user_id: 99 }], [{ id: 10 }]], expect: [2] },
    { label: 'nhiều dòng mồ côi, sắp tăng dần', args: [[{ id: 30, user_id: 99 }, { id: 4, user_id: 98 }], [{ id: 10 }]], expect: [4, 30] },
    { label: 'user_id null không tính là mồ côi', args: [[{ id: 1, user_id: null }], [{ id: 10 }]], expect: [] },
    { label: 'thiếu hẳn user_id cũng không tính', args: [[{ id: 1 }], [{ id: 10 }]], expect: [] },
    { label: 'không có user nào', args: [[{ id: 1, user_id: 1 }], []], expect: [1] },
    { label: 'danh sách rỗng', args: [[], []], expect: [] },
    { label: 'không dùng find lồng trong vòng lặp', script: `let finds = 0;
const users = [{ id: 1 }];
const proxy = new Proxy(users, { get(t, p) { if (p === 'find') finds++; return t[p]; } });
fn([{ id: 1, user_id: 1 }, { id: 2, user_id: 1 }], proxy);
return finds;`, expect: 0 }
  ],
  solution: `function findOrphanTodos(todos = [], users = []) {
  const ids = new Set(users.map((user) => user.id));

  return todos
    .filter((todo) => todo.user_id != null && !ids.has(todo.user_id))
    .map((todo) => todo.id)
    .sort((a, b) => a - b);
}`
},
{
  id: 'node-53', lang: 'node', level: 'Cơ bản', topic: 'SQLite', fn: 'toSqliteValue',
  title: 'SQLite không có kiểu boolean',
  io: {
    signature: 'toSqliteValue(value) → number | string | null',
    params: [
      ['value', 'bất kỳ', 'Giá trị JavaScript sắp ghi xuống SQLite: boolean, number, string, null, undefined, Date, hoặc object/mảng.']
    ],
    returns: ['number | string | null', 'Giá trị SQLite nhận được. Object và mảng bị chuyển thành chuỗi JSON.'],
    example: `toSqliteValue(true)              // → 1
toSqliteValue(undefined)         // → null
toSqliteValue({ a: 1 })          // → '{"a":1}'`
  },
  brief: `<p>SQLite chỉ có năm kiểu lưu trữ: <code>NULL</code>, <code>INTEGER</code>, <code>REAL</code>, <code>TEXT</code>, <code>BLOB</code>. Không có boolean, không có ngày tháng, không có JSON. Đó là lý do bảng <code>todos</code> khai báo <code>completed BOOLEAN DEFAULT 0</code> — chữ <code>BOOLEAN</code> chỉ là ghi chú cho người đọc, còn giá trị thật lưu xuống là số 0 hoặc 1.</p>
<p>Viết hàm <code>toSqliteValue(value)</code> chuyển đổi trước khi ghi:</p>
<table><thead><tr><th>Vào</th><th>Ra</th><th>Vì sao</th></tr></thead><tbody>
<tr><td><code>true</code> / <code>false</code></td><td><code>1</code> / <code>0</code></td><td>Không có kiểu boolean</td></tr>
<tr><td><code>undefined</code></td><td><code>null</code></td><td>SQLite không hiểu undefined</td></tr>
<tr><td><code>null</code></td><td><code>null</code></td><td>Giữ nguyên</td></tr>
<tr><td><code>Date</code></td><td>Chuỗi ISO</td><td>Sắp xếp được theo thứ tự chữ cái, và không mất múi giờ</td></tr>
<tr><td>Object hoặc mảng</td><td>Chuỗi JSON</td><td>Không có kiểu JSON</td></tr>
<tr><td>Số, chuỗi</td><td>Giữ nguyên</td><td>Đã đúng kiểu</td></tr>
</tbody></table>
<p class="warn"><code>NaN</code> và <code>Infinity</code> cũng là number nhưng SQLite không lưu được — chuyển cả hai thành <code>null</code>.</p>`,
  starter: `function toSqliteValue(value) {
  // Viết code ở đây
}`,
  hints: [
    'Xét undefined và null trước, vì typeof null là "object" và sẽ rơi nhầm vào nhánh JSON.',
    'value instanceof Date nhận ra đối tượng ngày; toISOString() cho chuỗi chuẩn.',
    'Number.isFinite loại được cả NaN lẫn Infinity chỉ bằng một phép kiểm tra.'
  ],
  tests: [
    { label: 'true thành 1', args: [true], expect: 1 },
    { label: 'false thành 0', args: [false], expect: 0 },
    { label: 'undefined thành null', args: [undefined], expect: null },
    { label: 'null giữ nguyên', args: [null], expect: null },
    { label: 'số giữ nguyên', args: [42], expect: 42 },
    { label: 'chuỗi giữ nguyên', args: ['xin chao'], expect: 'xin chao' },
    { label: 'NaN thành null', args: [NaN], expect: null },
    { label: 'Infinity thành null', args: [Infinity], expect: null },
    { label: 'Date thành chuỗi ISO', script: `return fn(new Date('2026-09-20T10:00:00.000Z'));`, expect: '2026-09-20T10:00:00.000Z' },
    { label: 'object thành JSON', args: [{ a: 1 }], expect: '{"a":1}' },
    { label: 'mảng thành JSON', args: [[1, 2]], expect: '[1,2]' }
  ],
  solution: `function toSqliteValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}`
},
{
  id: 'node-54', lang: 'node', level: 'Trung bình', topic: 'SQLite', fn: 'escapeLike',
  title: 'Thoát ký tự trong LIKE',
  io: {
    signature: 'escapeLike(text) → string',
    params: [
      ['text', 'string', 'Từ khoá người dùng gõ vào ô tìm kiếm. Có thể chứa %, _ hoặc dấu gạch chéo ngược — những ký tự mang ý nghĩa đặc biệt trong LIKE.']
    ],
    returns: ['string', 'Chuỗi đã thoát, dùng an toàn trong LIKE với ESCAPE \'\\\\\'.'],
    example: `escapeLike('giam 50%')    // → 'giam 50\\\\%'
escapeLike('file_name')    // → 'file\\\\_name'`
  },
  brief: `<p>Tham số hoá chặn được SQL injection, nhưng nó <strong>không</strong> chặn được một vấn đề khác: trong mệnh đề <code>LIKE</code>, hai ký tự <code>%</code> và <code>_</code> có nghĩa đặc biệt.</p>
<ul>
<li><code>%</code> khớp với chuỗi bất kỳ, dài bao nhiêu cũng được</li>
<li><code>_</code> khớp với đúng một ký tự bất kỳ</li>
</ul>
<p>Người dùng tìm <code>"giam 50%"</code> sẽ nhận về mọi dòng bắt đầu bằng "giam 50" — không phải lỗi bảo mật, nhưng là kết quả sai. Còn người dùng gõ mỗi dấu <code>%</code> thì lấy về toàn bộ bảng.</p>
<p>Viết hàm <code>escapeLike(text)</code> thêm dấu gạch chéo ngược trước các ký tự đặc biệt:</p>
<ul>
<li><code>\\</code> → <code>\\\\</code> (phải xử lý <strong>trước</strong>, nếu không bạn sẽ thoát nhầm dấu mình vừa thêm vào)</li>
<li><code>%</code> → <code>\\%</code></li>
<li><code>_</code> → <code>\\_</code></li>
<li>Mọi ký tự khác giữ nguyên</li>
</ul>
<p>Câu truy vấn hoàn chỉnh sẽ là: <code>WHERE task LIKE ? ESCAPE '\\'</code> với giá trị là <code>'%' + escapeLike(tuKhoa) + '%'</code>.</p>`,
  starter: `function escapeLike(text) {
  // Viết code ở đây
}`,
  hints: [
    'Thứ tự thay thế quan trọng: gạch chéo ngược trước, rồi mới tới % và _.',
    'Một biểu thức chính quy với lớp ký tự và cờ g làm được cả ba trong một lần.',
    'Trong chuỗi JavaScript, một dấu gạch chéo ngược phải viết thành hai.'
  ],
  tests: [
    { label: 'chuỗi thường giữ nguyên', args: ['hoc backend'], expect: 'hoc backend' },
    { label: 'thoát phần trăm', args: ['giam 50%'], expect: 'giam 50\\%' },
    { label: 'thoát gạch dưới', args: ['file_name'], expect: 'file\\_name' },
    { label: 'thoát gạch chéo ngược', args: ['a\\b'], expect: 'a\\\\b' },
    { label: 'nhiều ký tự đặc biệt', args: ['%_%'], expect: '\\%\\_\\%' },
    { label: 'gạch chéo ngược đứng trước phần trăm', args: ['\\%'], expect: '\\\\\\%' },
    { label: 'chuỗi rỗng', args: [''], expect: '' }
  ],
  solution: `function escapeLike(text) {
  return String(text).replace(/[\\\\%_]/g, (char) => '\\\\' + char);
}`
},
{
  id: 'node-55', lang: 'node', level: 'Cơ bản', topic: 'Middleware', fn: 'formatLogLine',
  title: 'Một dòng log cho mỗi request',
  io: {
    signature: 'formatLogLine(entry) → string',
    params: [
      ['entry', 'object', 'Thông tin một request đã xử lý xong: method (string), path (string), status (number), ms (number, thời gian xử lý), userId (number hoặc null, tuỳ chọn).']
    ],
    returns: ['string', 'Một dòng log theo đúng định dạng mô tả trong đề bài.'],
    example: `formatLogLine({ method: 'post', path: '/todos', status: 201, ms: 12.7, userId: 7 })
// → 'POST /todos 201 13ms user=7'`
  },
  brief: `<p>Middleware ghi log là middleware đầu tiên nên có trong mọi dự án. Khi có sự cố, một dòng log tốt cho biết ngay: ai gọi, gọi gì, kết quả ra sao, mất bao lâu.</p>
<p>Viết hàm <code>formatLogLine(entry)</code> sinh dòng log theo định dạng:</p>
<pre>&lt;METHOD&gt; &lt;path&gt; &lt;status&gt; &lt;ms&gt;ms[ user=&lt;userId&gt;][ SLOW]</pre>
<ul>
<li><code>method</code> viết HOA</li>
<li><code>ms</code> làm tròn tới số nguyên gần nhất</li>
<li>Có <code>userId</code> (khác <code>null</code> và <code>undefined</code>) thì thêm <code> user=&lt;id&gt;</code></li>
<li><code>ms</code> từ 1000 trở lên thì thêm <code> SLOW</code> vào cuối — để sau này lọc log chậm bằng một lệnh grep</li>
<li>Các phần ngăn nhau bằng đúng một dấu cách, không có dấu cách thừa ở hai đầu</li>
</ul>`,
  starter: `function formatLogLine(entry = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Dựng một mảng các mảnh rồi join(" ") — không bao giờ sinh ra dấu cách thừa.',
    'Math.round làm tròn tới số nguyên gần nhất; 12.5 thành 13.',
    'userId != null bắt cả null lẫn undefined nhưng vẫn giữ lại số 0.'
  ],
  tests: [
    { label: 'request thường', args: [{ method: 'GET', path: '/todos', status: 200, ms: 4 }], expect: 'GET /todos 200 4ms' },
    { label: 'method viết thường', args: [{ method: 'post', path: '/todos', status: 201, ms: 12 }], expect: 'POST /todos 201 12ms' },
    { label: 'làm tròn thời gian', args: [{ method: 'GET', path: '/', status: 200, ms: 12.7 }], expect: 'GET / 200 13ms' },
    { label: 'có userId', args: [{ method: 'GET', path: '/todos', status: 200, ms: 4, userId: 7 }], expect: 'GET /todos 200 4ms user=7' },
    { label: 'userId null thì bỏ qua', args: [{ method: 'GET', path: '/todos', status: 401, ms: 1, userId: null }], expect: 'GET /todos 401 1ms' },
    { label: 'userId bằng 0 vẫn ghi', args: [{ method: 'GET', path: '/', status: 200, ms: 1, userId: 0 }], expect: 'GET / 200 1ms user=0' },
    { label: 'đánh dấu request chậm', args: [{ method: 'GET', path: '/report', status: 200, ms: 2400 }], expect: 'GET /report 200 2400ms SLOW' },
    { label: 'đúng mốc 1000ms đã là chậm', args: [{ method: 'GET', path: '/x', status: 200, ms: 1000, userId: 3 }], expect: 'GET /x 200 1000ms user=3 SLOW' }
  ],
  solution: `function formatLogLine(entry = {}) {
  const ms = Math.round(entry.ms);
  const parts = [
    String(entry.method).toUpperCase(),
    entry.path,
    entry.status,
    ms + 'ms',
  ];

  if (entry.userId != null) parts.push('user=' + entry.userId);
  if (ms >= 1000) parts.push('SLOW');

  return parts.join(' ');
}`
},
{
  id: 'node-56', lang: 'node', level: 'Trung bình', topic: 'Middleware', fn: 'corsHeaders',
  title: 'Middleware CORS',
  io: {
    signature: 'corsHeaders(origin, options) → object',
    params: [
      ['origin', 'string | undefined', 'Giá trị header Origin của request, ví dụ "http://localhost:5173". Request cùng origin không gửi header này, khi đó giá trị là undefined.'],
      ['options', 'object · mặc định {}', 'allowed (mảng origin được phép, mặc định []), credentials (boolean, cho phép gửi cookie, mặc định false), methods (mảng method, mặc định ["GET","POST","PUT","DELETE","OPTIONS"]).']
    ],
    returns: ['object',
      'Các header cần đặt lên response. Origin không được phép, hoặc request không có Origin → trả object rỗng.'],
    example: `corsHeaders('http://localhost:5173', { allowed: ['http://localhost:5173'], credentials: true })
// → { 'Access-Control-Allow-Origin': 'http://localhost:5173',
//      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
//      'Access-Control-Allow-Credentials': 'true' }`
  },
  brief: `<p>Frontend chạy ở <code>localhost:5173</code>, backend ở <code>localhost:5003</code>. Trình duyệt coi đây là hai <strong>origin</strong> khác nhau và chặn request — đó là lỗi CORS, và nó là lỗi đầu tiên mà mọi người học full stack đều gặp.</p>
<p>Điều quan trọng cần hiểu: CORS là <strong>quy tắc của trình duyệt</strong>, và chỉ server mới gỡ được. Nó không phải lỗi trong code frontend của bạn, và cũng không bảo vệ server — curl hay Postman bỏ qua CORS hoàn toàn.</p>
<p>Viết hàm <code>corsHeaders(origin, options)</code> quyết định những header cần trả về.</p>
<ul>
<li><code>origin</code> nằm trong <code>options.allowed</code> → trả <code>Access-Control-Allow-Origin</code> bằng <strong>chính origin đó</strong>, cùng <code>Access-Control-Allow-Methods</code> là danh sách method nối bằng dấu phẩy và dấu cách</li>
<li><code>options.credentials</code> là true → thêm <code>Access-Control-Allow-Credentials: 'true'</code></li>
<li><code>origin</code> không được phép, hoặc <code>undefined</code> (request cùng origin) → trả object rỗng</li>
<li><code>allowed</code> chứa <code>'*'</code> → cho phép mọi origin. Nhưng khi <code>credentials</code> là true thì <code>'*'</code> <strong>bị bỏ qua</strong> và kết quả là object rỗng</li>
</ul>
<p class="warn">Quy tắc cuối không phải tôi đặt ra — đó là quy định của chuẩn CORS. Cho phép mọi trang trên internet gửi kèm cookie của người dùng tới API của bạn thì bất kỳ trang nào cũng thao tác được thay họ. Trình duyệt từ chối tổ hợp đó.</p>`,
  starter: `function corsHeaders(origin, options = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Xử lý trường hợp không có origin trước — trả object rỗng ngay.',
    'Kiểm tra tổ hợp "*" với credentials trước khi làm bất cứ việc gì khác.',
    'Danh sách method mặc định nên đặt thành hằng số ở đầu hàm.'
  ],
  tests: [
    { label: 'origin được phép', args: ['http://localhost:5173', { allowed: ['http://localhost:5173'] }], expect: { 'Access-Control-Allow-Origin': 'http://localhost:5173', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' } },
    { label: 'kèm credentials', args: ['http://localhost:5173', { allowed: ['http://localhost:5173'], credentials: true }], expect: { 'Access-Control-Allow-Origin': 'http://localhost:5173', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Credentials': 'true' } },
    { label: 'origin không được phép', args: ['http://ke-xau.com', { allowed: ['http://localhost:5173'] }], expect: {} },
    { label: 'không có origin', args: [undefined, { allowed: ['http://localhost:5173'] }], expect: {} },
    { label: 'danh sách cho phép rỗng', args: ['http://localhost:5173', {}], expect: {} },
    { label: 'sao cho phép mọi origin', args: ['http://bat-ky.com', { allowed: ['*'] }], expect: { 'Access-Control-Allow-Origin': 'http://bat-ky.com', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' } },
    { label: 'sao đi với credentials thì bị từ chối', args: ['http://bat-ky.com', { allowed: ['*'], credentials: true }], expect: {} },
    { label: 'danh sách method tuỳ chỉnh', args: ['http://a.com', { allowed: ['http://a.com'], methods: ['GET', 'POST'] }], expect: { 'Access-Control-Allow-Origin': 'http://a.com', 'Access-Control-Allow-Methods': 'GET, POST' } }
  ],
  solution: `function corsHeaders(origin, options = {}) {
  const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  const allowed = options.allowed ?? [];
  const credentials = Boolean(options.credentials);

  if (!origin) return {};

  const wildcard = allowed.includes('*');
  if (wildcard && credentials) return {}; // chuẩn CORS cấm tổ hợp này
  if (!wildcard && !allowed.includes(origin)) return {};

  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': (options.methods ?? DEFAULT_METHODS).join(', '),
  };
  if (credentials) headers['Access-Control-Allow-Credentials'] = 'true';

  return headers;
}`
}
];
