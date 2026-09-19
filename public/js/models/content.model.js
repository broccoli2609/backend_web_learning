/**
 * MODEL — Nội dung.
 *
 * Giữ toàn bộ lý thuyết, bài tập, thuật ngữ và lộ trình, kèm các hàm tra cứu.
 * Model không biết gì về DOM: nó chỉ trả dữ liệu, ai hiển thị là việc của view.
 */
import { THEORY, EXERCISES, GLOSSARY, ROADMAP } from '../../data/index.js';

/** Danh sách phẳng mọi bài học, kèm chương chứa nó — dùng để đi tới/lui. */
const LESSONS = THEORY.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({ chapter, lesson }))
);

const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

/** Bài tập nào được bài học nào dùng làm phần kiểm tra cuối bài. */
const LESSON_BY_EXERCISE = new Map();
for (const { lesson } of LESSONS) {
  if (lesson.check?.type === 'ex') LESSON_BY_EXERCISE.set(lesson.check.exId, lesson.id);
}

export const contentModel = {
  chapters: () => THEORY,
  lessons: () => LESSONS,
  exercises: () => EXERCISES,
  glossary: () => GLOSSARY,
  roadmap: () => ROADMAP,

  totals() {
    return {
      chapters: THEORY.length,
      lessons: LESSONS.length,
      exercises: EXERCISES.length,
      node: EXERCISES.filter((e) => e.lang === 'node').length,
      dotnet: EXERCISES.filter((e) => e.lang === 'dotnet').length,
      roadmapItems: ROADMAP.reduce((n, stage) => n + stage.items.length, 0)
    };
  },

  chapterById(id) {
    return THEORY.find((c) => c.id === id) ?? null;
  },

  /** Trả về bài học kèm chương và hai bài kề bên, hoặc null nếu không có. */
  lessonById(id) {
    const index = LESSONS.findIndex((x) => x.lesson.id === id);
    if (index === -1) return null;
    return {
      ...LESSONS[index],
      index,
      prev: LESSONS[index - 1] ?? null,
      next: LESSONS[index + 1] ?? null
    };
  },

  exerciseById(id) {
    return EXERCISE_BY_ID.get(id) ?? null;
  },

  /** Bài học nào sẽ được tính là xong khi làm đạt bài tập này. */
  lessonIdForExercise(exerciseId) {
    return LESSON_BY_EXERCISE.get(exerciseId) ?? null;
  },

  topics() {
    return [...new Set(EXERCISES.map((e) => e.topic))].sort((a, b) => a.localeCompare(b, 'vi'));
  },

  /**
   * Lọc bài tập theo bộ lọc của màn hình danh sách.
   * `isPassed` được truyền từ ngoài vào để model nội dung không phải biết tới tiến độ.
   */
  filterExercises(filters = {}, isPassed = () => false) {
    const keyword = (filters.q ?? '').trim().toLowerCase();

    return EXERCISES.filter((e) => {
      if (filters.lang && e.lang !== filters.lang) return false;
      if (filters.level && e.level !== filters.level) return false;
      if (filters.topic && e.topic !== filters.topic) return false;

      if (filters.status === 'passed' && !isPassed(e.id)) return false;
      if (filters.status === 'todo' && isPassed(e.id)) return false;

      if (keyword) {
        const haystack = `${e.title} ${e.topic} ${e.id} ${stripTags(e.brief)}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  },

  searchGlossary(query = '') {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter((g) => `${g.term} ${g.def} ${g.tag}`.toLowerCase().includes(q));
  }
};

/** Bỏ thẻ HTML khỏi một đoạn mô tả để tìm kiếm và để gửi cho Claude. */
export function stripTags(html) {
  if (typeof document === 'undefined') {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const box = document.createElement('div');
  box.innerHTML = html;
  return (box.textContent ?? '').replace(/\s+/g, ' ').trim();
}
