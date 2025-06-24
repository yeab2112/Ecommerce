import axios from 'axios';
import Order from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config();

const initiateChapaPayment = async (req, res) => {
  try {
    const { orderId } = req.body; // Expect orderId: "685aad9b5f38aac9f51c826f"

    // Validate order exists and is payable
    const order = await Order.findOne({
      _id: orderId,
      status: 'pending',
      'paymentDetails.status': 'pending'
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    // Prepare Chapa payload
    const chapaPayload = {
      amount: order.total.toFixed(2),
      currency: 'ETB', // Force ETB for Ethiopian payments
      email: order.deliveryInfo.email,
      first_name: order.deliveryInfo.firstName.substring(0, 50),
      last_name: order.deliveryInfo.lastName.substring(0, 50),
      tx_ref: order._id.toString(), // Full MongoDB ID
      callback_url: `${process.env.BASE_URL}/api/payments/callback`,
      return_url: `${process.env.CLIENT_URL}/orders/${order._id.toString().slice(-8)}`,
      customization: {
        title: "Addis Zemmon",
        description: `Payment for Order #${order._id.toString().slice(-8)}`
      },
      meta: {
        order_id: order._id,
        user_id: order.user
      }
    };

    // Atomic update to prevent duplicate payments
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'paymentDetails.status': 'pending' },
      {
        $set: {
          'paymentDetails': {
            status: 'initiated',
            method: 'chapa',
            initiatedAt: new Date(),
            shortReference: order._id.toString().slice(-8)
          }
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error('Payment already being processed');
    }

    // Initiate payment with Chapa
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      chapaPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    // Store Chapa reference
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          'paymentDetails.reference': response.data.data.reference,
          'paymentDetails.checkoutUrl': response.data.data.checkout_url
        }
      }
    );

    res.json({
      success: true,
      checkoutUrl: response.data.data.checkout_url
    });

  } catch (error) {
    console.error('Payment initiation failed:', error);
    
    // Revert status if failed
    await Order.updateOne(
      { _id: req.body.orderId },
      {
        $set: {
          'paymentDetails.status': 'failed',
          'paymentDetails.error': error.message
        }
      }
    );

    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Payment initiation failed'
    });
  }
};

const chapaCallback = async (req, res) => {
  const { trx_ref, status } = req.body; // trx_ref = "685aad9b5f38aac9f51c826f"
  
  // Immediate response to Chapa
  res.status(200).send('Callback received');

  try {
    // Atomic status transition
    const order = await Order.findOneAndUpdate(
      {
        _id: trx_ref, // Using full ID directly
        'paymentDetails.status': { $in: ['pending', 'initiated'] }
      },
      {
        $set: {
          'paymentDetails.status': status === 'success' ? 'completed' : 'failed',
          'paymentDetails.lastCallback': new Date(),
          'paymentDetails.reference': trx_ref
        }
      }
    );

    if (!order) {
      console.log('Ignoring duplicate or invalid callback for:', trx_ref);
      return;
    }

    if (status !== 'success') {
      console.log('Payment failed for order:', trx_ref);
      return;
    }

    // Verify payment
    const verification = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
      {
        headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` },
        timeout: 10000
      }
    );

    // Final atomic verification
    await Order.updateOne(
      {
        _id: trx_ref,
        'paymentDetails.status': 'completed'
      },
      {
        $set: {
          'paymentDetails.status': 'verified',
          'paymentDetails.verification': verification.data,
          status: 'processing'
        }
      }
    );

    console.log('Order verified and ready for fulfillment:', trx_ref);
    // Trigger fulfillment workflow here

  } catch (error) {
    console.error('Callback processing failed:', error);
    // Implement retry logic here
  }
};

export { initiateChapaPayment, chapaCallback };