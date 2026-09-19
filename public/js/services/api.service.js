/**
 * SERVICE — Gọi API của server Express.
 *
 * Trang vẫn chạy khi không có server (mở tĩnh trên GitHub Pages), nên mọi lời
 * gọi ở đây đều được phép thất bại: `probe()` hỏi một lần lúc khởi động, và
 * phần còn lại của ứng dụng chỉ dùng API khi `isOnline()` trả về true.
 */

/**
 * Gốc của API, suy ra từ vị trí của chính file này.
 *
 * Trang chạy ở hai chỗ có gốc khác nhau:
 *   - server Express : http://host/            → gốc là ''
 *   - GitHub Pages   : http://…/<tên-repo>/    → gốc là '/<tên-repo>'
 * Lấy theo `import.meta.url` (đường dẫn của module này) thay vì theo địa chỉ
 * trang, vì địa chỉ trang đổi theo route còn vị trí file thì không.
 */
function detectBaseUrl() {
  try {
    // file này ở <gốc>/js/services/ nên lùi hai cấp là về gốc
    return new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
}

const state = { online: false, checked: false, baseUrl: detectBaseUrl() };

const TIMEOUT_MS = 2500;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);

  try {
    const res = await fetch(`${state.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      signal: controller.signal,
      ...options
    });

    const body = res.status === 204 ? null : await res.json().catch(() => null);

    if (!res.ok) {
      const error = new Error(body?.message ?? `HTTP ${res.status}`);
      error.status = res.status;
      error.body = body;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export const apiService = {
  /** Kiểm tra một lần xem có server phía sau không. */
  async probe() {
    if (state.checked) return state.online;
    state.checked = true;
    try {
      const health = await request('/api/health', { timeoutMs: 1200 });
      state.online = health?.status === 'healthy' || health?.status === 'degraded';
    } catch {
      state.online = false;
    }
    return state.online;
  },

  isOnline: () => state.online,

  getLibraries() {
    return request('/api/libraries');
  },

  getProgress(userId) {
    return request(`/api/progress/${encodeURIComponent(userId)}`);
  },

  saveProgress(userId, progress) {
    return request(`/api/progress/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({ data: progress })
    });
  },

  recordSubmission(userId, exerciseId, payload) {
    return request(
      `/api/progress/${encodeURIComponent(userId)}/exercises/${encodeURIComponent(exerciseId)}`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }
};
