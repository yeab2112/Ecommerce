import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // for navigation
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShopContext } from '../context/ShopContext'; // import ShopContext

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);  // To toggle between login/signup
  const [formData, setFormData] = useState({
    name: '',  // Default empty for both login and signup
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { token, setToken } = useContext(ShopContext);  // Get the token and setToken function from context
  const navigate = useNavigate();  // for redirecting after successful login/signup

  // If token exists, redirect to the home page immediately
  useEffect(() => {
    if (token) {
      navigate('/');  // Redirect to home if token is available
    }
  }, [token, navigate]);

  // Update formData state whenever `isLogin` changes
  useEffect(() => {
    setFormData({
      name: isLogin ? '' : '',  // Name field is only required for signup
      email: '',
      password: '',
    });
  }, [isLogin]);

  // Toggle between login and signup forms
  const toggleForm = () => setIsLogin(!isLogin);

  // Handle input field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle login/signup form submission
  const handleAuthSubmit = async (e, type) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = type === 'login' ? '/api/user/login' : '/api/user/signup';
      const response = await axios.post(`'https://ecommerce-rho-hazel.vercel.app/${endpoint}`, formData);

      // On success, set the token in context and navigate to home
      setToken(response.data.token); // Store the token in the global context
      localStorage.setItem('token', response.data.token);  // Save token in localStorage
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} successful!`);
      navigate('/');  // Redirect to the home page after success
    } catch (err) {
      // Handle error gracefully
      const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">
          {isLogin ? 'Login' : 'Signup'}
        </h2>

        <form
          onSubmit={(e) => handleAuthSubmit(e, isLogin ? 'login' : 'signup')}
          className="space-y-4"
        >
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : isLogin ? 'Login' : 'Sign up'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button onClick={toggleForm} className="focus:outline-none">
            {isLogin ? (
              <span>
                Don't have an account?{' '}
                <span className="text-blue-500 cursor-pointer hover:underline">Sign up</span>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <span className="text-blue-500 cursor-pointer hover:underline">Log in</span>
              </span>
            )}
          </button>
        </div>
      </div>
      <ToastContainer />  {/* Toast notifications */}
    </div>
  );
};

export default AuthPage;
