import axios from 'axios';
import Order from "../moduls/order.js";
import dotenv from 'dotenv';
dotenv.config();

const initiateChapaPayment = async (req, res) => {
  try {
    const { amount, email, tx_ref } = req.body;
    
    if (!amount || !email || !tx_ref) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    const callback_url = `${req.protocol}://${req.get('host')}/api/payment/callback`;
    
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount,
        currency: 'ETB',
        email,
        tx_ref,
        callback_url,
        return_url: 'https://ecommerce-client-lake.vercel.app/order-confirmation'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return res.json({ 
      checkout_url: response.data.data.checkout_url 
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ 
      error: 'Payment processing failed' 
    });
  }
};

const chapaCallback = async (req, res) => {
  try {
    // Handle both GET-with-body and normal cases
    const tx_ref = req.body?.trx_ref || req.query?.tx_ref;
    const status = req.body?.status || req.query?.status;

    if (!tx_ref) {
      return res.status(400).json({ 
        error: 'Missing transaction reference' 
      });
    }

    // Immediate response
    res.status(200).json({ received: true });

    // Verify payment
    if (status === 'success') {
      const { data } = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
        {
          headers: { 
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` 
          },
          timeout: 8000
        }
      );

      await Order.updateOne(
        { _id: tx_ref },
        {
          status: 'processing',
          paymentStatus: 'completed',
          updatedAt: new Date()
        }
      );
    } else {
      await Order.updateOne(
        { _id: tx_ref },
        { 
          paymentStatus: 'failed',
          updatedAt: new Date()
        }
      );
    }

  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ 
      error: 'Callback processing failed' 
    });
  }
};

export { initiateChapaPayment, chapaCallback };