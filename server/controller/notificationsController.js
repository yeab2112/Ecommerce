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
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // Only create notification if status is "received"
  
      await Notification.create({
        type: 'order_received',
        message: `Customer received Order #${order._id.toString().slice(-6)}`,
        orderId: order._id,
        read: false,

        customer: {
          name: order.user.name,
          email: order.user.email


        },
        conditionChecks:{
          allItemsReceived:order.receivedConfirmation.allItemsReceived,
          itemsInGoodCondition:order.receivedConfirmation.itemsInGoodCondition
        }
      });
    

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
;
export { getAllNotifications, markAllAsRead, notifyAdmin }