/**
 * CONTROLLER — Danh sách bài tập và màn hình làm bài.
 *
 * Đây là controller nặng nhất: nó điều phối ba service (chạy test, chấm bằng
 * Claude, lưu tiến độ) nhưng bản thân không chứa logic của cái nào cả.
 */
import { contentModel } from '../models/content.model.js';
import { progressModel } from '../models/progress.model.js';
import { testRunner } from '../services/test-runner.service.js';
import { graderService } from '../services/grader.service.js';
import { describeClaudeError } from '../services/claude.service.js';
import { enhanceEditor } from '../services/editor.service.js';
import { wrapTables } from '../views/components.view.js';
import {
  renderExerciseList, renderExercise, renderTestResults,
  renderGrade, renderPending, renderFailure, renderReviewShell
} from '../views/exercise.view.js';
import { router } from './router.js';
import { progressChanged } from './events.js';

const filters = { q: '', lang: '', level: '', topic: '', status: '' };
let searchTimer = null;

export const exerciseListController = {
  render() {
    return {
      html: renderExerciseList({
        exercises: contentModel.filterExercises(filters, (id) => progressModel.isExercisePassed(id)),
        totals: contentModel.totals(),
        filters,
        topics: contentModel.topics(),
        recordOf: (id) => progressModel.exerciseRecord(id)
      })
    };
  },

  mount(root) {
    const search = root.querySelector('#ex-q');
    if (search) {
      search.addEventListener('input', () => {
        filters.q = search.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          const caret = search.selectionStart;
          router.render();
          const again = document.querySelector('#ex-q');
          if (again) {
            again.focus();
            try {
              again.setSelectionRange(caret, caret);
            } catch {
              /* một số trình duyệt không cho đặt con trỏ trên input search */
            }
          }
        }, 220);
      });
    }

    const bind = (id, key) => {
      const field = root.querySelector(`#${id}`);
      field?.addEventListener('change', () => {
        filters[key] = field.value;
        router.render();
      });
    };

    bind('ex-lang', 'lang');
    bind('ex-level', 'level');
    bind('ex-topic', 'topic');
    bind('ex-status', 'status');
  }
};

export const exerciseController = {
  render([exerciseId]) {
    const exercise = contentModel.exerciseById(exerciseId);
    return {
      wide: true,
      html: renderExercise({
        exercise,
        record: progressModel.exerciseRecord(exerciseId),
        graderAvailable: graderService.available()
      })
    };
  },

  mount(root, [exerciseId]) {
    const exercise = contentModel.exerciseById(exerciseId);
    if (!exercise) return;

    wrapTables(root);

    const editor = root.querySelector('#code-input');
    const output = root.querySelector('#ex-output');
    if (!editor || !output) return;

    enhanceEditor(editor);

    root.querySelector('#reset-code')?.addEventListener('click', () => {
      editor.value = exercise.starter;
      editor.focus();
    });

    root.querySelector('#run-tests')?.addEventListener('click', (event) =>
      runTests(event.currentTarget, exercise, editor, output)
    );

    root.querySelector('#grade-code')?.addEventListener('click', (event) =>
      gradeSubmission(event.currentTarget, exercise, editor, output)
    );

    root.querySelector('#review-code')?.addEventListener('click', (event) =>
      requestReview(event.currentTarget, exercise, editor, output)
    );
  }
};

/* ---------- các thao tác trên màn hình làm bài ---------- */

async function runTests(button, exercise, editor, output) {
  await withBusyButton(button, 'Đang chạy…', async () => {
    output.innerHTML = renderPending(`đang chạy ${exercise.tests.length} test…`);

    const outcome = await testRunner.run(exercise, editor.value);
    output.innerHTML = renderTestResults(outcome);

    progressModel.saveExercise(exercise.id, {
      status: testRunner.allPassed(outcome) ? 'passed' : 'attempted',
      code: editor.value
    });
    progressChanged();
  });
}

async function gradeSubmission(button, exercise, editor, output) {
  if (!editor.value.trim() || editor.value.trim() === exercise.starter.trim()) {
    output.innerHTML = renderFailure('Bạn chưa viết gì thêm so với code mẫu. Hãy làm bài rồi nộp.');
    return;
  }

  await withBusyButton(button, 'Claude đang chấm…', async () => {
    output.innerHTML = renderPending('Claude đang đọc bài của bạn, thường mất 10–40 giây…');

    try {
      const grade = await graderService.grade(exercise, editor.value);
      output.innerHTML = renderGrade(grade);
      progressModel.saveExercise(exercise.id, {
        status: grade.passed ? 'passed' : 'attempted',
        code: editor.value,
        feedback: grade
      });
    } catch (err) {
      output.innerHTML = renderFailure(describeClaudeError(err));
      progressModel.saveExercise(exercise.id, { status: 'attempted', code: editor.value });
    }
    progressChanged();
  });
}

async function requestReview(button, exercise, editor, output) {
  await withBusyButton(button, 'Đang hỏi…', async () => {
    output.innerHTML = renderReviewShell();
    const target = output.querySelector('#review-text');

    try {
      await graderService.review(exercise, editor.value, ({ text }) => {
        if (target) target.textContent = text;
      });
    } catch (err) {
      if (target) target.textContent = describeClaudeError(err);
    }
  });
}

/* ---------- tiện ích giao diện ---------- */

async function withBusyButton(button, busyLabel, work) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = busyLabel;
  try {
    await work();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

