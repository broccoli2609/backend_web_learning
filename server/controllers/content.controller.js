/**
 * CONTROLLER — Nội dung.
 *
 * Controller chỉ làm ba việc: đọc tham số từ request, gọi service, chọn status
 * code. Không có một dòng quy tắc nghiệp vụ nào ở đây.
 */
import { contentService } from '../services/content.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const contentController = {
  listChapters: asyncHandler(async (_req, res) => {
    res.json({ items: contentService.listChapters() });
  }),

  getLesson: asyncHandler(async (req, res) => {
    res.json(contentService.getLesson(req.params.lessonId));
  }),

  listExercises: asyncHandler(async (req, res) => {
    const filters = {
      lang: req.query.lang,
      level: req.query.level,
      topic: req.query.topic,
      q: req.query.q
    };
    res.json(contentService.listExercises(filters, req.pagination));
  }),

  getExercise: asyncHandler(async (req, res) => {
    res.json(contentService.getExercise(req.params.exerciseId));
  }),

  getSolution: asyncHandler(async (req, res) => {
    res.json(contentService.getSolution(req.params.exerciseId));
  }),

  listTopics: asyncHandler(async (_req, res) => {
    res.json({ items: contentService.listTopics() });
  }),

  listGlossary: asyncHandler(async (req, res) => {
    res.json({ items: contentService.searchGlossary(req.query.q) });
  }),

  listRoadmap: asyncHandler(async (_req, res) => {
    res.json({ items: contentService.listRoadmap() });
  })
};
