/**
 * Integration test cho API — chương 9 nói về chính kiểu test này.
 * Dùng: npm run test:api   (chạy bằng test runner có sẵn của Node, không cài gì thêm)
 *
 * Server được dựng bằng `createApp()` và lắng nghe trên cổng ngẫu nhiên, nên
 * test không đụng vào cổng thật và chạy song song được.
 * Tiến độ ghi vào một thư mục tạm, xoá sạch sau khi chạy.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const storage = await mkdtemp(join(tmpdir(), 'xuong-backend-test-'));
process.env.STORAGE_DIR = storage;
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

const { createApp } = await import('../server/app.js');

// So với chính nội dung đang có, không phải với một con số viết cứng — thêm
// chương hay thêm bài tập thì test vẫn đúng, còn API trả thiếu thì vẫn hỏng.
const { THEORY, EXERCISES } = await import('../public/data/index.js');

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(storage, { recursive: true, force: true });
});

const get = (path) => fetch(`${baseUrl}${path}`);
const send = (method, path, body) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

test('GET /api/health báo hệ thống khoẻ', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.status, 'healthy');
  assert.equal(body.checks.content, 'healthy');
});

test('GET /api/health/live không chạm nơi lưu trữ', async () => {
  const res = await get('/api/health/live');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'healthy');
});

test('GET /api/content/theory trả đủ số chương đang có', async () => {
  const body = await (await get('/api/content/theory')).json();
  assert.equal(body.items.length, THEORY.length);
  assert.ok(body.items[0].lessons.length > 0);

  // Số chương hiển thị phải liên tục từ 1, vì nó do thứ tự trong ORDER sinh ra
  assert.deepEqual(
    body.items.map((chapter) => chapter.num),
    THEORY.map((_, index) => index + 1)
  );
});

test('GET /api/content/exercises phân trang và lọc được', async () => {
  const page = await (await get('/api/content/exercises?size=5&page=2')).json();
  assert.equal(page.items.length, 5);
  assert.equal(page.page, 2);
  assert.equal(page.total, EXERCISES.length);
  assert.equal(page.hasPrev, true);

  const nodeOnly = await (await get('/api/content/exercises?lang=node&size=100')).json();
  assert.ok(nodeOnly.items.every((e) => e.lang === 'node'));
});

test('GET /api/content/exercises kẹp size vào tối đa 100', async () => {
  const body = await (await get('/api/content/exercises?size=9999')).json();
  assert.equal(body.size, 100);
});

test('GET /api/content/exercises từ chối lang không hợp lệ', async () => {
  const res = await get('/api/content/exercises?lang=cobol');
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(body.type, 'validation_error');
  assert.ok(body.traceId);
});

test('chi tiết bài tập không kèm lời giải, phải hỏi riêng', async () => {
  const detail = await (await get('/api/content/exercises/node-01')).json();
  assert.equal(detail.id, 'node-01');
  assert.equal(detail.solution, undefined);
  assert.ok(Array.isArray(detail.tests));

  const solution = await (await get('/api/content/exercises/node-01/solution')).json();
  assert.ok(solution.solution.includes('function'));
});

test('bài tập không tồn tại trả 404 có định dạng thống nhất', async () => {
  const res = await get('/api/content/exercises/khong-co-that');
  assert.equal(res.status, 404);

  const body = await res.json();
  assert.equal(body.type, 'not_found');
  assert.ok(body.message.length > 0);
});

test('tiến độ: đọc bản rỗng, ghi rồi đọc lại', async () => {
  const empty = await (await get('/api/progress/test-user')).json();
  assert.deepEqual(empty.data.lessons, {});
  assert.equal(empty.summary.overall, 0);

  const saved = await send('PUT', '/api/progress/test-user', {
    data: { lessons: { c1l1: true }, exercises: { 'node-01': { status: 'passed', code: 'x' } } }
  });
  assert.equal(saved.status, 200);

  const again = await (await get('/api/progress/test-user')).json();
  assert.equal(again.data.lessons.c1l1, true);
  assert.equal(again.data.exercises['node-01'].status, 'passed');
  assert.ok(again.summary.overall > 0);
});

test('tiến độ: PUT thiếu trường data trả 422', async () => {
  const res = await send('PUT', '/api/progress/test-user', { wrong: 1 });
  assert.equal(res.status, 422);
  assert.equal((await res.json()).details[0].field, 'data');
});

test('tiến độ: userId có ký tự lạ bị chặn', async () => {
  const res = await get('/api/progress/..%2F..%2Fetc');
  assert.equal(res.status, 400);
});

test('nộp bài ghi lịch sử và trả 201 kèm Location', async () => {
  const res = await send('POST', '/api/progress/test-user/exercises/node-03', {
    status: 'passed',
    score: 100
  });
  assert.equal(res.status, 201);
  assert.ok(res.headers.get('location')?.includes('/submissions'));

  const history = await (await get('/api/progress/test-user/submissions')).json();
  assert.equal(history.items[0].exerciseId, 'node-03');
  assert.equal(history.items[0].status, 'passed');
});

test('nộp bài với trạng thái lạ trả 422', async () => {
  const res = await send('POST', '/api/progress/test-user/exercises/node-03', { status: 'xong' });
  assert.equal(res.status, 422);
});

test('GET /api/libraries trả bảng phiên bản', async () => {
  const body = await (await get('/api/libraries')).json();
  assert.ok(body.items.length >= 8);
  assert.ok(body.items.some((item) => item.id === 'nodejs'));
});

test('endpoint /api không tồn tại trả 404 dạng JSON', async () => {
  const res = await get('/api/khong-co');
  assert.equal(res.status, 404);
  assert.equal((await res.json()).type, 'not_found');
});

test('đường dẫn ngoài /api trả về trang chính cho router phía trình duyệt', async () => {
  const res = await get('/theory');
  assert.equal(res.status, 200);
  assert.ok((await res.text()).includes('Xưởng Backend'));
});

test('mỗi response đều có header X-Trace-Id', async () => {
  const res = await get('/api/health/live');
  assert.ok(res.headers.get('x-trace-id'));
});
