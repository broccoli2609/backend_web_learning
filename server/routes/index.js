/**
 * ROUTES — Bảng route gốc, gắn tất cả dưới tiền tố /api.
 */
import { Router } from 'express';
import { contentRoutes } from './content.routes.js';
import { progressRoutes } from './progress.routes.js';
import { healthController, libraryController } from '../controllers/health.controller.js';

export const apiRoutes = Router();

apiRoutes.get('/health', healthController.health);
apiRoutes.get('/health/live', healthController.live);
apiRoutes.get('/health/ready', healthController.ready);

apiRoutes.get('/libraries', libraryController.list);

apiRoutes.use('/content', contentRoutes);
apiRoutes.use('/progress', progressRoutes);
