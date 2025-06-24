import axios from 'axios';
import Order from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config();

// Constants
const CHAPA_API_URL = 'https://api.chapa.co/v1/transaction';
const FRONTEND_SUCCESS_URL = 'https://ecommerce-client-lake.vercel.app/order-confirmation';
const REQUEST_TIMEOUT = 10000; // 10 seconds

const initiateChapaPayment = async (req, res) => {
  try {
    // Destructure and validate required fields
    const { amount, email, tx_ref } = req.body;
    if (!amount || !email || !tx_ref) {
      return res.status(400).json({ 
        success: false,
        message: 'Amount, email and transaction reference are required'
      });
    }

    // Construct callback URL
    const callback_url = `${req.protocol}://${req.get('host')}/api/payment/callback`;

    // Prepare payload
    const payload = {
      amount,
      currency: req.body.currency || 'ETB',
      email,
      first_name: req.body.first_name || 'Customer',
      last_name: req.body.last_name || '',
      tx_ref,
      callback_url,
      return_url: FRONTEND_SUCCESS_URL,
      customization: {
        title: "Addis Zemmon",
        description: "Payment for your order"
      },
      meta: req.body.meta || {}
    };

    // Initiate payment
    const response = await axios.post(
      `${CHAPA_API_URL}/initialize`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: REQUEST_TIMEOUT
      }
    );

    if (!response.data?.status === 'success') {
      throw new Error(response.data?.message || 'Payment initialization failed');
    }

    return res.json({
      success: true,
      url: response.data.data.checkout_url
    });

  } catch (error) {
    console.error('Payment initiation error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    const statusCode = error.response?.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.response?.data?.message || 'Payment processing failed'
    });
  }
};

const chapaCallback = async (req, res) => {
  try {
    // Extract transaction data from all possible sources
    const tx_ref = req.body?.trx_ref || req.query?.tx_ref;
    const status = req.body?.status || req.query?.status;

    if (!tx_ref) {
      console.error('Missing transaction reference in callback');
      return res.status(400).json({ 
        error: 'Transaction reference is required' 
      });
    }

    // Immediate acknowledgment
    res.status(200).json({ 
      received: true,
      tx_ref,
      status: 'processing' 
    });

    // Process payment status
    if (status !== 'success') {
      await handleFailedPayment(tx_ref);
      return;
    }

    // Verify successful payment
    await verifyAndUpdatePayment(tx_ref);

  } catch (error) {
    console.error('Callback processing error:', {
      message: error.message,
      stack: error.stack,
      tx_ref: req.body?.trx_ref || req.query?.tx_ref
    });

    res.status(500).json({ 
      error: 'Payment verification failed',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Helper functions
async function handleFailedPayment(tx_ref) {
  await Order.updateOne(
    { _id: tx_ref },
    { 
      'paymentDetails.status': 'failed',
      updatedAt: new Date()
    }
  );
}

async function verifyAndUpdatePayment(tx_ref) {
  const verification = await axios.get(
    `${CHAPA_API_URL}/verify/${tx_ref}`,
    {
      headers: { 
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` 
      },
      timeout: 8000
    }
  );

  if (verification.data.status !== 'success') {
    throw new Error('Payment verification failed');
  }

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

export { initiateChapaPayment, chapaCallback };