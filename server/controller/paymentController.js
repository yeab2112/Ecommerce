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

const chapaCallback = async (req, res) => {
    try {
      const { tx_ref, status } = req.query;
  
      // First check the immediate status from callback
      if (status !== 'success') {
        await Order.findOneAndUpdate(
          { _id: tx_ref },
          { payment: 'payment_failed' }
        );
        return res.redirect(`http://localhost:3000/payment-failed`);
      }
  
      // Verify the transaction with Chapa (additional security check)
      const verificationResponse = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
          }
        }
      );
  
      if (verificationResponse.data.status !== 'success') {
        await Order.findOneAndUpdate(
          { _id: tx_ref },
          { payment: 'false' }
        );
        return res.redirect(`http://localhost:3000/payment-failed`);
      }
  
      // Only mark as paid after successful verification
      const order = await Order.findOneAndUpdate(
        { _id: tx_ref },
        { 
          payment: 'true',
          paymentDetails: verificationResponse.data.data
        },
        { new: true }
      );
  
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      return res.redirect(`http://localhost:3000/order-confirmation/${order._id}`);
      
    } catch (error) {
      console.error('Payment callback error:', error);
      // Optionally update order status to 'payment_verification_failed' here
      res.status(500).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }
  };
  ;
 export{initiateChapaPayment,chapaCallback}