/**
 * MODEL — Nội dung, phía server.
 *
 * Server và trình duyệt import cùng một thư mục `public/data`, nên nội dung chỉ
 * tồn tại một bản duy nhất. Thêm một bài học là sửa một file, không phải hai.
 *
 * Đây là "model đọc": dữ liệu cố định, nạp một lần lúc khởi động.
 */
import { THEORY, EXERCISES, GLOSSARY, ROADMAP, LIBRARIES } from '../../public/data/index.js';

const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));

const lessonIndex = THEORY.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({ chapterId: chapter.id, chapterNum: chapter.num, lesson }))
);

/** Bỏ trường nặng và trường không nên gửi ra ngoài — DTO của chương 3. */
function toExerciseSummary(exercise) {
  return {
    id: exercise.id,
    lang: exercise.lang,
    level: exercise.level,
    topic: exercise.topic,
    title: exercise.title
  };
}

function toExerciseDetail(exercise) {
  const { solution, ...rest } = exercise;
  return rest; // lời giải mẫu chỉ trả khi được hỏi riêng
}

export const contentRepository = {
  chapters: () => THEORY,

  chapterById(id) {
    return THEORY.find((c) => c.id === id) ?? null;
  },

  lessons: () => lessonIndex,

  lessonById(id) {
    return lessonIndex.find((entry) => entry.lesson.id === id) ?? null;
  },

  exercises: () => EXERCISES,

  exerciseById(id) {
    return exerciseById.get(id) ?? null;
  },

  glossary: () => GLOSSARY,
  roadmap: () => ROADMAP,
  libraries: () => LIBRARIES,

  toExerciseSummary,
  toExerciseDetail
};
