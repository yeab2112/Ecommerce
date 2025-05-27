import Notification from '../moduls/Notification.js';
import Order from "../moduls/order.js";
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
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // Only create notification if status is "received"
    if (status === 'received') {
      await Notification.create({
        type: 'order_received',
        message: `Customer received Order #${order._id.toString().slice(-6)}`,
        orderId: order._id,
        read: false,
        recipient: 'admin' // or specific admin ID
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
;
export {getAllNotifications,markAllAsRead,notifyAdmin}