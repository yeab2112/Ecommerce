import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../asset/asset';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function Profile() {
  const { user, token, fetchUserData, fetchCart } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch user data (which includes normalized orders array)
        const userData = await fetchUserData();
        console.log('User data with orders:', {
          userId: userData._id,
          orderCount: userData.orders.length,
          sampleOrder: userData.orders[0] || null
        });

        // 2. Set orders from normalized user data
        setOrders(userData.orders);

        // 3. Fallback check if orders might exist but weren't populated
        if (userData.orders.length === 0) {
          console.log('Checking for unpopulated orders...');
          try {
            const response = await axios.get(
              'https://ecommerce-rho-hazel.vercel.app/api/orders/user',
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success && response.data.orders?.length > 0) {
              console.log('Found additional orders:', response.data.orders.length);
              setOrders(response.data.orders);
            }
          } catch (err) {
            console.log('Optional orders check failed:', err.message);
          }
        }

        await fetchCart();
      } catch (err) {
        console.error('Profile load error:', {
          message: err.message,
          response: err.response?.data,
          stack: err.stack
        });
        setError(err.message);
        toast.error(err.response?.data?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, navigate, fetchUserData, fetchCart]);

  if (!token) return null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
        <p className="font-bold">Error Loading Profile</p>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const latestOrder = orders[0] || null;
  console.log('Rendering with orders:', {
    count: orders.length,
    sample: latestOrder
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-500 py-8 px-6 text-white">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="mt-2">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
              <img 
                src={user?.image || assets.profile} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = assets.profile}
              />
            </div>
            
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800">
                {user?.name || "Guest User"}
              </h2>
              <p className="text-gray-600">{user?.email || "guest@example.com"}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{user?.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">
                    {latestOrder?.deliveryInfo?.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">
                {latestOrder ? 'Latest Shipping Address' : 'Shipping Address'}
              </h3>
              {latestOrder?.deliveryInfo ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {latestOrder.deliveryInfo.firstName} {latestOrder.deliveryInfo.lastName}
                  </p>
                  <p>{latestOrder.deliveryInfo.address}</p>
                  <p>
                    {latestOrder.deliveryInfo.city}, {latestOrder.deliveryInfo.state} {latestOrder.deliveryInfo.zipCode}
                  </p>
                  <p>{latestOrder.deliveryInfo.country}</p>
                  <p>Phone: {latestOrder.deliveryInfo.phone}</p>
                </div>
              ) : (
                <p className="text-gray-500">No address saved from orders</p>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Recent Orders</h3>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 3).map(order => (
                    <div 
                      key={order._id} 
                      className="border-b pb-4 last:border-0 cursor-pointer hover:bg-gray-100 p-2 rounded transition"
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Order #{order._id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-gray-700">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                        <p className="font-semibold">${order.total?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <button
                    onClick={() => navigate('/collection')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    Browse Products
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/edit-profile')}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            >
              Edit Profile
            </button>
            {/* {orders.length > 0 && (
              <button
                onClick={() => navigate('/orders')}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                View All Orders
              </button>
            )} */}
            <button
              onClick={() => navigate('/products')}
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;