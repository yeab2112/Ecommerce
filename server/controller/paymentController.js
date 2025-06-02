import axios from 'axios';
import Order from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config();

const CHAPA_API_URL = 'https://api.chapa.co/v1/transaction';
const FRONTEND_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_PROD_URL 
  : 'http://localhost:3000';

const initiateChapaPayment = async (req, res) => {
  try {
    // Validate environment configuration
    if (!process.env.CHAPA_SECRET_KEY) {
      console.error('Chapa secret key not configured');
      return res.status(500).json({ 
        success: false, 
        message: 'Payment service configuration error' 
      });
    }

    // Destructure and validate request body
    const { 
      amount, 
      email, 
      tx_ref, 
      currency = 'ETB', 
      first_name = '', 
      last_name = '', 
      callback_url, 
      return_url, 
      meta = {} 
    } = req.body;

    // Enhanced validation
    const validationErrors = [];
    if (!amount || isNaN(amount)) validationErrors.push('Valid amount is required');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) validationErrors.push('Valid email is required');
    if (!tx_ref) validationErrors.push('Transaction reference is required');

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    // Prepare Chapa payload with defaults
    const chapaPayload = {
      amount: String(amount), // Chapa expects amount as string
      currency: currency.toUpperCase(),
      email,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      tx_ref,
      callback_url: callback_url || `${req.headers.origin}/api/payment/callback`,
      return_url: return_url || `${FRONTEND_BASE_URL}/order-confirmation`,
      customization: {
        title: "Addis Zemmon",
        description: "Payment for your order"
      },
      meta: {
        ...meta,
        source: 'ecommerce-api',
        ip_address: req.ip
      }
    };

    // Call Chapa API with timeout
    const response = await axios.post(
      `${CHAPA_API_URL}/initialize`,
      chapaPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      }
    );

    // Validate Chapa response
    if (!response.data?.status === 'success' || !response.data?.data?.checkout_url) {
      console.error('Unexpected Chapa response:', response.data);
      throw new Error('Invalid response from payment gateway');
    }

    // Update order with payment initiation details
    await Order.findByIdAndUpdate(tx_ref, {
      paymentStatus: 'pending',
      paymentGateway: 'chapa',
      paymentReference: response.data.data.checkout_url
    });

    return res.json({ 
      success: true, 
      url: response.data.data.checkout_url,
      tx_ref,
      verification_url: `${req.headers.origin}/api/payment/verify/${tx_ref}`
    });

  } catch (error) {
    console.error('Payment initiation error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Payment initiation failed';

    return res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        detail: error.response?.data 
      })
    });
  }
};

const chapaCallback = async (req, res) => {
  try {
    const { tx_ref, status } = req.query;

    // Basic validation
    if (!tx_ref) {
      return res.status(400).redirect(`${FRONTEND_BASE_URL}/payment-error?reason=invalid_reference`);
    }

    // Immediate status check
    if (status !== 'success') {
      await Order.findByIdAndUpdate(tx_ref, {
        paymentStatus: 'failed',
        paymentDetails: { callbackStatus: status }
      });
      return res.redirect(`${FRONTEND_BASE_URL}/payment-failed?tx_ref=${tx_ref}`);
    }

    // Verify transaction with Chapa
    const verificationResponse = await axios.get(
      `${CHAPA_API_URL}/verify/${tx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
        },
        timeout: 10000
      }
    );

    // Handle verification result
    if (verificationResponse.data.status !== 'success') {
      await Order.findByIdAndUpdate(tx_ref, {
        paymentStatus: 'verification_failed',
        paymentDetails: verificationResponse.data
      });
      return res.redirect(`${FRONTEND_BASE_URL}/payment-failed?tx_ref=${tx_ref}&reason=verification`);
    }

    // Successful payment
    const updatedOrder = await Order.findByIdAndUpdate(
      tx_ref,
      { 
        paymentDetails:{
          status:"completed"
        } ,
        paymentDetails: verificationResponse.data.data,
        status: 'processing'
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).redirect(`${FRONTEND_BASE_URL}/payment-error?reason=order_not_found`);
    }

    // Redirect to success page
    return res.redirect(`${FRONTEND_BASE_URL}/order-confirmation/${tx_ref}`);

  } catch (error) {
    console.error('Payment callback error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });

    // Update order status if possible
    if (req.query.tx_ref) {
      await Order.findByIdAndUpdate(req.query.tx_ref, {
         paymentDetails:{
          status:'failed'
        },
        paymentDetails: { error: error.message }
      }).catch(e => console.error('Failed to update order status:', e));
    }

    return res.status(500).redirect(
      `${FRONTEND_BASE_URL}/payment-error?reason=server_error&tx_ref=${req.query.tx_ref || 'unknown'}`
    );
  }
};

export { initiateChapaPayment, chapaCallback };