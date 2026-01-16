import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notification.controller';

const router = Router();

router.get('/notifications', authenticateToken, getNotifications);
router.post('/notifications/:id/read', authenticateToken, markNotificationRead);
router.post('/notifications/read-all', authenticateToken, markAllNotificationsRead);

export default router;
