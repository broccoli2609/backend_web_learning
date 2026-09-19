/**
 * CONTROLLER — Tiến độ học.
 */
import { progressService } from '../services/progress.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const progressController = {
  get: asyncHandler(async (req, res) => {
    res.json(await progressService.get(req.params.userId));
  }),

  replace: asyncHandler(async (req, res) => {
    res.json(await progressService.replace(req.params.userId, req.body.data));
  }),

  recordSubmission: asyncHandler(async (req, res) => {
    const submission = await progressService.recordSubmission(
      req.params.userId,
      req.params.exerciseId,
      { status: req.body.status, score: req.body.score }
    );
    // 201 kèm Location trỏ tới nơi xem lại lịch sử — đúng quy ước REST.
    res
      .status(201)
      .location(`/api/progress/${encodeURIComponent(req.params.userId)}/submissions`)
      .json(submission);
  }),

  listSubmissions: asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 20;
    res.json({ items: await progressService.recentSubmissions(req.params.userId, limit) });
  })
};
