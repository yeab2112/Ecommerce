import express from 'express';
import {
  getAllNotifications,
  markAllAsRead
} from '../controller/notificationsController.js'
const notificationRouter = express.Router();

// GET /api/notifications
 notificationRouter.get('/get-notifications', getAllNotifications);

// PUT /api/notifications/mark-read
notificationRouter.put('/mark-all-read', markAllAsRead);

export default notificationRouter;