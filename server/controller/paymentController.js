import axios  from 'axios';
import  Order  from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

 const initiateChapaPayment = async (req, res) => {
  try {
    const { amount, currency, email, first_name, last_name, tx_ref, callback_url, return_url, meta } = req.body;

    // Validate required fields
    if (!amount || !email || !tx_ref) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const chapaPayload = {
      amount,
      currency: currency || 'ETB',
      email,
      first_name,
      last_name,
      tx_ref,
      callback_url,
      return_url,
      customization: {
        title: "Addis Zemmon",
        description: "Payment for your order"
      },
      meta
    };

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      chapaPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status === 'success' && response.data.data.checkout_url) {
      return res.json({ 
        success: true, 
        url: response.data.data.checkout_url 
      });
    } else {
      throw new Error('Failed to initialize payment');
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Payment initiation failed' 
    });
  }
};

import axios from 'axios';
import Order from '../models/Order.js'; // adjust path as needed

const chapaCallback = async (req, res) => {
  try {
    const { tx_ref, status } = req.query;

    if (!tx_ref) {
      return res.status(400).redirect(`${process.env.FRONTEND_BASE_URL}/payment-error?reason=invalid_reference`);
    }

    // Step 1: If status from Chapa is not success
    if (status !== 'success') {
      await Order.findOneAndUpdate(
        { _id: tx_ref },
        { 'paymentDetails.status': 'failed' }, // Correct nested update
        { new: true }
      );
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/payment-failed`);
    }

    // Step 2: Verify with Chapa
    const verificationResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    const verificationData = verificationResponse.data;

    if (verificationData.status !== 'success') {
      await Order.findOneAndUpdate(
        { _id: tx_ref },
        { 'paymentDetails.status': 'verification_failed' },
        { new: true }
      );
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/payment-failed`);
    }

    // Step 3: Mark as paid
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: tx_ref },
      {
        'paymentDetails.status': 'completed',
        paymentMethod: verificationData.data.payment_method || 'chapa',
        paymentDetails: verificationData.data, // Save all details
        status: 'processing', // Use correct enum: pending → processing
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found with the provided reference',
      });
    }

    // Redirect to frontend confirmation page
    return res.redirect(`${process.env.FRONTEND_BASE_URL}/order-confirmation/${updatedOrder._id}`);

  } catch (error) {
    console.error('Payment callback error:', error);

    try {
      await Order.findOneAndUpdate(
        { _id: req.query.tx_ref },
        { 'paymentDetails.status': 'verification_error' },
        { new: true }
      );
    } catch (dbError) {
      console.error('Failed to update order status:', dbError);
    }

    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};


 export{initiateChapaPayment,chapaCallback}