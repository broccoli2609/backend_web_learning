/**
 * Chạy lời giải mẫu của mọi bài Node.js qua chính bộ test của bài đó.
 * Dùng: npm run test:exercises
 *
 * Script này dùng đúng logic so sánh mà trang web dùng khi chấm bài, nên nếu nó
 * xanh thì người học làm đúng cũng sẽ thấy xanh.
 */
import { Buffer } from 'node:buffer';
import { EXERCISES } from '../public/data/index.js';
import { deepEqual, showValue } from '../public/js/services/test-runner.service.js';

// atob có sẵn trong trình duyệt; Node cần bản thay thế cho bài giải mã JWT.
if (typeof globalThis.atob !== 'function') {
  globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
}

const exercises = EXERCISES.filter((e) => e.lang === 'node' && e.tests?.length);

let failed = 0;
let ran = 0;

for (const exercise of exercises) {
  let fn;
  try {
    fn = new Function(`${exercise.solution}\n;return ${exercise.fn};`)();
  } catch (err) {
    failed++;
    console.error(`✕ ${exercise.id} — lời giải mẫu không chạy được: ${err.message}`);
    continue;
  }

  for (const test of exercise.tests) {
    ran++;
    let actual;
    let error = null;

    try {
      if (test.script) {
        const body = test.async ? `return (async () => {${test.script}})();` : test.script;
        actual = new Function('fn', body)(fn);
      } else {
        actual = fn.apply(null, test.args ?? []);
      }
      if (actual && typeof actual.then === 'function') actual = await actual;
    } catch (err) {
      error = err.message;
    }

    if (error !== null || !deepEqual(actual, test.expect)) {
      failed++;
      console.error(`✕ ${exercise.id} [${test.label}]`);
      console.error(`    mong đợi : ${showValue(test.expect)}`);
      console.error(`    nhận được: ${error !== null ? `ném lỗi: ${error}` : showValue(actual)}`);
    }
  }
}

console.log(`\n${exercises.length} bài Node.js chạy test · ${ran} test · ${EXERCISES.length} bài tập tổng cộng`);

if (failed > 0) {
  console.error(`✕ ${failed} test hỏng`);
  process.exit(1);
}
console.log('✓ Tất cả test đều qua');
