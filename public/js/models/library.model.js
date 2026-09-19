/**
 * MODEL — Phiên bản thư viện.
 *
 * Dữ liệu đi kèm trong `data/reference/libraries.js` luôn hiển thị được, nên
 * trang không bao giờ trống. Nếu có nguồn động thì lấy bản mới hơn:
 *   - Claude Artifact: tài liệu `content/libraries`, do tác vụ định kỳ ghi vào
 *   - Server Express : `GET /api/libraries`
 */
import { LIBRARIES } from '../../data/index.js';
import { claudeService } from '../services/claude.service.js';
import { apiService } from '../services/api.service.js';

const state = { data: LIBRARIES, source: 'bundled' };

function isUsable(payload) {
  return Boolean(payload && Array.isArray(payload.items) && payload.items.length);
}

export const libraryModel = {
  async load() {
    const doc = claudeService.librariesDoc();
    if (doc) {
      try {
        const snap = await doc.get();
        if (snap.exists && isUsable(snap.data())) {
          state.data = snap.data();
          state.source = 'claude';
          return state.data;
        }
      } catch {
        /* rơi xuống nguồn kế tiếp */
      }
    }

    if (apiService.isOnline()) {
      try {
        const payload = await apiService.getLibraries();
        if (isUsable(payload)) {
          state.data = payload;
          state.source = 'server';
        }
      } catch {
        /* dùng dữ liệu đi kèm */
      }
    }
    return state.data;
  },

  all: () => state.data,
  updatedAt: () => state.data.updatedAt ?? '',
  note: () => state.data.note ?? '',
  byEcosystem: (eco) => state.data.items.filter((item) => item.eco === eco),

  /** Câu mô tả nguồn dữ liệu, hiển thị dưới bảng. */
  sourceLabel() {
    switch (state.source) {
      case 'claude':
        return 'Tác vụ định kỳ hàng tuần cập nhật bảng này.';
      case 'server':
        return 'Server đang phục vụ bảng này từ dữ liệu của chính nó.';
      default:
        return 'Đang dùng dữ liệu đi kèm trong mã nguồn — sửa ở data/reference/libraries.js.';
    }
  }
};
