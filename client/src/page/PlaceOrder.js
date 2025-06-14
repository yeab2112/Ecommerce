import React, { useState, useContext } from 'react';
import { ShopContext } from "../context/ShopContext";
import axios from 'axios';

function PlaceOrder() {
  const { setCart, cart, currency, delivery_fee, navigate } = useContext(ShopContext);
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({ ...prev, [name]: value }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = totalPrice + delivery_fee;

  const initiateOnlinePayment = async (orderData) => {
    setIsProcessingPayment(true);
    setError(null);
    
    try {
      // 1. Create order in database
      const orderResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/orders`, 
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 15000
        }
      );

      if (!orderResponse.data?.success || !orderResponse.data?.order?._id) {
        throw new Error('Order creation failed');
      }

      const order = orderResponse.data.order;
      
      // 2. Prepare payment payload
      const paymentPayload = {
        amount: finalTotal,
        currency: currency === '$' ? 'USD' : 'ETB',
        email: deliveryInfo.email,
        first_name: deliveryInfo.firstName,
        last_name: deliveryInfo.lastName,
        tx_ref: order.paymentDetails.tx_ref, // Use the generated tx_ref
        callback_url: `${window.location.origin}/api/payment/callback`,
        return_url: `${window.location.origin}/order-confirmation/${order._id}`,
        meta: {
          order_id: order._id,
          user_id: localStorage.getItem('userId')
        }
      };

      // 3. Initiate payment
      const paymentResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/payment/initiate`,
        paymentPayload,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );

      if (!paymentResponse.data?.url) {
        throw new Error('Payment gateway error');
      }

      window.location.href = paymentResponse.data.url;

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.message || 'Payment processing failed. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleOrderConfirmation = async () => {
    if (!paymentMethod) {
      setError("Please select a payment method.");
      return;
    }
    
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !deliveryInfo[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      const orderItems = cart.map(item => ({
        product: item._id,
        name: item.name,
        image: item.image,
        size: item.size || 'standard',
        color: item.color || 'default',
        quantity: item.quantity,
        price: item.price
      }));

      const orderData = {
        deliveryInfo,
        paymentMethod,
        items: orderItems,
        subtotal: totalPrice,
        deliveryFee: delivery_fee,
        total: finalTotal,
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'pending'
      };

      if (paymentMethod === 'Online Payment') {
        await initiateOnlinePayment(orderData);
      } else {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/orders`,
          orderData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          setCart([]);
          navigate('/order-confirmation', { state: { order: response.data.order } });
        }
      }
    } catch (error) {
      console.error('Order error:', error);
      setError(error.response?.data?.message || 'Order failed. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart-message">
        <h1>Your cart is empty</h1>
        <button onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="order-container">
      <h1>Place Your Order</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="order-grid">
        {/* Delivery Information Form */}
        <div className="delivery-form">
          <h2>Delivery Information</h2>
          {/* Form fields remain the same */}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          
          {cart.map((item) => (
            <div key={`${item._id}_${item.size}_${item.color}`} className="cart-item">
              <span>{item.name} (x{item.quantity})</span>
              <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>{currency}{totalPrice.toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>Delivery Fee</span>
              <span>{currency}{delivery_fee.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Total</span>
              <span>{currency}{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-methods">
            <h2>Payment Method</h2>
            <div className="method-buttons">
              <button
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={paymentMethod === 'Cash on Delivery' ? 'active' : ''}
              >
                Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentMethod('Online Payment')}
                className={paymentMethod === 'Online Payment' ? 'active' : ''}
              >
                Online Payment
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate('/cart')}>Go Back</button>
            <button
              onClick={handleOrderConfirmation}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceOrder;