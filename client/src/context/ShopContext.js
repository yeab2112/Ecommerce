import axios from 'axios';
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const ShopContext = createContext();

function ShopContextProvider({ children }) {
  const currency = "$";
  const delivery_fee = 10;
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  // Fetch all products
  const getProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/product/list_products');
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      console.log('Fetching user data...');
      const response = await axios.get(
        'https://ecommerce-rho-hazel.vercel.app/api/user/me',
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log('Full API response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData)
        
        // Debug: Check what's actually being returned
        console.log('User data structure:', {
          id: userData._id,
          orderCount: userData.orders?.length || 0,
          hasDeliveryInfo: userData.orders?.[0]?.deliveryInfo ? true : false
        });
  
        // Normalize data structure
        return {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          createdAt: userData.createdAt,
          orders: userData.orders || [], // Ensure array
          cartdata: userData.cartdata || {}
        };
      }
      throw new Error(response.data.message || 'Failed to fetch user data');
    } catch (error) {
      console.error('Error in fetchUserData:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }, [token]);

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart([]);
      return;
    }

    try {
      const response = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/cart/get', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const cartData = response.data.cartdata || {};
        
        // Convert cart object to array with proper structure
        const cartArray = Object.entries(cartData).map(([cartKey, item]) => ({
          ...item,
          _id: item.productId || item.product, // Handle both cases
          cartKey,
          productId: item.productId || item.product, // Consistent field
          size: item.size,
          color: item.color,
          quantity: item.quantity || 1,
          price: item.price || 0,
          name: item.name || 'Unknown Product',
          image: item.image || ''
        }));

        setCart(cartArray);
      }
    } catch (error) {
      console.error('Cart fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to load cart');
      setCart([]);
    }
  }, [token]);


  // Calculate cart totals safely
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const quantity = Number(item?.quantity) || 0;
      return sum + quantity;
    }, 0);
  }, [cart]);

  // Initialize data on component mount
  useEffect(() => {
    getProducts();
    if (token) {
      fetchCart();
      fetchUserData();
    }
  }, [getProducts, fetchCart, fetchUserData, token]);

  // Add to cart function
 // Add to cart function - Updated
  const addToCart = async (productId, size, color) => {
    if (!token) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return false;
    }

    // Normalize inputs
    const normalizedSize = size?.trim()?.toUpperCase();
    const normalizedColor = typeof color === 'string' 
      ? color.trim() 
      : color?.name?.trim();

    if (!normalizedSize || !normalizedColor) {
      toast.error('Please select both size and color');
      return false;
    }

    const toastId = toast.loading('Adding to cart...');

    try {
      const response = await axios.post(
        'https://ecommerce-rho-hazel.vercel.app/api/cart/add',
        { 
          productId, 
          size: normalizedSize,
          color: normalizedColor 
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchCart(); // Refresh cart instead of local updates
        toast.update(toastId, {
          render: 'Added to cart successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 2000
        });
        return true;
      }
      throw new Error(response.data.message || 'Failed to add to cart');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.update(toastId, {
        render: error.response?.data?.message || error.message || 'Failed to add to cart',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
      return false;
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId, size, color, newQuantity) => {
    const toastId = toast.loading('Updating cart...');
    
    // Normalize inputs
    const normalizedSize = size?.trim()?.toUpperCase();
    const normalizedColor = typeof color === 'string' 
      ? color.trim() 
      : color?.name?.trim();

    try {
      const quantityNumber = Number(newQuantity);
      if (isNaN(quantityNumber) || quantityNumber < 0) {
        throw new Error('Invalid quantity value');
      }

      const response = await axios.put(
        'https://ecommerce-rho-hazel.vercel.app/api/cart/update',
        { 
          productId, 
          size: normalizedSize, 
          color: normalizedColor, 
          quantity: quantityNumber 
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchCart(); // Refresh cart instead of local updates
        toast.update(toastId, {
          render: 'Cart updated successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 2000
        });
        return true;
      }
      throw new Error(response.data.message || 'Failed to update cart');
    } catch (error) {
      console.error('Update cart error:', error);
      toast.update(toastId, {
        render: error.response?.data?.message || error.message || 'Failed to update cart',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
      return false;
    }
  };

  // Action handlers - Updated
  const increaseQuantity = async (productId, size, color) => {
    const item = cart.find(item => 
      item._id === productId && 
      item.size === size && 
      item.color === color
    );
    if (!item) return;
    
    await updateCartItem(productId, size, color, item.quantity + 1);
  };

  const decreaseQuantity = async (productId, size, color) => {
    const item = cart.find(item => 
      item._id === productId && 
      item.size === size && 
      item.color === color
    );
    if (!item) return;
    
    const newQuantity = item.quantity - 1;
    await updateCartItem(productId, size, color, newQuantity);
  };

  const removeFromCart = async (productId, size, color) => {
    await updateCartItem(productId, size, color, 0);
  };


  // Action handlers

  const contextValue = {
    delivery_fee,
    products,
    currency,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    setCart,
    cart,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    navigate,
    getProducts,
    fetchCart,
    setToken,
    token,
    loading,
    error,
    user,
    setUser,
    fetchUserData,
    orders,
    setOrders
  };

  return <ShopContext.Provider value={contextValue}>{children}</ShopContext.Provider>;
}

export default ShopContextProvider;