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
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: '',
    trackingNumber: ''
  });

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

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;

    setIsUpdating(prev => ({ ...prev, [orderId]: true }));

    try {
      let updateData = { status: newStatus };

      // Show tracking modal if status is being changed to shipped
      if (newStatus === 'shipped') {
        setCurrentOrder(orderId);
        setShowTrackingModal(true);
        setIsUpdating(prev => ({ ...prev, [orderId]: false }));
        return;
      }

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

  // Handle shipping order with tracking info
  const handleShipOrder = async () => {
    if (!currentOrder) return;

    setIsUpdating(prev => ({ ...prev, [currentOrder]: true }));

    try {
      const response = await axios.put(
        `https://ecommerce-rho-hazel.vercel.app/api/orders/status/${currentOrder}`,
        {
          status: 'shipped',
          carrier: trackingInfo.carrier,
          trackingNumber: trackingInfo.trackingNumber
        },
        {
          headers: {
            'Authorization': `Bearer ${atoken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOrders(prev => prev.map(order =>
          order._id === currentOrder ? {
            ...order,
            status: 'shipped',
            tracking: {
              carrier: trackingInfo.carrier,
              trackingNumber: trackingInfo.trackingNumber,
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          } : order
        ));
        toast.success('Order shipped with tracking information');
        setShowTrackingModal(false);
        setTrackingInfo({ carrier: '', trackingNumber: '' });
      } else {
        throw new Error(response.data.message || 'Failed to ship order');
      }
    } catch (err) {
      console.error('Shipping error:', err);
      toast.error(err.response?.data?.message || 'Failed to ship order');
    } finally {
      setIsUpdating(prev => ({ ...prev, [currentOrder]: false }));
    }
  };

  // Filter orders based on search term
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

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
  };

  // Status badge colors
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

      {/* Search and Stats */}
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

      {/* Tracking Info Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Shipping Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Carrier*</label>
                <select
                  value={trackingInfo.carrier}
                  onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Carrier</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number*</label>
                <input
                  type="text"
                  value={trackingInfo.trackingNumber}
                  onChange={(e) => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tracking number"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingInfo({ carrier: '', trackingNumber: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShipOrder}
                disabled={!trackingInfo.carrier || !trackingInfo.trackingNumber || isUpdating[currentOrder]}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating[currentOrder] ? 'Processing...' : 'Confirm Shipping'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
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

                {/* Customer Info */}
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

                {/* Tracking Info (if shipped) */}
                {(order.status === 'shipped' || order.status === 'delivered') && order.tracking && (
                  <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                    <h3 className="font-medium text-sm mb-2">TRACKING INFORMATION</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Carrier</p>
                        <p className="text-sm font-medium">{order.tracking.carrier || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tracking #</p>
                        <p className="text-sm font-medium">{order.tracking.trackingNumber || 'Not available'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Update</p>
                        <p className="text-sm font-medium">
                          {order.tracking.updatedAt ? 
                            new Date(order.tracking.updatedAt).toLocaleString() : 
                            'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-4">
                  <h3 className="font-medium text-sm mb-2">ITEMS</h3>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 pb-3 border-b last:border-b-0">
                        <img 
                          src={item.image || '/images/product-placeholder.jpg'} 
                          alt={item.name}
                          className="w-12 h-12 object-contain rounded border"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mt-1">
                            <p>Qty: {item.quantity}</p>
                            <p>Size: {item.size}</p>
                            <p>${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-sm">PAYMENT METHOD</h3>
                      <p className="text-sm">{order.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-medium text-sm">ORDER TOTAL</h3>
                      <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search query</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  className={`px-4 py-2 border rounded-md w-10 flex items-center justify-center ${
                    currentPage === pageNum 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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