import React, { useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../asset/asset';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user, token, fetchUserData } = useContext(ShopContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [token, navigate, fetchUserData]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-500 py-8 px-6 text-white">
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
              <img 
                src={user?.image || assets.profile} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800">
                {user?.name || "Guest User"}
              </h2>
              <p className="text-gray-600">{user?.email || "guest@example.com"}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{user?.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user?.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Shipping Address</h3>
              {user?.address ? (
                <div className="space-y-2">
                  <p className="font-medium">{user.address.street}</p>
                  <p>{user.address.city}, {user.address.state} {user.address.zipCode}</p>
                  <p>{user.address.country}</p>
                </div>
              ) : (
                <p className="text-gray-500">No address saved</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => navigate('/edit-profile')}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            >
              Edit Profile
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;