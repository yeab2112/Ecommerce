import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function EditProfile() {
  const { user, token, fetchUserData } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const latestOrder = user?.orders?.[user.orders.length - 1];

const [formData, setFormData] = useState({
  name: user?.name || '',
  deliveryInfo: {
    phone: latestOrder?.deliveryInfo?.phone || '',
    address: latestOrder?.deliveryInfo?.address || '', 
    city: latestOrder?.deliveryInfo?.city || '',
    state: latestOrder?.deliveryInfo?.state || '',
    zipCode: latestOrder?.deliveryInfo?.zipCode || '',
    country: latestOrder?.deliveryInfo?.country || '',
    firstName: latestOrder?.deliveryInfo?.firstName || '',
    lastName: latestOrder?.deliveryInfo?.lastName || '',
    email: latestOrder?.deliveryInfo?.email || user?.email || '',
  }
});
  // Unified change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        deliveryInfo: {
          ...prev.deliveryInfo,
          [name]: value
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting:", formData); // Debug log
      
      const response = await axios.put(
        'https://ecommerce-rho-hazel.vercel.app/api/user/update',
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        fetchUserData(); // Refresh user data
        navigate('/profile');
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          
          {/* Phone Field */}
          <div>
            <label className="block text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.deliveryInfo.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          
          {/* Address Section */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Delivery Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Street */}
              <div>
                <label className="block text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.deliveryInfo.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              {/* City */}
              <div>
                <label className="block text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.deliveryInfo.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              {/* State */}
              <div>
                <label className="block text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.deliveryInfo.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              {/* Zip Code */}
              <div>
                <label className="block text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.deliveryInfo.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              {/* Country */}
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.deliveryInfo.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;