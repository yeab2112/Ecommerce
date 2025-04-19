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

  // Get current orders for pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Change page
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

      {/* Search Section */}
      <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search orders..."
          className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
        />
        <div className="mt-2 text-xs sm:text-sm text-gray-500">
          Showing {currentOrders.length} of {filteredOrders.length} filtered orders ({orders.length} total)
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4 mb-6">
        {currentOrders.length > 0 ? (
          currentOrders.map(order => (
            <div key={order._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="bg-gray-50 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b">
                <div className="mb-2 sm:mb-0">
                  <h2 className="font-semibold text-base sm:text-lg">Order #{order._id.slice(-6)}</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    disabled={isUpdating[order._id]}
                    className={`border rounded-md p-1 sm:p-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isUpdating[order._id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-3 sm:p-4">
                {/* Customer Info */}
                <div className="mb-3 sm:mb-4">
                  <h3 className="font-medium text-base sm:text-lg mb-1 sm:mb-2 text-gray-800">Customer</h3>
                  <div className="grid grid-cols-1 gap-2 sm:gap-4">
                    <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs sm:text-sm">
                      <p className="font-medium">User Details</p>
                      <p><span className="text-gray-600">Name:</span> {order.user?.name || 'N/A'}</p>
                      <p><span className="text-gray-600">Email:</span> {order.user?.email || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs sm:text-sm">
                      <p className="font-medium">Delivery Details</p>
                      <p><span className="text-gray-600">To:</span> {order.deliveryInfo?.firstName} {order.deliveryInfo?.lastName}</p>
                      <p><span className="text-gray-600">Address:</span> {order.deliveryInfo?.address}, {order.deliveryInfo?.city}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-3 sm:mb-4">
                  <h3 className="font-medium text-base sm:text-lg mb-1 sm:mb-2 text-gray-800">Items</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex border-b pb-2 sm:pb-3 last:border-0">
                        <img 
                          src={item.image || '/placeholder-product.jpg'} 
                          alt={item.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain mr-2 sm:mr-4 rounded border border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-product.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{item.name}</p>
                          <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm mt-1">
                            <div><span className="text-gray-600">Size:</span> {item.size}</div>
                            <div><span className="text-gray-600">Qty:</span> {item.quantity}</div>
                            <div><span className="text-gray-600">Price:</span> ${item.price.toFixed(2)}</div>
                            <div><span className="text-gray-600">Total:</span> ${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-2 sm:p-4 rounded text-xs sm:text-sm">
                  <h3 className="font-medium text-base sm:text-lg mb-1 sm:mb-2 text-gray-800">Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <p><span className="text-gray-600">Payment:</span> {order.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p><span className="text-gray-600">Subtotal:</span> ${order.subtotal.toFixed(2)}</p>
                      <p><span className="text-gray-600">Delivery:</span> ${order.deliveryFee.toFixed(2)}</p>
                      <p className="font-bold sm:text-lg mt-1 sm:mt-2">Total: ${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Pagination Controls - Only show if there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastOrder, filteredOrders.length)}
            </span>{' '}
            of <span className="font-medium">{filteredOrders.length}</span> results
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Show page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`px-3 py-1 rounded-md border text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-3 py-1 text-sm">...</span>
            )}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => paginate(totalPages)}
                className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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