/**
 * ROUTES — Tiến độ học.
 *
 * Lưu ý về bảo mật: bản này không có đăng nhập, nên bất kỳ ai biết userId đều
 * đọc ghi được tiến độ của id đó. Ở dự án thật, userId phải lấy từ token đã xác
 * thực chứ không phải từ URL — đúng lỗ hổng IDOR ở chương 6. README nói rõ chỗ
 * cần sửa khi bạn thêm đăng nhập.
 */
import { Router } from 'express';
import { progressController } from '../controllers/progress.controller.js';
import { validateIdParam, requireBodyFields } from '../middlewares/validate.js';

export const progressRoutes = Router();

const userId = validateIdParam('userId');
const exerciseId = validateIdParam('exerciseId');

progressRoutes.get('/:userId', userId, progressController.get);
progressRoutes.put('/:userId', userId, requireBodyFields('data'), progressController.replace);

progressRoutes.get('/:userId/submissions', userId, progressController.listSubmissions);
progressRoutes.post(
  '/:userId/exercises/:exerciseId',
  userId,
  exerciseId,
  requireBodyFields('status'),
  progressController.recordSubmission
);
