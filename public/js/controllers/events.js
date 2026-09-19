/**
 * Kênh sự kiện nhỏ giữa các controller.
 *
 * Khi tiến độ đổi, thanh điều hướng và thanh tiến độ ở cột trái phải cập nhật,
 * nhưng controller đang làm việc thì không nên biết tới chúng. Nó chỉ phát một
 * tín hiệu, ai quan tâm thì nghe.
 */
const PROGRESS_CHANGED = 'progress:changed';

export function progressChanged() {
  document.dispatchEvent(new CustomEvent(PROGRESS_CHANGED));
}

export function onProgressChanged(handler) {
  document.addEventListener(PROGRESS_CHANGED, handler);
}
