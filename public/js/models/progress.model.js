/**
 * MODEL — Tiến độ học.
 *
 * Một nguồn sự thật duy nhất cho: bài học đã xong, đáp án quiz, kết quả và code
 * của từng bài tập, checklist lộ trình.
 *
 * Nơi lưu được chọn theo thứ tự ưu tiên, cái nào có thì dùng:
 *   1. Database của Claude Artifact — theo tài khoản, đồng bộ giữa các máy
 *   2. API của server Express      — theo id người dùng lưu trong localStorage
 *   3. localStorage                — chỉ trong trình duyệt này
 * localStorage luôn được ghi kèm, để mất mạng vẫn còn dữ liệu.
 */
import { claudeService } from '../services/claude.service.js';
import { apiService } from '../services/api.service.js';
import { contentModel } from './content.model.js';

const STORAGE_KEY = 'xuong-backend-progress-v1';
const USER_KEY = 'xuong-backend-user-id';
const SAVE_DEBOUNCE_MS = 700;

const empty = () => ({ lessons: {}, quizzes: {}, exercises: {}, roadmap: {} });

const state = {
  data: empty(),
  localUserId: null,
  saveTimer: null,
  saving: false,
  remoteWritable: true
};

/* ---------- lưu trữ trong trình duyệt ---------- */

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* chế độ ẩn danh hoặc bị chặn — bỏ qua, phần còn lại vẫn chạy */
  }
}

function localUserId() {
  if (state.localUserId) return state.localUserId;
  try {
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = `local-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(USER_KEY, id);
    }
    state.localUserId = id;
  } catch {
    state.localUserId = 'local-anonymous';
  }
  return state.localUserId;
}

/** Id dùng khi gọi API: ưu tiên id thật của Claude, không có thì id cục bộ. */
function effectiveUserId() {
  return claudeService.userId() ?? localUserId();
}

/* ---------- gộp dữ liệu ---------- */

/** Giữ giá trị đang có, chỉ bổ sung khoá còn thiếu — không ghi đè việc vừa làm. */
function mergeInto(target, incoming) {
  if (!incoming || typeof incoming !== 'object') return;
  for (const section of ['lessons', 'quizzes', 'exercises', 'roadmap']) {
    const part = incoming[section];
    if (!part || typeof part !== 'object') continue;
    for (const [key, value] of Object.entries(part)) {
      if (!(key in target[section])) target[section][key] = value;
    }
  }
}

/* ---------- ghi xuống nơi lưu ---------- */

async function persistRemote() {
  if (!state.remoteWritable) return;

  const doc = claudeService.progressDoc();
  if (doc) {
    try {
      await doc.set({ data: state.data, updatedAt: new Date().toISOString() });
      return;
    } catch {
      state.remoteWritable = false;
      return;
    }
  }

  if (apiService.isOnline()) {
    try {
      await apiService.saveProgress(effectiveUserId(), state.data);
    } catch {
      /* server có thể vừa tắt — localStorage đã giữ bản sao */
    }
  }
}

function scheduleSave() {
  writeLocal(state.data);

  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(async () => {
    if (state.saving) {
      scheduleSave();
      return;
    }
    state.saving = true;
    await persistRemote();
    state.saving = false;
  }, SAVE_DEBOUNCE_MS);
}

/* ---------- giao diện công khai ---------- */

export const progressModel = {
  /** Nạp tiến độ từ mọi nguồn có sẵn. Gọi một lần lúc khởi động. */
  async load() {
    state.data = empty();
    mergeInto(state.data, readLocal());

    const doc = claudeService.progressDoc();
    if (doc) {
      try {
        const snap = await doc.get();
        if (snap.exists) mergeInto(state.data, snap.data()?.data);
      } catch {
        /* không đọc được thì dùng bản cục bộ */
      }
      return state.data;
    }

    if (apiService.isOnline()) {
      try {
        const remote = await apiService.getProgress(effectiveUserId());
        mergeInto(state.data, remote?.data);
      } catch {
        /* server chưa có dữ liệu cho người này — bình thường */
      }
    }
    return state.data;
  },

  /** Nơi tiến độ đang được lưu, để hiển thị cho người dùng biết. */
  storageLabel() {
    if (claudeService.hasDb()) return 'tài khoản Claude';
    if (apiService.isOnline()) return 'server';
    return 'trình duyệt này';
  },

  raw: () => state.data,

  /* --- bài học --- */
  isLessonDone: (lessonId) => Boolean(state.data.lessons[lessonId]),

  markLessonDone(lessonId) {
    if (!lessonId || state.data.lessons[lessonId]) return false;
    state.data.lessons[lessonId] = true;
    scheduleSave();
    return true;
  },

  /* --- quiz --- */
  quizAnswer: (lessonId) => state.data.quizzes[lessonId] ?? null,

  saveQuizAnswer(lessonId, picked, correct) {
    state.data.quizzes[lessonId] = { picked, correct };
    if (correct) state.data.lessons[lessonId] = true;
    scheduleSave();
  },

  clearQuizAnswer(lessonId) {
    delete state.data.quizzes[lessonId];
    scheduleSave();
  },

  /* --- bài tập --- */
  exerciseRecord: (exerciseId) => state.data.exercises[exerciseId] ?? null,

  isExercisePassed(exerciseId) {
    return state.data.exercises[exerciseId]?.status === 'passed';
  },

  saveExercise(exerciseId, record) {
    const passed = record.status === 'passed';
    state.data.exercises[exerciseId] = { ...record, at: new Date().toISOString() };

    if (passed) {
      const lessonId = contentModel.lessonIdForExercise(exerciseId);
      if (lessonId) state.data.lessons[lessonId] = true;
    }
    scheduleSave();

    // Ghi thêm một dòng lịch sử nộp bài ở server, nếu có server.
    if (apiService.isOnline() && !claudeService.hasDb()) {
      apiService
        .recordSubmission(effectiveUserId(), exerciseId, {
          status: record.status,
          score: record.feedback?.score ?? null
        })
        .catch(() => {});
    }
  },

  /* --- lộ trình --- */
  isRoadmapItemDone: (key) => Boolean(state.data.roadmap[key]),

  setRoadmapItem(key, done) {
    state.data.roadmap[key] = done;
    scheduleSave();
  },

  /* --- thống kê --- */
  stats() {
    const totals = contentModel.totals();

    const lessonsDone = contentModel.lessons()
      .filter(({ lesson }) => state.data.lessons[lesson.id]).length;

    const exercises = contentModel.exercises();
    const passed = (lang) =>
      exercises.filter((e) => (!lang || e.lang === lang) && this.isExercisePassed(e.id)).length;

    const roadmapDone = Object.values(state.data.roadmap).filter(Boolean).length;

    const doneUnits = lessonsDone + passed();
    const totalUnits = totals.lessons + totals.exercises;

    return {
      lessonsDone,
      lessonsTotal: totals.lessons,
      exercisesDone: passed(),
      exercisesTotal: totals.exercises,
      nodeDone: passed('node'),
      nodeTotal: totals.node,
      dotnetDone: passed('dotnet'),
      dotnetTotal: totals.dotnet,
      roadmapDone,
      roadmapTotal: totals.roadmapItems,
      overall: totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100),
      doneUnits,
      totalUnits
    };
  }
};
