/**
 * SERVICE — Quy tắc nghiệp vụ cho nội dung.
 *
 * Service không biết gì về HTTP: nó không đọc `req`, không gọi `res`, không trả
 * status code. Nó nhận dữ liệu thuần, ném `AppError` khi có gì sai, và nhờ vậy
 * gọi lại được từ một job nền hay một bài test mà không cần dựng server.
 */
import { contentRepository } from '../models/content.model.js';
import { AppError } from '../utils/app-error.js';

const LEVELS = new Set(['Cơ bản', 'Trung bình', 'Nâng cao']);
const LANGS = new Set(['node', 'dotnet']);

export const contentService = {
  listChapters() {
    return contentRepository.chapters().map((chapter) => ({
      id: chapter.id,
      num: chapter.num,
      title: chapter.title,
      summary: chapter.summary,
      lessons: chapter.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        checkType: lesson.check?.type ?? null
      }))
    }));
  },

  getLesson(lessonId) {
    const entry = contentRepository.lessonById(lessonId);
    if (!entry) throw AppError.notFound(`Không tìm thấy bài học ${lessonId}`);
    return entry;
  },

  /**
   * Lọc và phân trang bài tập.
   * Trả về đúng hình dạng mà chương 8 khuyến nghị: items kèm metadata.
   */
  listExercises(filters, pagination) {
    if (filters.lang && !LANGS.has(filters.lang)) {
      throw AppError.badRequest('Tham số lang phải là node hoặc dotnet');
    }
    if (filters.level && !LEVELS.has(filters.level)) {
      throw AppError.badRequest('Tham số level không hợp lệ');
    }

    const keyword = (filters.q ?? '').trim().toLowerCase();

    const matched = contentRepository.exercises().filter((exercise) => {
      if (filters.lang && exercise.lang !== filters.lang) return false;
      if (filters.level && exercise.level !== filters.level) return false;
      if (filters.topic && exercise.topic !== filters.topic) return false;
      if (!keyword) return true;

      return `${exercise.title} ${exercise.topic} ${exercise.id}`.toLowerCase().includes(keyword);
    });

    const { page, size, skip, take } = pagination;
    const items = matched.slice(skip, skip + take).map(contentRepository.toExerciseSummary);
    const totalPages = Math.max(1, Math.ceil(matched.length / size));

    return {
      items,
      page,
      size,
      total: matched.length,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  getExercise(exerciseId, { includeSolution = false } = {}) {
    const exercise = contentRepository.exerciseById(exerciseId);
    if (!exercise) throw AppError.notFound(`Không tìm thấy bài tập ${exerciseId}`);
    return includeSolution ? exercise : contentRepository.toExerciseDetail(exercise);
  },

  getSolution(exerciseId) {
    const exercise = contentRepository.exerciseById(exerciseId);
    if (!exercise) throw AppError.notFound(`Không tìm thấy bài tập ${exerciseId}`);
    return { id: exercise.id, solution: exercise.solution };
  },

  searchGlossary(query) {
    const q = (query ?? '').trim().toLowerCase();
    const all = contentRepository.glossary();
    if (!q) return all;
    return all.filter((term) => `${term.term} ${term.def} ${term.tag}`.toLowerCase().includes(q));
  },

  listRoadmap() {
    return contentRepository.roadmap();
  },

  listTopics() {
    return [...new Set(contentRepository.exercises().map((e) => e.topic))]
      .sort((a, b) => a.localeCompare(b, 'vi'));
  }
};
