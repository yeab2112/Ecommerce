import React, { useState, useContext } from 'react';
import { ShopContext } from "../context/ShopContext";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PlaceOrder() {
  const { cart, currency, delivery_fee, navigate, token, setCart } = useContext(ShopContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo({ ...deliveryInfo, [name]: value });
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = totalPrice + delivery_fee;

  const initiateChapaPayment = async (orderId) => {
    setIsProcessingPayment(true);
    try {
      const response = await axios.post(
        'https://ecommerce-rho-hazel.vercel.app/api/payment/chapa',
        {
          amount: finalTotal,
          currency: 'ETB',
          email: deliveryInfo.email,
          first_name: deliveryInfo.firstName,
          last_name: deliveryInfo.lastName,
          tx_ref: orderId,
          callback_url: `${window.location.origin}/order-confirmation/${orderId}`,
          return_url: `${window.location.origin}/order-confirmation/${orderId}`,
          meta: { orderId }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment initiation failed');
      setIsProcessingPayment(false);
    }
  };

  const handleOrderConfirmation = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (!token) {
      toast.error("Please login to place an order.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        deliveryInfo,
        paymentMethod,
        items: cart.map(item => ({
          product: item._id,  
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image
        })),
        subtotal: totalPrice,
        deliveryFee: delivery_fee,
        total: finalTotal,
        status: paymentMethod === 'Cash on Delivery' ? 'pending' : 'payment_pending'
      };

      const response = await axios.post(
        'https://ecommerce-rho-hazel.vercel.app/api/orders',
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        if (paymentMethod === 'Cash on Delivery') {
          toast.success('Order placed successfully!');
          navigate('/order-confirmation', {
            state: {
              orderId: response.data.order._id,
              orderDetails: response.data.order
            }
          });
          setCart([]);
        } else if (paymentMethod === 'Online Payment') {
          await initiateChapaPayment(response.data.order._id);
        }
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      if (paymentMethod !== 'Online Payment') {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Place Your Order</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Delivery Info */}
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input type="text" name="firstName" placeholder="First Name" value={deliveryInfo.firstName} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
              <input type="text" name="lastName" placeholder="Last Name" value={deliveryInfo.lastName} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
            </div>
            <input type="email" name="email" placeholder="Email" value={deliveryInfo.email} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
            <input type="text" name="address" placeholder="Street Address" value={deliveryInfo.address} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
            <div className="flex gap-4">
              <input type="text" name="city" placeholder="City" value={deliveryInfo.city} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
              <input type="text" name="state" placeholder="State" value={deliveryInfo.state} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
            </div>
            <div className="flex gap-4">
              <input type="text" name="zipCode" placeholder="Zip Code" value={deliveryInfo.zipCode} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
              <input type="text" name="country" placeholder="Country" value={deliveryInfo.country} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
            </div>
            <input type="tel" name="phone" placeholder="Phone Number" value={deliveryInfo.phone} onChange={handleInputChange} className="border p-2 w-full rounded-md" required />
          </div>
        </div>

        {/* Order Summary & Payment */}
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="space-y-4 mb-6">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.name} (Size: {item.size}, Qty: {item.quantity})</span>
                <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-semibold text-base">
            <span>Subtotal</span>
            <span>{currency}{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span>Delivery Fee</span>
            <span>{currency}{delivery_fee.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold text-xl">
            <span>Total</span>
            <span>{currency}{finalTotal.toFixed(2)}</span>
          </div>

          {/* Payment Method Buttons */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Select Payment Method</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`w-full sm:w-1/2 p-2 text-sm rounded-md text-white whitespace-nowrap ${
                  paymentMethod === 'Cash on Delivery' ? 'bg-green-600' : 'bg-gray-500'
                }`}
              >
                Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentMethod('Online Payment')}
                className={`w-full sm:w-1/2 p-2 text-sm rounded-md text-white whitespace-nowrap ${
                  paymentMethod === 'Online Payment' ? 'bg-green-600' : 'bg-gray-500'
                }`}
              >
                Online Payment
              </button>
            </div>
            {paymentMethod === 'Online Payment' && (
              <div className="mt-2 text-sm text-gray-600">
                You will be redirected to Chapa to complete payment.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
            <button
              onClick={() => navigate('/cart')}
              className="bg-gray-500 text-white py-2 px-4 rounded-md w-full sm:w-1/2 whitespace-nowrap"
            >
              Go Back
            </button>
            <button
              onClick={handleOrderConfirmation}
              disabled={isSubmitting || isProcessingPayment}
              className={`bg-blue-600 text-white py-2 px-4 rounded-md w-full sm:w-1/2 whitespace-nowrap ${
                isSubmitting || isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessingPayment
                ? 'Redirecting to Payment...'
                : isSubmitting
                ? 'Processing...'
                : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceOrder;
