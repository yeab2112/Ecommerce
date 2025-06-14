import React, { useState, useContext } from 'react';
import { ShopContext } from "../context/ShopContext";
import axios from 'axios';

function PlaceOrder() {
  const { setCart, cart, currency, delivery_fee, navigate } = useContext(ShopContext);

  // State for handling delivery information
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

  // State for payment method
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes for delivery information
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Final total price (subtotal + delivery fee)
  const finalTotal = totalPrice + delivery_fee;

  // Handle online payment initiation
 const initiateOnlinePayment = async (orderData) => {
  setIsProcessingPayment(true);
  setError(null);
  
  try {
    // Validate essential data before proceeding
    if (!orderData || !deliveryInfo.email || !finalTotal) {
      throw new Error('Incomplete payment data provided');
    }

    // 1. First create the order in your database
    const orderResponse = await axios.post(
      'https://ecommerce-rho-hazel.vercel.app/api/orders', 
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 15000 // 15 second timeout
      }
    );

    // Enhanced response validation
    if (!orderResponse.data?.success || !orderResponse.data?.order?._id) {
      console.error('Invalid order response:', orderResponse.data);
      throw new Error('Order creation failed - invalid server response');
    }

    const order = orderResponse.data.order;
    console.log('Order created successfully:', order);

    // 2. Prepare payment payload with enhanced validation
    const paymentPayload = {
      amount: finalTotal,
      currency: currency === '$' ? 'USD' : 'ETB',
      email: deliveryInfo.email,
      first_name: deliveryInfo.firstName || '',
      last_name: deliveryInfo.lastName || '',
      tx_ref: order._id,
      callback_url: `${window.location.origin}/api/payment/callback`,
      return_url: `${window.location.origin}/order-confirmation/${order._id}`,
      meta: {
        order_id: order._id,
        user_id: localStorage.getItem('userId') || 'unknown'
      }
    };

    console.log('Payment payload:', paymentPayload);

    // 3. Initiate payment processing with retry logic
    const paymentResponse = await retryRequest(
      () => axios.post(
        'https://ecommerce-rho-hazel.vercel.app/api/payment/initiate',
        paymentPayload,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 20000 // 20 second timeout for payment processing
        }
      ),
      2 // Retry up to 2 times
    );

    // Validate payment response
    if (!paymentResponse.data?.url) {
      console.error('Invalid payment response:', paymentResponse.data);
      throw new Error('Payment gateway did not return redirect URL');
    }

    console.log('Payment initiation successful, redirecting...');
    window.location.href = paymentResponse.data.url;

  } catch (error) {
    console.error('Detailed payment error:', {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response?.data,
      stack: error.stack
    });

    let userMessage = 'Payment processing failed. Please try again.';
    
    if (error.response) {
      // Handle specific error messages from server
      if (error.response.data?.errors) {
        userMessage = error.response.data.errors.join(', ');
      } else if (error.response.data?.message) {
        userMessage = error.response.data.message;
      }
      
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
    } else if (error.code === 'ECONNABORTED') {
      userMessage = 'Request timed out. Please try again.';
    } else if (error.message.includes('network')) {
      userMessage = 'Network error. Please check your internet connection.';
    }

    setError(userMessage);
    setIsProcessingPayment(false);
  }
};

// Helper function for retry logic
const retryRequest = async (fn, retries = 2, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(res => setTimeout(res, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
};

  // Handle order confirmation
  const handleOrderConfirmation = async () => {
    if (!paymentMethod) {
      setError("Please select a payment method.");
      return;
    }
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !deliveryInfo[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      // Prepare items with all required fields
      const orderItems = cart.map(item => ({
        product: item._id || item.productId,
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
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'completed' : 'pending'
      };

      if (paymentMethod === 'Online Payment') {
        await initiateOnlinePayment(orderData);
      } else {
        // For Cash on Delivery
        const response = await axios.post(
          'https://ecommerce-rho-hazel.vercel.app/api/orders',
          orderData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data) {
          setCart([]);
          navigate('/order-confirmation', { state: { order: response.data } });
        } else {
          throw new Error('Failed to create order');
        }
      }
    } catch (error) {
      console.error('Order failed:', error);
      setError(error.message || 'Order failed. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Place Your Order</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Delivery Information */}
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name *"
                value={deliveryInfo.firstName}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name *"
                value={deliveryInfo.lastName}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={deliveryInfo.email}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                name="address"
                placeholder="Street Address *"
                value={deliveryInfo.address}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={deliveryInfo.city}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                name="state"
                placeholder="State/Province"
                value={deliveryInfo.state}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                name="zipCode"
                placeholder="Postal/Zip Code"
                value={deliveryInfo.zipCode}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="country"
                placeholder="Country *"
                value={deliveryInfo.country}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                name="phone"
                placeholder="Phone Number *"
                value={deliveryInfo.phone}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary and Payment */}
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={`${item._id}_${item.size}_${item.color}`} className="flex justify-between mb-2">
                <div>
                  <span>{item.name} (x{item.quantity})</span>
                  {item.size && <span className="text-sm text-gray-500 ml-2">Size: {item.size}</span>}
                  {item.color && <span className="text-sm text-gray-500 ml-2">Color: {item.color}</span>}
                </div>
                <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-semibold text-lg">
            <span>Subtotal</span>
            <span>{currency}{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Delivery Fee</span>
            <span>{currency}{delivery_fee.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold text-xl">
            <span>Total</span>
            <span>{currency}{finalTotal.toFixed(2)}</span>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Select Payment Method</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`w-1/2 p-2 rounded-md text-white transition ${
                  paymentMethod === 'Cash on Delivery' ? 'bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentMethod('Online Payment')}
                className={`w-1/2 p-2 rounded-md text-white transition ${
                  paymentMethod === 'Online Payment' ? 'bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                Online Payment
              </button>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => navigate('/cart')}
              className="bg-gray-500 text-white p-2 rounded-md w-1/3 hover:bg-gray-600 transition"
            >
              Go Back
            </button>
            <button
              onClick={handleOrderConfirmation}
              disabled={isProcessingPayment}
              className={`bg-blue-500 text-white p-2 rounded-md w-1/3 hover:bg-blue-600 transition ${
                isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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