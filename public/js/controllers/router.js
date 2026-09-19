/**
 * CONTROLLER — Bộ định tuyến.
 *
 * Đọc hash trên URL, chọn controller tương ứng, yêu cầu nó dựng HTML rồi gắn
 * sự kiện. Đây là chỗ duy nhất trong ứng dụng chạm vào `location` và ghi
 * `innerHTML` của vùng nội dung.
 *
 * Bảng route cố tình phẳng: `#/ex/node-01` tách thành route `ex` và tham số
 * `['node-01']`, giống cách Express tách `/ex/:id`.
 */

const controllers = new Map();
const hooks = { afterRender: () => {} };

function parseHash(hash = window.location.hash) {
  const clean = hash.replace(/^#\/?/, '');
  const segments = clean.split('/').filter(Boolean);
  return { route: segments[0] ?? '', params: segments.slice(1) };
}

export const router = {
  register(route, controller) {
    controllers.set(route, controller);
    return this;
  },

  onAfterRender(fn) {
    hooks.afterRender = fn;
    return this;
  },

  current() {
    return parseHash();
  },

  /** Vẽ lại màn hình hiện tại — dùng sau khi dữ liệu thay đổi. */
  render() {
    const root = document.getElementById('view');
    if (!root) return;

    const { route, params } = parseHash();
    const controller = controllers.get(route) ?? controllers.get('');

    let output;
    try {
      output = controller.render(params);
    } catch (err) {
      console.error('Lỗi khi dựng màn hình:', err);
      output = { html: '<div class="empty">Có lỗi khi hiển thị màn hình này.</div>' };
    }

    root.className = output.wide ? 'wrap wide' : 'wrap';
    root.innerHTML = output.html;

    controller.mount?.(root, params);
    hooks.afterRender(route, params);
  },

  start() {
    window.addEventListener('hashchange', () => {
      this.render();
      window.scrollTo(0, 0);
      document.getElementById('view')?.focus();
    });
    this.render();
    return this;
  }
};
