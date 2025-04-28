import  Order  from "../moduls/order.js";
import  UserModel  from "../moduls/user.js";
// Create a new order
 const createOrder = async (req, res) => {
  try {
    const { deliveryInfo, paymentMethod, items, subtotal, deliveryFee, total } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!deliveryInfo || !paymentMethod || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order information'
      });
    }

    // Create new order
    const order = new Order({
      user: userId,
      deliveryInfo,
      paymentMethod,
      items,
      subtotal,
      deliveryFee,
      total,
      status: 'pending'
    });

    // Save order to database
    await order.save();

    // Clear user's cart after successful order
    await UserModel.findByIdAndUpdate(userId, { cartdata: {} });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};
// Get all orders with items for current user
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('_id orderNumber items total createdAt status')
      .lean();

    if (!orders.length) {
      return res.status(404).json({ 
        success: false,
        message: 'No orders found' 
      });
    }

    res.json({ 
      success: true,
      orders 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Get order status and tracking info
const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id
    }).select('status tracking updatedAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const responseData = {
      success: true,
      status: order.status
    };

    if (order.tracking) {
      responseData.trackingInfo = {
        carrier: order.tracking.carrier || 'Not specified',
        trackingNumber: order.tracking.trackingNumber || 'Not available',
        updatedAt: order.tracking.updatedAt 
          ? order.tracking.updatedAt.toISOString() 
          : order.updatedAt.toISOString()
      };
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order tracking'
    });
  }
};
// Get all orders with user and delivery info
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email') // Populate user info
      .sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ 
        success: false,
        message: 'No orders found' 
      });
    }

    res.json({ 
      success: true,
      orders 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, carrier, trackingNumber } = req.body;
    const { orderId } = req.params;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const updateData = { 
      status,
      updatedAt: new Date()
    };

    // Add tracking info when status changes to 'shipped'
    if (status === 'shipped') {
      updateData.tracking = {
        carrier: carrier || 'Standard Shipping',
        trackingNumber: trackingNumber || 'Not available',
        updatedAt: new Date()
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email');

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating order status'
    });
  }
};

export { createOrder,getOrderTracking, getUserOrders,getAllOrders,updateOrderStatus}

