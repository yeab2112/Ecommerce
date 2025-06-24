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
  // Immediately respond to Chapa
  res.status(200).send('Callback received');
  
  try {
    const { tx_ref, status } = req.query; // GET requests use query params

    console.log("🌐 Chapa callback received:", { tx_ref, status });

    if (!tx_ref) {
      console.error('Missing transaction reference');
      return; // Already responded, can't redirect
    }

    // Process verification asynchronously
    if (status !== 'success') {
      await Order.updateOne(
        { _id: tx_ref },
        { 
          'paymentDetails.status': 'failed',
          updatedAt: new Date()
        }
      );
      return;
    }

    const verification = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` },
        timeout: 8000
      }
    );

    if (verification.data.status === 'success') {
      await Order.updateOne(
        { _id: tx_ref },
        {
          paymentMethod: verification.data.data.payment_method || 'chapa',
          paymentDetails: {
            ...verification.data.data,
            status: 'completed'
          },
          status: 'processing',
          updatedAt: new Date()
        }
      );
    }
  } catch (error) {
    console.error('❌ Callback processing error:', error);
    if (req.query.tx_ref) {
      await Order.updateOne(
        { _id: req.query.tx_ref },
        { 
          'paymentDetails.status': 'errored',
          updatedAt: new Date()
        }
      );
    }
  }
};

export { initiateChapaPayment, chapaCallback };