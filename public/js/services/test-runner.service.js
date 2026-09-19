/**
 * SERVICE — Chạy test cho bài tập JavaScript.
 *
 * Code của người học chạy trong một Web Worker riêng: vòng lặp vô tận chỉ treo
 * worker đó và bị kết thúc sau 5 giây, trang chính không hề hấn gì. Nếu trình
 * duyệt không tạo được worker, hàm lui về chạy ngay trong trang.
 *
 * Ba hàm dưới đây được chuyển thành chuỗi để dựng worker, nên chúng phải độc
 * lập: mọi thứ cần dùng đều đi qua tham số, không tham chiếu ra ngoài.
 */

const TIMEOUT_MS = 5000;

export function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;

  for (const key of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

export function showValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') return 'function';
  if (typeof value === 'string') return JSON.stringify(value);
  try {
    const text = JSON.stringify(value, (_k, v) => (v === undefined ? '__undefined__' : v));
    return text === undefined ? String(value) : text.replace(/"__undefined__"/g, 'undefined');
  } catch {
    return String(value);
  }
}

export async function runTestsCore(code, fnName, tests, eq, show) {
  let fn;
  try {
    // eslint-disable-next-line no-new-func
    fn = new Function(`${code}\n;return typeof ${fnName} !== "undefined" ? ${fnName} : undefined;`)();
  } catch (err) {
    return { fatal: `Code không chạy được: ${err?.message ?? String(err)}` };
  }

  if (typeof fn !== 'function') {
    return { fatal: `Không tìm thấy hàm ${fnName}. Hãy giữ nguyên tên hàm trong đề bài.` };
  }

  const results = [];
  for (const test of tests) {
    let actual;
    let error = null;
    try {
      if (test.script) {
        const body = test.async ? `return (async () => {${test.script}})();` : test.script;
        // eslint-disable-next-line no-new-func
        actual = new Function('fn', body)(fn);
      } else {
        actual = fn.apply(null, test.args ?? []);
      }
      if (actual && typeof actual.then === 'function') actual = await actual;
    } catch (err) {
      error = err?.message ?? String(err);
    }

    results.push({
      label: test.label,
      ok: error === null && eq(actual, test.expect),
      expected: show(test.expect),
      actual: error !== null ? `ném lỗi: ${error}` : show(actual)
    });
  }
  return { results };
}

function workerSource() {
  return [
    `var deepEqual = ${deepEqual.toString()};`,
    `var showValue = ${showValue.toString()};`,
    `var runTestsCore = ${runTestsCore.toString()};`,
    'self.onmessage = function (e) {',
    '  runTestsCore(e.data.code, e.data.fnName, e.data.tests, deepEqual, showValue)',
    '    .then(function (r) { self.postMessage(r); })',
    '    .catch(function (err) { self.postMessage({ fatal: String(err && err.message || err) }); });',
    '};'
  ].join('\n');
}

function runInWorker(code, fnName, tests) {
  return new Promise((resolve, reject) => {
    let url;
    let worker;
    try {
      url = URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' }));
      worker = new Worker(url);
    } catch (err) {
      if (url) URL.revokeObjectURL(url);
      reject(err);
      return;
    }

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(value);
    };

    const timer = setTimeout(
      () => finish({ fatal: `Quá thời gian ${TIMEOUT_MS / 1000} giây — có thể code đang lặp vô tận.` }),
      TIMEOUT_MS
    );

    worker.onmessage = (event) => finish(event.data);
    worker.onerror = (event) => finish({ fatal: `Lỗi khi chạy: ${event.message || 'không rõ'}` });

    try {
      worker.postMessage({ code, fnName, tests });
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        reject(err);
      }
    }
  });
}

export const testRunner = {
  /** Chạy toàn bộ test của một bài tập với code người học vừa viết. */
  async run(exercise, code) {
    try {
      return await runInWorker(code, exercise.fn, exercise.tests);
    } catch {
      return runTestsCore(code, exercise.fn, exercise.tests, deepEqual, showValue);
    }
  },

  /** Kết quả có phải "qua hết" không. */
  allPassed(outcome) {
    return Boolean(
      !outcome.fatal && outcome.results?.length && outcome.results.every((r) => r.ok)
    );
  }
};
