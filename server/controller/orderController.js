import Order from "../moduls/order.js";
import UserModel from "../moduls/user.js";
import { notifyAdmin } from "./notificationsController.js";
// Create a new order
const createOrder = async (req, res) => {
  try {
    const { deliveryInfo, paymentMethod, items, subtotal, deliveryFee, total } = req.body;
    const userId = req.user._id;  // Ensure req.user is populated by auth middleware
 
    // Enhanced validation
    if (!deliveryInfo || !paymentMethod || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order information'
      });
    }

    // Validate each item in the items array
    for (const item of items) {
      if (!item.product || !item.name || !item.size || !item.quantity || !item.price) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item data in order'
        });
      }

      // Add default color if not provided
      if (!item.color) {
        item.color = 'default';
      }
    }

    // Validate deliveryInfo structure
    const requiredDeliveryFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode', 'country', 'phone'];
    for (const field of requiredDeliveryFields) {
      if (!deliveryInfo[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required delivery field: ${field}`
        });
      }
    }

    // Create new order with color information
    const order = new Order({
      user: userId,
      deliveryInfo,
      paymentMethod,
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        image: item.image,
        size: item.size,
        color: item.color || 'default', // Ensure color is included
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      deliveryFee,
      total,
      status: paymentMethod === 'Cash on Delivery' ? 'pending' : 'payment_pending'
    });

    // Save order to database
    const savedOrder = await order.save();
    console.log('Order saved successfully:', savedOrder);

    // Update user with saved order id and clear cart
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: { orders: savedOrder._id },
        $set: { cartdata: {} }
      },
      { new: true }
    );

    if (!updatedUser) {
      console.error('User not found during order creation');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message
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

    // Admin-allowed statuses (user sets only 'return_requested' optionally elsewhere)
    const validStatuses = [
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'return_approved',
      'return_rejected'
    ];

    // Sequential flow control: from -> allowed next statuses
   const allowedTransitions = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],             // user sets 'received' after delivery
  received: [],              // user only, admin doesn't touch
  return_requested: ['return_approved', 'return_rejected'],
  return_approved: [],
  return_rejected: [],
  cancelled: []
};


    // Step 1: Check if requested status is allowed generally
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Only allowed admin statuses can be used.'
      });
    }

    // Step 2: Find the current order
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const currentStatus = currentOrder.status;

    // Step 3: Validate transition
    const allowedNext = allowedTransitions[currentStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${status}". Allowed: ${allowedNext.join(', ')}`
      });
    }

    // Step 4: Build update data
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Step 5: If shipping, add tracking info
    if (status === 'shipped') {
      updateData.tracking = {
        carrier: carrier || 'Standard Shipping',
        trackingNumber: trackingNumber || 'Not available',
        updatedAt: new Date()
      };
    }

    // Step 6: Perform update
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated from "${currentStatus}" to "${status}"`
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating order status'
    });
  }
};

const confirmOrderReceived = async (req, res) => {
  try {
    const { note, allItemsReceived, itemsInGoodCondition } = req.body;
    const orderId = req.params.id;
    const userId = req.user._id;

    // Validate input
    if (typeof allItemsReceived !== 'boolean' || typeof itemsInGoodCondition !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Please verify both condition checks'
      });
    }

    // Find order first to check conditions
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this order'
      });
    }

    // Check status
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order must be in delivered status to confirm receipt',
        currentStatus: order.status
      });
    }

    // Check if already confirmed
    if (order.receivedConfirmation?.confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Order receipt already confirmed',
        confirmedAt: order.receivedConfirmation.confirmedAt
      });
    }

    // Proceed with update
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          'receivedConfirmation': {
            confirmed: true,
            confirmedAt: new Date(),
            note: note || '',
            allItemsReceived,
            itemsInGoodCondition
          },
          status: 'received'
        }
      },
      { new: true }
    ).populate('user', 'name email');

    // Notify admin
    notifyAdmin({
      orderId: updatedOrder._id,
      customerName: updatedOrder.user.name,
      customerEmail: updatedOrder.user.email,
      confirmationTime: new Date(),
      note: note,
      conditionChecks: { allItemsReceived, itemsInGoodCondition }
    });

    return res.json({
      success: true,
      message: 'Order receipt confirmed successfully',
      order: {
        _id: updatedOrder._id,
        status: updatedOrder.status,
        receivedConfirmation: updatedOrder.receivedConfirmation
      }
    });

  } catch (error) {
    console.error('Error confirming order receipt:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export { createOrder, getOrderTracking, getUserOrders, getAllOrders, updateOrderStatus, confirmOrderReceived }

