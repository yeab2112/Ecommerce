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
    console.log('Received callback body:', req.body); // Log the entire request body
    
    const { trx_ref, status } = req.body;
    
    if (!trx_ref) {
      console.error('Missing transaction reference in callback');
      return res.status(400).send('Missing transaction reference');
    }

    // Immediately respond to Chapa
    res.status(200).send('Callback received');
    
    // 1. Find order by reference
    const order = await Order.findOne({ 
      'paymentDetails.reference': trx_ref 
    });
    
    if (!order) {
      console.error('Order not found for reference:', trx_ref);
      return;
    }

    console.log(`Found order ${order._id} with current status: ${order.paymentDetails.status}`);

    // 2. Basic status update
    const updateData = {
      'paymentDetails.status': status === 'success' ? 'completed' : 'failed',
      'paymentDetails.lastCallback': new Date()
    };

    console.log('Preparing update data:', updateData);

    // 3. Only verify if payment succeeded
    if (status === 'success') {
      console.log('Initiating verification for successful payment');
      const verification = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
        { headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` } }
      );

      updateData.status = 'processing';
      updateData['paymentDetails.verification'] = verification.data;
      updateData['paymentDetails.status'] = 'verified';
      updateData['paymentDetails.method'] = verification.data.data?.payment_method || 'chapa';
      
      console.log('Verification data received:', verification.data);
    }

    // 4. Single database update
    const updateResult = await Order.updateOne(
      { _id: order._id },
      { $set: updateData }
    );

    console.log(`Update result for order ${trx_ref}:`, updateResult);
    console.log(`Order ${trx_ref} updated to status: ${status}`);

  } catch (error) {
    console.error('Callback error:', error.message);
    console.error('Error stack:', error.stack);
    // Consider retry logic here
  }
};

export { initiateChapaPayment, chapaCallback };