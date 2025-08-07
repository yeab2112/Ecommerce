import Notification from '../moduls/Notification.js';
import Order from "../moduls/order.js";
// Create a new notification (used internally, not exposed via route)
const notifyAdmin = async (orderData) => {
  try {
    // Validate required fields against schema
    if (!orderData?.orderId || 
        !orderData?.customer?.name || 
        !orderData?.customer?.email ||
        typeof orderData?.conditionChecks?.allItemsReceived !== 'boolean' ||
        typeof orderData?.conditionChecks?.itemsInGoodCondition !== 'boolean') {
      throw new Error("Missing required fields for notification");
    }

    const notificationData = {
      orderId: orderData.orderId,
      customer: {
        name: orderData.customer.name,
        email: orderData.customer.email
      },
      note: orderData.note || undefined, // Store as undefined if empty
      conditionChecks: {
        allItemsReceived: orderData.conditionChecks.allItemsReceived,
        itemsInGoodCondition: orderData.conditionChecks.itemsInGoodCondition
      }
    };

    const notification = await Notification.create(notificationData);
    console.log(`📬 Notification created for order ${orderData.orderId}`);
    return notification;
  } catch (error) {
    console.error('❌ Notification creation failed:', {
      error: error.message,
      inputData: orderData,
      stack: error.stack
    });
    throw error; // Re-throw to handle in calling function
  }
};

// Get all notifications
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderId',
        select: 'status total user paymentMethod payment createdAt ', // Choose what to return
      });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    // Update all unread notifications
    const result = await Notification.updateMany(
      { read: false }, // Find all unread notifications
      { $set: { read: true } } // Mark them as read
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};
export { getAllNotifications, markAllAsRead, notifyAdmin }