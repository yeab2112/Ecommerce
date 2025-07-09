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
  const [trackingData, setTrackingData] = useState({});
  const [loadingOrders, setLoadingOrders] = useState({});
  const [confirmationNote, setConfirmationNote] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [allItemsReceived, setAllItemsReceived] = useState(false);
  const [itemsInGoodCondition, setItemsInGoodCondition] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewProduct, setCurrentReviewProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Utility function to handle both product structures
 const getProductData = (product) => {
  if (!product) return null;
  
  return {
    _id: product._id,
    name: product.name,
    image: product.image,
    price: product.price,
    // Product-specific fields
    size: product.size,
    color: product.color,
    quantity: product.quantity,
    reviewed: product.reviewed,
    review: product.review
  };
};
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

  const fetchTrackingInfo = async (orderId) => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoadingOrders(prev => ({ ...prev, [orderId]: true }));

    try {
      const response = await axios.get(
        `https://ecommerce-rho-hazel.vercel.app/api/orders/${orderId}/tracking`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setTrackingData(prev => ({
          ...prev,
          [orderId]: {
            status: response.data.status,
            ...(response.data.trackingInfo && {
              trackingInfo: {
                carrier: response.data.trackingInfo.carrier,
                trackingNumber: response.data.trackingInfo.trackingNumber,
                updatedAt: response.data.trackingInfo.updatedAt
              }
            })
          }
        }));
      } else {
        toast.error(response.data.message || 'Failed to fetch tracking information');
      }
    } catch (err) {
      console.error('Error fetching tracking info:', err);
      toast.error(err.response?.data?.message || 'Failed to load tracking information');
    } finally {
      setLoadingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleConfirmReceived = async () => {
    if (!currentOrderId) return;

    try {
      const response = await axios.put(
        `https://ecommerce-rho-hazel.vercel.app/api/orders/confirm-received/${currentOrderId}`,
        {
          note: confirmationNote,
          allItemsReceived,
          itemsInGoodCondition
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOrders(prev => prev.map(order =>
          order._id === currentOrderId ? {
            ...order,
            status: 'received',
            receivedConfirmation: {
              confirmed: true,
              confirmedAt: new Date().toISOString(),
              note: confirmationNote,
              allItemsReceived,
              itemsInGoodCondition
            }
          } : order
        ));
        toast.success('Thank you for confirming receipt of your order!');
        setShowConfirmationModal(false);
        setConfirmationNote('');
        setAllItemsReceived(false);
        setItemsInGoodCondition(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm receipt');
      console.error('Confirmation error:', err.response?.data?.debug);
    }
  };

  const handleSubmitReview = async () => {
  if (!currentReviewProduct || !currentOrderId) {
    toast.error('Missing required review information');
    return;
  }
 const product = getProductData(currentReviewProduct);
  const productId = product._id;
  if (!productId) {
    console.error('Product ID not found in:', currentReviewProduct);
    toast.error('Could not identify the product to review');
    return;
  }
    setIsSubmittingReview(true);

    try {
      const reviewData = {
        productId: productId,
        orderId: currentOrderId,
        rating: reviewRating,
        comment: reviewText.trim()
      };

      const response = await axios.post(
        'https://ecommerce-rho-hazel.vercel.app/api/reviews',
        reviewData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Thank you for your review!');
        setShowReviewModal(false);
        setReviewText('');
        setReviewRating(5);
        setCurrentReviewProduct(null);
        
        setOrders(prev => prev.map(order => {
          if (order._id === currentOrderId) {
            return {
              ...order,
              items: order.items.map(item => {
                const itemProduct = getProductData(item.product);
                if (itemProduct?._id === productId) {
                  return { 
                    ...item, 
                    reviewed: true,
                    review: {
                      rating: reviewRating,
                      comment: reviewText,
                      createdAt: new Date().toISOString()
                    }
                  };
                }
                return item;
              })
            };
          }
          return order;
        }));
      }
    } catch (err) {
      console.error('Review submission error:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-green-200 text-green-900';
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
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Product Received</h3>
            <p className="mb-4">Please confirm that you have physically received and checked your products.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition Check:</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allItemsReceived}
                    onChange={(e) => setAllItemsReceived(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 mr-2"
                  />
                  <span>All items received</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={itemsInGoodCondition}
                    onChange={(e) => setItemsInGoodCondition(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 mr-2"
                  />
                  <span>Items in good condition</span>
                </label>
              </div>
            </div>

            <textarea
              placeholder="Optional: Add any notes about the received products..."
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              rows={3}
              value={confirmationNote}
              onChange={(e) => setConfirmationNote(e.target.value)}
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setConfirmationNote('');
                  setAllItemsReceived(false);
                  setItemsInGoodCondition(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceived}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Review {getProductData(currentReviewProduct)?.name}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="text-2xl focus:outline-none"
                  >
                    {star <= reviewRating ? '★' : '☆'}
                  </button>
                ))}
                <span className="ml-2 text-gray-600">{reviewRating} out of 5</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Share your experience with this product..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewText('');
                  setReviewRating(5);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-8">
        {orders.map((order) => {
          const orderDate = new Date(order.createdAt).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          return (
            <div key={order._id} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">
                    Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-600">Placed on {orderDate}</p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="divide-y">
               {order.items.map((item) => {
 const product = getProductData(item.product);
  const productId = product._id;
  
                  
                  return (
                    <div key={`${order._id}-${productId}`} className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center col-span-2">
                        <img
                          className="w-20 h-20 object-contain"
                          src={product?.image || '/placeholder-product.jpg'}
                          alt={product?.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-product.jpg';
                          }}
                        />
                        <div className="ml-4">
                          <h3 className="font-medium">{product?.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                          {item.size && <p className="text-sm text-gray-600">Size: {product.size}</p>}
                          {product.color && (
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-gray-600 mr-2">Color:</span>
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: product.color.toLowerCase() }}
                                title={product.color}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <p className="font-medium">
                          {currency}{(product ?.price * product.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center justify-end">
                        {(order.status === 'delivered' || order.status === 'received') && (
                          <div>
                            {item.reviewed ? (
                              <span className="text-green-600 text-sm">✓ Reviewed</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setCurrentReviewProduct(product);
                                  setCurrentOrderId(order._id);
                                  setShowReviewModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 p-4 border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full md:w-auto space-y-2">
                  <button
                    onClick={() => fetchTrackingInfo(order._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200 w-full md:w-auto"
                    disabled={loadingOrders[order._id]}
                  >
                    {loadingOrders[order._id] ? 'Loading...' : 'Track Order'}
                  </button>

                  {order.status === 'delivered' && !order.receivedConfirmation?.confirmed && (
                    <button
                      onClick={() => {
                        setCurrentOrderId(order._id);
                        setShowConfirmationModal(true);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200 w-full md:w-auto"
                    >
                      Confirm Product Received
                    </button>
                  )}

                  {order.receivedConfirmation?.confirmed && (
                    <div className="p-2 bg-green-50 text-green-800 rounded-md text-sm">
                      <p>✓ Confirmed received on {new Date(order.receivedConfirmation.confirmedAt).toLocaleString()}</p>
                      {order.receivedConfirmation.note && (
                        <p className="mt-1">Note: {order.receivedConfirmation.note}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto">
                  <p className="text-lg font-medium text-right">Total: {currency}{order.total.toFixed(2)}</p>
                  {trackingData[order._id] && (
                    <div className="mt-2 p-3 bg-white rounded-md border">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Current Status:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        {(order.status === 'shipped' || order.status === 'delivered') && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Carrier:</span>
                              <span>{trackingData[order._id].trackingInfo?.carrier || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Tracking #:</span>
                              <span>{trackingData[order._id].trackingInfo?.trackingNumber || 'Not available'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Last Update:</span>
                              <span>
                                {trackingData[order._id].trackingInfo?.updatedAt ?
                                  new Date(trackingData[order._id].trackingInfo.updatedAt).toLocaleString() :
                                  'Not available'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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