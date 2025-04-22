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
  const [ordersPerPage] = useState(10);
  const [isUpdating, setIsUpdating] = useState({});

  const atoken = localStorage.getItem('atoken');

  // Fetch all orders
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
      let updateData = { status: newStatus };

      const response = await axios.put(
        `https://ecommerce-rho-hazel.vercel.app/api/orders/status/${orderId}`,
        updateData,
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders by ID, name, or email..."
              className="w-full p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {currentOrders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {currentOrders.map(order => (
              <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                  <div>
                    <h2 className="font-semibold text-lg">
                      Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      disabled={isUpdating[order._id]}
                      className="border rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h3 className="font-medium text-sm mb-2">CUSTOMER</h3>
                    <p className="text-sm">{order.user?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{order.user?.email || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h3 className="font-medium text-sm mb-2">DELIVERY</h3>
                    <p className="text-sm">
                      {order.deliveryInfo?.firstName} {order.deliveryInfo?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.deliveryInfo?.address}, {order.deliveryInfo?.city}, {order.deliveryInfo?.state} {order.deliveryInfo?.zipCode}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                  <h3 className="font-medium text-sm mb-2">TRACKING INFORMATION</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Carrier</p>
                      <p className="text-sm font-medium">{order.tracking?.carrier || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tracking Number</p>
                      <p className="text-sm font-medium">{order.tracking?.number || 'Not available'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">No orders available</div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          <span>Page</span>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => paginate(Number(e.target.value))}
            min="1"
            max={totalPages}
            className="w-12 text-center border rounded-md px-2 py-1"
          />
          <span>of {totalPages}</span>
        </div>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Orders;
