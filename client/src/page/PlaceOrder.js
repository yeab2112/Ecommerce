import React, { useState, useContext } from 'react';
import { ShopContext } from "../context/ShopContext";

function PlaceOrder() {
  const { setCart,cart, currency, delivery_fee, navigate } = useContext(ShopContext);

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

  // Handle input changes for delivery information
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo({ ...deliveryInfo, [name]: value });
  };

  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Final total price (subtotal + delivery fee)
  const finalTotal = totalPrice + delivery_fee;

  // Handle order confirmation
  const handleOrderConfirmation = async () => {
  if (!paymentMethod) {
    alert("Please select a payment method.");
    return;
  }
  
  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'country', 'phone'];
  const missingFields = requiredFields.filter(field => !deliveryInfo[field]);
  
  if (missingFields.length > 0) {
    alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
    return;
  }
  
  try {
    // Prepare items with all required fields
    const orderItems = cart.map(item => ({
      product: item._id || item.productId, // Ensure you're sending the product ID
      name: item.name,
      image: item.image, // Add if your backend expects it
      size: item.size || 'standard', // Provide default if needed
      color: item.color || 'default',
      quantity: item.quantity,
      price: item.price
    }));

    const orderData = {
      deliveryInfo,
      paymentMethod,
      items: orderItems, // Use the properly formatted items
      subtotal: totalPrice,
      deliveryFee: delivery_fee,
      total: finalTotal
    };

    // Send to backend
    const response = await fetch('https://ecommerce-rho-hazel.vercel.app/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create order');
    }

    setCart([]);
    navigate('/order-confirmation');
  } catch (error) {
    console.error('Order failed:', error);
    alert(error.message || 'Order failed. Please try again.');
  }
};
;
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Place Your Order</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Delivery Information */}
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
          <div className="space-y-4">
            {/* First Name and Last Name Side by Side */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name *"
                value={deliveryInfo.firstName}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name *"
                value={deliveryInfo.lastName}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
                required
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={deliveryInfo.email}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
                required
              />
            </div>

            {/* Street Address */}
            <div className="mb-4">
              <input
                type="text"
                name="address"
                placeholder="Street Address *"
                value={deliveryInfo.address}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
                required
              />
            </div>

            {/* City and State Side by Side */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={deliveryInfo.city}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
                required
              />
              <input
                type="text"
                name="state"
                placeholder="State/Province"
                value={deliveryInfo.state}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
              />
            </div>

            {/* Zip Code and Country Side by Side */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                name="zipCode"
                placeholder="Postal/Zip Code"
                value={deliveryInfo.zipCode}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
              />
              <input
                type="text"
                name="country"
                placeholder="Country *"
                value={deliveryInfo.country}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
                required
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <input
                type="text"
                name="phone"
                placeholder="Phone Number *"
                value={deliveryInfo.phone}
                onChange={handleInputChange}
                className="border p-2 w-full rounded-md"
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary and Payment */}
        <div className="p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          {/* Order Items Summary */}
          <div className="space-y-4 mb-6">
            {cart.map((item, index) => (
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

          {/* Total Price */}
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

          {/* Payment Method Selection */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Select Payment Method</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`w-1/2 p-2 rounded-md text-white ${paymentMethod === 'Cash on Delivery' ? 'bg-green-500' : 'bg-gray-500'}`}
              >
                Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentMethod('Online Payment')}
                className={`w-1/2 p-2 rounded-md text-white ${paymentMethod === 'Online Payment' ? 'bg-green-500' : 'bg-gray-500'}`}
              >
                Online Payment
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => navigate('/cart')}
              className="bg-gray-500 text-white p-2 rounded-md w-1/3 hover:bg-gray-600 transition"
            >
              Go Back
            </button>
            <button
              onClick={handleOrderConfirmation}
              className="bg-blue-500 text-white p-2 rounded-md w-1/3 hover:bg-blue-600 transition"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceOrder;