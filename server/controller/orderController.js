import Order from "../moduls/order.js";
import { notifyAdmin } from "./notificationsController.js"
import UserModel from "../moduls/user.js";
// Create a new order
const createOrder = async (req, res) => {
  try {
    const { deliveryInfo, paymentMethod, items, subtotal, deliveryFee, total } = req.body;
    const userId = req.user._id;

    // Validation
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !deliveryInfo[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Create order
    const order = new Order({
      user: userId,
      deliveryInfo,
      paymentMethod,
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        size: item.size,
        color: item.color || 'default',
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      subtotal,
      deliveryFee,
      total,
      status: 'pending',
      paymentDetails: {
        status: paymentMethod === 'Online Payment' ? 'pending' : 'completed'
      }
    });

    const savedOrder = await order.save();

    // Update user's cart
    await UserModel.findByIdAndUpdate(userId, { $set: { cartdata: {} } });

    res.status(201).json({
      success: true,
      order: savedOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// Get all orders with items for current user
const getUserOrders = async (req, res) => {
  try {
    // Validate user ID
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Fetch orders with populated product details
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // Newest first
      .select('_id orderNumber items total createdAt status paymentMethod isPaid deliveryInfo')
      .populate({
        path: 'items.product',
        select: 'name price images slug' // Include essential product details
      })
      .lean();

    if (!orders.length) {
      return res.status(200).json({ // 200 instead of 404 for empty lists
        success: true,
        orders: [],
        message: 'No orders found'
      });
    }

    // Transform order items for cleaner client response
    const transformedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: {
          name: item.product?.name,
          price: item.product?.price,
          image: item.product?.images?.[0], // First image
          slug: item.product?.slug
        }
      }))
    }));

    res.json({
      success: true,
      orders: transformedOrders,
      count: orders.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

