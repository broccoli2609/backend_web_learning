/**
 * SERVICE — Cầu nối tới Claude.
 *
 * Trang chạy được ở ba nơi: bên trong Claude Artifact, sau server Express,
 * hoặc như file tĩnh trên GitHub Pages. Chỉ nơi đầu tiên có `window.claude`.
 * Service này gói toàn bộ phần "có thể không tồn tại" vào một chỗ, để phần
 * còn lại của ứng dụng chỉ cần hỏi: có dùng được không?
 */

const handles = { db: null, user: null, sample: null, userId: null, ready: false };

function available() {
  return typeof window !== 'undefined' && typeof window.claude?.use === 'function';
}

async function use(name) {
  try {
    return await window.claude.use(name);
  } catch {
    return null;
  }
}

export const claudeService = {
  /** Gọi một lần lúc khởi động. Không bao giờ ném lỗi. */
  async init() {
    if (handles.ready) return handles;
    handles.ready = true;
    if (!available()) return handles;

    handles.user = await use('user');
    handles.sample = await use('sample');
    handles.db = await use('db');

    if (typeof handles.user?.id === 'function') {
      try {
        handles.userId = await handles.user.id();
      } catch {
        handles.userId = null;
      }
    }
    return handles;
  },

  hasDb: () => Boolean(handles.db && handles.userId),
  hasSample: () => Boolean(handles.sample),
  userId: () => handles.userId,

  /** Đường dẫn tài liệu tiến độ riêng của người đang xem. */
  progressDoc() {
    if (!handles.db || !handles.userId) return null;
    return handles.db.doc(`data/users/${handles.userId}/progress`);
  },

  /** Tài liệu dùng chung chứa phiên bản thư viện, do tác vụ định kỳ ghi vào. */
  librariesDoc() {
    if (!handles.db) return null;
    return handles.db.doc('content/libraries');
  },

  /** Hỏi Claude, trả về JSON đã parse. Ném lỗi có trường `code` khi thất bại. */
  askForJson(prompt, options = {}) {
    if (!handles.sample) throw { code: 'not_granted', message: 'Không có Claude ở bản này' };
    return handles.sample.json(prompt, { modelTier: 'default', cache: false, ...options });
  },

  /** Hỏi Claude, trả về văn bản, có thể stream qua `onText`. */
  async askForText(prompt, options = {}) {
    if (!handles.sample) throw { code: 'not_granted', message: 'Không có Claude ở bản này' };
    const result = await handles.sample(prompt, { modelTier: 'default', cache: false, ...options });
    return result.text;
  }
};

/** Dịch mã lỗi của Claude thành câu tiếng Việt cho người dùng đọc. */
export function describeClaudeError(err) {
  switch (err?.code) {
    case 'not_granted':
    case 'sampling_disabled':
    case 'not_declared':
      return 'Bản này không gọi được Claude để chấm bài. Bạn vẫn đối chiếu được với tiêu chí và lời giải mẫu.';
    case 'rate_limited':
      return 'Đang gọi Claude quá nhiều. Chờ một lát rồi thử lại.';
    case 'session_expired':
      return 'Phiên đăng nhập đã hết hạn, hãy tải lại trang.';
    case 'invalid_json':
      return 'Claude trả về dữ liệu không đọc được. Bấm chấm lại một lần nữa.';
    case 'cancelled':
      return 'Đã dừng.';
    case 'refused':
      return 'Claude không chấm được bài này. Thử diễn đạt lại phần code hoặc bỏ nội dung không liên quan.';
    default:
      return `Không chấm được lúc này: ${err?.message ?? 'lỗi không rõ'}. Thử lại sau.`;
  }
}
