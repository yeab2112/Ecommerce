import axios from 'axios';
import Order from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config();

const initiateChapaPayment = async (req, res) => {
  try {
    const { amount, currency, email, first_name, last_name, tx_ref, meta } = req.body;



    // Validate required fields
    if (!amount || !email || !tx_ref) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const chapaPayload = {
      amount,
      currency: currency || 'ETB',
      email,
      first_name: first_name || 'Customer',
      last_name: last_name || '',
      tx_ref,
      callback_url: 'https://ecommerce-rho-hazel.vercel.app/api/payment/callback',
      return_url: 'https://ecommerce-client-lake.vercel.app/order-confirmation',
      customization: {
        title: "Addis Zemmon",
        description: "Payment for your order"
      },
      meta: meta || {}
    };

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      chapaPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      }
    );

    if (response.data?.status === 'success' && response.data?.data?.checkout_url) {
      return res.json({ 
        success: true, 
        url: response.data.data.checkout_url 
      });
    }
    throw new Error(response.data?.message || 'Failed to initialize payment');

  } catch (error) {
    console.error('Payment initiation error:', error);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.response?.data?.message || error.message || 'Payment initiation failed' 
    });
  }
};

const chapaCallback = async (req, res) => {
  try {
    // Handle both GET (query params) and POST (body) requests
    const tx_ref = req.query.tx_ref || req.body.tx_ref;
    const status = req.query.status || req.body.status;

    console.log("🌐 Chapa callback received:", { tx_ref, status });

    if (!tx_ref) {
      console.error('Missing transaction reference in callback');
      return res.redirect(
        `https://ecommerce-client-lake.vercel.app/order-confirmation/payment-error?reason=missing_reference`
      );
    }

    // Immediately respond to Chapa to prevent timeout
    res.status(200).send('Callback received');

    if (status !== 'success') {
      await Order.findOneAndUpdate(
        { _id: tx_ref },
        { 
          'paymentDetails.status': 'failed',
          'updatedAt': new Date()
        }
      );
      return;
    }

    // Verify transaction
    const verificationResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
        },
        timeout: 8000
      }
    );

    const verificationData = verificationResponse.data;

    if (verificationData.status !== 'success' || !verificationData.data) {
      await Order.findOneAndUpdate(
        { _id: tx_ref },
        { 
          'paymentDetails.status': 'verification_failed',
          'updatedAt': new Date()
        }
      );
      return;
    }

    // Update successful payment
    await Order.findOneAndUpdate(
      { _id: tx_ref },
      {
        paymentMethod: verificationData.data.payment_method || 'chapa',
        paymentDetails: {
          ...verificationData.data,
          status: 'completed'
        },
        status: 'processing',
        updatedAt: new Date()
      }
    );

  } catch (error) {
    console.error('❌ Payment callback processing error:', error.message);
    if (req.query.tx_ref || req.body.tx_ref) {
      await Order.findOneAndUpdate(
        { _id: req.query.tx_ref || req.body.tx_ref },
        { 
          'paymentDetails.status': 'errored',
          'updatedAt': new Date()
        }
      );
    }
  }
};

export { initiateChapaPayment, chapaCallback };