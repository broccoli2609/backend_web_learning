/* Bài tự luyện Node.js — phần 2: bất đồng bộ, dữ liệu, vận hành và kiểm thử.
 * Những chủ đề ở đây đi xa hơn khoá video một chút, nhưng đều là thứ bạn
 * sẽ gặp ngay khi dự án rời khỏi máy cá nhân. */

export default [
{
  id: 'node-83', lang: 'node', level: 'Trung bình', topic: 'Xử lý lỗi', fn: 'asyncHandler', async: true,
  title: 'Bắt lỗi trong route async',
  io: {
    signature: 'asyncHandler(fn) → function(req, res, next)',
    params: [
      ['fn', 'function', 'Handler bất đồng bộ dạng (req, res) trả về Promise. Promise này có thể bị reject.']
    ],
    returns: ['function',
      'Middleware ba tham số. Handler chạy êm thì không gọi next; handler ném lỗi thì gọi next(err) đúng một lần.'],
    example: `router.get('/', asyncHandler(async (req, res) => {
  const todos = await prisma.todo.findMany()
  res.json(todos)
}))`
  },
  brief: `<p>Express 4 <strong>không</strong> bắt lỗi của Promise bị reject. Đoạn code dưới đây trông hoàn toàn bình thường nhưng khi database hỏng thì request treo vĩnh viễn — không có response, không có log, chỉ có một client ngồi chờ tới khi hết thời gian:</p>
<pre><code>router.get('/', async (req, res) => {
  const todos = await prisma.todo.findMany()   // nếu chỗ này ném lỗi…
  res.json(todos)
})</code></pre>
<p>Lý do: Express gọi handler rồi quên nó đi. Handler đồng bộ ném lỗi thì Express bắt được; handler async thì lỗi nằm trong Promise, và Express không hề <code>await</code> nó.</p>
<p>Viết hàm <code>asyncHandler(fn)</code> bọc handler lại:</p>
<ul>
<li>Trả về một middleware ba tham số <code>(req, res, next)</code></li>
<li>Gọi <code>fn(req, res)</code>, và khi Promise bị reject thì gọi <code>next(err)</code></li>
<li>Chạy êm thì <strong>không</strong> gọi <code>next</code> — handler đã tự trả lời rồi</li>
<li><code>fn</code> ném lỗi đồng bộ (trước cả <code>await</code> đầu tiên) cũng phải rơi vào <code>next(err)</code></li>
</ul>
<p class="callout">Express 5 bắt giúp bạn việc này, nên khi nâng phiên bản bạn bỏ được hàm bọc. Nhưng phần lớn dự án ngoài kia vẫn đang ở Express 4, và <code>asyncHandler</code> là một trong những đoạn code được chép đi chép lại nhiều nhất trong hệ sinh thái Node.</p>`,
  starter: `function asyncHandler(fn) {
  // Viết code ở đây — trả về một hàm (req, res, next)
}`,
  hints: [
    'Promise.resolve(fn(req, res)) biến cả giá trị thường lẫn Promise thành Promise.',
    'Cách đó cũng bắt luôn lỗi ném đồng bộ, nếu bạn bọc trong try/catch hoặc dùng .catch.',
    'Đừng await bên trong middleware rồi trả về Promise — Express không dùng giá trị trả về.'
  ],
  tests: [
    { label: 'chạy êm thì không gọi next', async: true, script: `let called = false;
const mw = fn(async (req, res) => { res.done = true; });
const res = {};
await mw({}, res, () => { called = true; });
await new Promise((r) => setTimeout(r, 0));
return { done: res.done, called };`, expect: { done: true, called: false } },
    { label: 'Promise reject thì gọi next với lỗi', async: true, script: `let seen = null;
const mw = fn(async () => { throw new Error('db down'); });
await mw({}, {}, (err) => { seen = err; });
await new Promise((r) => setTimeout(r, 0));
return seen ? seen.message : 'khong-goi-next';`, expect: 'db down' },
    { label: 'lỗi ném đồng bộ cũng bắt được', async: true, script: `let seen = null;
const mw = fn(() => { throw new Error('loi-dong-bo'); });
await mw({}, {}, (err) => { seen = err; });
await new Promise((r) => setTimeout(r, 0));
return seen ? seen.message : 'khong-goi-next';`, expect: 'loi-dong-bo' },
    { label: 'handler nhận đúng req và res', async: true, script: `const seen = [];
const mw = fn(async (req, res) => { seen.push(req.id, res.id); });
await mw({ id: 'req' }, { id: 'res' }, () => {});
await new Promise((r) => setTimeout(r, 0));
return seen;`, expect: ['req', 'res'] },
    { label: 'chỉ gọi next đúng một lần', async: true, script: `let count = 0;
const mw = fn(async () => { throw new Error('x'); });
await mw({}, {}, () => { count++; });
await new Promise((r) => setTimeout(r, 0));
return count;`, expect: 1 }
  ],
  solution: `function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    return Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  };
}`
},
{
  id: 'node-84', lang: 'node', level: 'Trung bình', topic: 'Bất đồng bộ', fn: 'withTimeout', async: true,
  title: 'Đặt hạn cho một Promise',
  io: {
    signature: 'await withTimeout(promise, ms, message) → Promise',
    params: [
      ['promise', 'Promise', 'Việc đang chờ: một truy vấn database, một lời gọi API.'],
      ['ms', 'number', 'Chờ tối đa bao nhiêu mili giây.'],
      ['message', "string · mặc định 'hết thời gian chờ'", 'Nội dung lỗi khi quá hạn.']
    ],
    returns: ['Promise',
      'Promise trả về kết quả gốc nếu kịp. Quá hạn thì reject với Error mang message đã cho. Promise gốc reject thì lỗi đó được truyền nguyên.'],
    example: `await withTimeout(fetchUser(id), 3000)
// → dữ liệu, hoặc ném Error('hết thời gian chờ')`
  },
  brief: `<p>Một lời gọi ra ngoài không có hạn chờ là một lời gọi có thể treo mãi mãi. Dịch vụ bên kia không trả lời, request của bạn giữ một kết nối, và khi chuyện đó xảy ra với hàng nghìn request thì server hết tài nguyên — dù chính nó không hỏng gì cả.</p>
<p>Viết hàm <code>withTimeout(promise, ms, message)</code>:</p>
<ul>
<li>Promise gốc xong trước hạn → trả về kết quả của nó</li>
<li>Promise gốc reject trước hạn → truyền nguyên lỗi đó ra</li>
<li>Quá hạn trước → reject với <code>new Error(message)</code></li>
<li>Dù đi nhánh nào, <strong>phải hủy bộ đếm giờ</strong> bằng <code>clearTimeout</code></li>
</ul>
<p class="warn">Bỏ quên <code>clearTimeout</code> thì tiến trình Node giữ bộ đếm giờ sống tới khi nó chạy xong — script test sẽ không thoát, và trong ứng dụng thật là một rò rỉ nhỏ nhân lên theo mỗi request.</p>
<p>Lưu ý một giới hạn thật của cách này: hết hạn <strong>không</strong> hủy được việc đang chạy. Truy vấn database vẫn chạy tới cùng; bạn chỉ thôi chờ nó. Muốn hủy thật thì phải có <code>AbortController</code> và bên kia phải hỗ trợ.</p>`,
  starter: `async function withTimeout(promise, ms, message = 'hết thời gian chờ') {
  // Viết code ở đây
}`,
  hints: [
    'Promise.race chạy đua hai Promise, cái nào xong trước thì thắng.',
    'Giữ id của setTimeout trong một biến bên ngoài để clearTimeout gọi được.',
    'Dùng finally để hủy bộ đếm giờ cho cả nhánh thành công lẫn nhánh lỗi.'
  ],
  tests: [
    { label: 'kịp hạn', async: true, script: `return await fn(new Promise((r) => setTimeout(() => r('xong'), 5)), 200);`, expect: 'xong' },
    { label: 'quá hạn', async: true, script: `try { await fn(new Promise(() => {}), 10); return 'khong-nem'; }
catch (e) { return e.message; }`, expect: 'hết thời gian chờ' },
    { label: 'thông báo tuỳ chỉnh', async: true, script: `try { await fn(new Promise(() => {}), 10, 'database khong tra loi'); return 'khong-nem'; }
catch (e) { return e.message; }`, expect: 'database khong tra loi' },
    { label: 'lỗi gốc được truyền nguyên', async: true, script: `try { await fn(Promise.reject(new Error('loi-goc')), 200); return 'khong-nem'; }
catch (e) { return e.message; }`, expect: 'loi-goc' },
    { label: 'giá trị thường cũng chạy', async: true, script: `return await fn(Promise.resolve(42), 200);`, expect: 42 },
    { label: 'hủy bộ đếm giờ sau khi xong', async: true, script: `let cleared = 0;
const goc = globalThis.clearTimeout;
globalThis.clearTimeout = (id) => { cleared++; return goc(id); };
try {
  await fn(Promise.resolve('x'), 200);
} finally {
  globalThis.clearTimeout = goc;
}
return cleared > 0;`, expect: true }
  ],
  solution: `async function withTimeout(promise, ms, message = 'hết thời gian chờ') {
  let timer;

  const quaHan = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, quaHan]);
  } finally {
    clearTimeout(timer);
  }
}`
},
{
  id: 'node-85', lang: 'node', level: 'Nâng cao', topic: 'Bất đồng bộ', fn: 'mapLimit', async: true,
  title: 'Chạy song song nhưng có giới hạn',
  io: {
    signature: 'await mapLimit(items, limit, task) → Promise<Array>',
    params: [
      ['items', 'Array · mặc định []', 'Danh sách đầu vào.'],
      ['limit', 'number', 'Số việc được phép chạy cùng lúc, tối thiểu 1.'],
      ['task', 'async function', 'task(item, index) trả về Promise kết quả cho phần tử đó.']
    ],
    returns: ['Promise<Array>',
      'Mảng kết quả theo ĐÚNG thứ tự của items, không phải thứ tự hoàn thành. Một task ném lỗi thì cả hàm reject với lỗi đó.'],
    example: `await mapLimit(userIds, 5, (id) => fetchUser(id))
// gọi tối đa 5 request cùng lúc, trả kết quả đúng thứ tự`
  },
  brief: `<p><code>Promise.all(ids.map(fetchUser))</code> với mười nghìn id sẽ mở mười nghìn kết nối cùng lúc. Database từ chối, API bên kia chặn IP của bạn, và bộ nhớ tăng vọt. Ngược lại, vòng <code>for</code> có <code>await</code> thì an toàn nhưng chậm gấp hàng trăm lần vì chạy tuần tự.</p>
<p>Lời giải nằm ở giữa: chạy song song, nhưng <strong>không quá N việc một lúc</strong>.</p>
<p>Viết hàm <code>mapLimit(items, limit, task)</code>:</p>
<ul>
<li>Không bao giờ có quá <code>limit</code> task đang chạy cùng lúc</li>
<li>Một task xong thì task tiếp theo trong hàng đợi được khởi động ngay</li>
<li>Kết quả trả về theo <strong>đúng thứ tự của <code>items</code></strong>, không phải thứ tự hoàn thành</li>
<li>Một task ném lỗi → cả hàm reject với lỗi đó</li>
<li><code>items</code> rỗng → mảng rỗng, và không gọi <code>task</code> lần nào</li>
<li><code>limit</code> nhỏ hơn 1 thì coi như 1</li>
</ul>`,
  starter: `async function mapLimit(items = [], limit, task) {
  // Viết code ở đây
}`,
  hints: [
    'Một biến đếm chung làm con trỏ: mỗi worker tự lấy chỉ số tiếp theo rồi tăng nó lên.',
    'Tạo đúng min(limit, items.length) worker, mỗi worker là một vòng while lấy việc.',
    'Ghi kết quả vào results[index] thay vì push — như vậy thứ tự tự đúng.'
  ],
  tests: [
    { label: 'kết quả đúng thứ tự', async: true, script: `return await fn([1, 2, 3], 2, async (x) => x * 10);`, expect: [10, 20, 30] },
    { label: 'chậm nhanh lẫn lộn vẫn đúng thứ tự', async: true, script: `return await fn([30, 10, 20], 3, async (x) => {
  await new Promise((r) => setTimeout(r, x / 10));
  return x;
});`, expect: [30, 10, 20] },
    { label: 'không vượt quá giới hạn', async: true, script: `let dangChay = 0, dinh = 0;
await fn([1, 2, 3, 4, 5, 6], 2, async () => {
  dangChay++;
  dinh = Math.max(dinh, dangChay);
  await new Promise((r) => setTimeout(r, 2));
  dangChay--;
});
return dinh;`, expect: 2 },
    { label: 'chạy đủ mọi phần tử', async: true, script: `let dem = 0;
await fn([1, 2, 3, 4, 5], 2, async () => { dem++; });
return dem;`, expect: 5 },
    { label: 'nhận được chỉ số', async: true, script: `return await fn(['a', 'b'], 1, async (item, i) => item + i);`, expect: ['a0', 'b1'] },
    { label: 'mảng rỗng không gọi task', async: true, script: `let dem = 0;
const out = await fn([], 3, async () => { dem++; });
return { out, dem };`, expect: { out: [], dem: 0 } },
    { label: 'lỗi được ném ra ngoài', async: true, script: `try {
  await fn([1, 2, 3], 2, async (x) => { if (x === 2) throw new Error('hong o 2'); return x; });
  return 'khong-nem';
} catch (e) { return e.message; }`, expect: 'hong o 2' },
    { label: 'giới hạn lớn hơn số phần tử', async: true, script: `return await fn([1, 2], 99, async (x) => x);`, expect: [1, 2] }
  ],
  solution: `async function mapLimit(items = [], limit, task) {
  const results = new Array(items.length);
  const songSong = Math.max(1, Math.min(limit, items.length));
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: songSong }, worker));
  return results;
}`
},
{
  id: 'node-86', lang: 'node', level: 'Cơ bản', topic: 'Bất đồng bộ', fn: 'backoffDelays',
  title: 'Tính dãy thời gian chờ khi thử lại',
  io: {
    signature: 'backoffDelays(attempts, options) → Array<number>',
    params: [
      ['attempts', 'number', 'Số lần THỬ LẠI (không tính lần gọi đầu). Nhỏ hơn 1 thì trả mảng rỗng.'],
      ['options', 'object · mặc định {}', '{ base: number mặc định 100 — thời gian chờ cơ sở tính bằng mili giây; max: number mặc định 10000 — trần; factor: number mặc định 2 — hệ số nhân mỗi lần }.']
    ],
    returns: ['Array<number>', 'Dãy thời gian chờ trước mỗi lần thử lại, tính bằng mili giây, đã kẹp theo trần max.'],
    example: `backoffDelays(5)                      // → [100, 200, 400, 800, 1600]
backoffDelays(5, { max: 500 })        // → [100, 200, 400, 500, 500]`
  },
  brief: `<p>Thử lại ngay lập tức là cách tệ nhất để phản ứng với một dịch vụ đang quá tải: bạn vừa dồn thêm tải đúng lúc nó yếu nhất. Nếu cả nghìn client cùng làm vậy, dịch vụ vừa hồi phục lại chết tiếp — hiện tượng này có tên <em>thundering herd</em>.</p>
<p><strong>Exponential backoff</strong> giải quyết bằng cách chờ lâu dần sau mỗi lần thất bại:</p>
<pre>lần 1 → chờ 100ms
lần 2 → chờ 200ms
lần 3 → chờ 400ms
lần 4 → chờ 800ms …</pre>
<p>Viết hàm <code>backoffDelays(attempts, options)</code>:</p>
<ul>
<li>Phần tử thứ <code>i</code> (đếm từ 0) là <code>base * factor^i</code></li>
<li>Mọi giá trị đều bị kẹp không vượt quá <code>max</code></li>
<li><code>attempts</code> nhỏ hơn 1 → mảng rỗng</li>
<li>Kết quả là số nguyên — làm tròn xuống</li>
</ul>
<p class="callout">Trong hệ thống thật, người ta còn cộng thêm một lượng ngẫu nhiên nhỏ gọi là <em>jitter</em>, để các client không cùng thức dậy tại một thời điểm. Bài này bỏ qua jitter cho kết quả tính được, nhưng hãy nhớ rằng backoff không jitter vẫn để lại từng đợt sóng đồng loạt.</p>`,
  starter: `function backoffDelays(attempts, options = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Math.pow(factor, i) hoặc factor ** i đều được.',
    'Math.min kẹp theo trần, Math.floor cho số nguyên.',
    'Array.from({ length: n }, (_, i) => ...) sinh dãy gọn hơn vòng for.'
  ],
  tests: [
    { label: 'mặc định', args: [5], expect: [100, 200, 400, 800, 1600] },
    { label: 'kẹp theo trần', args: [5, { max: 500 }], expect: [100, 200, 400, 500, 500] },
    { label: 'base khác', args: [3, { base: 50 }], expect: [50, 100, 200] },
    { label: 'hệ số 3', args: [4, { base: 10, factor: 3 }], expect: [10, 30, 90, 270] },
    { label: 'một lần thử lại', args: [1], expect: [100] },
    { label: 'không thử lại', args: [0], expect: [] },
    { label: 'số âm', args: [-2], expect: [] },
    { label: 'làm tròn xuống', args: [3, { base: 1.5, factor: 2 }], expect: [1, 3, 6] }
  ],
  solution: `function backoffDelays(attempts, options = {}) {
  const { base = 100, max = 10000, factor = 2 } = options;
  if (!(attempts >= 1)) return [];

  return Array.from({ length: Math.floor(attempts) }, (_, i) =>
    Math.floor(Math.min(max, base * factor ** i))
  );
}`
},
{
  id: 'node-87', lang: 'node', level: 'Nâng cao', topic: 'Kiểm thử', fn: 'deepEqual',
  title: 'Tự viết phép so sánh sâu',
  io: {
    signature: 'deepEqual(a, b) → boolean',
    params: [
      ['a', 'bất kỳ', 'Giá trị thứ nhất: số, chuỗi, boolean, null, undefined, mảng, object thường, hoặc Date.'],
      ['b', 'bất kỳ', 'Giá trị thứ hai.']
    ],
    returns: ['boolean', 'true khi hai giá trị có cùng cấu trúc và cùng nội dung ở mọi tầng.'],
    example: `deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })   // → true
