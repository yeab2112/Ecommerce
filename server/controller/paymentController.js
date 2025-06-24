import axios from 'axios';
import Order from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config();

const initiateChapaPayment = async (req, res) => {
  try {
    const { amount, currency, email, first_name, last_name, tx_ref, meta } = req.body;

    // Validate required fields
    if (!amount || !email || !tx_ref) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields (amount, email, or tx_ref)' 
      });
    }

    const callback_url = `${req.protocol}://${req.get('host')}/api/payment/callback`;

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

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      chapaPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data?.status === 'success') {
      return res.json({ 
        success: true, 
        url: response.data.data.checkout_url 
      });
    }
    
    throw new Error(response.data?.message || 'Payment initialization failed');

  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Payment processing failed' 
    });
  }
};

const chapaCallback = async (req, res) => {
  try {
    // Special handling for Vercel's GET-with-body requests
    let tx_ref, status;
    
    if (req.method === 'GET' && Object.keys(req.body).length > 0) {
      // Handle Vercel's special case where GET has body
      tx_ref = req.body.trx_ref;
      status = req.body.status;
    } else {
      // Normal cases
      tx_ref = req.body?.trx_ref || req.query?.tx_ref;
      status = req.body?.status || req.query?.status;
    }

    console.log('Payment callback received:', {
      method: req.method,
      tx_ref,
      status,
      body: req.body,
      query: req.query
    });

    if (!tx_ref) {
      console.error('Missing transaction reference');
      return res.status(400).json({ error: 'Missing transaction reference' });
    }

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
    }

  } catch (error) {
    console.error('Callback error:', error.message);
    res.status(500).json({ error: 'Callback processing failed' });
  }
};

export { initiateChapaPayment, chapaCallback };