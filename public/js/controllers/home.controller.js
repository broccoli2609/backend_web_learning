/**
 * CONTROLLER — Trang chủ và checklist lộ trình.
 */
import { contentModel } from '../models/content.model.js';
import { progressModel } from '../models/progress.model.js';
import { renderHome } from '../views/home.view.js';
import { progressChanged } from './events.js';

export const homeController = {
  render() {
    const nextLesson =
      contentModel.lessons().find(({ lesson }) => !progressModel.isLessonDone(lesson.id)) ?? null;

    const nextExercise =
      contentModel.exercises().find((e) => !progressModel.isExercisePassed(e.id)) ?? null;

    return {
      html: renderHome({
        stats: progressModel.stats(),
        roadmap: contentModel.roadmap(),
        nextLesson,
        nextExercise,
        isRoadmapItemDone: (key) => progressModel.isRoadmapItemDone(key)
      })
    };
  },

  mount(root) {
    for (const input of root.querySelectorAll('[data-roadmap]')) {
      input.addEventListener('change', () => {
        progressModel.setRoadmapItem(input.getAttribute('data-roadmap'), input.checked);
        input.closest('.checkitem')?.classList.toggle('done', input.checked);
        // Không vẽ lại cả màn hình: chỉ báo cho thanh bên cập nhật số đếm.
        progressChanged();
      });
    }
  }
};
