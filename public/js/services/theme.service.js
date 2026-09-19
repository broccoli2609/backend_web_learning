/**
 * SERVICE — Giao diện sáng / tối.
 *
 * Mặc định trang theo cài đặt hệ điều hành. Khi người dùng bấm đổi, lựa chọn
 * được đóng dấu lên thẻ <html> và nhớ lại trong localStorage.
 */
const KEY = 'xuong-backend-theme';

function stored() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

export const themeService = {
  /** Gọi sớm, trước khi vẽ trang, để không nháy sai màu. */
  init() {
    const saved = stored();
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  },

  current() {
    const stamped = document.documentElement.getAttribute('data-theme');
    if (stamped) return stamped;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  toggle() {
    const next = this.current() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* không nhớ được thì thôi, lần sau theo hệ điều hành */
    }
    return next;
  }
};