deepEqual([1, 2], [2, 1])                              // → false`
  },
  brief: `<p><code>{ a: 1 } === { a: 1 }</code> là <code>false</code>, vì <code>===</code> so sánh <em>tham chiếu</em> chứ không so nội dung. Mọi framework test đều phải tự viết phép so sánh sâu — kể cả bộ chấm bài của trang này.</p>
<p>Viết hàm <code>deepEqual(a, b)</code>, xét theo thứ tự:</p>
<ol>
<li>Bằng nhau theo <code>Object.is</code> → <code>true</code>. Hàm này xử lý đúng cả <code>NaN</code> (bằng chính nó) lẫn <code>-0</code> khác <code>0</code></li>
<li>Một trong hai là <code>null</code> hoặc không phải object → <code>false</code></li>
<li>Cả hai là <code>Date</code> → so <code>getTime()</code></li>
<li>Một là mảng còn cái kia không → <code>false</code></li>
<li>Cả hai là mảng → cùng độ dài và từng phần tử <code>deepEqual</code></li>
<li>Cả hai là object → cùng số khoá, và mọi khoá của <code>a</code> đều có trong <code>b</code> với giá trị <code>deepEqual</code></li>
</ol>
<p class="callout">Thứ tự khoá không quan trọng — <code>{ a: 1, b: 2 }</code> bằng <code>{ b: 2, a: 1 }</code>. Nhưng thứ tự phần tử mảng thì quan trọng, vì mảng vốn có thứ tự.</p>`,
  starter: `function deepEqual(a, b) {
  // Viết code ở đây
}`,
  hints: [
    'Object.is(a, b) thay cho === giúp NaN so sánh đúng.',
    'typeof null là "object" — kiểm tra null trước.',
    'Array.isArray phải xét trước khi coi cả hai là object thường.'
  ],
  tests: [
    { label: 'số bằng nhau', args: [1, 1], expect: true },
    { label: 'NaN bằng chính nó', args: [NaN, NaN], expect: true },
    { label: 'khác kiểu', args: [1, '1'], expect: false },
    { label: 'null và object', args: [null, {}], expect: false },
    { label: 'object cùng nội dung', args: [{ a: 1 }, { a: 1 }], expect: true },
    { label: 'thứ tự khoá không quan trọng', args: [{ a: 1, b: 2 }, { b: 2, a: 1 }], expect: true },
    { label: 'thiếu khoá', args: [{ a: 1 }, { a: 1, b: 2 }], expect: false },
    { label: 'lồng nhiều tầng', args: [{ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }], expect: true },
    { label: 'mảng khác thứ tự', args: [[1, 2], [2, 1]], expect: false },
    { label: 'mảng khác độ dài', args: [[1], [1, 2]], expect: false },
    { label: 'mảng và object không bằng nhau', args: [[], {}], expect: false },
    { label: 'Date cùng thời điểm', script: `return fn(new Date('2026-01-01'), new Date('2026-01-01'));`, expect: true },
    { label: 'Date khác thời điểm', script: `return fn(new Date('2026-01-01'), new Date('2026-01-02'));`, expect: false },
    { label: 'undefined bằng undefined', args: [undefined, undefined], expect: true }
  ],
  solution: `function deepEqual(a, b) {
  if (Object.is(a, b)) return true;

  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;

  return keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
}`
},
{
  id: 'node-88', lang: 'node', level: 'Trung bình', topic: 'Kiểm thử', fn: 'createClock',
  title: 'Đồng hồ giả cho test',
  io: {
    signature: 'createClock(start) → { now, at, advance, pending }',
    params: [
      ['start', 'number · mặc định 0', 'Thời điểm ban đầu, tính bằng mili giây.'],
      ['at(delay, callback)', 'function', 'Hẹn chạy callback sau delay mili giây kể từ thời điểm HIỆN TẠI của đồng hồ.'],
      ['advance(ms)', 'function', 'Tua đồng hồ tới trước ms mili giây, chạy mọi callback đã tới hạn theo đúng thứ tự thời gian.'],
      ['pending()', 'function', 'Số callback còn đang chờ.']
    ],
    returns: ['object', 'now() → number · at(delay, cb) → void · advance(ms) → void · pending() → number.'],
    example: `const clock = createClock(0);
clock.at(100, () => console.log('xong'));
clock.advance(50);    // chưa gì cả
clock.advance(50);    // in ra 'xong'`
  },
  brief: `<p>Test một cache có hạn 10 phút mà phải <em>chờ</em> 10 phút thì không ai chạy test nữa. Lời giải: đừng dùng đồng hồ thật. Truyền vào một hàm lấy thời gian, và trong test thì đưa cho nó một đồng hồ bạn tự tua.</p>
<p>Bạn đã gặp mẫu này ở bài cache và bài rate limiter — tham số <code>now</code> tồn tại chính vì lý do đó. Bài này dựng luôn chiếc đồng hồ.</p>
<ul>
<li><code>now()</code> trả về thời điểm hiện tại của đồng hồ</li>
<li><code>at(delay, callback)</code> hẹn giờ, tính từ thời điểm hiện tại</li>
<li><code>advance(ms)</code> tua tới trước, chạy mọi callback đã tới hạn <strong>theo đúng thứ tự thời gian</strong>, và đặt <code>now()</code> đúng bằng thời điểm sau khi tua</li>
<li>Callback chạy rồi thì bị gỡ khỏi hàng đợi</li>
<li>Hai callback cùng thời điểm → chạy theo thứ tự đã hẹn</li>
<li>Callback hẹn <strong>bên trong</strong> một callback khác, mà tới hạn trong cùng lần tua, cũng phải được chạy</li>
</ul>
<p>Điều cuối là chỗ dễ sai nhất: nếu bạn lọc danh sách một lần rồi chạy, những callback sinh ra giữa chừng sẽ bị bỏ sót.</p>`,
  starter: `function createClock(start = 0) {
  // Viết code ở đây
}`,
  hints: [
    'Giữ một mảng { time, seq, callback } và một biến đếm seq để phá thế hoà.',
    'Trong advance, lặp while: mỗi vòng tìm callback sớm nhất còn hạn, đặt now bằng thời điểm của nó rồi chạy.',
    'Đặt now về đúng mốc cuối cùng sau khi không còn callback nào tới hạn.'
  ],
  tests: [
    { label: 'thời điểm ban đầu', script: `return fn(1000).now();`, expect: 1000 },
    { label: 'tua thì now tăng', script: `const c = fn(0); c.advance(50); return c.now();`, expect: 50 },
    { label: 'chưa tới hạn thì chưa chạy', script: `const log = [];
const c = fn(0);
c.at(100, () => log.push('xong'));
c.advance(50);
return log;`, expect: [] },
    { label: 'tới hạn thì chạy', script: `const log = [];
const c = fn(0);
c.at(100, () => log.push('xong'));
c.advance(100);
return log;`, expect: ['xong'] },
    { label: 'chạy theo thứ tự thời gian', script: `const log = [];
const c = fn(0);
c.at(300, () => log.push('c'));
c.at(100, () => log.push('a'));
c.at(200, () => log.push('b'));
c.advance(500);
return log;`, expect: ['a', 'b', 'c'] },
    { label: 'cùng thời điểm thì theo thứ tự hẹn', script: `const log = [];
const c = fn(0);
c.at(100, () => log.push('truoc'));
c.at(100, () => log.push('sau'));
c.advance(100);
return log;`, expect: ['truoc', 'sau'] },
    { label: 'callback thấy đúng thời điểm của mình', script: `const log = [];
const c = fn(0);
c.at(100, () => log.push(c.now()));
c.at(250, () => log.push(c.now()));
c.advance(500);
return log;`, expect: [100, 250] },
    { label: 'chạy xong thì gỡ khỏi hàng đợi', script: `const c = fn(0);
c.at(10, () => {});
c.advance(10);
return c.pending();`, expect: 0 },
    { label: 'callback hẹn thêm callback', script: `const log = [];
const c = fn(0);
c.at(10, () => { log.push('dau'); c.at(10, () => log.push('sau')); });
c.advance(100);
return log;`, expect: ['dau', 'sau'] },
    { label: 'tua nhiều lần cộng dồn', script: `const log = [];
const c = fn(0);
c.at(150, () => log.push('xong'));
c.advance(100);
c.advance(100);
return { log, now: c.now() };`, expect: { log: ['xong'], now: 200 } }
  ],
  solution: `function createClock(start = 0) {
  let current = start;
  let seq = 0;
  let queue = [];

  return {
    now: () => current,

    at(delay, callback) {
      queue.push({ time: current + delay, seq: seq++, callback });
    },

    advance(ms) {
      const target = current + ms;

      while (true) {
        const den = queue.filter((item) => item.time <= target);
        if (den.length === 0) break;

        den.sort((a, b) => (a.time - b.time) || (a.seq - b.seq));
        const item = den[0];

        queue = queue.filter((x) => x !== item);
        current = item.time;
        item.callback();
      }

      current = target;
    },

    pending: () => queue.length,
  };
}`
},
{
  id: 'node-89', lang: 'node', level: 'Trung bình', topic: 'SQLite', fn: 'buildWhereIn',
  title: 'Mệnh đề IN với số lượng thay đổi',
  io: {
    signature: 'buildWhereIn(column, values) → { sql, values }',
    params: [
      ['column', 'string', 'Tên cột. Chỉ được gồm chữ, số và gạch dưới; sai thì ném Error("tên không hợp lệ").'],
      ['values', 'Array · mặc định []', 'Danh sách giá trị cần lọc. Giá trị trùng nhau phải được loại bớt, giữ lần xuất hiện đầu.']
    ],
    returns: ['object',
      '{ sql: string, values: Array }. Danh sách rỗng (hoặc rỗng sau khi loại trùng) → sql là "1 = 0" và values rỗng.'],
    example: `buildWhereIn('id', [1, 2, 3])
// → { sql: 'id IN (?, ?, ?)', values: [1, 2, 3] }`
  },
  brief: `<p>Lọc theo một danh sách id là việc rất hay gặp, và nó có một cái bẫy: số lượng dấu hỏi phải khớp với số giá trị, mà số giá trị thì thay đổi theo từng lần gọi.</p>
<p>Viết hàm <code>buildWhereIn(column, values)</code>:</p>
<ul>
<li>Sinh <code>cot IN (?, ?, ?)</code> với đúng số dấu hỏi bằng số giá trị</li>
<li>Loại giá trị trùng, <strong>giữ lần xuất hiện đầu tiên</strong></li>
<li>Danh sách rỗng → <code>sql</code> là <code>'1 = 0'</code> và <code>values</code> rỗng</li>
<li>Tên cột sai định dạng → ném <code>Error('tên không hợp lệ')</code></li>
</ul>
<p class="warn">Vì sao danh sách rỗng lại cho <code>1 = 0</code>? Vì <code>cot IN ()</code> là <strong>lỗi cú pháp SQL</strong> ở hầu hết database. Còn nếu bạn bỏ luôn mệnh đề <code>WHERE</code> thì câu lệnh trả về <em>toàn bộ bảng</em> — đúng ngược với ý định "không lọc được gì cả". <code>1 = 0</code> là một điều kiện luôn sai, tức là không dòng nào khớp: chính xác điều bạn muốn.</p>
<p class="callout">Giới hạn cần biết: SQLite cho tối đa 999 tham số trong một câu lệnh, PostgreSQL là 65535. Với danh sách dài hơn, hãy chia thành nhiều lô — chính là bài <code>chunk</code> bạn đã làm.</p>`,
  starter: `function buildWhereIn(column, values = []) {
  // Viết code ở đây
}`,
  hints: [
    '[...new Set(values)] loại trùng và giữ nguyên thứ tự xuất hiện đầu.',
    'Array(n).fill("?").join(", ") sinh dãy dấu hỏi.',
    'Kiểm tra tên cột trước khi làm bất cứ việc gì khác.'
  ],
  tests: [
    { label: 'ba giá trị', args: ['id', [1, 2, 3]], expect: { sql: 'id IN (?, ?, ?)', values: [1, 2, 3] } },
    { label: 'một giá trị', args: ['user_id', [7]], expect: { sql: 'user_id IN (?)', values: [7] } },
    { label: 'loại trùng', args: ['id', [1, 2, 1, 3, 2]], expect: { sql: 'id IN (?, ?, ?)', values: [1, 2, 3] } },
    { label: 'danh sách rỗng', args: ['id', []], expect: { sql: '1 = 0', values: [] } },
    { label: 'giá trị chuỗi', args: ['status', ['moi', 'dang_xu_ly']], expect: { sql: 'status IN (?, ?)', values: ['moi', 'dang_xu_ly'] } },
    { label: 'giá trị nguy hiểm vẫn nằm ngoài sql', args: ['name', ["' OR 1=1 --"]], expect: { sql: 'name IN (?)', values: ["' OR 1=1 --"] } },
    { label: 'tên cột lạ bị chặn', script: `try { fn('id; DROP TABLE x', [1]); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'tên không hợp lệ' }
  ],
  solution: `function buildWhereIn(column, values = []) {
  if (!/^[A-Za-z0-9_]+$/.test(String(column))) throw new Error('tên không hợp lệ');

  const unique = [...new Set(values)];
  if (unique.length === 0) return { sql: '1 = 0', values: [] };

  const holders = new Array(unique.length).fill('?').join(', ');
  return { sql: column + ' IN (' + holders + ')', values: unique };
}`
},
{
  id: 'node-90', lang: 'node', level: 'Trung bình', topic: 'Database', fn: 'groupRows',
  title: 'Nhóm các dòng theo một cột',
  io: {
    signature: 'groupRows(rows, key) → object',
    params: [
      ['rows', 'Array<object> · mặc định []', 'Các dòng lấy từ database.'],
      ['key', 'string | function', 'Tên cột để nhóm, hoặc một hàm nhận dòng và trả về khoá nhóm.']
    ],
    returns: ['object',
      'Khoá nhóm (luôn là chuỗi) → mảng các dòng thuộc nhóm đó, giữ nguyên thứ tự xuất hiện. Dòng có khoá null hoặc undefined bị bỏ qua.'],
    example: `groupRows([{ userId: 1, task: 'a' }, { userId: 2, task: 'b' }, { userId: 1, task: 'c' }], 'userId')
// → { '1': [{ userId: 1, task: 'a' }, { userId: 1, task: 'c' }], '2': [{ userId: 2, task: 'b' }] }`
  },
  brief: `<p>Database trả về danh sách phẳng, nhưng giao diện thường cần dữ liệu đã nhóm: todo theo người dùng, đơn hàng theo tháng, log theo mức độ. Gom nhóm ở tầng ứng dụng là một phép biến đổi bạn viết đi viết lại — nên viết một lần cho tử tế.</p>
<ul>
<li><code>key</code> là chuỗi → lấy giá trị của cột đó</li>
<li><code>key</code> là hàm → gọi nó với từng dòng để lấy khoá nhóm</li>
<li>Khoá nhóm luôn được đổi sang chuỗi (object của JavaScript chỉ nhận khoá chuỗi)</li>
<li>Giữ <strong>nguyên thứ tự xuất hiện</strong> của các dòng trong mỗi nhóm</li>
<li>Dòng có khoá là <code>null</code> hoặc <code>undefined</code> thì bỏ qua hẳn</li>
<li>Danh sách rỗng → <code>{}</code></li>
</ul>
<p class="callout">Gom nhóm bằng JavaScript hợp lý khi bạn <em>đã</em> phải lấy toàn bộ dữ liệu về. Nếu chỉ cần con số tổng hợp, hãy để database làm: <code>GROUP BY</code> chạy trên dữ liệu đã có sẵn index, và trả về ít byte hơn hàng nghìn lần.</p>`,
  starter: `function groupRows(rows = [], key) {
  // Viết code ở đây
}`,
  hints: [
    'typeof key === "function" quyết định cách lấy khoá.',
    'Dùng object thường với Object.create(null) hoặc {} đều được.',
    'result[k] ??= [] tạo mảng khi chưa có.'
  ],
  tests: [
    { label: 'nhóm theo cột', args: [[{ userId: 1, task: 'a' }, { userId: 2, task: 'b' }, { userId: 1, task: 'c' }], 'userId'], expect: { 1: [{ userId: 1, task: 'a' }, { userId: 1, task: 'c' }], 2: [{ userId: 2, task: 'b' }] } },
    { label: 'giữ thứ tự trong nhóm', script: `const out = fn([{ g: 'x', n: 1 }, { g: 'x', n: 2 }, { g: 'x', n: 3 }], 'g');
return out.x.map((r) => r.n);`, expect: [1, 2, 3] },
    { label: 'nhóm bằng hàm', args: [[{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }], (r) => (r.n % 2 === 0 ? 'chan' : 'le')], expect: { le: [{ n: 1 }, { n: 3 }], chan: [{ n: 2 }, { n: 4 }] } },
    { label: 'khoá null bị bỏ qua', args: [[{ g: null, n: 1 }, { g: 'a', n: 2 }], 'g'], expect: { a: [{ g: 'a', n: 2 }] } },
    { label: 'thiếu hẳn cột cũng bị bỏ qua', args: [[{ n: 1 }, { g: 'a', n: 2 }], 'g'], expect: { a: [{ g: 'a', n: 2 }] } },
    { label: 'khoá số thành chuỗi', script: `return Object.keys(fn([{ g: 7 }], 'g'));`, expect: ['7'] },
    { label: 'danh sách rỗng', args: [[], 'g'], expect: {} },
    { label: 'khoá false vẫn được nhóm', script: `return Object.keys(fn([{ done: false }], 'done'));`, expect: ['false'] }
  ],
  solution: `function groupRows(rows = [], key) {
  const layKhoa = typeof key === 'function' ? key : (row) => row[key];
  const result = {};

  for (const row of rows) {
    const raw = layKhoa(row);
    if (raw == null) continue;

    const group = String(raw);
    if (!result[group]) result[group] = [];
    result[group].push(row);
  }

  return result;
}`
},
{
  id: 'node-91', lang: 'node', level: 'Nâng cao', topic: 'Database', fn: 'detectNPlusOne',
  title: 'Phát hiện N+1 từ log truy vấn',
  io: {
    signature: 'detectNPlusOne(log, threshold) → Array<object>',
    params: [
      ['log', 'Array<string> · mặc định []', 'Các câu lệnh SQL đã chạy trong một request, theo đúng thứ tự.'],
      ['threshold', 'number · mặc định 3', 'Từ bao nhiêu lần lặp trở lên thì coi là đáng ngờ.']
    ],
    returns: ['Array<object>',
      'Mảng { pattern: string, count: number } cho những mẫu câu lệnh lặp từ threshold lần trở lên. Sắp giảm dần theo count, cùng count thì theo bảng chữ cái.'],
    example: `detectNPlusOne([
  'SELECT * FROM users',
  'SELECT * FROM todos WHERE user_id = 1',
  'SELECT * FROM todos WHERE user_id = 2',
  'SELECT * FROM todos WHERE user_id = 3'
])
// → [{ pattern: 'SELECT * FROM todos WHERE user_id = ?', count: 3 }]`
  },
  brief: `<p>Truy vấn N+1 không báo lỗi. Nó chỉ làm ứng dụng chậm dần theo số bản ghi, nên thường chỉ lộ ra khi đã chạy thật. Cách phát hiện đáng tin nhất là bật log truy vấn rồi đếm: <em>một request mà chạy 201 câu lệnh gần như giống hệt nhau thì gần như chắc chắn là N+1</em>.</p>
<p>Viết hàm <code>detectNPlusOne(log, threshold)</code>:</p>
<ol>
<li><strong>Chuẩn hoá</strong> từng câu lệnh thành một <em>mẫu</em>: thay mọi số nguyên đứng riêng bằng <code>?</code>, và thay mọi chuỗi trong nháy đơn bằng <code>?</code></li>
<li>Đếm số lần mỗi mẫu xuất hiện</li>
<li>Giữ những mẫu có số lần từ <code>threshold</code> trở lên</li>
<li>Sắp giảm dần theo số lần; cùng số lần thì sắp theo bảng chữ cái của mẫu</li>
</ol>
<p>Chuẩn hoá là phần cốt lõi: <code>WHERE user_id = 1</code> và <code>WHERE user_id = 2</code> là hai chuỗi khác nhau nhưng cùng một mẫu, và chính sự lặp lại của mẫu mới là dấu hiệu.</p>
<p class="callout">Trong thực tế, bạn bật log của Prisma hoặc dùng một middleware đếm truy vấn mỗi request, rồi cảnh báo khi vượt ngưỡng. Phát hiện sớm luôn rẻ hơn tối ưu muộn.</p>`,
  starter: `function detectNPlusOne(log = [], threshold = 3) {
  // Viết code ở đây
}`,
  hints: [
    'Thay chuỗi trong nháy đơn trước, rồi mới thay số — làm ngược lại thì số nằm trong chuỗi bị đụng tới.',
    '/\\b\\d+\\b/g bắt các số nguyên đứng riêng.',
    'Dùng Map để đếm, rồi chuyển sang mảng để sắp xếp.'
  ],
  tests: [
    { label: 'phát hiện N+1 kinh điển', args: [['SELECT * FROM users', 'SELECT * FROM todos WHERE user_id = 1', 'SELECT * FROM todos WHERE user_id = 2', 'SELECT * FROM todos WHERE user_id = 3']], expect: [{ pattern: 'SELECT * FROM todos WHERE user_id = ?', count: 3 }] },
    { label: 'dưới ngưỡng thì bỏ qua', args: [['SELECT * FROM todos WHERE id = 1', 'SELECT * FROM todos WHERE id = 2']], expect: [] },
    { label: 'ngưỡng tuỳ chỉnh', args: [['SELECT * FROM t WHERE id = 1', 'SELECT * FROM t WHERE id = 2'], 2], expect: [{ pattern: 'SELECT * FROM t WHERE id = ?', count: 2 }] },
    { label: 'chuẩn hoá chuỗi trong nháy', args: [["SELECT * FROM users WHERE username = 'a'", "SELECT * FROM users WHERE username = 'b'", "SELECT * FROM users WHERE username = 'c'"]], expect: [{ pattern: 'SELECT * FROM users WHERE username = ?', count: 3 }] },
    { label: 'nhiều mẫu, sắp giảm dần', args: [['A WHERE x = 1', 'A WHERE x = 2', 'A WHERE x = 3', 'A WHERE x = 4', 'B WHERE y = 1', 'B WHERE y = 2', 'B WHERE y = 3']], expect: [{ pattern: 'A WHERE x = ?', count: 4 }, { pattern: 'B WHERE y = ?', count: 3 }] },
    { label: 'cùng số lần thì theo bảng chữ cái', args: [['B WHERE y = 1', 'B WHERE y = 2', 'B WHERE y = 3', 'A WHERE x = 1', 'A WHERE x = 2', 'A WHERE x = 3']], expect: [{ pattern: 'A WHERE x = ?', count: 3 }, { pattern: 'B WHERE y = ?', count: 3 }] },
    { label: 'log rỗng', args: [[]], expect: [] },
    { label: 'câu lệnh giống hệt cũng tính', args: [['SELECT 1', 'SELECT 1', 'SELECT 1']], expect: [{ pattern: 'SELECT ?', count: 3 }] }
  ],
  solution: `function detectNPlusOne(log = [], threshold = 3) {
  const chuanHoa = (sql) =>
    String(sql)
      .replace(/'[^']*'/g, '?')
      .replace(/\\b\\d+\\b/g, '?');

  const counts = new Map();
  for (const sql of log) {
    const pattern = chuanHoa(sql);
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= threshold)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => (b.count - a.count) || a.pattern.localeCompare(b.pattern));
}`
},
{
  id: 'node-92', lang: 'node', level: 'Nâng cao', topic: 'Database', fn: 'runInTransaction',
  title: 'Transaction và quay lại khi hỏng',
  io: {
    signature: 'runInTransaction(state, steps) → object',
    params: [
      ['state', 'object', 'Trạng thái dữ liệu, ví dụ { stock: 10, orders: [] }. Chỉ chứa giá trị đơn, mảng và object lồng nhau (không có hàm, không có Date).'],
      ['steps', 'Array<function> · mặc định []', 'Các bước cần chạy tuần tự. Mỗi bước nhận bản nháp của state và sửa trực tiếp lên đó. Bước nào ném lỗi thì cả giao dịch bị huỷ.']
    ],
    returns: ['object',
      '{ ok: boolean, state: object, error: string | null } — state là kết quả cuối cùng khi thành công, hoặc BẢN GỐC không đổi khi thất bại.'],
    example: `runInTransaction({ stock: 10, orders: [] }, [
  (s) => { s.stock -= 3; },
  (s) => { s.orders.push({ qty: 3 }); }
])
// → { ok: true, state: { stock: 7, orders: [{ qty: 3 }] }, error: null }`
  },
  brief: `<p>Đặt hàng gồm ba bước: trừ tồn kho, tạo đơn, ghi lịch sử. Bước ba hỏng mà hai bước đầu đã ghi thì dữ liệu sai vĩnh viễn — kho thiếu ba sản phẩm mà không có đơn nào tương ứng.</p>
<p><strong>Transaction</strong> giải quyết bằng một lời hứa đơn giản: <em>hoặc tất cả thành công, hoặc không gì cả</em>.</p>
<p>Viết hàm <code>runInTransaction(state, steps)</code> mô phỏng cơ chế đó:</p>
<ul>
<li>Tạo một <strong>bản nháp sâu</strong> của <code>state</code> rồi chạy các bước trên bản nháp</li>
<li>Mọi bước chạy êm → <code>{ ok: true, state: &lt;bản nháp&gt;, error: null }</code></li>
<li>Một bước ném lỗi → dừng ngay, <strong>không chạy các bước sau</strong>, trả <code>{ ok: false, state: &lt;bản GỐC, không đổi&gt;, error: &lt;message của lỗi&gt; }</code></li>
<li><code>state</code> gốc <strong>không bao giờ</strong> bị thay đổi, kể cả khi thành công</li>
<li>Danh sách bước rỗng → thành công, state là bản sao của gốc</li>
</ul>
<p class="warn">Điểm mấu chốt là <em>bản sao sâu</em>. Sao chép nông bằng <code>{ ...state }</code> thì mảng và object con vẫn dùng chung tham chiếu — một bước đẩy phần tử vào <code>state.orders</code> sẽ sửa luôn bản gốc, và phép quay lại của bạn không quay được gì cả.</p>`,
  starter: `function runInTransaction(state, steps = []) {
  // Viết code ở đây
}`,
  hints: [
    'structuredClone hoặc JSON.parse(JSON.stringify(x)) đều cho bản sao sâu ở bài này.',
    'Bọc vòng lặp trong try/catch, và trả về state gốc ở nhánh catch.',
    'Nhánh thành công trả về bản nháp, không phải bản gốc.'
  ],
  tests: [
    { label: 'mọi bước thành công', script: `return fn({ stock: 10, orders: [] }, [
  (s) => { s.stock -= 3; },
  (s) => { s.orders.push({ qty: 3 }); }
]);`, expect: { ok: true, state: { stock: 7, orders: [{ qty: 3 }] }, error: null } },
    { label: 'một bước hỏng thì quay lại hết', script: `return fn({ stock: 10, orders: [] }, [
  (s) => { s.stock -= 3; },
  () => { throw new Error('het hang'); }
]);`, expect: { ok: false, state: { stock: 10, orders: [] }, error: 'het hang' } },
    { label: 'không chạy bước sau khi đã hỏng', script: `const log = [];
fn({ n: 0 }, [
  () => { log.push('a'); },
  () => { throw new Error('x'); },
  () => { log.push('c'); }
]);
return log;`, expect: ['a'] },
    { label: 'state gốc không đổi khi hỏng', script: `const goc = { stock: 10, orders: [] };
fn(goc, [(s) => { s.stock = 0; s.orders.push('x'); }, () => { throw new Error('x'); }]);
return goc;`, expect: { stock: 10, orders: [] } },
    { label: 'state gốc không đổi kể cả khi thành công', script: `const goc = { stock: 10, orders: [] };
fn(goc, [(s) => { s.stock = 7; s.orders.push('x'); }]);
return goc;`, expect: { stock: 10, orders: [] } },
    { label: 'danh sách bước rỗng', script: `return fn({ a: 1 }, []);`, expect: { ok: true, state: { a: 1 }, error: null } },
    { label: 'sửa sâu vào object lồng nhau', script: `return fn({ kho: { ao: 5 } }, [(s) => { s.kho.ao -= 2; }]).state;`, expect: { kho: { ao: 3 } } },
    { label: 'bước sau dùng kết quả bước trước', script: `return fn({ n: 1 }, [
  (s) => { s.n = s.n + 1; },
  (s) => { s.n = s.n * 10; }
]).state;`, expect: { n: 20 } }
  ],
  solution: `function runInTransaction(state, steps = []) {
  const draft = structuredClone(state);

  try {
    for (const step of steps) step(draft);
    return { ok: true, state: draft, error: null };
  } catch (err) {
    return { ok: false, state, error: err.message };
  }
}`
},
{
  id: 'node-93', lang: 'node', level: 'Trung bình', topic: 'Cấu hình', fn: 'diffEnv',
  title: 'So .env với .env.example',
  io: {
    signature: 'diffEnv(example, actual) → object',
    params: [
      ['example', 'object · mặc định {}', 'Các biến khai trong .env.example — tên biến → giá trị mẫu (thường là chuỗi rỗng).'],
      ['actual', 'object · mặc định {}', 'Các biến thực sự có trong môi trường, thường là process.env.']
    ],
    returns: ['object',
      '{ missing: Array<string>, empty: Array<string>, extra: Array<string> } — cả ba đều sắp theo bảng chữ cái.'],
    example: `diffEnv({ PORT: '', JWT_SECRET: '' }, { PORT: '5003', JWT_SECRET: '' })
// → { missing: [], empty: ['JWT_SECRET'], extra: [] }`
  },
  brief: `<p>Người mới clone dự án, chép <code>.env.example</code> thành <code>.env</code>, rồi quên điền một biến. Server khởi động bình thường và hỏng ba giờ sau, ở một endpoint chẳng liên quan gì tới biến đó.</p>
<p>Cách phòng: kiểm tra ngay lúc khởi động và chết ngay nếu thiếu. Viết hàm <code>diffEnv(example, actual)</code> làm phép so sánh.</p>
<table><thead><tr><th>Nhóm</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td><code>missing</code></td><td>Có trong example nhưng <strong>không có mặt</strong> trong actual</td></tr>
<tr><td><code>empty</code></td><td>Có mặt nhưng giá trị rỗng hoặc chỉ toàn khoảng trắng</td></tr>
<tr><td><code>extra</code></td><td>Có trong actual mà example không khai — thường là biến hệ thống, hoặc một biến ai đó thêm mà quên cập nhật example</td></tr>
</tbody></table>
<ul>
<li>Một biến chỉ thuộc <strong>một</strong> nhóm: thiếu hẳn thì vào <code>missing</code>, không vào <code>empty</code></li>
<li>Cả ba mảng sắp theo bảng chữ cái</li>
</ul>
<p class="callout">Ứng dụng nên <strong>chết ngay khi khởi động</strong> nếu <code>missing</code> khác rỗng. Chết lúc khởi động là một dòng lỗi rõ ràng; chết giữa chừng ở môi trường thật là một sự cố.</p>`,
  starter: `function diffEnv(example = {}, actual = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Object.hasOwn phân biệt "không có mặt" với "có mà rỗng".',
    'String(value).trim() === "" nhận ra cả chuỗi toàn khoảng trắng.',
    'Nhớ sort() cả ba mảng trước khi trả về.'
  ],
  tests: [
    { label: 'đầy đủ', args: [{ PORT: '', JWT_SECRET: '' }, { PORT: '5003', JWT_SECRET: 'abc' }], expect: { missing: [], empty: [], extra: [] } },
    { label: 'thiếu biến', args: [{ PORT: '', JWT_SECRET: '' }, { PORT: '5003' }], expect: { missing: ['JWT_SECRET'], empty: [], extra: [] } },
    { label: 'có mà rỗng', args: [{ JWT_SECRET: '' }, { JWT_SECRET: '' }], expect: { missing: [], empty: ['JWT_SECRET'], extra: [] } },
    { label: 'toàn khoảng trắng cũng là rỗng', args: [{ JWT_SECRET: '' }, { JWT_SECRET: '   ' }], expect: { missing: [], empty: ['JWT_SECRET'], extra: [] } },
    { label: 'biến thừa', args: [{ PORT: '' }, { PORT: '5003', NODE_ENV: 'production' }], expect: { missing: [], empty: [], extra: ['NODE_ENV'] } },
    { label: 'thiếu hẳn thì không tính là rỗng', script: `const out = fn({ A: '' }, {});
return { missing: out.missing, empty: out.empty };`, expect: { missing: ['A'], empty: [] } },
    { label: 'sắp theo bảng chữ cái', args: [{ ZED: '', ALPHA: '' }, {}], expect: { missing: ['ALPHA', 'ZED'], empty: [], extra: [] } },
    { label: 'cả hai rỗng', args: [{}, {}], expect: { missing: [], empty: [], extra: [] } }
  ],
  solution: `function diffEnv(example = {}, actual = {}) {
  const missing = [];
  const empty = [];

  for (const key of Object.keys(example)) {
    if (!Object.hasOwn(actual, key)) {
      missing.push(key);
      continue;
    }
    if (String(actual[key] ?? '').trim() === '') empty.push(key);
  }

  const extra = Object.keys(actual).filter((key) => !Object.hasOwn(example, key));

  return { missing: missing.sort(), empty: empty.sort(), extra: extra.sort() };
}`
},
{
  id: 'node-94', lang: 'node', level: 'Cơ bản', topic: 'Vận hành', fn: 'uptimeText',
  title: 'Hiển thị thời gian chạy cho người đọc',
  io: {
    signature: 'uptimeText(seconds) → string',
    params: [
      ['seconds', 'number', 'Số giây ứng dụng đã chạy, ví dụ từ process.uptime(). Có thể là số thập phân.']
    ],
    returns: ['string', 'Chuỗi gọn kiểu "2 ngày 3 giờ". Dưới một phút thì trả về số giây.'],
    example: `uptimeText(0)        // → '0 giây'
uptimeText(90)       // → '1 phút 30 giây'
uptimeText(180000)   // → '2 ngày 2 giờ'`
  },
  brief: `<p>Endpoint <code>/health</code> trả về <code>{ "uptime": 183642.7 }</code> thì đúng về kỹ thuật nhưng không ai đọc nổi. Con người cần "2 ngày 3 giờ".</p>
<p>Viết hàm <code>uptimeText(seconds)</code> theo quy tắc: <strong>chỉ hiển thị hai đơn vị lớn nhất khác 0</strong>.</p>
<table><thead><tr><th>Giây</th><th>Kết quả</th></tr></thead><tbody>
<tr><td>0</td><td><code>0 giây</code></td></tr>
<tr><td>45</td><td><code>45 giây</code></td></tr>
<tr><td>90</td><td><code>1 phút 30 giây</code></td></tr>
<tr><td>3600</td><td><code>1 giờ</code></td></tr>
<tr><td>3660</td><td><code>1 giờ 1 phút</code></td></tr>
<tr><td>180000</td><td><code>2 ngày 2 giờ</code></td></tr>
</tbody></table>
<ul>
<li>Bốn đơn vị: <code>ngày</code>, <code>giờ</code>, <code>phút</code>, <code>giây</code></li>
<li>Bỏ qua các đơn vị bằng 0 ở đầu; lấy tối đa hai đơn vị đầu tiên khác 0, <strong>liền nhau theo thứ tự</strong></li>
<li>Đơn vị thứ hai bằng 0 thì bỏ luôn: 3600 giây là <code>1 giờ</code>, không phải <code>1 giờ 0 phút</code></li>
<li>Số thập phân thì cắt phần lẻ</li>
<li>Số âm hoặc không phải số → <code>0 giây</code></li>
</ul>`,
  starter: `function uptimeText(seconds) {
  // Viết code ở đây
}`,
  hints: [
    'Tính lần lượt ngày, giờ, phút, giây bằng phép chia lấy nguyên và chia lấy dư.',
    'Dựng mảng [[giá trị, tên đơn vị], ...] rồi lọc bỏ các giá trị bằng 0.',
    'slice(0, 2) lấy hai đơn vị đầu; mảng rỗng thì trả "0 giây".'
  ],
  tests: [
    { label: 'không giây', args: [0], expect: '0 giây' },
    { label: 'dưới một phút', args: [45], expect: '45 giây' },
    { label: 'phút và giây', args: [90], expect: '1 phút 30 giây' },
    { label: 'tròn giờ', args: [3600], expect: '1 giờ' },
    { label: 'giờ và phút', args: [3660], expect: '1 giờ 1 phút' },
    { label: 'bỏ qua giây khi đã có hai đơn vị', args: [3661], expect: '1 giờ 1 phút' },
    { label: 'ngày và giờ', args: [180000], expect: '2 ngày 2 giờ' },
    { label: 'tròn ngày', args: [86400], expect: '1 ngày' },
    { label: 'cắt phần thập phân', args: [45.9], expect: '45 giây' },
    { label: 'số âm', args: [-5], expect: '0 giây' },
    { label: 'không phải số', args: ['abc'], expect: '0 giây' }
  ],
  solution: `function uptimeText(seconds) {
  const total = Math.floor(Number(seconds));
  if (!Number.isFinite(total) || total <= 0) return '0 giây';

  const parts = [
    [Math.floor(total / 86400), 'ngày'],
    [Math.floor((total % 86400) / 3600), 'giờ'],
    [Math.floor((total % 3600) / 60), 'phút'],
    [total % 60, 'giây'],
  ];

  const dau = parts.findIndex(([value]) => value > 0);
  if (dau === -1) return '0 giây';

  return parts
    .slice(dau, dau + 2)
    .filter(([value]) => value > 0)
    .map(([value, unit]) => value + ' ' + unit)
    .join(' ');
}`
},
{
  id: 'node-95', lang: 'node', level: 'Trung bình', topic: 'Vận hành', fn: 'parseLogLine',
  title: 'Đọc ngược một dòng log',
  io: {
    signature: 'parseLogLine(line) → object | null',
    params: [
      ['line', 'string', 'Một dòng log dạng "GET /todos 200 4ms user=7 SLOW". Bốn phần đầu bắt buộc; user và SLOW là tuỳ chọn.']
    ],
    returns: ['object | null',
      '{ method, path, status, ms, userId, slow }. Dòng không đúng định dạng → null.'],
    example: `parseLogLine('POST /todos 201 13ms user=7')
// → { method: 'POST', path: '/todos', status: 201, ms: 13, userId: 7, slow: false }`
  },
  brief: `<p>Log chỉ có giá trị khi đọc lại được bằng máy. Đây là chiều ngược của bài <code>formatLogLine</code>: từ một dòng văn bản dựng lại object.</p>
<pre>GET /todos 200 4ms user=7 SLOW
└┬┘ └──┬─┘ └┬┘ └┬┘ └──┬─┘ └─┬┘
 │     │    │   │     │     └ tuỳ chọn: request chậm
 │     │    │   │     └ tuỳ chọn: id người dùng
 │     │    │   └ thời gian xử lý
 │     │    └ status code
 │     └ đường dẫn
 └ method</pre>
<ul>
<li>Tách theo khoảng trắng; ít hơn bốn phần → <code>null</code></li>
<li><code>status</code> và <code>ms</code> phải là số nguyên; sai thì <code>null</code></li>
<li>Phần <code>ms</code> phải kết thúc bằng <code>ms</code>; không thì <code>null</code></li>
<li><code>userId</code> lấy từ phần <code>user=&lt;số&gt;</code>; không có thì <code>null</code></li>
<li><code>slow</code> là <code>true</code> khi có phần <code>SLOW</code></li>
<li>Thứ tự của <code>user=</code> và <code>SLOW</code> không quan trọng</li>
</ul>`,
  starter: `function parseLogLine(line) {
  // Viết code ở đây
}`,
  hints: [
    'trim rồi split(/\\s+/) để không bị dính khoảng trắng thừa.',
    'Kiểm tra endsWith("ms") rồi slice bỏ hai ký tự cuối.',
    'Duyệt các phần còn lại và xét từng cái, thay vì cố định vị trí.'
  ],
  tests: [
    { label: 'dòng tối giản', args: ['GET /todos 200 4ms'], expect: { method: 'GET', path: '/todos', status: 200, ms: 4, userId: null, slow: false } },
    { label: 'có userId', args: ['POST /todos 201 13ms user=7'], expect: { method: 'POST', path: '/todos', status: 201, ms: 13, userId: 7, slow: false } },
    { label: 'có SLOW', args: ['GET /report 200 2400ms SLOW'], expect: { method: 'GET', path: '/report', status: 200, ms: 2400, userId: null, slow: true } },
    { label: 'đủ cả hai', args: ['GET /x 200 1000ms user=3 SLOW'], expect: { method: 'GET', path: '/x', status: 200, ms: 1000, userId: 3, slow: true } },
    { label: 'thứ tự ngược cũng đọc được', args: ['GET /x 200 1000ms SLOW user=3'], expect: { method: 'GET', path: '/x', status: 200, ms: 1000, userId: 3, slow: true } },
    { label: 'khoảng trắng thừa', args: ['  GET   /todos   200   4ms  '], expect: { method: 'GET', path: '/todos', status: 200, ms: 4, userId: null, slow: false } },
    { label: 'thiếu phần', args: ['GET /todos 200'], expect: null },
    { label: 'status không phải số', args: ['GET /todos OK 4ms'], expect: null },
    { label: 'thiếu hậu tố ms', args: ['GET /todos 200 4'], expect: null },
    { label: 'dòng rỗng', args: [''], expect: null }
  ],
  solution: `function parseLogLine(line) {
  const parts = String(line).trim().split(/\\s+/).filter(Boolean);
  if (parts.length < 4) return null;

  const [method, path, statusText, msText, ...rest] = parts;

  const status = Number(statusText);
  if (!Number.isInteger(status)) return null;

  if (!msText.endsWith('ms')) return null;
  const ms = Number(msText.slice(0, -2));
  if (!Number.isInteger(ms)) return null;

  let userId = null;
  let slow = false;

  for (const part of rest) {
    if (part === 'SLOW') slow = true;
    else if (part.startsWith('user=')) {
      const value = Number(part.slice(5));
      if (Number.isInteger(value)) userId = value;
    }
  }

  return { method, path, status, ms, userId, slow };
}`
},
{
  id: 'node-96', lang: 'node', level: 'Trung bình', topic: 'Vận hành', fn: 'summarizeLogs',
  title: 'Tóm tắt một tập log',
  io: {
    signature: 'summarizeLogs(entries) → object',
    params: [
      ['entries', 'Array<object> · mặc định []', 'Các dòng log đã parse: { method, path, status, ms }. Dòng thiếu status hoặc ms không hợp lệ thì bỏ qua.']
    ],
    returns: ['object',
      '{ total, ok, clientError, serverError, avgMs, p95Ms, slowest } — bốn số đầu là số nguyên đếm, avgMs làm tròn tới số nguyên, slowest là { path, ms } hoặc null.'],
    example: `summarizeLogs([{ path: '/a', status: 200, ms: 10 }, { path: '/b', status: 500, ms: 40 }])
// → { total: 2, ok: 1, clientError: 0, serverError: 1, avgMs: 25, p95Ms: 40, slowest: { path: '/b', ms: 40 } }`
  },
  brief: `<p>Nghìn dòng log không nói lên điều gì cho tới khi được tổng hợp. Bốn con số dưới đây là thứ bạn nhìn đầu tiên mỗi sáng.</p>
<table><thead><tr><th>Trường</th><th>Cách tính</th></tr></thead><tbody>
<tr><td><code>total</code></td><td>Số dòng hợp lệ</td></tr>
<tr><td><code>ok</code></td><td>status từ 200 tới 399</td></tr>
<tr><td><code>clientError</code></td><td>status từ 400 tới 499</td></tr>
<tr><td><code>serverError</code></td><td>status từ 500 trở lên</td></tr>
<tr><td><code>avgMs</code></td><td>Thời gian trung bình, làm tròn tới số nguyên</td></tr>
<tr><td><code>p95Ms</code></td><td>Phân vị 95</td></tr>
<tr><td><code>slowest</code></td><td><code>{ path, ms }</code> của dòng chậm nhất, hoặc <code>null</code></td></tr>
</tbody></table>
<p>Cách tính <strong>p95</strong> trong bài này: sắp mọi <code>ms</code> tăng dần, lấy phần tử ở vị trí <code>ceil(0.95 * n) - 1</code>, tối thiểu là 0.</p>
<p>Dòng không hợp lệ (thiếu <code>status</code>, hoặc <code>ms</code> không phải số hữu hạn) thì bỏ qua và không tính vào <code>total</code>. Danh sách rỗng → mọi số bằng 0 và <code>slowest</code> là <code>null</code>.</p>
<p class="callout">Vì sao nhìn p95 chứ không nhìn trung bình? Vì trung bình che giấu đuôi. Một API có trung bình 40ms nghe rất ổn, nhưng nếu p95 là 3 giây thì cứ hai mươi người dùng lại có một người chờ ba giây — và họ chính là những người bỏ đi.</p>`,
  starter: `function summarizeLogs(entries = []) {
  // Viết code ở đây
}`,
  hints: [
    'Lọc bỏ dòng không hợp lệ ngay từ đầu, rồi mọi phép tính sau đó đều an toàn.',
    'Sắp mảng ms tăng dần một lần, dùng cho cả p95.',
    'Math.round cho avgMs; slowest tìm bằng reduce hoặc một vòng lặp thường.'
  ],
  tests: [
    { label: 'hai dòng', args: [[{ path: '/a', status: 200, ms: 10 }, { path: '/b', status: 500, ms: 40 }]], expect: { total: 2, ok: 1, clientError: 0, serverError: 1, avgMs: 25, p95Ms: 40, slowest: { path: '/b', ms: 40 } } },
    { label: 'phân loại status', args: [[{ path: '/a', status: 204, ms: 1 }, { path: '/b', status: 301, ms: 1 }, { path: '/c', status: 404, ms: 1 }, { path: '/d', status: 503, ms: 1 }]], expect: { total: 4, ok: 2, clientError: 1, serverError: 1, avgMs: 1, p95Ms: 1, slowest: { path: '/a', ms: 1 } } },
    { label: 'trung bình làm tròn', args: [[{ path: '/a', status: 200, ms: 10 }, { path: '/b', status: 200, ms: 11 }]], expect: { total: 2, ok: 2, clientError: 0, serverError: 0, avgMs: 11, p95Ms: 11, slowest: { path: '/b', ms: 11 } } },
    { label: 'p95 trên mười dòng', script: `const entries = [];
for (let i = 1; i <= 10; i++) entries.push({ path: '/p' + i, status: 200, ms: i * 10 });
return fn(entries).p95Ms;`, expect: 100 },
    { label: 'bỏ qua dòng hỏng', args: [[{ path: '/a', status: 200, ms: 10 }, { path: '/b', ms: 20 }, { path: '/c', status: 200, ms: 'abc' }]], expect: { total: 1, ok: 1, clientError: 0, serverError: 0, avgMs: 10, p95Ms: 10, slowest: { path: '/a', ms: 10 } } },
    { label: 'danh sách rỗng', args: [[]], expect: { total: 0, ok: 0, clientError: 0, serverError: 0, avgMs: 0, p95Ms: 0, slowest: null } },
    { label: 'chậm nhất khi có nhiều dòng', args: [[{ path: '/a', status: 200, ms: 5 }, { path: '/cham', status: 200, ms: 900 }, { path: '/b', status: 200, ms: 7 }]], expect: { total: 3, ok: 3, clientError: 0, serverError: 0, avgMs: 304, p95Ms: 900, slowest: { path: '/cham', ms: 900 } } }
  ],
  solution: `function summarizeLogs(entries = []) {
  const rows = entries.filter(
    (e) => Number.isFinite(Number(e.status)) && Number.isFinite(Number(e.ms))
  );

  if (rows.length === 0) {
    return { total: 0, ok: 0, clientError: 0, serverError: 0, avgMs: 0, p95Ms: 0, slowest: null };
  }

  let ok = 0, clientError = 0, serverError = 0, tong = 0;
  let slowest = rows[0];

  for (const row of rows) {
    const status = Number(row.status);
    if (status >= 500) serverError++;
    else if (status >= 400) clientError++;
    else if (status >= 200) ok++;

    tong += Number(row.ms);
    if (Number(row.ms) > Number(slowest.ms)) slowest = row;
  }

  const sorted = rows.map((row) => Number(row.ms)).sort((a, b) => a - b);
  const viTri = Math.max(0, Math.ceil(0.95 * sorted.length) - 1);

  return {
    total: rows.length,
    ok,
    clientError,
    serverError,
    avgMs: Math.round(tong / rows.length),
    p95Ms: sorted[viTri],
    slowest: { path: slowest.path, ms: Number(slowest.ms) },
  };
}`
},
{
  id: 'node-97', lang: 'node', level: 'Cơ bản', topic: 'Hiệu năng', fn: 'rateLimitHeaders',
  title: 'Header cho rate limiting',
  io: {
    signature: 'rateLimitHeaders(state) → object',
    params: [
      ['state', 'object', '{ limit: number — số lượt tối đa; remaining: number — số lượt còn lại; resetAt: number — thời điểm cửa sổ mở lại, tính bằng GIÂY; now: number — thời điểm hiện tại, tính bằng giây }.']
    ],
    returns: ['object',
      'Ba header luôn có: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. Thêm Retry-After khi hết lượt. Mọi giá trị đều là chuỗi.'],
    example: `rateLimitHeaders({ limit: 100, remaining: 0, resetAt: 1060, now: 1000 })
// → { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '0',
//      'X-RateLimit-Reset': '1060', 'Retry-After': '60' }`
  },
  brief: `<p>Trả 429 mà không nói gì thêm thì client chỉ biết thử lại mù. Bộ header dưới đây biến giới hạn thành thứ máy móc đọc được và tự điều chỉnh theo.</p>
<table><thead><tr><th>Header</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td><code>X-RateLimit-Limit</code></td><td>Tối đa bao nhiêu lượt trong một cửa sổ</td></tr>
<tr><td><code>X-RateLimit-Remaining</code></td><td>Còn bao nhiêu lượt</td></tr>
<tr><td><code>X-RateLimit-Reset</code></td><td>Thời điểm cửa sổ mở lại</td></tr>
<tr><td><code>Retry-After</code></td><td>Chờ bao nhiêu giây nữa — <strong>chỉ có khi đã hết lượt</strong></td></tr>
</tbody></table>
<ul>
<li>Ba header đầu <strong>luôn</strong> xuất hiện, kể cả khi request được chấp nhận</li>
<li><code>Retry-After</code> chỉ xuất hiện khi <code>remaining</code> bằng 0 hoặc âm</li>
<li><code>Retry-After</code> bằng <code>resetAt - now</code>, tối thiểu là 1 — nói "chờ 0 giây" thì client quay lại ngay và lại bị chặn</li>
<li><code>remaining</code> âm được hiển thị thành 0</li>
<li>Mọi giá trị đều là <strong>chuỗi</strong>, vì header HTTP là văn bản</li>
</ul>`,
  starter: `function rateLimitHeaders(state = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Math.max(0, remaining) kẹp số âm về 0.',
    'Math.max(1, resetAt - now) cho Retry-After.',
    'String(x) đổi mọi giá trị sang chuỗi.'
  ],
  tests: [
    { label: 'còn lượt', args: [{ limit: 100, remaining: 42, resetAt: 1060, now: 1000 }], expect: { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '42', 'X-RateLimit-Reset': '1060' } },
    { label: 'hết lượt', args: [{ limit: 100, remaining: 0, resetAt: 1060, now: 1000 }], expect: { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1060', 'Retry-After': '60' } },
    { label: 'remaining âm hiển thị 0', args: [{ limit: 10, remaining: -3, resetAt: 1030, now: 1000 }], expect: { 'X-RateLimit-Limit': '10', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1030', 'Retry-After': '30' } },
    { label: 'Retry-After tối thiểu 1', args: [{ limit: 10, remaining: 0, resetAt: 1000, now: 1000 }], expect: { 'X-RateLimit-Limit': '10', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1000', 'Retry-After': '1' } },
    { label: 'cửa sổ đã qua vẫn cho 1', args: [{ limit: 10, remaining: 0, resetAt: 900, now: 1000 }], expect: { 'X-RateLimit-Limit': '10', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '900', 'Retry-After': '1' } },
    { label: 'giá trị là chuỗi', script: `const h = fn({ limit: 1, remaining: 1, resetAt: 2, now: 1 });
return typeof h['X-RateLimit-Limit'];`, expect: 'string' },
    { label: 'còn một lượt thì chưa có Retry-After', script: `return 'Retry-After' in fn({ limit: 10, remaining: 1, resetAt: 1060, now: 1000 });`, expect: false }
  ],
  solution: `function rateLimitHeaders(state = {}) {
  const { limit, remaining, resetAt, now } = state;

  const headers = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(resetAt),
  };

  if (remaining <= 0) {
    headers['Retry-After'] = String(Math.max(1, resetAt - now));
  }

  return headers;
}`
},
{
  id: 'node-98', lang: 'node', level: 'Trung bình', topic: 'Bảo mật', fn: 'sanitizeFilename',
  title: 'Làm sạch tên file người dùng tải lên',
  io: {
    signature: 'sanitizeFilename(name, options) → string',
    params: [
      ['name', 'string', 'Tên file do client gửi lên. KHÔNG tin được: có thể chứa đường dẫn, ký tự điều khiển, hoặc dài bất thường.'],
      ['options', 'object · mặc định {}', '{ maxLength: number mặc định 100 — độ dài tối đa của tên, KHÔNG tính phần mở rộng }.']
    ],
    returns: ['string', 'Tên file an toàn để ghép vào đường dẫn. Không còn gì dùng được thì trả "file".'],
    example: `sanitizeFilename('../../etc/passwd')        // → 'passwd'
