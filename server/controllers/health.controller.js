/**
 * CONTROLLER — Health check và bảng phiên bản thư viện.
 */
import { healthService } from '../services/health.service.js';
import { contentRepository } from '../models/content.model.js';
import { asyncHandler } from '../utils/async-handler.js';

export const healthController = {
  /** Trang web gọi endpoint này để biết có server phía sau hay không. */
  health: asyncHandler(async (_req, res) => {
    const report = await healthService.readiness();
    res.status(report.httpStatus).json(report);
  }),

  live: asyncHandler(async (_req, res) => {
    res.json(healthService.liveness());
  }),

  ready: asyncHandler(async (_req, res) => {
    const report = await healthService.readiness();
    res.status(report.httpStatus).json(report);
  })
};

export const libraryController = {
  list: asyncHandler(async (_req, res) => {
    // Bảng này ít đổi — cho trình duyệt cache 5 phút để đỡ gọi lại.
    res.set('Cache-Control', 'public, max-age=300');
    res.json(contentRepository.libraries());
  })
};
