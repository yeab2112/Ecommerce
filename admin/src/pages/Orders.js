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

  // Ethiopian shipping carriers
  const ethiopianCarriers = [
    { value: '', label: 'Select Shipping Company' },
    { value: 'Ethiopian Postal Service', label: 'Ethiopian Postal Service' },
    { value: 'DHL Ethiopia', label: 'DHL Ethiopia' },
    { value: 'FedEx Ethiopia', label: 'FedEx Ethiopia' },
    { value: 'EMS Ethiopia', label: 'EMS Ethiopia' },
    { value: 'Sky Freight', label: 'Sky Freight' },
    { value: 'National Courier', label: 'National Courier' },
    { value: 'Other', label: 'Other Local Provider' }
  ];

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

  // Allowed status transitions
  const getAllowedStatuses = (currentStatus) => {
    const transitions = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return transitions[currentStatus] || [];
  };

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
      toast.error(err.response?.data?.message || 'Invalid status transition');
      // Force re-render to reset dropdown
      setOrders(prev => [...prev]);
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
      (order.deliveryInfo?.email?.toLowerCase().includes(searchLower))||
      (order.status?.toLowerCase().includes(searchLower))

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
    <div className="container mx-auto px-4 py-8 min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>

      {/* Search and Stats */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders by ID, name, Status or email..."
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Company*</label>
                <select
                  value={trackingInfo.carrier}
                  onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {ethiopianCarriers.map((carrier) => (
                    <option key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </option>
                  ))}
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
      <div className="space-y-6">
        {currentOrders.length > 0 ? (
          currentOrders.map(order => (
            <div key={order._id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="font-semibold text-lg">
                    Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-0 flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    disabled={isUpdating[order._id] || ['delivered', 'cancelled'].includes(order.status)}
                    className="border rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    {/* Current status */}
                    <option value={order.status}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </option>

                    {/* Dynamically show allowed statuses */}
                    {getAllowedStatuses(order.status).map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                {/* Customer and Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Name:</span> {order.user?.name || 'N/A'}</p>
                      <p><span className="text-gray-600">Email:</span> {order.user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-3">Delivery Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Recipient:</span> {order.deliveryInfo?.firstName} {order.deliveryInfo?.lastName}</p>
                      <p><span className="text-gray-600">Address:</span> {order.deliveryInfo?.address}</p>
                      <p><span className="text-gray-600">City:</span> {order.deliveryInfo?.city}</p>
                      <p><span className="text-gray-600">Phone:</span> {order.deliveryInfo?.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking Information (if shipped) */}
                {(order.status === 'shipped' || order.status === 'delivered') && order.tracking && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                    <h3 className="font-medium text-gray-700 mb-3">Shipping Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Shipping Company</p>
                        <p className="font-medium">{order.tracking.carrier || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tracking Number</p>
                        <p className="font-medium">{order.tracking.trackingNumber || 'Not available'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Update</p>
                        <p className="font-medium">
                          {order.tracking.updatedAt ? 
                            new Date(order.tracking.updatedAt).toLocaleString() : 
                            'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <img 
                          src={item.image || '/images/product-placeholder.jpg'} 
                          alt={item.name}
                          className="w-16 h-16 object-contain rounded border"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/product-placeholder.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600 mt-1">
                            <p>Size: {item.size}</p>
                            <p>Qty: {item.quantity}</p>
                            <p>Price: ${item.price.toFixed(2)}</p>
                            {item.color && (
                              <div className="flex items-center">
                                <span>Color: </span>
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-300 ml-1"
                                  style={{ backgroundColor: item.color.toLowerCase() }}
                                  title={item.color}
                                />
                                <span className="ml-1">{item.color}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-3">Order Summary</h3>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <p className="text-gray-600">Payment Method:</p>
                      <p className="font-medium">{order.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">Subtotal: <span className="font-medium">${order.subtotal.toFixed(2)}</span></p>
                        <p className="text-gray-600">Delivery Fee: <span className="font-medium">${order.deliveryFee.toFixed(2)}</span></p>
                        <p className="text-lg font-bold mt-2">Total: ${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} - {filteredOrders.length} total orders
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