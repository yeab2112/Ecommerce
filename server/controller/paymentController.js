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

    console.log("🌐 Chapa callback query:", req.query);

    // Validate tx_ref exists
    if (!tx_ref) {
      return res.redirect(
        `https://ecommerce-client-lake.vercel.app/order-confirmation/payment-error?reason=missing_reference`
      );
    }

    // Case 1: Initial status check failed
    if (status !== 'success') {
      await Order.findOneAndUpdate(
        { _id: tx_ref },
        { 
          'paymentDetails.status': 'failed',
          'updatedAt': new Date()
        }
      );
      return res.redirect(
        `https://ecommerce-client-lake.vercel.app/order-confirmation/payment-failed?tx_ref=${tx_ref}`
      );
    }

    // Case 2: Verify with Chapa API
    const verificationResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
        },
        timeout: 5000
      }
    );

    const verificationData = verificationResponse.data;

    // Case 3: Verification failed
    if (verificationData.status !== 'success' || !verificationData.data) {
      await Order.findOneAndUpdate(
        { _id: tx_ref },
        { 
          'paymentDetails.status': 'verification_failed',
          'updatedAt': new Date()
        }
      );
      return res.redirect(
        `https://ecommerce-client-lake.vercel.app/order-confirmation/payment-failed?reason=verification&tx_ref=${tx_ref}`
      );
    }

    // Case 4: Success - Update order
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: tx_ref },
      {
        paymentMethod: verificationData.data.payment_method || 'chapa',
        paymentDetails: {
          ...verificationData.data,
          status: 'completed'
        },
        status: 'processing',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.redirect(
        `https://ecommerce-client-lake.vercel.app/order-confirmation/payment-error?reason=order_not_found&tx_ref=${tx_ref}`
      );
    }

    // Success redirect
    return res.redirect(
      `https://ecommerce-client-lake.vercel.app/order-confirmation/${updatedOrder._id}?payment_status=success`
    );

  } catch (error) {
    console.error('❌ Payment callback error:', error.message);
    
    try {
      await Order.findOneAndUpdate(
        { _id: req.query.tx_ref },
        { 
          'paymentDetails.status': 'errored',
          'updatedAt': new Date()
        }
      );
    } catch (dbError) {
      console.error('❌ Failed to update order:', dbError.message);
    }

    return res.redirect(
      `https://ecommerce-client-lake.vercel.app/order-confirmation/payment-error?reason=server_error&tx_ref=${req.query.tx_ref || 'unknown'}`
    );
  }
};



 export{initiateChapaPayment,chapaCallback}