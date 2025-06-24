import axios from 'axios';
import Order from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config();

const initiateChapaPayment = async (req, res) => {
  try {
    const { amount, currency, email, first_name, last_name, tx_ref, meta } = req.body;

    // Validate required fields
    if (!amount || !email || !tx_ref) {
      console.error('Missing required fields:', { amount, email, tx_ref });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields (amount, email, or tx_ref)' 
      });
    }

    // Construct callback URL dynamically
    const callback_url = process.env.NODE_ENV === 'production'
      ? 'https://ecommerce-rho-hazel.vercel.app/api/payment/callback'
      : `${req.protocol}://${req.get('host')}/api/payment/callback`;

    const chapaPayload = {
      amount,
      currency: currency || 'ETB',
      email,
      first_name: first_name || 'Customer',
      last_name: last_name || '',
      tx_ref,
      callback_url,
      return_url: 'https://ecommerce-client-lake.vercel.app/order-confirmation',
      customization: {
        title: "Addis Zemmon",
        description: "Payment for your order"
      },
      meta: meta || {}
    };

    console.log('Initiating Chapa payment with payload:', chapaPayload);

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
      console.log('Payment initiated successfully for tx_ref:', tx_ref);
      return res.json({ 
        success: true, 
        url: response.data.data.checkout_url 
      });
    }
    
    throw new Error(response.data?.message || 'Failed to initialize payment');

  } catch (error) {
    console.error('Payment initiation error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.response?.data?.message || error.message || 'Payment initiation failed' 
    });
  }
};

const chapaCallback = async (req, res) => {
  try {
    // Log complete request for debugging
    console.log('🔔 Full Callback Request:', {
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    // Handle both GET (query) and POST (body) formats
    const tx_ref = req.body?.trx_ref || req.query?.tx_ref;
    const status = req.body?.status || req.query?.status;

    if (!tx_ref) {
      console.error('❌ Missing transaction reference:', {
        body: req.body,
        query: req.query
      });
      return res.status(400).json({ error: 'Missing transaction reference' });
    }

    console.log('🌐 Processing payment callback:', { tx_ref, status });

    // Immediately acknowledge receipt
    res.status(200).json({ received: true, tx_ref });

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

    console.log('Verifying payment for:', tx_ref);
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
            status: 'completed',
            verifiedAt: new Date()
          },
          status: 'processing',
          updatedAt: new Date()
        }
      );
      console.log('✅ Payment verified successfully:', tx_ref);
    } else {
      console.error('Payment verification failed:', tx_ref);
      await Order.updateOne(
        { _id: tx_ref },
        { 
          'paymentDetails.status': 'verification_failed',
          updatedAt: new Date()
        }
      );
    }

  } catch (error) {
    console.error('❌ Callback processing error:', {
      message: error.message,
      stack: error.stack,
      request: {
        body: req.body,
        query: req.query
      }
    });

    const tx_ref = req.body?.trx_ref || req.query?.tx_ref;
    if (tx_ref) {
      await Order.updateOne(
        { _id: tx_ref },
        { 
          'paymentDetails.status': 'errored',
          'paymentDetails.error': error.message,
          updatedAt: new Date()
        }
      );
    }
  }
};

export { initiateChapaPayment, chapaCallback };