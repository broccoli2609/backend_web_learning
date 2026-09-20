/**
 * Gom toàn bộ nội dung thành một điểm nhập duy nhất.
 * Cả trình duyệt và server đều import từ đây, nên nội dung chỉ tồn tại một bản.
 */
import chapters0105 from './theory/chapters-01-05.js';
import chapters0610 from './theory/chapters-06-10.js';
import chapters1115 from './theory/chapters-11-15.js';
import videoNenTang from './theory/video-01-nen-tang.js';
import nodeExercises from './exercises/node.js';
import nodeVideoExercises from './exercises/node-video.js';
import dotnetExercises from './exercises/dotnet.js';
import glossary from './reference/glossary.js';
import roadmap from './reference/roadmap.js';
import libraries from './reference/libraries.js';

const ALL_CHAPTERS = [...chapters0105, ...chapters0610, ...chapters1115, ...videoNenTang];

/**
 * Thứ tự học, quyết định ở đây chứ không phải ở tên file.
 *
 * Mạch đi từ "internet hoạt động thế nào" tới một ứng dụng Node.js chạy được,
 * rồi mới tới các chủ đề nền tảng chung và ASP.NET Core. Muốn chèn một chương
 * mới vào giữa, chỉ cần thêm id của nó vào đúng vị trí trong mảng này — số
 * chương hiển thị được đánh lại tự động.
 */
const ORDER = [
  // Phần 1 — hiểu internet trước khi viết dòng code nào
  'n1', 'c1', 'c2',
  // Phần 2 — Node.js và Express
  'n2', 'n3', 'c11',
  // Phần 3 — kiến trúc và dữ liệu
  'c3', 'c4', 'c5',
  // Phần 4 — bảo mật
  'c6',
  // Phần 5 — chất lượng và vận hành
  'c7', 'c8', 'c9', 'c10',
  // Phần 6 — nền tảng thứ hai và lộ trình
  'c12', 'c13', 'c14', 'c15'
];

function orderChapters(chapters, order) {
  const byId = new Map(chapters.map((c) => [c.id, c]));
  const sorted = [];

  for (const id of order) {
    const chapter = byId.get(id);
    if (!chapter) throw new Error(`Thứ tự chương nhắc tới id không tồn tại: ${id}`);
    byId.delete(id);
    sorted.push(chapter);
  }

  // Chương chưa được xếp thì nối vào cuối, để quên không làm mất nội dung.
  for (const chapter of byId.values()) sorted.push(chapter);

  return sorted.map((chapter, index) => ({ ...chapter, num: index + 1 }));
}

export const THEORY = orderChapters(ALL_CHAPTERS, ORDER);
export const EXERCISES = [...nodeExercises, ...nodeVideoExercises, ...dotnetExercises];
export const GLOSSARY = glossary;
export const ROADMAP = roadmap;
export const LIBRARIES = libraries;
