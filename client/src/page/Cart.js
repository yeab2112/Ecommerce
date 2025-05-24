import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { FaPlus, FaMinus, FaTrash } from "react-icons/fa";

function Cart() {
  const { 
    cart, 
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    currency, 
    delivery_fee, 
    navigate
  } = useContext(ShopContext);

  // Calculate total with delivery
  const totalWithDelivery = parseFloat((cartTotal + delivery_fee).toFixed(2));

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6">Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div>
          {/* Cart Items */}
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={`${item._id}_${item.size}_${item.color}`} // Added color to key for uniqueness
                className="flex flex-col md:flex-row p-4 border rounded-lg shadow-sm hover:shadow-md transition duration-300 gap-4"
              >
                {/* Product Image */}
                <div className="flex justify-center sm:justify-start">
                  <img
                    src={item.image || '/placeholder-product.png'}
                    alt={item.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-gray-200"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <p className="text-gray-600">{currency}{item.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Size: {item.size}</p>
                  <p className="text-sm text-gray-500">Color: {item.color}</p>
                </div>

                {/* Quantity and Remove Controls */}
                <div className="flex justify-between sm:justify-center items-center">
                  {/* Quantity Controls */}
                  <div className="flex items-center sm:justify-center space-x-3">
                    <button
                      onClick={() => decreaseQuantity(item._id, item.size, item.color)}
                      className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus className="text-gray-700 text-xs" />
                    </button>
                    <span className="text-lg font-semibold text-center w-6">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increaseQuantity(item._id, item.size, item.color)}
                      className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
                    >
                      <FaPlus className="text-gray-700 text-xs" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item._id, item.size, item.color)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                    aria-label="Remove item"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Section */}
          <div className="mt-6 p-4 sm:p-6 border rounded-lg shadow-sm bg-gray-50">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{currency}{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Delivery Fee:</span>
              <span className="font-medium">{currency}{delivery_fee.toFixed(2)}</span>
            </div>
            <hr className="my-3 border-gray-300" />
            <div className="flex justify-between text-lg sm:text-xl">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">
                {currency}{totalWithDelivery.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => navigate('/place-order')}
              className="w-full mt-4 sm:mt-6 bg-blue-600 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-medium"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
