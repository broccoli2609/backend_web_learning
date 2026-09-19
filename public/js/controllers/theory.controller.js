/**
 * CONTROLLER — Danh sách chương và trang một bài học.
 */
import { contentModel } from '../models/content.model.js';
import { progressModel } from '../models/progress.model.js';
import { renderChapterList, renderLesson } from '../views/theory.view.js';
import { wrapTables } from '../views/components.view.js';
import { router } from './router.js';
import { progressChanged } from './events.js';

/** Chương nào đang mở — giữ ngoài view để vẽ lại không làm sập hết. */
const openChapters = new Set();

function ensureOneChapterOpen(chapters) {
  if (openChapters.size > 0) return;
  const firstIncomplete = chapters.find((chapter) =>
    chapter.lessons.some((lesson) => !progressModel.isLessonDone(lesson.id))
  );
  if (firstIncomplete) openChapters.add(firstIncomplete.id);
}

export const chapterListController = {
  render() {
    const chapters = contentModel.chapters();
    ensureOneChapterOpen(chapters);

    return {
      html: renderChapterList({
        chapters,
        stats: progressModel.stats(),
        isLessonDone: (id) => progressModel.isLessonDone(id),
        openChapters
      })
    };
  },

  mount(root) {
    for (const button of root.querySelectorAll('[data-chapter]')) {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-chapter');
        const panel = root.querySelector(`#lessons-${CSS.escape(id)}`);
        if (!panel) return;

        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        if (panel.hidden) openChapters.delete(id);
        else openChapters.add(id);
      });
    }
  }
};

export const lessonController = {
  render([lessonId]) {
    const entry = contentModel.lessonById(lessonId);
    const linkedExercise =
      entry?.lesson.check?.type === 'ex' ? contentModel.exerciseById(entry.lesson.check.exId) : null;

    return {
      html: renderLesson({
        entry,
        done: entry ? progressModel.isLessonDone(entry.lesson.id) : false,
        quizAnswer: entry ? progressModel.quizAnswer(entry.lesson.id) : null,
        linkedExercise
      })
    };
  },

  mount(root, [lessonId]) {
    wrapTables(root);

    const submit = root.querySelector('[data-quiz-submit]');
    if (submit) {
      submit.addEventListener('click', () => {
        const picked = root.querySelector(`input[name="q-${CSS.escape(lessonId)}"]:checked`);
        const warning = root.querySelector('#quiz-warn');

        if (!picked) {
          if (warning) warning.hidden = false;
          return;
        }

        const { lesson } = contentModel.lessonById(lessonId);
        const value = Number(picked.value);
        progressModel.saveQuizAnswer(lessonId, value, value === lesson.check.answer);
        progressChanged();
        router.render();
      });
    }

    const reset = root.querySelector('[data-quiz-reset]');
    if (reset) {
      reset.addEventListener('click', () => {
        progressModel.clearQuizAnswer(lessonId);
        router.render();
      });
    }
  }
};
