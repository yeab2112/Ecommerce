import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from "../context/ShopContext";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function OrderConfirmation() {
  const { currency, navigate, token } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState({});
  const [loadingOrders, setLoadingOrders] = useState({});

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/orders/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success && response.data.orders && response.data.orders.length > 0) {
          setOrders(response.data.orders);
        } else {
          setError('No orders found');
          toast.info('No orders found');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || err.message);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [token, navigate]);

  const fetchOrderTracking = async (orderId) => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoadingOrders(prev => ({ ...prev, [orderId]: true }));

    try {
      const response = await axios.get(`https://ecommerce-rho-hazel.vercel.app/api/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTrackingInfo(prev => ({
          ...prev,
          [orderId]: response.data.trackingInfo
        }));
      } else {
        toast.error(response.data.message || 'Failed to fetch tracking info');
      }
    } catch (err) {
      console.error('Error fetching tracking info:', err);
      toast.error(err.response?.data?.message || 'Failed to load tracking information');
    } finally {
      setLoadingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6 text-center"><h2 className="text-xl">Loading order details...</h2></div>;
  }

  if (error || orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-xl text-gray-700">No orders found</h2>
        <p className="text-gray-500 mt-2">You haven't placed any orders yet.</p>
        <button onClick={() => navigate('/')} className="mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      
      <div className="space-y-8">
        {orders.map((order) => {
          const orderDate = new Date(order.createdAt).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          return (
            <div key={order._id} className="border rounded-lg overflow-hidden shadow-sm">
              {/* Order Header */}
              <div className="bg-gray-50 p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="font-semibold">
                    Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-600">Placed on {orderDate}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y">
                {order.items.map((item, index) => (
                  <div key={index} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Product Image */}
                    <div className="flex items-center">
                      <img
                        className="w-20 h-20 object-contain"
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="ml-4">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">Size: {item.size}</p>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center md:justify-center">
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                    </div>

                    {/* Price - Stacked on small screens, side by side on larger */}
                    <div className="flex flex-col md:items-end">
                      <p className="font-medium">{currency}{item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 md:hidden">Price</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary and Tracking */}
              <div className="bg-gray-50 p-4 border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full md:w-auto">
                  <button
                    onClick={() => fetchOrderTracking(order._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200 w-full md:w-auto"
                    disabled={loadingOrders[order._id]}
                  >
                    {loadingOrders[order._id] ? 'Loading...' : 'Track Order'}
                  </button>
                </div>
                
                <div className="text-right w-full md:w-auto">
                  <p className="text-lg font-medium">Total: {currency}{order.total.toFixed(2)}</p>
                  {trackingInfo[order._id] && (
                    <div className="mt-2 p-3 bg-white rounded-md border text-sm">
                      <h4 className="font-medium mb-1">Tracking Information</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600">Carrier:</span>
                        <span>{trackingInfo[order._id].carrier}</span>
                        <span className="text-gray-600">Tracking #:</span>
                        <span>{trackingInfo[order._id].trackingNumber}</span>
                        <span className="text-gray-600">Status:</span>
                        <span>{trackingInfo[order._id].status}</span>
                        <span className="text-gray-600">Last Update:</span>
                        <span>{new Date(trackingInfo[order._id].updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Back to Home Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default OrderConfirmation;