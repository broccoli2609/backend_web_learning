/* Bài tập Node.js — chấm bằng cách chạy test thật */

export default [
{
  id: 'node-01', lang: 'node', level: 'Cơ bản', topic: 'HTTP', fn: 'statusFor',
  title: 'Chọn đúng status code',
  brief: `<p>Viết hàm <code>statusFor(action, ctx)</code> trả về status code phù hợp cho từng tình huống.</p>
<ul>
<li><code>'created'</code> → 201</li>
<li><code>'deleted'</code> → 204</li>
<li><code>'ok'</code> → 200</li>
<li><code>'notFound'</code> → 404</li>
<li><code>'invalid'</code> → 422</li>
<li><code>'auth'</code> → 401 nếu <code>ctx.hasToken</code> là false, ngược lại 403</li>
<li>Mọi giá trị khác → 500</li>
</ul>`,
  starter: `function statusFor(action, ctx = {}) {
  // Viết code ở đây
}`,
  hints: ['Dùng switch hoặc một object map từ action sang mã.', 'Trường hợp "auth" cần nhìn vào ctx.hasToken để phân biệt 401 và 403.'],
  tests: [
    { label: 'tạo mới trả 201', args: ['created'], expect: 201 },
    { label: 'xoá trả 204', args: ['deleted'], expect: 204 },
    { label: 'thành công trả 200', args: ['ok'], expect: 200 },
    { label: 'không tìm thấy trả 404', args: ['notFound'], expect: 404 },
    { label: 'dữ liệu sai trả 422', args: ['invalid'], expect: 422 },
    { label: 'chưa có token trả 401', args: ['auth', { hasToken: false }], expect: 401 },
    { label: 'có token nhưng thiếu quyền trả 403', args: ['auth', { hasToken: true }], expect: 403 },
    { label: 'trường hợp lạ trả 500', args: ['xyz'], expect: 500 }
  ],
  solution: `function statusFor(action, ctx = {}) {
  const map = { created: 201, deleted: 204, ok: 200, notFound: 404, invalid: 422 };
  if (action === 'auth') return ctx.hasToken ? 403 : 401;
  return map[action] ?? 500;
}`
},
{
  id: 'node-02', lang: 'node', level: 'Cơ bản', topic: 'HTTP', fn: 'parseQuery',
  title: 'Đọc query string',
  brief: `<p>Viết hàm <code>parseQuery(qs)</code> nhận chuỗi query (không có dấu <code>?</code> đầu) và trả về object.</p>
<ul>
<li>Chuỗi rỗng hoặc <code>undefined</code> → <code>{}</code></li>
<li>Khoá lặp lại → giá trị là mảng theo thứ tự xuất hiện</li>
<li>Khoá không có giá trị (<code>flag</code>) → chuỗi rỗng</li>
<li>Giá trị phải được giải mã URL: <code>%20</code> thành dấu cách</li>
</ul>`,
  starter: `function parseQuery(qs) {
  // Viết code ở đây
}`,
  hints: ['Tách bằng split("&") rồi split("=") cho từng cặp.', 'decodeURIComponent xử lý %20 và dấu +.', 'Khi gặp khoá đã có, chuyển giá trị cũ thành mảng.'],
  tests: [
    { label: 'chuỗi rỗng', args: [''], expect: {} },
    { label: 'undefined', args: [undefined], expect: {} },
    { label: 'một cặp', args: ['page=2'], expect: { page: '2' } },
    { label: 'nhiều cặp', args: ['page=2&size=20'], expect: { page: '2', size: '20' } },
    { label: 'khoá lặp thành mảng', args: ['tag=a&tag=b&tag=c'], expect: { tag: ['a', 'b', 'c'] } },
    { label: 'khoá không giá trị', args: ['active'], expect: { active: '' } },
    { label: 'giải mã URL', args: ['q=hello%20world'], expect: { q: 'hello world' } }
  ],
  solution: `function parseQuery(qs) {
  const out = {};
  if (!qs) return out;
  for (const part of qs.split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const key = decodeURIComponent(i === -1 ? part : part.slice(0, i));
    const val = i === -1 ? '' : decodeURIComponent(part.slice(i + 1).replace(/\\+/g, ' '));
    if (key in out) out[key] = [].concat(out[key], val);
    else out[key] = val;
  }
  return out;
}`
},
{
  id: 'node-03', lang: 'node', level: 'Cơ bản', topic: 'Phân trang', fn: 'buildPagination',
  title: 'Tính tham số phân trang',
  brief: `<p>Viết hàm <code>buildPagination(query, total)</code> trả về <code>{ page, size, skip, take, totalPages, hasNext, hasPrev }</code>.</p>
<ul>
<li><code>page</code> mặc định 1, nhỏ nhất 1</li>
<li><code>size</code> mặc định 20, nhỏ nhất 1, lớn nhất 100</li>
<li>Giá trị là chuỗi hoặc không phải số → dùng mặc định</li>
<li><code>skip = (page - 1) * size</code>, <code>take = size</code></li>
<li><code>totalPages = Math.ceil(total / size)</code>, tối thiểu 1</li>
</ul>`,
  starter: `function buildPagination(query = {}, total = 0) {
  // Viết code ở đây
}`,
  hints: ['Number("abc") cho NaN — kiểm tra bằng Number.isFinite.', 'Math.min và Math.max giúp kẹp giá trị vào khoảng cho phép.'],
  tests: [
    { label: 'mặc định', args: [{}, 0], expect: { page: 1, size: 20, skip: 0, take: 20, totalPages: 1, hasNext: false, hasPrev: false } },
    { label: 'trang 3', args: [{ page: '3', size: '10' }, 100], expect: { page: 3, size: 10, skip: 20, take: 10, totalPages: 10, hasNext: true, hasPrev: true } },
    { label: 'size vượt trần bị kẹp về 100', args: [{ size: '5000' }, 100], expect: { page: 1, size: 100, skip: 0, take: 100, totalPages: 1, hasNext: false, hasPrev: false } },
    { label: 'page âm về 1', args: [{ page: '-4' }, 40], expect: { page: 1, size: 20, skip: 0, take: 20, totalPages: 2, hasNext: true, hasPrev: false } },
    { label: 'giá trị rác dùng mặc định', args: [{ page: 'abc', size: 'xyz' }, 25], expect: { page: 1, size: 20, skip: 0, take: 20, totalPages: 2, hasNext: true, hasPrev: false } }
  ],
  solution: `function buildPagination(query = {}, total = 0) {
  const num = (v, def) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : def);
  const page = Math.max(1, Math.trunc(num(query.page, 1)));
  const size = Math.min(100, Math.max(1, Math.trunc(num(query.size, 20))));
  const totalPages = Math.max(1, Math.ceil(total / size));
  return { page, size, skip: (page - 1) * size, take: size, totalPages,
    hasNext: page < totalPages, hasPrev: page > 1 };
}`
},
{
  id: 'node-04', lang: 'node', level: 'Trung bình', topic: 'Routing', fn: 'matchRoute',
  title: 'So khớp route có tham số',
  brief: `<p>Viết hàm <code>matchRoute(pattern, path)</code> so khớp đường dẫn với mẫu có tham số kiểu Express.</p>
<ul>
<li>Khớp → trả về object các tham số, ví dụ <code>{ id: '42' }</code></li>
<li>Không khớp → trả về <code>null</code></li>
<li>Mẫu không có tham số vẫn phải so khớp chính xác</li>
<li>Số đoạn khác nhau → không khớp</li>
</ul>
<p>Ví dụ: <code>matchRoute('/users/:id/orders/:orderId', '/users/7/orders/42')</code> → <code>{ id: '7', orderId: '42' }</code></p>`,
  starter: `function matchRoute(pattern, path) {
  // Viết code ở đây
}`,
  hints: ['Tách cả hai chuỗi bằng split("/") và so từng đoạn.', 'Đoạn bắt đầu bằng ":" là tham số, lấy tên bằng slice(1).', 'Trả null ngay khi có một đoạn không khớp.'],
  tests: [
    { label: 'route tĩnh khớp', args: ['/health', '/health'], expect: {} },
    { label: 'route tĩnh không khớp', args: ['/health', '/healthz'], expect: null },
    { label: 'một tham số', args: ['/users/:id', '/users/42'], expect: { id: '42' } },
    { label: 'hai tham số', args: ['/users/:id/orders/:orderId', '/users/7/orders/42'], expect: { id: '7', orderId: '42' } },
    { label: 'khác số đoạn', args: ['/users/:id', '/users/42/orders'], expect: null },
    { label: 'đoạn tĩnh giữa chừng sai', args: ['/users/:id/orders', '/users/7/items'], expect: null }
  ],
  solution: `function matchRoute(pattern, path) {
  const p = pattern.split('/'), q = path.split('/');
  if (p.length !== q.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = q[i];
    else if (p[i] !== q[i]) return null;
  }
  return params;
}`
},
{
  id: 'node-05', lang: 'node', level: 'Cơ bản', topic: 'Kiến trúc', fn: 'toUserDto',
  title: 'Chuyển entity thành DTO',
  brief: `<p>Viết hàm <code>toUserDto(user)</code> nhận entity và trả về DTO an toàn để gửi ra API.</p>
<ul>
<li>Giữ lại: <code>id</code>, <code>email</code>, <code>name</code>, <code>role</code></li>
<li>Thêm <code>displayName</code>: <code>name</code> nếu có, ngược lại phần trước dấu <code>@</code> của email</li>
<li>Loại bỏ mọi trường khác (<code>passwordHash</code>, <code>deletedAt</code>, <code>internalNote</code>…)</li>
<li><code>user</code> là <code>null</code> hoặc <code>undefined</code> → trả <code>null</code></li>
</ul>`,
  starter: `function toUserDto(user) {
  // Viết code ở đây
}`,
  hints: ['Liệt kê trường cần giữ (allowlist) thay vì xoá trường cần bỏ — an toàn hơn khi entity thêm cột mới.', 'email.split("@")[0] lấy phần trước dấu @.'],
  tests: [
    { label: 'null trả null', args: [null], expect: null },
    { label: 'bỏ passwordHash', args: [{ id: 1, email: 'a@b.com', name: 'An', role: 'user', passwordHash: 'x', deletedAt: null }], expect: { id: 1, email: 'a@b.com', name: 'An', role: 'user', displayName: 'An' } },
    { label: 'không có name thì lấy từ email', args: [{ id: 2, email: 'kiet@mail.com', name: '', role: 'admin', internalNote: 'vip' }], expect: { id: 2, email: 'kiet@mail.com', name: '', role: 'admin', displayName: 'kiet' } }
  ],
  solution: `function toUserDto(user) {
  if (!user) return null;
  const { id, email, name, role } = user;
  return { id, email, name, role, displayName: name || String(email).split('@')[0] };
}`
},
{
  id: 'node-06', lang: 'node', level: 'Trung bình', topic: 'Validation', fn: 'validateOrder',
  title: 'Validate đầu vào',
  brief: `<p>Viết hàm <code>validateOrder(body)</code> trả về mảng lỗi, mỗi lỗi dạng <code>{ field, error }</code>. Hợp lệ → mảng rỗng.</p>
<ul>
<li><code>productId</code>: bắt buộc, số nguyên dương → lỗi <code>'phải là số nguyên dương'</code></li>
<li><code>quantity</code>: bắt buộc, số nguyên từ 1 đến 100 → lỗi <code>'phải từ 1 đến 100'</code></li>
<li><code>note</code>: tuỳ chọn, nếu có phải là chuỗi tối đa 200 ký tự → lỗi <code>'tối đa 200 ký tự'</code></li>
</ul>
<p>Thứ tự lỗi theo thứ tự trên. Trả về mọi lỗi cùng lúc, không dừng ở lỗi đầu tiên.</p>`,
  starter: `function validateOrder(body = {}) {
  // Viết code ở đây
}`,
  hints: ['Number.isInteger kiểm tra số nguyên; nhớ rằng "5" là chuỗi chứ không phải số.', 'Đẩy lỗi vào mảng rồi trả về cuối hàm thay vì return sớm.'],
  tests: [
    { label: 'hợp lệ', args: [{ productId: 1, quantity: 2 }], expect: [] },
    { label: 'hợp lệ có note', args: [{ productId: 1, quantity: 2, note: 'giao giờ hành chính' }], expect: [] },
    { label: 'thiếu productId', args: [{ quantity: 2 }], expect: [{ field: 'productId', error: 'phải là số nguyên dương' }] },
    { label: 'productId là chuỗi', args: [{ productId: '3', quantity: 2 }], expect: [{ field: 'productId', error: 'phải là số nguyên dương' }] },
    { label: 'quantity vượt trần', args: [{ productId: 1, quantity: 500 }], expect: [{ field: 'quantity', error: 'phải từ 1 đến 100' }] },
    { label: 'nhiều lỗi cùng lúc', args: [{ productId: 0, quantity: 0 }], expect: [{ field: 'productId', error: 'phải là số nguyên dương' }, { field: 'quantity', error: 'phải từ 1 đến 100' }] },
    { label: 'note quá dài', args: [{ productId: 1, quantity: 1, note: 'x'.repeat(201) }], expect: [{ field: 'note', error: 'tối đa 200 ký tự' }] }
  ],
  solution: `function validateOrder(body = {}) {
  const errors = [];
  if (!Number.isInteger(body.productId) || body.productId <= 0)
    errors.push({ field: 'productId', error: 'phải là số nguyên dương' });
  if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 100)
    errors.push({ field: 'quantity', error: 'phải từ 1 đến 100' });
  if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 200))
    errors.push({ field: 'note', error: 'tối đa 200 ký tự' });
  return errors;
}`
},
{
  id: 'node-07', lang: 'node', level: 'Nâng cao', topic: 'Middleware', fn: 'runMiddlewares', async: true,
  title: 'Tự cài đặt middleware pipeline',
  brief: `<p>Viết hàm <code>runMiddlewares(middlewares, ctx)</code> chạy dãy middleware theo đúng cách Express làm.</p>
<ul>
<li>Mỗi middleware có dạng <code>(ctx, next) =&gt; ...</code>, có thể là async</li>
<li>Middleware gọi <code>next()</code> thì chuyển tiếp; không gọi thì dừng pipeline</li>
<li>Middleware ném lỗi → hàm reject với chính lỗi đó</li>
<li>Kết thúc → trả về <code>ctx</code></li>
<li>Gọi <code>next()</code> hai lần trong cùng một middleware → ném <code>Error('next() called twice')</code></li>
</ul>`,
  starter: `async function runMiddlewares(middlewares, ctx = {}) {
  // Viết code ở đây
}`,
  hints: ['Dùng hàm đệ quy dispatch(i) trả về Promise.', 'Giữ một biến đánh dấu chỉ số đã gọi để phát hiện next() gọi hai lần.'],
  tests: [
    { label: 'chạy theo thứ tự', async: true, script: `const log = [];
const mws = [
  async (c, next) => { log.push('a'); await next(); log.push('a-sau'); },
  async (c, next) => { log.push('b'); await next(); },
];
await fn(mws, {});
return log;`, expect: ['a', 'b', 'a-sau'] },
    { label: 'dừng khi không gọi next', async: true, script: `const log = [];
const mws = [
  async (c, next) => { log.push('a'); },
  async (c, next) => { log.push('b'); await next(); },
];
await fn(mws, {});
return log;`, expect: ['a'] },
    { label: 'trả về ctx đã thay đổi', async: true, script: `const mws = [async (c, next) => { c.user = 'kiet'; await next(); }];
const out = await fn(mws, {});
return out.user;`, expect: 'kiet' },
    { label: 'lỗi được ném ra ngoài', async: true, script: `const mws = [async () => { throw new Error('boom'); }];
try { await fn(mws, {}); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'boom' },
    { label: 'next gọi hai lần bị chặn', async: true, script: `const mws = [async (c, next) => { await next(); await next(); }];
try { await fn(mws, {}); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'next() called twice' }
  ],
  solution: `async function runMiddlewares(middlewares, ctx = {}) {
  let lastIndex = -1;
  async function dispatch(i) {
    if (i <= lastIndex) throw new Error('next() called twice');
    lastIndex = i;
    const mw = middlewares[i];
    if (!mw) return;
    await mw(ctx, () => dispatch(i + 1));
  }
  await dispatch(0);
  return ctx;
}`
},
{
  id: 'node-08', lang: 'node', level: 'Cơ bản', topic: 'HTTP', fn: 'classifyMethod',
  title: 'Phân loại HTTP method',
  brief: `<p>Viết hàm <code>classifyMethod(method)</code> trả về <code>{ method, safe, idempotent, hasBody }</code>.</p>
<ul>
<li><code>method</code> luôn viết HOA trong kết quả, nhận vào có thể viết thường</li>
<li><strong>safe</strong> (không thay đổi dữ liệu): GET, HEAD, OPTIONS</li>
<li><strong>idempotent</strong>: GET, HEAD, OPTIONS, PUT, DELETE</li>
<li><strong>hasBody</strong> (thường có body): POST, PUT, PATCH</li>
<li>Method không nhận ra → mọi cờ đều <code>false</code></li>
</ul>`,
  starter: `function classifyMethod(method) {
  // Viết code ở đây
}`,
  hints: ['toUpperCase() trước khi so sánh.', 'Dùng mảng includes() cho từng nhóm.'],
  tests: [
    { label: 'GET', args: ['GET'], expect: { method: 'GET', safe: true, idempotent: true, hasBody: false } },
    { label: 'post viết thường', args: ['post'], expect: { method: 'POST', safe: false, idempotent: false, hasBody: true } },
    { label: 'PUT', args: ['PUT'], expect: { method: 'PUT', safe: false, idempotent: true, hasBody: true } },
    { label: 'PATCH', args: ['PATCH'], expect: { method: 'PATCH', safe: false, idempotent: false, hasBody: true } },
    { label: 'DELETE', args: ['DELETE'], expect: { method: 'DELETE', safe: false, idempotent: true, hasBody: false } },
    { label: 'method lạ', args: ['BREW'], expect: { method: 'BREW', safe: false, idempotent: false, hasBody: false } }
  ],
  solution: `function classifyMethod(method) {
  const m = String(method).toUpperCase();
  const known = ['GET','HEAD','OPTIONS','POST','PUT','PATCH','DELETE'];
  if (!known.includes(m)) return { method: m, safe: false, idempotent: false, hasBody: false };
  return {
    method: m,
    safe: ['GET','HEAD','OPTIONS'].includes(m),
    idempotent: ['GET','HEAD','OPTIONS','PUT','DELETE'].includes(m),
    hasBody: ['POST','PUT','PATCH'].includes(m),
  };
}`
},
{
  id: 'node-09', lang: 'node', level: 'Trung bình', topic: 'Database', fn: 'attachCustomers',
  title: 'Gộp dữ liệu để tránh N+1',
  brief: `<p>Bạn có danh sách đơn hàng và danh sách khách hàng lấy trong <em>một</em> truy vấn. Viết hàm <code>attachCustomers(orders, customers)</code> gắn khách hàng vào từng đơn mà không lặp tìm kiếm.</p>
<ul>
<li>Mỗi đơn có <code>customerId</code>; kết quả thêm trường <code>customer</code></li>
<li>Không tìm thấy khách hàng → <code>customer: null</code></li>
<li>Giữ nguyên thứ tự đơn hàng và các trường sẵn có</li>
<li>Độ phức tạp phải là O(n + m), không được lồng <code>find</code> trong vòng lặp</li>
</ul>`,
  starter: `function attachCustomers(orders = [], customers = []) {
  // Viết code ở đây
}`,
  hints: ['Dựng một Map từ id sang customer trước, rồi map qua orders.', 'new Map(customers.map(c => [c.id, c])) là cách ngắn gọn.'],
  tests: [
    { label: 'gắn đúng khách hàng', args: [[{ id: 1, customerId: 10, total: 500 }], [{ id: 10, name: 'An' }]], expect: [{ id: 1, customerId: 10, total: 500, customer: { id: 10, name: 'An' } }] },
    { label: 'nhiều đơn cùng khách', args: [[{ id: 1, customerId: 10 }, { id: 2, customerId: 10 }], [{ id: 10, name: 'An' }]], expect: [{ id: 1, customerId: 10, customer: { id: 10, name: 'An' } }, { id: 2, customerId: 10, customer: { id: 10, name: 'An' } }] },
    { label: 'khách không tồn tại', args: [[{ id: 1, customerId: 99 }], [{ id: 10, name: 'An' }]], expect: [{ id: 1, customerId: 99, customer: null }] },
    { label: 'danh sách rỗng', args: [[], []], expect: [] },
    { label: 'không dùng find lồng nhau', script: `let finds = 0;
const customers = [{ id: 1, name: 'A' }];
const proxy = new Proxy(customers, { get(t, p) { if (p === 'find') finds++; return t[p]; } });
fn([{ id: 1, customerId: 1 }, { id: 2, customerId: 1 }], proxy);
return finds;`, expect: 0 }
  ],
  solution: `function attachCustomers(orders = [], customers = []) {
  const byId = new Map(customers.map((c) => [c.id, c]));
  return orders.map((o) => ({ ...o, customer: byId.get(o.customerId) ?? null }));
}`
},
{
  id: 'node-10', lang: 'node', level: 'Trung bình', topic: 'Database', fn: 'buildQuery',
  title: 'Dựng điều kiện truy vấn an toàn',
  brief: `<p>Viết hàm <code>buildQuery(query, allowed)</code> chuyển query string thành đối tượng truy vấn, chỉ chấp nhận các trường trong danh sách cho phép.</p>
<p>Trả về <code>{ where, orderBy }</code>:</p>
<ul>
<li><code>where</code> chứa các cặp khoá–giá trị có khoá nằm trong <code>allowed</code>; khoá lạ bị bỏ qua hoàn toàn</li>
<li><code>sort</code> dạng <code>'price'</code> → <code>orderBy = { price: 'asc' }</code>; dạng <code>'-price'</code> → <code>{ price: 'desc' }</code></li>
<li><code>sort</code> trỏ tới trường không được phép, hoặc không có <code>sort</code> → <code>orderBy = { id: 'asc' }</code></li>
<li>Các khoá điều khiển <code>page</code>, <code>size</code>, <code>sort</code> không bao giờ vào <code>where</code></li>
</ul>`,
  starter: `function buildQuery(query = {}, allowed = []) {
  // Viết code ở đây
}`,
  hints: ['Danh sách cho phép (allowlist) là cách duy nhất an toàn — không bao giờ đổ thẳng req.query vào ORM.', 'Kiểm tra ký tự đầu của sort để biết chiều sắp xếp.'],
  tests: [
    { label: 'lọc theo trường được phép', args: [{ category: 'book' }, ['category', 'price']], expect: { where: { category: 'book' }, orderBy: { id: 'asc' } } },
    { label: 'bỏ qua trường lạ', args: [{ category: 'book', isAdmin: 'true' }, ['category']], expect: { where: { category: 'book' }, orderBy: { id: 'asc' } } },
    { label: 'sắp xếp tăng', args: [{ sort: 'price' }, ['price']], expect: { where: {}, orderBy: { price: 'asc' } } },
    { label: 'sắp xếp giảm', args: [{ sort: '-price' }, ['price']], expect: { where: {}, orderBy: { price: 'desc' } } },
    { label: 'sort trường không được phép', args: [{ sort: '-secret' }, ['price']], expect: { where: {}, orderBy: { id: 'asc' } } },
    { label: 'page và size không vào where', args: [{ page: '2', size: '20', category: 'book' }, ['category']], expect: { where: { category: 'book' }, orderBy: { id: 'asc' } } }
  ],
  solution: `function buildQuery(query = {}, allowed = []) {
  const control = new Set(['page', 'size', 'sort']);
  const where = {};
  for (const [k, v] of Object.entries(query)) {
    if (control.has(k)) continue;
    if (allowed.includes(k)) where[k] = v;
  }
  let orderBy = { id: 'asc' };
  if (typeof query.sort === 'string' && query.sort) {
    const desc = query.sort.startsWith('-');
    const field = desc ? query.sort.slice(1) : query.sort;
    if (allowed.includes(field)) orderBy = { [field]: desc ? 'desc' : 'asc' };
  }
  return { where, orderBy };
}`
},
{
  id: 'node-11', lang: 'node', level: 'Trung bình', topic: 'Bảo mật', fn: 'decodeJwtPayload',
  title: 'Giải mã payload của JWT',
  brief: `<p>Viết hàm <code>decodeJwtPayload(token)</code> trả về payload đã parse, hoặc <code>null</code> nếu token không hợp lệ.</p>
<ul>
<li>Token gồm ba phần ngăn bởi dấu chấm; thiếu phần nào → <code>null</code></li>
<li>Phần giữa là payload mã base64url: thay <code>-</code> thành <code>+</code>, <code>_</code> thành <code>/</code>, bù <code>=</code> cho đủ bội số 4</li>
<li>Giải mã xong không parse được JSON → <code>null</code></li>
</ul>
<p class="warn">Lưu ý: giải mã <strong>không</strong> phải xác thực. Hàm này chỉ đọc nội dung; việc kiểm tra chữ ký luôn phải làm ở server bằng thư viện.</p>`,
  starter: `function decodeJwtPayload(token) {
  // Gợi ý: atob() có sẵn trong trình duyệt; ở Node dùng Buffer.from(s, 'base64')
}`,
  hints: ['atob giải mã base64 chuẩn, nên phải đổi ký tự base64url trước.', 'Bọc toàn bộ trong try/catch và trả null khi có lỗi.'],
  tests: [
    { label: 'token hợp lệ', args: ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3Iiwicm9sZSI6ImFkbWluIn0.abc'], expect: { sub: '7', role: 'admin' } },
    { label: 'thiếu phần', args: ['abc.def'], expect: null },
    { label: 'chuỗi rỗng', args: [''], expect: null },
    { label: 'payload không phải JSON', args: ['aaa.bm90LWpzb24.ccc'], expect: null },
    { label: 'null', args: [null], expect: null }
  ],
  solution: `function decodeJwtPayload(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    let b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return JSON.parse(atob(b));
  } catch { return null; }
}`
},
{
  id: 'node-12', lang: 'node', level: 'Cơ bản', topic: 'Bảo mật', fn: 'tokenState',
  title: 'Kiểm tra hạn của token',
  brief: `<p>Viết hàm <code>tokenState(payload, nowSeconds)</code> trả về một trong bốn chuỗi:</p>
<ul>
<li><code>'invalid'</code> — payload không phải object, hoặc thiếu <code>exp</code>, hoặc <code>exp</code> không phải số</li>
<li><code>'not_yet_valid'</code> — có <code>nbf</code> và <code>nowSeconds &lt; nbf</code></li>
<li><code>'expired'</code> — <code>nowSeconds &gt;= exp</code></li>
<li><code>'valid'</code> — còn lại</li>
</ul>
<p>Thứ tự kiểm tra đúng như trên. Nhớ rằng <code>exp</code> trong JWT tính bằng <strong>giây</strong>, không phải mili giây.</p>`,
  starter: `function tokenState(payload, nowSeconds) {
  // Viết code ở đây
}`,
  hints: ['typeof null === "object" nên phải kiểm tra null riêng.', 'Number.isFinite loại được cả NaN lẫn chuỗi.'],
  tests: [
    { label: 'còn hạn', args: [{ exp: 2000 }, 1000], expect: 'valid' },
    { label: 'hết hạn', args: [{ exp: 900 }, 1000], expect: 'expired' },
    { label: 'đúng thời điểm hết hạn', args: [{ exp: 1000 }, 1000], expect: 'expired' },
    { label: 'chưa tới hạn dùng', args: [{ exp: 5000, nbf: 2000 }, 1000], expect: 'not_yet_valid' },
    { label: 'thiếu exp', args: [{ sub: '7' }, 1000], expect: 'invalid' },
    { label: 'payload null', args: [null, 1000], expect: 'invalid' },
    { label: 'exp là chuỗi', args: [{ exp: '2000' }, 1000], expect: 'invalid' }
  ],
  solution: `function tokenState(payload, nowSeconds) {
  if (!payload || typeof payload !== 'object') return 'invalid';
  if (!Number.isFinite(payload.exp)) return 'invalid';
  if (Number.isFinite(payload.nbf) && nowSeconds < payload.nbf) return 'not_yet_valid';
  if (nowSeconds >= payload.exp) return 'expired';
  return 'valid';
}`
},
{
  id: 'node-13', lang: 'node', level: 'Trung bình', topic: 'Bảo mật', fn: 'can',
  title: 'Kiểm tra quyền theo role',
  brief: `<p>Viết hàm <code>can(user, permission, roles)</code> trả về <code>true</code>/<code>false</code>.</p>
<ul>
<li><code>roles</code> là object ánh xạ tên role sang mảng quyền, ví dụ <code>{ admin: ['*'], staff: ['order.read'] }</code></li>
<li><code>user.roles</code> là mảng tên role; người dùng có quyền nếu <em>bất kỳ</em> role nào của họ chứa quyền đó</li>
<li>Quyền <code>'*'</code> nghĩa là tất cả</li>
<li>Hỗ trợ ký tự đại diện theo nhóm: quyền <code>'order.*'</code> khớp với <code>'order.read'</code>, <code>'order.create'</code></li>
<li><code>user</code> là null, không có roles, hoặc role không tồn tại trong bảng → <code>false</code></li>
</ul>`,
  starter: `function can(user, permission, roles = {}) {
  // Viết code ở đây
}`,
  hints: ['Duyệt từng role của user, lấy mảng quyền tương ứng.', 'Với quyền dạng "order.*", so sánh phần trước dấu chấm.'],
  tests: [
    { label: 'admin có tất cả', args: [{ roles: ['admin'] }, 'order.delete', { admin: ['*'] }], expect: true },
    { label: 'quyền cụ thể', args: [{ roles: ['staff'] }, 'order.read', { staff: ['order.read'] }], expect: true },
    { label: 'thiếu quyền', args: [{ roles: ['staff'] }, 'order.delete', { staff: ['order.read'] }], expect: false },
    { label: 'đại diện theo nhóm', args: [{ roles: ['manager'] }, 'order.refund', { manager: ['order.*'] }], expect: true },
    { label: 'đại diện không khớp nhóm khác', args: [{ roles: ['manager'] }, 'user.delete', { manager: ['order.*'] }], expect: false },
    { label: 'nhiều role', args: [{ roles: ['guest', 'staff'] }, 'order.read', { guest: [], staff: ['order.read'] }], expect: true },
    { label: 'user null', args: [null, 'order.read', { staff: ['order.read'] }], expect: false },
    { label: 'role không có trong bảng', args: [{ roles: ['ghost'] }, 'order.read', { staff: ['order.read'] }], expect: false }
  ],
  solution: `function can(user, permission, roles = {}) {
  if (!user || !Array.isArray(user.roles)) return false;
  const group = String(permission).split('.')[0];
  return user.roles.some((r) => {
    const perms = roles[r];
    if (!Array.isArray(perms)) return false;
    return perms.some((p) => p === '*' || p === permission || p === group + '.*');
  });
}`
},
{
  id: 'node-14', lang: 'node', level: 'Trung bình', topic: 'Bảo mật', fn: 'authorizeAccess',
  title: 'Chặn lỗ hổng IDOR',
  brief: `<p>Viết hàm <code>authorizeAccess(user, resource)</code> trả về <code>{ allowed, status }</code>.</p>
<ul>
<li><code>user</code> null → <code>{ allowed: false, status: 401 }</code></li>
<li><code>resource</code> null hoặc undefined → <code>{ allowed: false, status: 404 }</code></li>
<li><code>user.role === 'admin'</code> → luôn cho phép, status 200</li>
<li><code>resource.ownerId === user.id</code> → cho phép, status 200</li>
<li>Còn lại → <code>{ allowed: false, status: 404 }</code> — cố ý trả 404 để không tiết lộ tài nguyên tồn tại</li>
</ul>`,
  starter: `function authorizeAccess(user, resource) {
  // Viết code ở đây
}`,
  hints: ['Thứ tự kiểm tra quan trọng: chưa đăng nhập trước, rồi tới tồn tại, rồi tới quyền.', 'Trả 404 thay vì 403 cho tài nguyên của người khác là lựa chọn bảo mật có chủ đích.'],
  tests: [
    { label: 'chưa đăng nhập', args: [null, { id: 1, ownerId: 5 }], expect: { allowed: false, status: 401 } },
    { label: 'tài nguyên không tồn tại', args: [{ id: 5, role: 'user' }, null], expect: { allowed: false, status: 404 } },
    { label: 'chủ sở hữu', args: [{ id: 5, role: 'user' }, { id: 1, ownerId: 5 }], expect: { allowed: true, status: 200 } },
    { label: 'admin xem của người khác', args: [{ id: 9, role: 'admin' }, { id: 1, ownerId: 5 }], expect: { allowed: true, status: 200 } },
    { label: 'người khác bị chặn bằng 404', args: [{ id: 7, role: 'user' }, { id: 1, ownerId: 5 }], expect: { allowed: false, status: 404 } }
  ],
  solution: `function authorizeAccess(user, resource) {
  if (!user) return { allowed: false, status: 401 };
  if (!resource) return { allowed: false, status: 404 };
  if (user.role === 'admin') return { allowed: true, status: 200 };
  if (resource.ownerId === user.id) return { allowed: true, status: 200 };
  return { allowed: false, status: 404 };
}`
},
{
  id: 'node-15', lang: 'node', level: 'Trung bình', topic: 'Xử lý lỗi', fn: 'normalizeError',
  title: 'Chuẩn hoá body lỗi',
  brief: `<p>Viết hàm <code>normalizeError(err, traceId)</code> chuyển mọi loại lỗi thành response thống nhất <code>{ status, body }</code>.</p>
<p><code>body</code> có dạng <code>{ type, message, details, traceId }</code>, trong đó <code>details</code> là mảng (rỗng nếu không có).</p>
<ul>
<li><code>err.name === 'ValidationError'</code> → status 422, type <code>'validation_error'</code>, details lấy từ <code>err.details</code></li>
<li><code>err.status</code> là số trong khoảng 400–499 → dùng status đó, type <code>'client_error'</code>, message lấy từ <code>err.message</code></li>
<li>Còn lại → status 500, type <code>'server_error'</code>, message cố định <code>'Lỗi hệ thống'</code> (không lộ thông tin nội bộ)</li>
</ul>`,
  starter: `function normalizeError(err, traceId = '') {
  // Viết code ở đây
}`,
  hints: ['Trường hợp 500 phải giấu message gốc — đó là điểm chính của bài này.', 'Dùng Array.isArray để phòng err.details không phải mảng.'],
  tests: [
    { label: 'lỗi validation', args: [{ name: 'ValidationError', message: 'sai', details: [{ field: 'q', error: 'bắt buộc' }] }, 't1'], expect: { status: 422, body: { type: 'validation_error', message: 'sai', details: [{ field: 'q', error: 'bắt buộc' }], traceId: 't1' } } },
    { label: 'lỗi client 404', args: [{ status: 404, message: 'Không tìm thấy đơn hàng' }, 't2'], expect: { status: 404, body: { type: 'client_error', message: 'Không tìm thấy đơn hàng', details: [], traceId: 't2' } } },
    { label: 'lỗi lạ bị giấu chi tiết', args: [{ message: 'connect ECONNREFUSED 10.0.0.5:5432', stack: 'at db.js:12' }, 't3'], expect: { status: 500, body: { type: 'server_error', message: 'Lỗi hệ thống', details: [], traceId: 't3' } } },
    { label: 'status 500 khai báo sẵn vẫn bị giấu', args: [{ status: 500, message: 'chi tiết nội bộ' }, 't4'], expect: { status: 500, body: { type: 'server_error', message: 'Lỗi hệ thống', details: [], traceId: 't4' } } }
  ],
  solution: `function normalizeError(err = {}, traceId = '') {
  if (err.name === 'ValidationError') {
    return { status: 422, body: { type: 'validation_error', message: err.message,
      details: Array.isArray(err.details) ? err.details : [], traceId } };
  }
  if (Number.isInteger(err.status) && err.status >= 400 && err.status <= 499) {
    return { status: err.status, body: { type: 'client_error', message: err.message,
      details: [], traceId } };
  }
  return { status: 500, body: { type: 'server_error', message: 'Lỗi hệ thống', details: [], traceId } };
}`
},
{
  id: 'node-16', lang: 'node', level: 'Trung bình', topic: 'Hiệu năng', fn: 'createCache',
  title: 'Cache in-memory có TTL',
  brief: `<p>Viết hàm <code>createCache(ttlMs, now)</code> trả về object có <code>get(key)</code>, <code>set(key, value)</code>, <code>del(key)</code>, <code>size()</code>.</p>
<ul>
<li><code>now</code> là hàm trả về thời điểm hiện tại (mili giây) — để test không phải chờ thật</li>
<li><code>get</code> trả <code>undefined</code> nếu key không tồn tại hoặc đã quá hạn</li>
<li>Key quá hạn phải bị xoá khỏi bộ nhớ khi <code>get</code> chạm tới (<code>size()</code> giảm)</li>
<li><code>set</code> lại cùng key thì làm mới thời hạn</li>
</ul>`,
  starter: `function createCache(ttlMs, now = Date.now) {
  // Viết code ở đây
}`,
  hints: ['Lưu { value, expiresAt } trong một Map.', 'So sánh now() với expiresAt trong get, và xoá luôn nếu hết hạn.'],
  tests: [
    { label: 'lấy lại giá trị vừa đặt', script: `const c = fn(1000, () => 0); c.set('a', 1); return c.get('a');`, expect: 1 },
    { label: 'key không tồn tại', script: `const c = fn(1000, () => 0); return c.get('x');`, expect: undefined },
    { label: 'hết hạn trả undefined', script: `let t = 0; const c = fn(1000, () => t); c.set('a', 1); t = 1500; return c.get('a');`, expect: undefined },
    { label: 'còn trong hạn', script: `let t = 0; const c = fn(1000, () => t); c.set('a', 1); t = 900; return c.get('a');`, expect: 1 },
    { label: 'key hết hạn bị dọn khỏi bộ nhớ', script: `let t = 0; const c = fn(1000, () => t); c.set('a', 1); t = 2000; c.get('a'); return c.size();`, expect: 0 },
    { label: 'set lại làm mới hạn', script: `let t = 0; const c = fn(1000, () => t); c.set('a', 1); t = 900; c.set('a', 2); t = 1500; return c.get('a');`, expect: 2 },
    { label: 'del xoá key', script: `const c = fn(1000, () => 0); c.set('a', 1); c.del('a'); return c.size();`, expect: 0 }
  ],
  solution: `function createCache(ttlMs, now = Date.now) {
  const store = new Map();
  return {
    set(key, value) { store.set(key, { value, expiresAt: now() + ttlMs }); },
    get(key) {
      const e = store.get(key);
      if (!e) return undefined;
      if (now() >= e.expiresAt) { store.delete(key); return undefined; }
      return e.value;
    },
    del(key) { store.delete(key); },
    size() { return store.size; },
  };
}`
},
{
  id: 'node-17', lang: 'node', level: 'Nâng cao', topic: 'Hiệu năng', fn: 'createRateLimiter',
  title: 'Rate limiter cửa sổ trượt',
  brief: `<p>Viết hàm <code>createRateLimiter({ limit, windowMs, now })</code> trả về hàm <code>check(key)</code>.</p>
<p><code>check</code> trả về <code>{ allowed, remaining, retryAfterMs }</code>:</p>
<ul>
<li>Đếm số lần gọi của <code>key</code> trong <code>windowMs</code> mili giây gần nhất (cửa sổ trượt, không phải cửa sổ cố định)</li>
<li>Chưa đạt <code>limit</code> → ghi nhận lần gọi này, <code>allowed: true</code>, <code>remaining</code> là số lượt còn lại sau lần này, <code>retryAfterMs: 0</code></li>
<li>Đã đạt <code>limit</code> → <strong>không</strong> ghi nhận, <code>allowed: false</code>, <code>remaining: 0</code>, <code>retryAfterMs</code> là thời gian tới khi lần gọi cũ nhất rời khỏi cửa sổ</li>
<li>Mỗi key đếm độc lập</li>
</ul>`,
  starter: `function createRateLimiter({ limit, windowMs, now = Date.now }) {
  // Viết code ở đây
}`,
  hints: ['Lưu mảng timestamp cho mỗi key, lọc bỏ những mốc cũ hơn now() - windowMs trước khi đếm.', 'retryAfterMs = timestamp cũ nhất + windowMs - now().'],
  tests: [
    { label: 'lượt đầu được phép', script: `const l = fn({ limit: 3, windowMs: 1000, now: () => 0 }); return l('a');`, expect: { allowed: true, remaining: 2, retryAfterMs: 0 } },
    { label: 'đủ limit thì chặn', script: `const l = fn({ limit: 2, windowMs: 1000, now: () => 0 });
l('a'); l('a'); return l('a');`, expect: { allowed: false, remaining: 0, retryAfterMs: 1000 } },
    { label: 'cửa sổ trượt qua thì mở lại', script: `let t = 0; const l = fn({ limit: 2, windowMs: 1000, now: () => t });
l('a'); l('a'); t = 1001; return l('a');`, expect: { allowed: true, remaining: 1, retryAfterMs: 0 } },
    { label: 'key khác đếm riêng', script: `const l = fn({ limit: 1, windowMs: 1000, now: () => 0 });
l('a'); return l('b');`, expect: { allowed: true, remaining: 0, retryAfterMs: 0 } },
    { label: 'lần bị chặn không tính vào cửa sổ', script: `let t = 0; const l = fn({ limit: 1, windowMs: 1000, now: () => t });
l('a'); t = 500; l('a'); t = 1001; return l('a');`, expect: { allowed: true, remaining: 0, retryAfterMs: 0 } }
  ],
  solution: `function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const hits = new Map();
  return function check(key) {
    const t = now();
    const arr = (hits.get(key) || []).filter((ts) => ts > t - windowMs);
    if (arr.length >= limit) {
      hits.set(key, arr);
      return { allowed: false, remaining: 0, retryAfterMs: arr[0] + windowMs - t };
    }
    arr.push(t);
    hits.set(key, arr);
    return { allowed: true, remaining: limit - arr.length, retryAfterMs: 0 };
  };
}`
},
{
  id: 'node-18', lang: 'node', level: 'Nâng cao', topic: 'Bất đồng bộ', fn: 'retry', async: true,
  title: 'Thử lại với backoff',
  brief: `<p>Viết hàm <code>retry(task, { attempts, onRetry })</code> gọi <code>task()</code> và thử lại khi nó ném lỗi.</p>
<ul>
<li>Thành công → trả về kết quả ngay</li>
<li>Thất bại → thử lại, tối đa <code>attempts</code> lần gọi <em>tổng cộng</em></li>
<li>Trước mỗi lần thử lại, gọi <code>onRetry(attemptNumber, error)</code> nếu có (attemptNumber bắt đầu từ 1 cho lần thử lại đầu tiên)</li>
<li>Hết lượt vẫn lỗi → ném lỗi cuối cùng</li>
<li>Lỗi có thuộc tính <code>fatal === true</code> → ném ngay, không thử lại</li>
</ul>`,
  starter: `async function retry(task, { attempts = 3, onRetry } = {}) {
  // Viết code ở đây
}`,
  hints: ['Vòng for từ 1 tới attempts, try/catch bên trong.', 'Kiểm tra err.fatal trước khi quyết định thử lại.', 'Nhớ ném lỗi ở lần cuối cùng thay vì trả undefined.'],
  tests: [
    { label: 'thành công ngay', async: true, script: `return await fn(async () => 'ok', { attempts: 3 });`, expect: 'ok' },
    { label: 'thành công ở lần thứ ba', async: true, script: `let n = 0;
return await fn(async () => { n++; if (n < 3) throw new Error('x'); return n; }, { attempts: 5 });`, expect: 3 },
    { label: 'hết lượt thì ném lỗi', async: true, script: `let n = 0;
try { await fn(async () => { n++; throw new Error('luon-loi'); }, { attempts: 3 }); return 'khong-nem'; }
catch (e) { return n + ':' + e.message; }`, expect: '3:luon-loi' },
    { label: 'lỗi fatal không thử lại', async: true, script: `let n = 0;
try { await fn(async () => { n++; const e = new Error('stop'); e.fatal = true; throw e; }, { attempts: 5 }); return 'khong-nem'; }
catch (e) { return n; }`, expect: 1 },
    { label: 'gọi onRetry đúng số lần', async: true, script: `const calls = [];
try { await fn(async () => { throw new Error('e'); }, { attempts: 3, onRetry: (i) => calls.push(i) }); } catch {}
return calls;`, expect: [1, 2] }
  ],
  solution: `async function retry(task, { attempts = 3, onRetry } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try { return await task(); }
    catch (err) {
      lastErr = err;
      if (err && err.fatal) throw err;
      if (i < attempts && onRetry) onRetry(i, err);
    }
  }
  throw lastErr;
}`
},
{
  id: 'node-19', lang: 'node', level: 'Cơ bản', topic: 'Xử lý dữ liệu', fn: 'chunk',
  title: 'Chia mảng thành lô',
  brief: `<p>Viết hàm <code>chunk(items, size)</code> chia mảng thành các lô nhỏ — kỹ thuật cơ bản khi ghi hàng loạt vào database hoặc gọi API có giới hạn.</p>
<ul>
<li>Lô cuối có thể ít phần tử hơn</li>
<li>Mảng rỗng → <code>[]</code></li>
<li><code>size</code> nhỏ hơn 1 hoặc không phải số nguyên → ném <code>Error('size phải là số nguyên dương')</code></li>
</ul>`,
  starter: `function chunk(items = [], size = 1) {
  // Viết code ở đây
}`,
  hints: ['Vòng lặp tăng theo bước size, dùng slice.', 'Kiểm tra size trước khi vào vòng lặp để tránh lặp vô tận.'],
  tests: [
    { label: 'chia đều', args: [[1, 2, 3, 4], 2], expect: [[1, 2], [3, 4]] },
    { label: 'lô cuối ngắn hơn', args: [[1, 2, 3, 4, 5], 2], expect: [[1, 2], [3, 4], [5]] },
    { label: 'size lớn hơn mảng', args: [[1, 2], 10], expect: [[1, 2]] },
    { label: 'mảng rỗng', args: [[], 3], expect: [] },
    { label: 'size bằng 0 thì ném lỗi', script: `try { fn([1, 2], 0); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'size phải là số nguyên dương' },
    { label: 'size không nguyên thì ném lỗi', script: `try { fn([1, 2], 1.5); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'size phải là số nguyên dương' }
  ],
  solution: `function chunk(items = [], size = 1) {
  if (!Number.isInteger(size) || size < 1) throw new Error('size phải là số nguyên dương');
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}`
},
{
  id: 'node-20', lang: 'node', level: 'Trung bình', topic: 'Bảo mật', fn: 'buildInsert',
  title: 'Sinh SQL tham số hoá',
  brief: `<p>Viết hàm <code>buildInsert(table, data)</code> trả về <code>{ sql, values }</code> — câu lệnh INSERT <strong>tham số hoá</strong>, không nối chuỗi giá trị.</p>
<ul>
<li>Placeholder kiểu PostgreSQL: <code>$1</code>, <code>$2</code>…</li>
<li>Thứ tự cột theo thứ tự khoá trong <code>data</code></li>
<li>Kết thúc bằng <code>RETURNING *</code></li>
<li>Tên bảng và tên cột chỉ được chứa chữ, số và dấu gạch dưới; sai → ném <code>Error('tên không hợp lệ')</code></li>
<li><code>data</code> rỗng → ném <code>Error('không có dữ liệu')</code></li>
</ul>
<p>Ví dụ: <code>buildInsert('users', { email: 'a@b.com', age: 30 })</code> → <code>{ sql: 'INSERT INTO users (email, age) VALUES ($1, $2) RETURNING *', values: ['a@b.com', 30] }</code></p>`,
  starter: `function buildInsert(table, data = {}) {
  // Viết code ở đây
}`,
  hints: ['Tên bảng và cột không tham số hoá được, nên phải kiểm tra bằng biểu thức chính quy: /^[A-Za-z0-9_]+$/.', 'Giá trị thì ngược lại — luôn đi qua mảng values, không bao giờ nối vào chuỗi.'],
  tests: [
    { label: 'một cột', args: ['users', { email: 'a@b.com' }], expect: { sql: 'INSERT INTO users (email) VALUES ($1) RETURNING *', values: ['a@b.com'] } },
    { label: 'nhiều cột', args: ['users', { email: 'a@b.com', age: 30 }], expect: { sql: 'INSERT INTO users (email, age) VALUES ($1, $2) RETURNING *', values: ['a@b.com', 30] } },
    { label: 'giá trị nguy hiểm vẫn an toàn vì được tham số hoá', args: ['users', { name: "'; DROP TABLE users; --" }], expect: { sql: 'INSERT INTO users (name) VALUES ($1) RETURNING *', values: ["'; DROP TABLE users; --"] } },
    { label: 'tên bảng có ký tự lạ bị chặn', script: `try { fn('users; DROP TABLE x', { a: 1 }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên không hợp lệ' },
    { label: 'tên cột có ký tự lạ bị chặn', script: `try { fn('users', { 'a b': 1 }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên không hợp lệ' },
    { label: 'data rỗng', script: `try { fn('users', {}); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'không có dữ liệu' }
  ],
  solution: `function buildInsert(table, data = {}) {
  const safe = /^[A-Za-z0-9_]+$/;
  if (!safe.test(String(table))) throw new Error('tên không hợp lệ');
  const cols = Object.keys(data);
  if (cols.length === 0) throw new Error('không có dữ liệu');
  for (const c of cols) if (!safe.test(c)) throw new Error('tên không hợp lệ');
  const holders = cols.map((_, i) => '$' + (i + 1));
  return {
    sql: \`INSERT INTO \${table} (\${cols.join(', ')}) VALUES (\${holders.join(', ')}) RETURNING *\`,
    values: cols.map((c) => data[c]),
  };
}`
},
{
  id: 'node-21', lang: 'node', level: 'Cơ bản', topic: 'Xử lý dữ liệu', fn: 'slugify',
  title: 'Tạo slug cho URL',
  brief: `<p>Viết hàm <code>slugify(text)</code> chuyển tiêu đề thành slug dùng được trên URL.</p>
<ul>
<li>Chuyển về chữ thường</li>
<li>Bỏ dấu tiếng Việt: <em>Lập trình</em> → <code>lap-trinh</code></li>
<li>Chữ <code>đ</code>/<code>Đ</code> → <code>d</code></li>
<li>Ký tự không phải chữ/số → dấu gạch ngang, gộp các gạch liên tiếp thành một</li>
<li>Bỏ gạch ở đầu và cuối</li>
</ul>`,
  starter: `function slugify(text = '') {
  // Gợi ý: normalize('NFD') tách dấu thành ký tự riêng để dễ loại bỏ
}`,
  hints: ['text.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") bỏ được hầu hết dấu.', 'Chữ đ không tách dấu bằng NFD nên phải thay riêng.', 'replace(/-+/g, "-") gộp gạch liên tiếp.'],
  tests: [
    { label: 'chuỗi đơn giản', args: ['Hello World'], expect: 'hello-world' },
    { label: 'bỏ dấu tiếng Việt', args: ['Lập trình Backend'], expect: 'lap-trinh-backend' },
    { label: 'chữ đ', args: ['Đặt hàng'], expect: 'dat-hang' },
    { label: 'ký tự đặc biệt', args: ['API & REST: cơ bản!'], expect: 'api-rest-co-ban' },
    { label: 'khoảng trắng thừa', args: ['  nhiều   khoảng  trắng  '], expect: 'nhieu-khoang-trang' },
    { label: 'chuỗi rỗng', args: [''], expect: '' }
  ],
  solution: `function slugify(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}`
},
{
  id: 'node-22', lang: 'node', level: 'Trung bình', topic: 'Cấu hình', fn: 'loadConfig',
  title: 'Nạp cấu hình từ biến môi trường',
  brief: `<p>Viết hàm <code>loadConfig(env, schema)</code> đọc cấu hình từ object biến môi trường theo mô tả.</p>
<p><code>schema</code> có dạng <code>{ PORT: { type: 'number', default: 3000 }, JWT_SECRET: { type: 'string', required: true } }</code>.</p>
<ul>
<li>Kiểu <code>'number'</code>: ép kiểu, giá trị không phải số → ném <code>Error('PORT không phải số')</code></li>
<li>Kiểu <code>'boolean'</code>: <code>'true'</code>/<code>'1'</code> → true, còn lại → false</li>
<li>Kiểu <code>'string'</code>: giữ nguyên</li>
<li>Thiếu giá trị và có <code>default</code> → dùng default (không ép kiểu lại)</li>
<li>Thiếu giá trị, <code>required: true</code>, không có default → ném <code>Error('thiếu biến môi trường: JWT_SECRET')</code></li>
</ul>`,
  starter: `function loadConfig(env = {}, schema = {}) {
  // Viết code ở đây
}`,
  hints: ['Ứng dụng nên chết ngay khi khởi động nếu thiếu cấu hình bắt buộc — đó là lý do bài này ném lỗi.', 'Chuỗi rỗng nên coi như không có giá trị.'],
  tests: [
    { label: 'ép kiểu số', args: [{ PORT: '8080' }, { PORT: { type: 'number', default: 3000 } }], expect: { PORT: 8080 } },
    { label: 'dùng giá trị mặc định', args: [{}, { PORT: { type: 'number', default: 3000 } }], expect: { PORT: 3000 } },
    { label: 'boolean', args: [{ DEBUG: 'true', CACHE: 'no' }, { DEBUG: { type: 'boolean' }, CACHE: { type: 'boolean' } }], expect: { DEBUG: true, CACHE: false } },
    { label: 'chuỗi giữ nguyên', args: [{ JWT_SECRET: 'abc' }, { JWT_SECRET: { type: 'string', required: true } }], expect: { JWT_SECRET: 'abc' } },
    { label: 'thiếu biến bắt buộc', script: `try { fn({}, { JWT_SECRET: { type: 'string', required: true } }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'thiếu biến môi trường: JWT_SECRET' },
    { label: 'số không hợp lệ', script: `try { fn({ PORT: 'abc' }, { PORT: { type: 'number' } }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'PORT không phải số' }
  ],
  solution: `function loadConfig(env = {}, schema = {}) {
  const out = {};
  for (const [key, rule] of Object.entries(schema)) {
    const raw = env[key];
    if (raw === undefined || raw === '') {
      if ('default' in rule) { out[key] = rule.default; continue; }
      if (rule.required) throw new Error('thiếu biến môi trường: ' + key);
      out[key] = undefined; continue;
    }
    if (rule.type === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error(key + ' không phải số');
      out[key] = n;
    } else if (rule.type === 'boolean') {
      out[key] = raw === 'true' || raw === '1';
    } else {
      out[key] = String(raw);
    }
  }
  return out;
}`
},
{
  id: 'node-23', lang: 'node', level: 'Nâng cao', topic: 'Phân trang', fn: 'cursorPage',
  title: 'Phân trang bằng cursor',
  brief: `<p>Viết hàm <code>cursorPage(items, { after, size })</code> phân trang theo cursor thay vì offset.</p>
<ul>
<li><code>items</code> đã sắp xếp theo <code>id</code> tăng dần</li>
<li>Không có <code>after</code> → lấy từ đầu</li>
<li>Có <code>after</code> → lấy các phần tử có <code>id</code> lớn hơn giá trị đó</li>
<li><code>after</code> trỏ tới id không tồn tại → vẫn lấy các phần tử có id lớn hơn</li>
<li>Trả về <code>{ items, nextCursor, hasNext }</code>; <code>nextCursor</code> là id của phần tử cuối trang, hoặc <code>null</code> nếu hết</li>
<li><code>size</code> mặc định 2, tối đa 50</li>
</ul>`,
  starter: `function cursorPage(items = [], { after, size = 2 } = {}) {
  // Viết code ở đây
}`,
  hints: ['Lọc trước theo điều kiện id > after, rồi slice lấy size phần tử.', 'hasNext đúng khi số phần tử còn lại nhiều hơn size.'],
  tests: [
    { label: 'trang đầu', args: [[{ id: 1 }, { id: 2 }, { id: 3 }], { size: 2 }], expect: { items: [{ id: 1 }, { id: 2 }], nextCursor: 2, hasNext: true } },
    { label: 'trang sau', args: [[{ id: 1 }, { id: 2 }, { id: 3 }], { after: 2, size: 2 }], expect: { items: [{ id: 3 }], nextCursor: null, hasNext: false } },
    { label: 'cursor không tồn tại', args: [[{ id: 1 }, { id: 5 }, { id: 9 }], { after: 3, size: 5 }], expect: { items: [{ id: 5 }, { id: 9 }], nextCursor: null, hasNext: false } },
    { label: 'danh sách rỗng', args: [[], { size: 2 }], expect: { items: [], nextCursor: null, hasNext: false } },
    { label: 'size bị kẹp về 50', script: `const items = Array.from({ length: 60 }, (_, i) => ({ id: i + 1 }));
const r = fn(items, { size: 999 });
return r.items.length;`, expect: 50 }
  ],
  solution: `function cursorPage(items = [], { after, size = 2 } = {}) {
  const take = Math.min(50, Math.max(1, Math.trunc(Number(size) || 2)));
  const rest = after === undefined || after === null
    ? items.slice()
    : items.filter((x) => x.id > after);
  const page = rest.slice(0, take);
  const hasNext = rest.length > take;
  return { items: page, nextCursor: hasNext ? page[page.length - 1].id : null, hasNext };
}`
},
{
  id: 'node-24', lang: 'node', level: 'Nâng cao', topic: 'Bất đồng bộ', fn: 'createBatcher', async: true,
  title: 'Gom nhiều lời gọi thành một truy vấn',
  brief: `<p>Kỹ thuật này (giống DataLoader) là cách triệt để nhất để diệt N+1. Viết hàm <code>createBatcher(batchFn)</code> trả về hàm <code>load(id)</code>.</p>
<ul>
<li>Nhiều lần gọi <code>load</code> trong <em>cùng một vòng microtask</em> được gom thành một lần gọi <code>batchFn(ids)</code></li>
<li><code>batchFn</code> nhận mảng id và trả về mảng kết quả <strong>cùng thứ tự</strong></li>
<li>Mỗi <code>load</code> trả về Promise cho đúng phần tử của nó</li>
<li>Id trùng nhau trong cùng lô chỉ gửi một lần cho <code>batchFn</code></li>
<li><code>batchFn</code> ném lỗi → mọi promise trong lô đó đều reject</li>
</ul>`,
  starter: `function createBatcher(batchFn) {
  // Gợi ý: queueMicrotask() hoặc Promise.resolve().then() để hoãn tới cuối vòng hiện tại
}`,
  hints: ['Giữ một mảng hàng đợi { id, resolve, reject }; lần đầu có phần tử thì lên lịch flush.', 'Dùng Map để loại id trùng, nhưng vẫn phải trả kết quả cho mọi người gọi.'],
  tests: [
    { label: 'gom thành một lần gọi', async: true, script: `const calls = [];
const load = fn(async (ids) => { calls.push(ids); return ids.map((i) => 'v' + i); });
const r = await Promise.all([load(1), load(2), load(3)]);
return { calls: calls.length, ids: calls[0], r };`, expect: { calls: 1, ids: [1, 2, 3], r: ['v1', 'v2', 'v3'] } },
    { label: 'trả đúng giá trị theo thứ tự', async: true, script: `const load = fn(async (ids) => ids.map((i) => i * 10));
return await Promise.all([load(3), load(1), load(2)]);`, expect: [30, 10, 20] },
    { label: 'id trùng chỉ gửi một lần', async: true, script: `const calls = [];
const load = fn(async (ids) => { calls.push(ids); return ids.map((i) => 'v' + i); });
const r = await Promise.all([load(1), load(1), load(2)]);
return { sent: calls[0], r };`, expect: { sent: [1, 2], r: ['v1', 'v1', 'v2'] } },
    { label: 'lô mới sau khi lô cũ xong', async: true, script: `const calls = [];
const load = fn(async (ids) => { calls.push(ids.slice()); return ids.map((i) => i); });
await Promise.all([load(1), load(2)]);
await Promise.all([load(3)]);
return calls;`, expect: [[1, 2], [3]] },
    { label: 'lỗi lan tới mọi người gọi', async: true, script: `const load = fn(async () => { throw new Error('db down'); });
const results = await Promise.allSettled([load(1), load(2)]);
return results.map((r) => r.status + ':' + (r.reason ? r.reason.message : ''));`, expect: ['rejected:db down', 'rejected:db down'] }
  ],
  solution: `function createBatcher(batchFn) {
  let queue = [];
  let scheduled = false;
  async function flush() {
    const batch = queue; queue = []; scheduled = false;
    const ids = [...new Set(batch.map((b) => b.id))];
    try {
      const results = await batchFn(ids);
      const byId = new Map(ids.map((id, i) => [id, results[i]]));
      for (const b of batch) b.resolve(byId.get(b.id));
    } catch (err) {
      for (const b of batch) b.reject(err);
    }
  }
  return function load(id) {
    return new Promise((resolve, reject) => {
      queue.push({ id, resolve, reject });
      if (!scheduled) { scheduled = true; queueMicrotask(flush); }
    });
  };
}`
},
{
  id: 'node-25', lang: 'node', level: 'Trung bình', topic: 'Vận hành', fn: 'buildHealth',
  title: 'Tổng hợp health check',
  brief: `<p>Viết hàm <code>buildHealth(checks)</code> nhận object trạng thái từng phụ thuộc và trả về báo cáo tổng.</p>
<p><code>checks</code> dạng <code>{ database: { status: 'healthy', critical: true }, redis: { status: 'down', critical: false } }</code>.</p>
<p>Trả về <code>{ status, httpStatus, checks, failing }</code>:</p>
<ul>
<li>Mọi thứ <code>'healthy'</code> → status <code>'healthy'</code>, httpStatus 200</li>
<li>Có thành phần không healthy nhưng <strong>không</strong> critical → <code>'degraded'</code>, httpStatus 200</li>
<li>Có thành phần critical không healthy → <code>'unhealthy'</code>, httpStatus 503</li>
<li><code>checks</code> là object rút gọn <code>{ tên: status }</code>; <code>failing</code> là mảng tên các thành phần không healthy, sắp xếp theo bảng chữ cái</li>
</ul>`,
  starter: `function buildHealth(checks = {}) {
  // Viết code ở đây
}`,
  hints: ['Duyệt Object.entries một lần, thu thập cả tên hỏng lẫn cờ critical.', 'sort() trên mảng chuỗi sắp theo bảng chữ cái sẵn.'],
  tests: [
    { label: 'tất cả khoẻ', args: [{ database: { status: 'healthy', critical: true } }], expect: { status: 'healthy', httpStatus: 200, checks: { database: 'healthy' }, failing: [] } },
    { label: 'phụ thuộc phụ hỏng', args: [{ database: { status: 'healthy', critical: true }, redis: { status: 'down', critical: false } }], expect: { status: 'degraded', httpStatus: 200, checks: { database: 'healthy', redis: 'down' }, failing: ['redis'] } },
    { label: 'phụ thuộc chính hỏng', args: [{ database: { status: 'down', critical: true }, redis: { status: 'healthy', critical: false } }], expect: { status: 'unhealthy', httpStatus: 503, checks: { database: 'down', redis: 'healthy' }, failing: ['database'] } },
    { label: 'nhiều thành phần hỏng, sắp xếp tên', args: [{ zeta: { status: 'down', critical: false }, alpha: { status: 'down', critical: false } }], expect: { status: 'degraded', httpStatus: 200, checks: { zeta: 'down', alpha: 'down' }, failing: ['alpha', 'zeta'] } },
    { label: 'không có phụ thuộc nào', args: [{}], expect: { status: 'healthy', httpStatus: 200, checks: {}, failing: [] } }
  ],
  solution: `function buildHealth(checks = {}) {
  const summary = {};
  const failing = [];
  let criticalDown = false;
  for (const [name, info] of Object.entries(checks)) {
    summary[name] = info.status;
    if (info.status !== 'healthy') {
      failing.push(name);
      if (info.critical) criticalDown = true;
    }
  }
  failing.sort();
  const status = criticalDown ? 'unhealthy' : failing.length ? 'degraded' : 'healthy';
  return { status, httpStatus: criticalDown ? 503 : 200, checks: summary, failing };
}`
}
];
