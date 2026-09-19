/**
 * ROUTES — Nội dung.
 *
 * Quy ước REST của chương 2 áp dụng ở đây: danh từ số nhiều, hành động nằm ở
 * method, lồng nhau tối đa một cấp, và ràng buộc kiểu ngay trên route.
 */
import { Router } from 'express';
import { contentController } from '../controllers/content.controller.js';
import { parsePagination, validateIdParam } from '../middlewares/validate.js';

export const contentRoutes = Router();

contentRoutes.get('/theory', contentController.listChapters);
contentRoutes.get('/theory/lessons/:lessonId', validateIdParam('lessonId'), contentController.getLesson);

contentRoutes.get('/exercises', parsePagination, contentController.listExercises);
contentRoutes.get('/exercises/topics', contentController.listTopics);
contentRoutes.get('/exercises/:exerciseId', validateIdParam('exerciseId'), contentController.getExercise);
contentRoutes.get(
  '/exercises/:exerciseId/solution',
  validateIdParam('exerciseId'),
  contentController.getSolution
);

contentRoutes.get('/glossary', contentController.listGlossary);
contentRoutes.get('/roadmap', contentController.listRoadmap);
