import Notification from '../moduls/Notification.js';

// Create a new notification (used internally, not exposed via route)
 const notifyAdmin = async (confirmationData) => {
  try {
    await Notification.create(confirmationData);
    console.log('Admin notified with new order confirmation.');
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// Get all notifications
 const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderId',
        select: 'status total user paymentMethod payment createdAt deliveryInfo items', // Choose what to return
      });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark all as read
 const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};
export {getAllNotifications,markAllAsRead,notifyAdmin}