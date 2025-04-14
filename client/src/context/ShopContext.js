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
  // Fetch all products
  const getProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/product/list_products');
      
      console.log('API Response:', response.data); // Log response to inspect structure
      
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err); // Log full error object for debugging
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
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
        const cartArray = Object.keys(cartData).map(key => {
          const [productId, size] = key.split('_');
          return {
            ...cartData[key],
            _id: productId,
            size: size,
            cartKey: key
          };
        });
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
    }
  }, [getProducts, fetchCart, token]);

  // Add to cart function
  const addToCart = async (productId, size) => {
    if (!token) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return false;
    }
  
    const normalizedSize = size.trim().toUpperCase();
    const cartKey = `${productId}_${normalizedSize}`;
  
    // Check if item already exists
    const existingItem = cart.find(item => item.cartKey === cartKey);
    if (existingItem) {
      toast.warning('This item is already in your cart');
      return false;
    }
  
    const toastId = toast.loading('Adding to cart...');
  
    try {
      const response = await axios.post(
        'https://ecommerce-rho-hazel.vercel.app/api/cart/add',
        { productId, size: normalizedSize },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.message === 'Product added to cart successfully!') {
        const product = products.find(p => p._id === productId);
        if (product) {
          setCart(prevCart => [
            ...prevCart,
            {
              _id: productId,
              product: productId,
              cartKey,
              size: normalizedSize,
              quantity: 1,
              price: product.price,
              name: product.name,
              image: product.images?.[0] || ''
            }
          ]);
        }
  
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
        render: error.message || 'Failed to add to cart',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
      
      await fetchCart();
      return false;
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId, size, newQuantity) => {
    const toastId = toast.loading('Updating cart...');
    const normalizedSize = size.trim().toUpperCase();
  
    try {
      const quantityNumber = Number(newQuantity);
      if (isNaN(quantityNumber)) {
        throw new Error('Invalid quantity value');
      }
  
      const response = await axios.put(
        'https://ecommerce-rho-hazel.vercel.app/api/cart/update',
        { 
          productId, 
          size: normalizedSize, 
          quantity: quantityNumber 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.success) {
        setCart(prevCart => {
          const cartKey = `${productId}_${normalizedSize}`;
          
          if (quantityNumber <= 0) {
            return prevCart.filter(item => item.cartKey !== cartKey);
          }
  
          return prevCart.map(item => {
            if (item.cartKey === cartKey) {
              return { 
                ...item, 
                quantity: quantityNumber 
              };
            }
            return item;
          });
        });
  
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
  
      await fetchCart();
      return false;
    }
  };

  // Action handlers
  const increaseQuantity = async (productId, size) => {
    const item = cart.find(item => item._id === productId && item.size === size);
    if (!item) return;
    
    await updateCartItem(productId, size, item.quantity + 1);
  };
  
  const decreaseQuantity = async (productId, size) => {
    const item = cart.find(item => item._id === productId && item.size === size);
    if (!item) return;
    
    const newQuantity = item.quantity - 1;
    if (newQuantity <= 0) {
      await removeFromCart(productId, size);
    } else {
      await updateCartItem(productId, size, newQuantity);
    }
  };
  
  const removeFromCart = async (productId, size) => {
    await updateCartItem(productId, size, 0);
  };

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
    error
  };

  return <ShopContext.Provider value={contextValue}>{children}</ShopContext.Provider>;
}

export default ShopContextProvider;