sanitizeFilename('bao cao Q1.pdf')          // → 'bao-cao-q1.pdf'`
  },
  brief: `<p>Tên file do client gửi lên là dữ liệu người dùng, và nó đi thẳng vào đường dẫn hệ thống tệp. Một tên như <code>../../etc/passwd</code> hoặc <code>../../../app/.env</code> đủ để ghi đè file hệ thống.</p>
<p>Viết hàm <code>sanitizeFilename(name, options)</code>, làm theo đúng thứ tự:</p>
<ol>
<li>Chỉ giữ phần sau dấu gạch chéo cuối cùng (cả <code>/</code> lẫn <code>\\</code>) — như vậy mọi phần đường dẫn biến mất</li>
<li>Tách phần mở rộng: đoạn sau dấu chấm cuối cùng, nếu nó dài từ 1 tới 10 ký tự và chỉ gồm chữ và số</li>
<li>Chuẩn hoá phần tên: bỏ dấu tiếng Việt, chuyển chữ thường, thay mọi ký tự không phải chữ số bằng dấu gạch ngang, gộp gạch liên tiếp, bỏ gạch ở hai đầu</li>
<li>Cắt phần tên còn tối đa <code>maxLength</code> ký tự, rồi bỏ lại dấu gạch thừa ở cuối</li>
<li>Phần tên rỗng sau khi làm sạch → dùng <code>'file'</code></li>
<li>Ghép lại: <code>tên</code> hoặc <code>tên.phanmorong</code> (phần mở rộng viết thường)</li>
</ol>
<p class="warn">Làm sạch tên file là lớp phòng thủ thứ hai, không phải thứ nhất. Lớp thứ nhất là <strong>không bao giờ dùng tên do client gửi làm tên lưu trữ</strong>: sinh một id ngẫu nhiên để lưu, và giữ tên gốc trong database chỉ để hiển thị lại cho người dùng.</p>`,
  starter: `function sanitizeFilename(name, options = {}) {
  // Viết code ở đây
}`,
  hints: [
    'normalize("NFD") rồi bỏ dấu, và thay riêng chữ đ — giống bài slugify.',
    'lastIndexOf(".") để tách phần mở rộng, nhưng nhớ kiểm tra nó hợp lệ.',
    'Sau khi cắt độ dài, có thể còn dấu gạch ở cuối — bỏ thêm một lần nữa.'
  ],
  tests: [
    { label: 'tên bình thường', args: ['bao cao Q1.pdf'], expect: 'bao-cao-q1.pdf' },
    { label: 'bỏ đường dẫn', args: ['../../etc/passwd'], expect: 'passwd' },
    { label: 'bỏ đường dẫn kiểu Windows', args: ['C:\\Users\\admin\\secret.txt'], expect: 'secret.txt' },
    { label: 'bỏ dấu tiếng Việt', args: ['Đơn hàng tháng 5.xlsx'], expect: 'don-hang-thang-5.xlsx' },
    { label: 'ký tự đặc biệt', args: ['a*b?c|d.png'], expect: 'a-b-c-d.png' },
    { label: 'không có phần mở rộng', args: ['README'], expect: 'readme' },
    { label: 'phần mở rộng quá dài thì coi như tên', args: ['file.khongphaidinhdang'], expect: 'file-khongphaidinhdang' },
    { label: 'chỉ toàn ký tự lạ', args: ['***'], expect: 'file' },
    { label: 'chuỗi rỗng', args: [''], expect: 'file' },
    { label: 'cắt theo độ dài', args: ['abcdefghij.txt', { maxLength: 4 }], expect: 'abcd.txt' },
    { label: 'cắt xong không để lại gạch thừa', args: ['abc def ghi.txt', { maxLength: 4 }], expect: 'abc.txt' },
    { label: 'file ẩn không tính là phần mở rộng', args: ['.env'], expect: 'env' }
  ],
  solution: `function sanitizeFilename(name, options = {}) {
  const { maxLength = 100 } = options;

  const text = String(name ?? '');
  const cuoi = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\\\'));
  const base = text.slice(cuoi + 1);

  let ten = base;
  let duoi = '';
  const dot = base.lastIndexOf('.');
  if (dot > 0 && /^[A-Za-z0-9]{1,10}$/.test(base.slice(dot + 1))) {
    ten = base.slice(0, dot);
    duoi = base.slice(dot + 1).toLowerCase();
  }

  ten = ten
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '');

  if (!ten) ten = 'file';

  return duoi ? ten + '.' + duoi : ten;
}`
},
{
  id: 'node-99', lang: 'node', level: 'Trung bình', topic: 'Bảo mật', fn: 'secretIssues',
  title: 'Khoá bí mật của bạn có đủ mạnh không',
  io: {
    signature: 'secretIssues(secret, options) → Array<string>',
    params: [
      ['secret', 'string', 'Giá trị của JWT_SECRET hoặc khoá bí mật tương tự.'],
      ['options', 'object · mặc định {}', '{ minLength: number mặc định 32, common: Array<string> — danh sách giá trị mẫu bị cấm, mặc định là ba chuỗi hay gặp }.']
    ],
    returns: ['Array<string>', 'Danh sách vấn đề, theo đúng thứ tự mô tả trong đề. Không có vấn đề nào → mảng rỗng.'],
    example: `secretIssues('secret')
// → ['quá ngắn', 'thiếu chữ số', 'nằm trong danh sách giá trị mẫu']`
  },
  brief: `<p><code>JWT_SECRET=your_jwt_secret_here</code> là dòng có thật trong file <code>docker-compose.yaml</code> của khoá học — và trong hàng nghìn dự án trên GitHub. Ai biết khoá đó thì tự ký được token nói mình là bất kỳ ai.</p>
<p>Viết hàm <code>secretIssues(secret, options)</code> kiểm tra trước khi ứng dụng khởi động. Trả về các vấn đề theo <strong>đúng thứ tự</strong> sau:</p>
<ol>
<li><code>'quá ngắn'</code> — độ dài nhỏ hơn <code>minLength</code></li>
<li><code>'thiếu chữ cái'</code> — không có ký tự a–z hoặc A–Z nào</li>
<li><code>'thiếu chữ số'</code> — không có chữ số nào</li>
<li><code>'chỉ có một loại ký tự lặp lại'</code> — toàn bộ chuỗi chỉ gồm một ký tự lặp đi lặp lại</li>
<li><code>'nằm trong danh sách giá trị mẫu'</code> — khớp (không phân biệt hoa thường) với một mục trong <code>common</code></li>
</ol>
<p>Danh sách <code>common</code> mặc định: <code>'secret'</code>, <code>'changeme'</code>, <code>'your_jwt_secret_here'</code>.</p>
<p class="callout">Cách sinh khoá tử tế trong Node: <code>crypto.randomBytes(32).toString('hex')</code>. Khoá đó dài 64 ký tự và không có cách nào đoán được. Sinh một lần, cất vào nơi quản lý bí mật, và <strong>mỗi môi trường một khoá khác nhau</strong>.</p>`,
  starter: `function secretIssues(secret, options = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Đẩy từng vấn đề vào mảng theo đúng thứ tự trong đề, đừng return sớm.',
    'new Set(text).size === 1 nhận ra chuỗi chỉ gồm một loại ký tự.',
    'So sánh với danh sách mẫu sau khi đã toLowerCase cả hai bên.'
  ],
  tests: [
    { label: 'khoá tốt', args: ['a7f3c9d2e5b8a1f4c7d0e3b6a9f2c5d8'], expect: [] },
    { label: 'quá ngắn', args: ['a1b2c3'], expect: ['quá ngắn'] },
    { label: 'chỉ có chữ', args: ['abcdefghijabcdefghijabcdefghijabcd'], expect: ['thiếu chữ số'] },
    { label: 'chỉ có số', args: ['12345678901234567890123456789012'], expect: ['thiếu chữ cái'] },
    { label: 'một ký tự lặp lại', args: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'], expect: ['thiếu chữ số', 'chỉ có một loại ký tự lặp lại'] },
    { label: 'giá trị mẫu', args: ['secret'], expect: ['quá ngắn', 'thiếu chữ số', 'nằm trong danh sách giá trị mẫu'] },
    { label: 'giá trị mẫu viết HOA vẫn nhận ra', args: ['CHANGEME'], expect: ['quá ngắn', 'thiếu chữ số', 'nằm trong danh sách giá trị mẫu'] },
    { label: 'giá trị mẫu của khoá học', args: ['your_jwt_secret_here'], expect: ['quá ngắn', 'thiếu chữ số', 'nằm trong danh sách giá trị mẫu'] },
    { label: 'chuỗi rỗng', args: [''], expect: ['quá ngắn', 'thiếu chữ cái', 'thiếu chữ số'] },
    { label: 'minLength tuỳ chỉnh', args: ['a1b2c3d4', { minLength: 8 }], expect: [] },
    { label: 'danh sách mẫu tuỳ chỉnh', args: ['congty2026congty2026congty2026ab', { common: ['congty2026congty2026congty2026ab'] }], expect: ['nằm trong danh sách giá trị mẫu'] }
  ],
  solution: `function secretIssues(secret, options = {}) {
  const { minLength = 32, common = ['secret', 'changeme', 'your_jwt_secret_here'] } = options;
  const text = String(secret ?? '');
  const issues = [];

  if (text.length < minLength) issues.push('quá ngắn');
  if (!/[A-Za-z]/.test(text)) issues.push('thiếu chữ cái');
  if (!/[0-9]/.test(text)) issues.push('thiếu chữ số');
  if (text.length > 0 && new Set(text).size === 1) issues.push('chỉ có một loại ký tự lặp lại');

  const thuong = text.toLowerCase();
  if (common.some((item) => String(item).toLowerCase() === thuong)) {
    issues.push('nằm trong danh sách giá trị mẫu');
  }

  return issues;
}`
},
{
  id: 'node-100', lang: 'node', level: 'Nâng cao', topic: 'Docker', fn: 'startupOrder',
  title: 'Thứ tự khởi động các service',
  io: {
    signature: 'startupOrder(services) → Array<string>',
    params: [
      ['services', 'object · mặc định {}', 'Tên service → mảng tên các service nó phụ thuộc (chính là depends_on trong docker-compose).']
    ],
    returns: ['Array<string>',
      'Thứ tự khởi động: mọi phụ thuộc của một service đều đứng trước nó. Nhiều service cùng sẵn sàng thì sắp theo bảng chữ cái. Có phụ thuộc vòng tròn → ném Error("phụ thuộc vòng tròn").'],
    example: `startupOrder({ app: ['db', 'redis'], db: [], redis: [] })
// → ['db', 'redis', 'app']`
  },
  brief: `<p><code>depends_on</code> trong docker-compose nói service nào phải lên trước. Với hai service thì nhìn là thấy; với mười lăm service thì cần thuật toán.</p>
<p>Viết hàm <code>startupOrder(services)</code> tính thứ tự khởi động.</p>
<ul>
<li>Mọi phụ thuộc của một service phải đứng <strong>trước</strong> nó trong kết quả</li>
<li>Nhiều service cùng sẵn sàng tại một thời điểm → lấy theo <strong>bảng chữ cái</strong>, để kết quả luôn giống nhau giữa các lần chạy</li>
<li>Phụ thuộc tới một service không khai báo thì bỏ qua phụ thuộc đó</li>
<li>Có vòng tròn (a cần b, b cần a) → ném <code>Error('phụ thuộc vòng tròn')</code></li>
<li><code>services</code> rỗng → mảng rỗng</li>
</ul>
<p>Đây là bài toán <strong>sắp xếp tô-pô</strong> (topological sort), và nó xuất hiện ở khắp nơi ngoài Docker: thứ tự chạy migration, thứ tự build module, thứ tự nạp plugin.</p>
<p class="callout">Cách đơn giản nhất: lặp đi lặp lại, mỗi vòng lấy ra mọi service có toàn bộ phụ thuộc đã nằm trong kết quả, sắp chúng theo bảng chữ cái rồi thêm vào. Nếu một vòng không lấy ra được service nào mà vẫn còn service chưa xếp, thì chắc chắn có vòng tròn.</p>`,
  starter: `function startupOrder(services = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Một Set chứa những service đã xếp giúp kiểm tra "phụ thuộc đã sẵn sàng chưa".',
    'Lọc bỏ phụ thuộc trỏ tới service không tồn tại ngay từ đầu.',
    'Vòng while: mỗi lượt tìm các service sẵn sàng; không tìm được cái nào là có vòng tròn.'
  ],
  tests: [
    { label: 'phụ thuộc đơn giản', args: [{ app: ['db'], db: [] }], expect: ['db', 'app'] },
    { label: 'hai phụ thuộc', args: [{ app: ['db', 'redis'], db: [], redis: [] }], expect: ['db', 'redis', 'app'] },
    { label: 'sắp theo bảng chữ cái khi cùng sẵn sàng', args: [{ zeta: [], alpha: [], beta: [] }], expect: ['alpha', 'beta', 'zeta'] },
    { label: 'chuỗi phụ thuộc', args: [{ c: ['b'], b: ['a'], a: [] }], expect: ['a', 'b', 'c'] },
    { label: 'phụ thuộc nhiều tầng', args: [{ web: ['api'], api: ['db', 'cache'], db: [], cache: [] }], expect: ['cache', 'db', 'api', 'web'] },
    { label: 'phụ thuộc tới service không khai báo', args: [{ app: ['khong-ton-tai'] }], expect: ['app'] },
    { label: 'không phụ thuộc gì', args: [{ a: [], b: [] }], expect: ['a', 'b'] },
    { label: 'rỗng', args: [{}], expect: [] },
    { label: 'vòng tròn', script: `try { fn({ a: ['b'], b: ['a'] }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'phụ thuộc vòng tròn' },
    { label: 'tự phụ thuộc cũng là vòng tròn', script: `try { fn({ a: ['a'] }); return 'khong-nem'; } catch (e) { return e.message; }`, expect: 'phụ thuộc vòng tròn' }
  ],
  solution: `function startupOrder(services = {}) {
  const names = Object.keys(services);
  const deps = new Map(
    names.map((name) => [name, (services[name] ?? []).filter((dep) => names.includes(dep))])
  );

  const done = new Set();
  const order = [];

  while (order.length < names.length) {
    const ready = names
      .filter((name) => !done.has(name))
      .filter((name) => deps.get(name).every((dep) => done.has(dep)))
      .sort();

    if (ready.length === 0) throw new Error('phụ thuộc vòng tròn');

    for (const name of ready) {
      done.add(name);
      order.push(name);
    }
  }

  return order;
}`
},
{
  id: 'node-101', lang: 'node', level: 'Trung bình', topic: 'Phân trang', fn: 'paginationMeta',
  title: 'Khối meta cho response phân trang',
  io: {
    signature: 'paginationMeta(query) → object',
    params: [
      ['query', 'object', '{ total: number — tổng số bản ghi; page: number — trang hiện tại; size: number — số bản ghi mỗi trang; basePath: string — đường dẫn để dựng link, mặc định chuỗi rỗng }.']
    ],
    returns: ['object',
      '{ page, size, total, totalPages, hasNext, hasPrev, links: { self, next, prev, first, last } } — link là chuỗi, hoặc null khi không có trang tương ứng.'],
    example: `paginationMeta({ total: 100, page: 2, size: 20, basePath: '/api/todos' })
// links.next → '/api/todos?page=3&size=20'
// links.prev → '/api/todos?page=1&size=20'`
  },
  brief: `<p>Trả về một mảng trần thì client không biết còn bao nhiêu trang nữa, và phải tự đoán cách dựng URL trang sau. Một khối <code>meta</code> đầy đủ giải quyết cả hai.</p>
<ul>
<li><code>page</code> nhỏ nhất là 1; <code>size</code> kẹp trong khoảng 1–100; giá trị không phải số thì dùng mặc định (page 1, size 20)</li>
<li><code>totalPages</code> là <code>ceil(total / size)</code>, tối thiểu 1</li>
<li><code>page</code> vượt quá <code>totalPages</code> thì <strong>giữ nguyên</strong> giá trị người dùng yêu cầu — <code>hasNext</code> sẽ là false và <code>links.next</code> là null</li>
<li>Link có dạng <code>&lt;basePath&gt;?page=N&amp;size=M</code></li>
<li><code>next</code> là null khi đang ở trang cuối hoặc quá trang cuối; <code>prev</code> là null khi đang ở trang 1</li>
<li><code>first</code> và <code>last</code> <strong>luôn</strong> có giá trị</li>
</ul>`,
  starter: `function paginationMeta(query = {}) {
  // Viết code ở đây
}`,
  hints: [
    'Viết một hàm phụ link(n) rồi dùng lại cho cả năm link.',
    'Math.ceil cho totalPages, Math.max(1, ...) để không bao giờ ra 0.',
    'hasNext là page < totalPages, không phải page + 1 <= total.'
  ],
  tests: [
    { label: 'trang giữa', args: [{ total: 100, page: 2, size: 20, basePath: '/api/todos' }], expect: { page: 2, size: 20, total: 100, totalPages: 5, hasNext: true, hasPrev: true, links: { self: '/api/todos?page=2&size=20', next: '/api/todos?page=3&size=20', prev: '/api/todos?page=1&size=20', first: '/api/todos?page=1&size=20', last: '/api/todos?page=5&size=20' } } },
    { label: 'trang đầu không có prev', script: `return fn({ total: 100, page: 1, size: 20, basePath: '/t' }).links.prev;`, expect: null },
    { label: 'trang cuối không có next', script: `return fn({ total: 100, page: 5, size: 20, basePath: '/t' }).links.next;`, expect: null },
    { label: 'không có bản ghi nào', args: [{ total: 0, page: 1, size: 20, basePath: '/t' }], expect: { page: 1, size: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false, links: { self: '/t?page=1&size=20', next: null, prev: null, first: '/t?page=1&size=20', last: '/t?page=1&size=20' } } },
    { label: 'giá trị mặc định', script: `const m = fn({ total: 50, basePath: '/t' });
return { page: m.page, size: m.size };`, expect: { page: 1, size: 20 } },
    { label: 'size vượt trần bị kẹp', script: `return fn({ total: 500, page: 1, size: 5000, basePath: '/t' }).size;`, expect: 100 },
    { label: 'page âm về 1', script: `return fn({ total: 50, page: -3, size: 20, basePath: '/t' }).page;`, expect: 1 },
    { label: 'vượt quá trang cuối', script: `const m = fn({ total: 50, page: 9, size: 20, basePath: '/t' });
return { page: m.page, hasNext: m.hasNext, next: m.links.next };`, expect: { page: 9, hasNext: false, next: null } },
    { label: 'basePath rỗng', script: `return fn({ total: 10, page: 1, size: 20 }).links.self;`, expect: '?page=1&size=20' }
  ],
  solution: `function paginationMeta(query = {}) {
  const { total = 0, basePath = '' } = query;

  const num = (value, fallback) => {
    const parsed = Math.trunc(Number(value));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const page = Math.max(1, num(query.page, 1));
  const size = Math.min(100, Math.max(1, num(query.size, 20)));
  const totalPages = Math.max(1, Math.ceil(total / size));

  const link = (n) => basePath + '?page=' + n + '&size=' + size;

  return {
    page,
    size,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    links: {
      self: link(page),
      next: page < totalPages ? link(page + 1) : null,
      prev: page > 1 ? link(page - 1) : null,
      first: link(1),
      last: link(totalPages),
    },
  };
}`
},
{
  id: 'node-102', lang: 'node', level: 'Trung bình', topic: 'Xử lý dữ liệu', fn: 'toCsv',
  title: 'Xuất dữ liệu ra CSV',
  io: {
    signature: 'toCsv(rows, columns) → string',
    params: [
      ['rows', 'Array<object> · mặc định []', 'Các dòng dữ liệu. Giá trị có thể là chuỗi, số, boolean, null hoặc undefined.'],
      ['columns', 'Array<string> · tuỳ chọn', 'Thứ tự cột. Không truyền thì lấy các khoá của dòng đầu tiên.']
    ],
    returns: ['string', 'Nội dung CSV, các dòng ngăn bởi ký tự xuống dòng, có dòng tiêu đề. Không có dòng nào và không có columns → chuỗi rỗng.'],
    example: `toCsv([{ id: 1, task: 'Hoc, bai' }])
// → 'id,task\\n1,"Hoc, bai"'`
  },
  brief: `<p>"Xuất Excel" là yêu cầu xuất hiện trong mọi dự án quản lý, và CSV là cách đơn giản nhất. Đơn giản, nhưng có ba cái bẫy phải xử lý đúng nếu không muốn file mở ra lệch cột.</p>
<p>Một giá trị <strong>phải được bọc trong nháy kép</strong> khi nó chứa dấu phẩy, nháy kép, hoặc ký tự xuống dòng. Và nháy kép bên trong thì được nhân đôi.</p>
<table><thead><tr><th>Giá trị</th><th>Ghi ra CSV</th></tr></thead><tbody>
<tr><td><code>Hoc bai</code></td><td><code>Hoc bai</code></td></tr>
<tr><td><code>Hoc, bai</code></td><td><code>"Hoc, bai"</code></td></tr>
<tr><td><code>Noi "xin chao"</code></td><td><code>"Noi ""xin chao"""</code></td></tr>
<tr><td><code>null</code> hoặc <code>undefined</code></td><td>chuỗi rỗng</td></tr>
<tr><td><code>true</code></td><td><code>true</code></td></tr>
</tbody></table>
<ul>
<li>Dòng đầu là tiêu đề, gồm tên các cột (cũng phải thoát như giá trị)</li>
<li>Các dòng ngăn nhau bằng một ký tự xuống dòng</li>
<li>Cột thiếu trong một dòng → ô rỗng</li>
<li>Không truyền <code>columns</code> → lấy khoá của dòng đầu tiên</li>
<li>Không có dòng nào và không truyền <code>columns</code> → chuỗi rỗng</li>
</ul>`,
  starter: `function toCsv(rows = [], columns) {
  // Viết code ở đây
}`,
  hints: [
    'Viết một hàm phụ escape(value) và dùng cho cả tiêu đề lẫn dữ liệu.',
    'Nhân đôi nháy kép trước, rồi mới bọc cả chuỗi trong nháy.',
    'Kiểm tra cần bọc hay không bằng một biểu thức chính quy có ba ký tự đặc biệt.'
  ],
  tests: [
    { label: 'dữ liệu đơn giản', args: [[{ id: 1, task: 'hoc' }]], expect: 'id,task\n1,hoc' },
    { label: 'nhiều dòng', args: [[{ a: 1 }, { a: 2 }]], expect: 'a\n1\n2' },
    { label: 'giá trị có dấu phẩy', args: [[{ id: 1, task: 'Hoc, bai' }]], expect: 'id,task\n1,"Hoc, bai"' },
    { label: 'giá trị có nháy kép', args: [[{ t: 'Noi "xin chao"' }]], expect: 't\n"Noi ""xin chao"""' },
    { label: 'giá trị có xuống dòng', args: [[{ t: 'dong1\ndong2' }]], expect: 't\n"dong1\ndong2"' },
    { label: 'null thành ô rỗng', args: [[{ a: null, b: 1 }]], expect: 'a,b\n,1' },
    { label: 'cột thiếu thành ô rỗng', args: [[{ a: 1 }, { b: 2 }], ['a', 'b']], expect: 'a,b\n1,\n,2' },
    { label: 'chọn thứ tự cột', args: [[{ a: 1, b: 2 }], ['b', 'a']], expect: 'b,a\n2,1' },
    { label: 'boolean', args: [[{ done: true }]], expect: 'done\ntrue' },
    { label: 'không có dòng nào', args: [[]], expect: '' },
    { label: 'không có dòng nhưng có cột', args: [[], ['a', 'b']], expect: 'a,b' },
    { label: 'tên cột cũng được thoát', args: [[{ 'a,b': 1 }]], expect: '"a,b"\n1' }
  ],
  solution: `function toCsv(rows = [], columns) {
  const cols = columns ?? (rows.length ? Object.keys(rows[0]) : []);
  if (cols.length === 0) return '';

  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (/[",\\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  };

  const lines = [cols.map(escape).join(',')];
  for (const row of rows) {
    lines.push(cols.map((col) => escape(row[col])).join(','));
  }

  return lines.join('\\n');
}`
},
{
  id: 'node-103', lang: 'node', level: 'Nâng cao', topic: 'Xử lý dữ liệu', fn: 'parseCsvLine',
  title: 'Đọc một dòng CSV',
  io: {
    signature: 'parseCsvLine(line) → Array<string>',
    params: [
      ['line', "string · mặc định ''", 'Một dòng CSV. Ô có thể được bọc trong nháy kép, và nháy kép bên trong được nhân đôi.']
    ],
    returns: ['Array<string>', 'Các ô đã tách. Dòng rỗng → mảng một phần tử là chuỗi rỗng.'],
    example: `parseCsvLine('1,"Hoc, bai",true')
// → ['1', 'Hoc, bai', 'true']`
  },
  brief: `<p>Chiều ngược của bài trước, và khó hơn hẳn. <code>line.split(',')</code> hỏng ngay ở ô đầu tiên có dấu phẩy bên trong nháy.</p>
<p>Cách đúng là <strong>duyệt từng ký tự</strong> và giữ một trạng thái "đang ở trong nháy hay không":</p>
<table><thead><tr><th>Ký tự</th><th>Ngoài nháy</th><th>Trong nháy</th></tr></thead><tbody>
<tr><td><code>"</code></td><td>Bắt đầu vào nháy</td><td>Nháy tiếp theo cũng là <code>"</code> → ghi một nháy, nhảy qua cả hai. Ngược lại → thoát khỏi nháy</td></tr>
<tr><td><code>,</code></td><td>Kết thúc ô hiện tại</td><td>Ghi bình thường vào ô</td></tr>
<tr><td>khác</td><td>Ghi vào ô</td><td>Ghi vào ô</td></tr>
</tbody></table>
<ul>
<li>Ô cuối cùng luôn được đẩy vào kết quả, kể cả khi rỗng</li>
<li>Dòng rỗng → <code>['']</code> (một ô rỗng, không phải mảng rỗng)</li>
<li>Dòng kết thúc bằng dấu phẩy → ô cuối là chuỗi rỗng</li>
</ul>
<p class="callout">Đây là một <em>máy trạng thái</em> nhỏ, và mẫu này lặp lại ở khắp nơi khi phân tích văn bản: đọc JSON, tách tham số dòng lệnh, tô màu cú pháp. Học một lần, dùng mãi.</p>`,
  starter: `function parseCsvLine(line = '') {
  // Viết code ở đây
}`,
  hints: [
    'Dùng vòng for với chỉ số để nhảy qua hai ký tự khi gặp nháy kép nhân đôi.',
    'Một biến ô đang xây và một mảng kết quả là đủ.',
    'Đừng quên đẩy ô cuối cùng vào kết quả sau khi hết vòng lặp.'
  ],
  tests: [
    { label: 'không có nháy', args: ['a,b,c'], expect: ['a', 'b', 'c'] },
    { label: 'ô có nháy', args: ['1,"Hoc, bai",true'], expect: ['1', 'Hoc, bai', 'true'] },
    { label: 'nháy kép bên trong', args: ['"Noi ""xin chao"""'], expect: ['Noi "xin chao"'] },
    { label: 'ô rỗng ở giữa', args: ['a,,c'], expect: ['a', '', 'c'] },
    { label: 'ô rỗng ở cuối', args: ['a,b,'], expect: ['a', 'b', ''] },
    { label: 'ô rỗng ở đầu', args: [',b'], expect: ['', 'b'] },
    { label: 'dòng rỗng', args: [''], expect: [''] },
    { label: 'một ô duy nhất', args: ['abc'], expect: ['abc'] },
    { label: 'ô bọc nháy nhưng rỗng', args: ['a,"",c'], expect: ['a', '', 'c'] },
    { label: 'đọc lại được thứ toCsv ghi ra', args: ['"a,b","c""d",e'], expect: ['a,b', 'c"d', 'e'] }
  ],
  solution: `function parseCsvLine(line = '') {
  const text = String(line);
  const cells = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ',') { cells.push(cell); cell = ''; }
    else cell += char;
  }

  cells.push(cell);
  return cells;
}`
},
{
  id: 'node-104', lang: 'node', level: 'Cơ bản', topic: 'Xử lý dữ liệu', fn: 'uniqueSlug',
  title: 'Slug không được trùng',
  io: {
    signature: 'uniqueSlug(base, taken) → string',
    params: [
      ['base', 'string', 'Slug mong muốn, đã chuẩn hoá sẵn (chỉ gồm chữ thường, số và dấu gạch ngang).'],
      ['taken', 'Array<string> | Set<string> · mặc định []', 'Các slug đã tồn tại trong database.']
    ],
    returns: ['string', 'Slug chưa bị chiếm: chính base nếu còn trống, ngược lại là base kèm hậu tố số nhỏ nhất còn trống, bắt đầu từ 2.'],
    example: `uniqueSlug('hoc-backend', ['hoc-backend', 'hoc-backend-2'])
// → 'hoc-backend-3'`
  },
  brief: `<p>Hai bài viết cùng tên "Học backend" cho ra cùng một slug, và cột <code>slug</code> có ràng buộc <code>UNIQUE</code> — bài thứ hai lưu thất bại.</p>
<p>Viết hàm <code>uniqueSlug(base, taken)</code> tìm slug còn trống:</p>
<ul>
<li><code>base</code> chưa bị chiếm → trả về chính nó</li>
<li>Bị chiếm → thử <code>base-2</code>, <code>base-3</code>… cho tới khi tìm được</li>
<li>Luôn lấy <strong>số nhỏ nhất còn trống</strong>: nếu <code>base</code> và <code>base-3</code> bị chiếm còn <code>base-2</code> trống, kết quả là <code>base-2</code></li>
<li><code>taken</code> nhận được cả mảng lẫn <code>Set</code></li>
<li><code>base</code> rỗng → dùng <code>'muc'</code> làm gốc</li>
</ul>
<p class="callout">Trong ứng dụng thật, hàm này vẫn có thể thua một cuộc đua: hai request cùng kiểm tra thấy <code>base-2</code> trống rồi cùng ghi. Ràng buộc <code>UNIQUE</code> ở database là thứ chặn được điều đó — hàm này chỉ giúp phần lớn trường hợp không phải chạm tới lỗi.</p>`,
  starter: `function uniqueSlug(base, taken = []) {
  // Viết code ở đây
}`,
  hints: [
    'Chuyển taken về Set một lần để tra nhanh và xử lý được cả hai kiểu đầu vào.',
    'Vòng while tăng dần bộ đếm từ 2.',
    'Kiểm tra base rỗng trước khi vào vòng lặp.'
  ],
  tests: [
    { label: 'chưa bị chiếm', args: ['hoc-backend', []], expect: 'hoc-backend' },
    { label: 'bị chiếm một lần', args: ['hoc-backend', ['hoc-backend']], expect: 'hoc-backend-2' },
    { label: 'bị chiếm nhiều lần', args: ['hoc-backend', ['hoc-backend', 'hoc-backend-2']], expect: 'hoc-backend-3' },
    { label: 'lấy số nhỏ nhất còn trống', args: ['a', ['a', 'a-3', 'a-4']], expect: 'a-2' },
    { label: 'nhận Set', script: `return fn('a', new Set(['a']));`, expect: 'a-2' },
    { label: 'slug khác không ảnh hưởng', args: ['a', ['b', 'c']], expect: 'a' },
    { label: 'base rỗng', args: ['', []], expect: 'muc' },
    { label: 'base rỗng và đã bị chiếm', args: ['', ['muc']], expect: 'muc-2' }
  ],
  solution: `function uniqueSlug(base, taken = []) {
  const used = taken instanceof Set ? taken : new Set(taken);
  const goc = String(base || '') || 'muc';

  if (!used.has(goc)) return goc;

  let n = 2;
  while (used.has(goc + '-' + n)) n++;
  return goc + '-' + n;
}`
},
{
  id: 'node-105', lang: 'node', level: 'Trung bình', topic: 'Kiến trúc', fn: 'toPublicDto',
  title: 'DTO theo vai trò người xem',
  io: {
    signature: 'toPublicDto(user, viewer) → object | null',
    params: [
      ['user', 'object | null', 'Bản ghi user lấy từ database: { id, username, email, role, createdAt, passwordHash, internalNote… }.'],
      ['viewer', 'object | null', 'Người đang xem: { id: number, role: string }. null nghĩa là khách chưa đăng nhập.']
    ],
    returns: ['object | null',
      'DTO với số trường thay đổi theo quan hệ giữa viewer và user. user là null → trả null.'],
    example: `toPublicDto({ id: 7, username: 'kiet', email: 'a@b.com', passwordHash: 'x' }, null)
// → { id: 7, username: 'kiet' }`
  },
  brief: `<p>Cùng một bản ghi, ba người xem khác nhau nên thấy ba lượng thông tin khác nhau. Trộn cả ba vào một hàm bằng những câu <code>if</code> rải rác là cách nhanh nhất để lộ dữ liệu.</p>
<table><thead><tr><th>Người xem</th><th>Thấy được</th></tr></thead><tbody>
<tr><td>Khách (viewer là null)</td><td><code>id</code>, <code>username</code></td></tr>
<tr><td>Người dùng khác đã đăng nhập</td><td>thêm <code>createdAt</code></td></tr>
<tr><td>Chính chủ (<code>viewer.id === user.id</code>)</td><td>thêm <code>email</code>, <code>role</code></td></tr>
<tr><td>Admin (<code>viewer.role === 'admin'</code>)</td><td>thêm <code>email</code>, <code>role</code>, <code>internalNote</code></td></tr>
</tbody></table>
<ul>
<li>Các mức <strong>cộng dồn</strong>: admin thấy mọi thứ của người dùng khác cộng thêm <code>internalNote</code></li>
<li><code>passwordHash</code> <strong>không bao giờ</strong> xuất hiện, kể cả với admin</li>
<li>Chỉ thêm trường khi bản ghi thực sự có — thiếu <code>internalNote</code> thì DTO không có khoá đó</li>
<li><code>user</code> là <code>null</code> hoặc <code>undefined</code> → trả <code>null</code></li>
</ul>
<p class="warn">Chú ý thứ tự: admin xem <em>chính mình</em> thì vừa là chính chủ vừa là admin — kết quả phải là hợp của cả hai mức.</p>`,
  starter: `function toPublicDto(user, viewer) {
  // Viết code ở đây
}`,
  hints: [
    'Bắt đầu từ mức thấp nhất rồi cộng dần, thay vì viết bốn nhánh riêng.',
    'Object.hasOwn(user, key) để chỉ thêm trường thực sự tồn tại.',
    'Tính hai biến boolean laChinhChu và laAdmin ở đầu hàm cho dễ đọc.'
  ],
  tests: [
    { label: 'khách chưa đăng nhập', args: [{ id: 7, username: 'kiet', email: 'a@b.com', role: 'user', createdAt: '2026-01-01', passwordHash: 'x' }, null], expect: { id: 7, username: 'kiet' } },
    { label: 'người dùng khác', args: [{ id: 7, username: 'kiet', email: 'a@b.com', role: 'user', createdAt: '2026-01-01' }, { id: 9, role: 'user' }], expect: { id: 7, username: 'kiet', createdAt: '2026-01-01' } },
    { label: 'chính chủ', args: [{ id: 7, username: 'kiet', email: 'a@b.com', role: 'user', createdAt: '2026-01-01' }, { id: 7, role: 'user' }], expect: { id: 7, username: 'kiet', createdAt: '2026-01-01', email: 'a@b.com', role: 'user' } },
    { label: 'admin xem người khác', args: [{ id: 7, username: 'kiet', email: 'a@b.com', role: 'user', createdAt: '2026-01-01', internalNote: 'vip' }, { id: 9, role: 'admin' }], expect: { id: 7, username: 'kiet', createdAt: '2026-01-01', email: 'a@b.com', role: 'user', internalNote: 'vip' } },
    { label: 'không bao giờ lộ passwordHash', script: `const dto = fn({ id: 1, username: 'a', passwordHash: 'x', internalNote: 'y' }, { id: 9, role: 'admin' });
return 'passwordHash' in dto;`, expect: false },
    { label: 'thiếu trường thì không thêm khoá', script: `const dto = fn({ id: 1, username: 'a' }, { id: 1, role: 'user' });
return Object.keys(dto).sort();`, expect: ['id', 'username'] },
    { label: 'admin xem chính mình', script: `const dto = fn({ id: 7, username: 'a', email: 'e', role: 'admin', internalNote: 'n' }, { id: 7, role: 'admin' });
return Object.keys(dto).sort();`, expect: ['email', 'id', 'internalNote', 'role', 'username'] },
    { label: 'user null', args: [null, { id: 1, role: 'admin' }], expect: null }
  ],
  solution: `function toPublicDto(user, viewer) {
  if (!user) return null;

  const dto = { id: user.id, username: user.username };
  if (!viewer) return dto;

  if (Object.hasOwn(user, 'createdAt')) dto.createdAt = user.createdAt;

  const laChinhChu = viewer.id === user.id;
  const laAdmin = viewer.role === 'admin';
  if (!laChinhChu && !laAdmin) return dto;

  if (Object.hasOwn(user, 'email')) dto.email = user.email;
  if (Object.hasOwn(user, 'role')) dto.role = user.role;

  if (laAdmin && Object.hasOwn(user, 'internalNote')) dto.internalNote = user.internalNote;

  return dto;
}`
},
{
  id: 'node-106', lang: 'node', level: 'Trung bình', topic: 'Kiểm thử', fn: 'createSpy',
  title: 'Hàm giả để test',
  io: {
    signature: 'createSpy(impl) → function & { calls, callCount, calledWith, reset, returns }',
    params: [
      ['impl', 'function · tuỳ chọn', 'Cài đặt thật mà spy sẽ gọi. Không truyền thì spy trả về undefined.']
    ],
    returns: ['function',
      'Hàm gọi được như thường, kèm các thuộc tính: calls (mảng mảng tham số), callCount() → number, calledWith(...args) → boolean, reset() → void, returns(value) → chính spy.'],
    example: `const spy = createSpy();
spy(1, 2);
spy.callCount();        // → 1
spy.calledWith(1, 2);   // → true`
  },
  brief: `<p>Để test một middleware, bạn cần biết nó <em>có gọi</em> <code>next()</code> hay không. Để test một service, bạn cần thay repository thật bằng thứ gì đó ghi lại các lời gọi. Đó là việc của <strong>spy</strong> — hàm giả biết kể lại mình đã được gọi thế nào.</p>
<p>Viết hàm <code>createSpy(impl)</code> trả về một hàm mang thêm năm khả năng:</p>
<table><thead><tr><th>Thành phần</th><th>Việc nó làm</th></tr></thead><tbody>
<tr><td>Gọi spy</td><td>Ghi lại mảng tham số vào <code>calls</code>, rồi gọi <code>impl</code> (nếu có) và trả kết quả của nó</td></tr>
<tr><td><code>calls</code></td><td>Mảng các mảng tham số, theo thứ tự gọi</td></tr>
<tr><td><code>callCount()</code></td><td>Số lần đã gọi</td></tr>
<tr><td><code>calledWith(...args)</code></td><td><code>true</code> nếu có ít nhất một lần gọi khớp <strong>đúng</strong> bộ tham số này (so sánh bằng <code>Object.is</code> trên từng phần tử, và cùng số lượng)</td></tr>
<tr><td><code>reset()</code></td><td>Xoá lịch sử gọi</td></tr>
<tr><td><code>returns(value)</code></td><td>Từ lúc này spy luôn trả <code>value</code>, bỏ qua <code>impl</code>. Trả về chính spy để nối chuỗi</td></tr>
</tbody></table>
<p class="callout">Trong JavaScript, hàm cũng là object — nên gắn thêm thuộc tính vào một hàm là chuyện hoàn toàn bình thường. Mọi thư viện test đều dựa trên tính chất này.</p>`,
  starter: `function createSpy(impl) {
  // Viết code ở đây
}`,
  hints: [
    'Khai báo function spy(...args) rồi gắn thuộc tính vào chính nó trước khi return.',
    'Một biến cờ cho biết returns() đã được gọi hay chưa — vì giá trị trả về có thể là undefined.',
    'calledWith so sánh độ dài trước, rồi từng phần tử bằng Object.is.'
  ],
  tests: [
    { label: 'đếm số lần gọi', script: `const s = fn(); s(); s(); return s.callCount();`, expect: 2 },
    { label: 'chưa gọi lần nào', script: `return fn().callCount();`, expect: 0 },
    { label: 'ghi lại tham số', script: `const s = fn(); s(1, 2); s('a'); return s.calls;`, expect: [[1, 2], ['a']] },
    { label: 'calledWith khớp', script: `const s = fn(); s(1, 2); return s.calledWith(1, 2);`, expect: true },
    { label: 'calledWith không khớp', script: `const s = fn(); s(1, 2); return s.calledWith(2, 1);`, expect: false },
    { label: 'calledWith khác số tham số', script: `const s = fn(); s(1, 2); return s.calledWith(1);`, expect: false },
    { label: 'gọi impl và trả kết quả', script: `const s = fn((a, b) => a + b); return s(2, 3);`, expect: 5 },
    { label: 'không có impl thì trả undefined', script: `const s = fn(); return s(1);`, expect: undefined },
    { label: 'returns ghi đè impl', script: `const s = fn(() => 'goc'); s.returns('gia'); return s();`, expect: 'gia' },
    { label: 'returns nối chuỗi được', script: `const s = fn(); return s.returns(1) === s;`, expect: true },
    { label: 'returns undefined vẫn ghi đè', script: `const s = fn(() => 'goc'); s.returns(undefined); return s();`, expect: undefined },
    { label: 'reset xoá lịch sử', script: `const s = fn(); s(1); s.reset(); return { count: s.callCount(), calls: s.calls };`, expect: { count: 0, calls: [] } },
    { label: 'dùng làm next của middleware', script: `const next = fn();
const mw = (req, res, n) => { if (req.ok) n(); };
mw({ ok: true }, {}, next);
mw({ ok: false }, {}, next);
return next.callCount();`, expect: 1 }
  ],
  solution: `function createSpy(impl) {
  let fixed;
  let hasFixed = false;

  function spy(...args) {
    spy.calls.push(args);
    if (hasFixed) return fixed;
    return impl ? impl(...args) : undefined;
  }

  spy.calls = [];
  spy.callCount = () => spy.calls.length;

  spy.calledWith = (...args) =>
    spy.calls.some(
      (call) => call.length === args.length && call.every((value, i) => Object.is(value, args[i]))
    );

  spy.reset = () => { spy.calls = []; };

  spy.returns = (value) => {
    fixed = value;
    hasFixed = true;
    return spy;
  };

  return spy;
}`
},
{
  id: 'node-107', lang: 'node', level: 'Nâng cao', topic: 'Kiến trúc', fn: 'createEventBus',
  title: 'Tách rời bằng sự kiện',
  io: {
    signature: 'createEventBus() → { on, once, off, emit, listenerCount }',
    params: [
      ['on(event, handler)', 'function', 'Đăng ký lắng nghe. Trả về một hàm huỷ đăng ký.'],
      ['once(event, handler)', 'function', 'Như on, nhưng tự gỡ sau lần gọi đầu tiên.'],
      ['off(event, handler)', 'function', 'Gỡ một handler cụ thể.'],
      ['emit(event, payload)', 'function', 'Phát sự kiện. Trả về số handler đã chạy.'],
      ['listenerCount(event)', 'function', 'Số handler đang lắng nghe sự kiện đó.']
    ],
    returns: ['object', 'on(event, handler) → function · once → function · off → void · emit → number · listenerCount → number.'],
    example: `const bus = createEventBus();
bus.on('user.registered', (user) => guiEmailChaoMung(user));
bus.emit('user.registered', { id: 7 });   // → 1`
  },
  brief: `<p>Đăng ký xong thì cần gửi email chào mừng, tạo todo mặc định, ghi log, cộng điểm giới thiệu. Nhét cả bốn vào <code>authRoutes.js</code> thì file đó phình ra mãi và mỗi lần thêm việc là sửa lại chỗ đã chạy tốt.</p>
<p><strong>Event bus</strong> đảo ngược quan hệ: route chỉ thông báo "có người vừa đăng ký", còn ai quan tâm thì tự đăng ký lắng nghe.</p>
<p>Viết hàm <code>createEventBus()</code>:</p>
<ul>
<li><code>on</code> đăng ký và <strong>trả về một hàm huỷ đăng ký</strong> — gọi hàm đó thì handler bị gỡ</li>
<li><code>emit</code> gọi các handler theo <strong>đúng thứ tự đăng ký</strong>, truyền <code>payload</code>, và trả về số handler đã chạy</li>
<li><code>once</code> tự gỡ handler <em>trước</em> khi gọi nó</li>
<li><code>off</code> gỡ đúng một handler; handler không tồn tại thì không sao cả</li>
<li>Một handler ném lỗi <strong>không được chặn</strong> các handler sau; lỗi bị nuốt</li>
<li>Gỡ handler <em>trong lúc</em> đang emit không ảnh hưởng tới lượt emit đang chạy</li>
<li>Sự kiện chưa ai nghe → <code>emit</code> trả về 0</li>
</ul>
<p class="warn">Hai điều cuối là chỗ dễ sai nhất. Duyệt thẳng trên mảng gốc trong khi handler gỡ chính nó sẽ làm vòng lặp nhảy cóc — hãy duyệt trên một bản sao.</p>`,
  starter: `function createEventBus() {
  // Viết code ở đây
}`,
  hints: [
    'Một Map từ tên sự kiện sang mảng handler.',
    'Trong emit, duyệt trên [...handlers] để việc gỡ giữa chừng không phá vòng lặp.',
    'once bọc handler gốc trong một hàm tự gọi off rồi mới chạy.'
  ],
  tests: [
    { label: 'gọi handler', script: `const bus = fn();
let thay = null;
bus.on('x', (p) => { thay = p; });
bus.emit('x', 42);
return thay;`, expect: 42 },
    { label: 'emit trả về số handler đã chạy', script: `const bus = fn();
bus.on('x', () => {});
bus.on('x', () => {});
return bus.emit('x');`, expect: 2 },
    { label: 'chưa ai nghe', script: `return fn().emit('x');`, expect: 0 },
    { label: 'đúng thứ tự đăng ký', script: `const bus = fn();
const log = [];
bus.on('x', () => log.push('a'));
bus.on('x', () => log.push('b'));
bus.emit('x');
return log;`, expect: ['a', 'b'] },
    { label: 'huỷ đăng ký bằng hàm trả về', script: `const bus = fn();
const huy = bus.on('x', () => {});
huy();
return bus.listenerCount('x');`, expect: 0 },
    { label: 'off gỡ đúng handler', script: `const bus = fn();
const a = () => {};
const b = () => {};
bus.on('x', a);
bus.on('x', b);
bus.off('x', a);
return bus.listenerCount('x');`, expect: 1 },
    { label: 'off với handler lạ không sao', script: `const bus = fn();
bus.on('x', () => {});
bus.off('x', () => {});
return bus.listenerCount('x');`, expect: 1 },
    { label: 'once chỉ chạy một lần', script: `const bus = fn();
let dem = 0;
bus.once('x', () => { dem++; });
bus.emit('x');
bus.emit('x');
return { dem, con: bus.listenerCount('x') };`, expect: { dem: 1, con: 0 } },
    { label: 'once vẫn nhận payload', script: `const bus = fn();
let thay = null;
bus.once('x', (p) => { thay = p; });
bus.emit('x', 'xin chao');
return thay;`, expect: 'xin chao' },
    { label: 'lỗi không chặn handler sau', script: `const bus = fn();
const log = [];
bus.on('x', () => { throw new Error('hong'); });
bus.on('x', () => log.push('van chay'));
const n = bus.emit('x');
return { log, n };`, expect: { log: ['van chay'], n: 2 } },
    { label: 'gỡ giữa chừng không phá lượt emit', script: `const bus = fn();
const log = [];
const b = () => log.push('b');
bus.on('x', () => { bus.off('x', b); log.push('a'); });
bus.on('x', b);
bus.emit('x');
return log;`, expect: ['a', 'b'] },
    { label: 'các sự kiện độc lập', script: `const bus = fn();
bus.on('a', () => {});
return { a: bus.listenerCount('a'), b: bus.listenerCount('b') };`, expect: { a: 1, b: 0 } }
  ],
  solution: `function createEventBus() {
  const map = new Map();

  const bus = {
    on(event, handler) {
      if (!map.has(event)) map.set(event, []);
      map.get(event).push(handler);
      return () => bus.off(event, handler);
    },

    once(event, handler) {
      const wrapper = (payload) => {
        bus.off(event, wrapper);
        handler(payload);
      };
      return bus.on(event, wrapper);
    },

    off(event, handler) {
      const list = map.get(event);
      if (!list) return;
      const index = list.indexOf(handler);
      if (index !== -1) list.splice(index, 1);
    },

    emit(event, payload) {
      const list = map.get(event);
      if (!list || list.length === 0) return 0;

      let ran = 0;
      for (const handler of [...list]) {
        ran++;
        try {
          handler(payload);
        } catch {
          /* một handler hỏng không được làm hỏng những handler còn lại */
        }
      }
      return ran;
    },

    listenerCount(event) {
      return (map.get(event) ?? []).length;
    },
  };

  return bus;
}`
}
];
