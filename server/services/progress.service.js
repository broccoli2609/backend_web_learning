/**
 * SERVICE — Quy tắc nghiệp vụ cho tiến độ.
 *
 * Chỗ này quyết định thế nào là một bản tiến độ hợp lệ, và giữ lịch sử nộp bài
 * ở mức có giới hạn. Repository chỉ lo đọc ghi; controller chỉ lo HTTP.
 */
import { progressRepository } from '../models/progress.model.js';
import { contentRepository } from '../models/content.model.js';
import { AppError } from '../utils/app-error.js';

const SECTIONS = ['lessons', 'quizzes', 'exercises', 'roadmap'];
const MAX_SUBMISSIONS = 200;
const MAX_CODE_CHARS = 20000;

/** Chỉ giữ những khoá hợp lệ — không tin dữ liệu client gửi lên. */
function sanitize(incoming) {
  const clean = progressRepository.emptyProgress();
  if (!incoming || typeof incoming !== 'object') return clean;

  for (const section of SECTIONS) {
    const part = incoming[section];
    if (!part || typeof part !== 'object' || Array.isArray(part)) continue;

    for (const [key, value] of Object.entries(part)) {
      if (typeof key !== 'string' || key.length > 128) continue;

      if (section === 'exercises' && value && typeof value === 'object') {
        clean.exercises[key] = {
          status: value.status === 'passed' ? 'passed' : 'attempted',
          code: typeof value.code === 'string' ? value.code.slice(0, MAX_CODE_CHARS) : '',
          at: typeof value.at === 'string' ? value.at : new Date().toISOString()
        };
      } else {
        clean[section][key] = value;
      }
    }
  }
  return clean;
}

function summarize(data) {
  const exercises = contentRepository.exercises();
  const lessons = contentRepository.lessons();

  const passed = exercises.filter((e) => data.exercises[e.id]?.status === 'passed');
  const lessonsDone = lessons.filter(({ lesson }) => data.lessons[lesson.id]).length;

  const doneUnits = lessonsDone + passed.length;
  const totalUnits = lessons.length + exercises.length;

  return {
    lessonsDone,
    lessonsTotal: lessons.length,
    exercisesDone: passed.length,
    exercisesTotal: exercises.length,
    nodeDone: passed.filter((e) => e.lang === 'node').length,
    dotnetDone: passed.filter((e) => e.lang === 'dotnet').length,
    overall: totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100)
  };
}

export const progressService = {
  async get(userId) {
    const record = await progressRepository.findByUser(userId);
    return { ...record, summary: summarize(record.data) };
  },

  async replace(userId, incoming) {
    const existing = await progressRepository.findByUser(userId);
    const data = sanitize(incoming);

    const saved = await progressRepository.save({
      userId,
      data,
      submissions: existing.submissions
    });

    return { ...saved, summary: summarize(saved.data) };
  },

  /** Ghi một dòng lịch sử nộp bài, và cập nhật trạng thái của bài đó. */
  async recordSubmission(userId, exerciseId, { status, score = null }) {
    if (!contentRepository.exerciseById(exerciseId)) {
      throw AppError.notFound(`Không tìm thấy bài tập ${exerciseId}`);
    }
    if (status !== 'passed' && status !== 'attempted') {
      throw AppError.unprocessable('Trạng thái không hợp lệ', [
        { field: 'status', error: 'phải là passed hoặc attempted' }
      ]);
    }

    const record = await progressRepository.findByUser(userId);

    const submission = {
      exerciseId,
      status,
      score: Number.isFinite(score) ? score : null,
      at: new Date().toISOString()
    };

    record.submissions = [submission, ...record.submissions].slice(0, MAX_SUBMISSIONS);
    record.data.exercises[exerciseId] = {
      ...(record.data.exercises[exerciseId] ?? {}),
      status,
      at: submission.at
    };

    await progressRepository.save(record);
    return submission;
  },

  async recentSubmissions(userId, limit = 20) {
    const record = await progressRepository.findByUser(userId);
    return record.submissions.slice(0, Math.min(Math.max(limit, 1), MAX_SUBMISSIONS));
  }
};
