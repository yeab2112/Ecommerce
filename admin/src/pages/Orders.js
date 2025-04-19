import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const [isUpdating, setIsUpdating] = useState({});

  const atoken = localStorage.getItem('atoken');

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/orders/allOrder', {
          headers: {
            'Authorization': `Bearer ${atoken}`
          }
        });

        if (response.data.success) {
          setOrders(response.data.orders);
        } else {
          throw new Error(response.data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || err.message);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, [atoken]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;

    setIsUpdating(prev => ({ ...prev, [orderId]: true }));

    try {
      const response = await axios.put(
        `https://ecommerce-rho-hazel.vercel.app/api/orders/status/${orderId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${atoken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOrders(prev => prev.map(order =>
          order._id === orderId ? {
            ...order,
            status: newStatus,
            updatedAt: new Date().toISOString()
          } : order
        ));
        toast.success(`Status updated to ${newStatus}`);
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order._id.toLowerCase().includes(searchLower) ||
      (order.user?.email?.toLowerCase().includes(searchLower)) ||
      (order.deliveryInfo?.firstName?.toLowerCase().includes(searchLower)) ||
      (order.deliveryInfo?.lastName?.toLowerCase().includes(searchLower)) ||
      (order.deliveryInfo?.email?.toLowerCase().includes(searchLower))
    );
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Orders Management</h1>

      {/* Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search orders..."
          className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <p className="mt-2 text-sm text-gray-500">
          Showing {currentOrders.length} of {filteredOrders.length} filtered orders ({orders.length} total)
        </p>
      </div>

      {/* Orders */}
      <div className="space-y-6 mb-6">
        {currentOrders.length > 0 ? (
          currentOrders.map(order => (
            <div key={order._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white">
              <div className="bg-gray-100 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b">
                <div>
                  <h2 className="font-semibold text-lg">Order #{order._id.slice(-6)}</h2>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    disabled={isUpdating[order._id]}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="p-4">
                {/* User & Delivery Info Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">User Info</p>
                    <p><span className="text-gray-600">Name:</span> {order.user?.name || 'N/A'}</p>
                    <p><span className="text-gray-600">Email:</span> {order.user?.email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Delivery Info</p>
                    <p><span className="text-gray-600">To:</span> {order.deliveryInfo?.firstName} {order.deliveryInfo?.lastName}</p>
                    <p><span className="text-gray-600">Address:</span> {order.deliveryInfo?.address}, {order.deliveryInfo?.city}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <p className="font-medium mb-2">Items</p>
                  <div className="space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-start border-b pb-2 last:border-b-0">
                        <img 
                          src={item.image || '/placeholder.jpg'} 
                          alt={item.name}
                          className="w-14 h-14 object-contain mr-4 border rounded"
                        />
                        <div className="text-sm">
                          <p className="font-medium">{item.name}</p>
                          <div className="grid grid-cols-2 gap-x-6">
                            <p><span className="text-gray-600">Qty:</span> {item.quantity}</p>
                            <p><span className="text-gray-600">Size:</span> {item.size}</p>
                            <p><span className="text-gray-600">Price:</span> ${item.price.toFixed(2)}</p>
                            <p><span className="text-gray-600">Total:</span> ${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Summary</p>
                  <div className="flex justify-between">
                    <div className="text-sm">
                      <p><span className="text-gray-600">Payment:</span> {order.paymentMethod}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p><span className="text-gray-600">Subtotal:</span> ${order.subtotal.toFixed(2)}</p>
                      <p><span className="text-gray-600">Delivery:</span> ${order.deliveryFee.toFixed(2)}</p>
                      <p className="font-bold mt-1">Total: ${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-sm text-gray-500">Try a different search.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 text-sm">
          <p>
            Showing <strong>{indexOfFirstOrder + 1}</strong> to <strong>{Math.min(indexOfLastOrder, filteredOrders.length)}</strong> of <strong>{filteredOrders.length}</strong> results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
