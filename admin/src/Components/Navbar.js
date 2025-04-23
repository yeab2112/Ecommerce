import React, { useState } from 'react';
import { asset } from '../asset/asset';

const Navbar = ({ onLogout, user, onToggleSidebar }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@example.com',
    avatar: user?.avatar || asset.user,
  });
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    language: 'en',
  });

  const handleProfileUpdate = (updatedData) => {
    setProfileData(updatedData);
    setShowProfileModal(false);
  };

  const handleSettingsUpdate = (updatedSettings) => {
    setSettings(updatedSettings);
    setShowSettingsModal(false);
    if (updatedSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <>
      <header className="border-b border-gray-200 p-4 flex items-center justify-between dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          {/* Mobile Toggle Button */}
          <button 
            onClick={onToggleSidebar}
            className="md:hidden mr-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ☰
          </button>
          
          <img 
            src={asset.admin}  
            alt="Admin"
            className="rounded-full w-10 h-10 border-2 border-gray-300 dark:border-gray-600" 
          />
          <h1 className="text-gray-800 font-semibold text-lg dark:text-white">Admin Dashboard</h1>
        </div>

        <div className="relative group">
          <img
            src={profileData.avatar}
            alt="User"
            className="rounded-full w-10 h-10 border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition duration-300 dark:border-gray-600"
          />
          
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-focus:opacity-100 group-focus:visible group-hover:opacity-100 group-hover:visible transition-all duration-300 dark:bg-gray-700 dark:border-gray-600">
            <ul className="py-2">
              <li>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-400 hover:text-white transition duration-300 dark:text-gray-200 dark:hover:bg-blue-500"
                >
                  Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-400 hover:text-white transition duration-300 dark:text-gray-200 dark:hover:bg-blue-500"
                >
                  Settings
                </button>
              </li>
              <li>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-400 hover:text-white transition duration-300 dark:text-gray-200 dark:hover:bg-blue-500"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Edit Profile</h2>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleProfileUpdate(profileData);
            }}>
              {/* Form fields remain the same */}
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Settings</h2>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSettingsUpdate(settings);
            }}>
              {/* Form fields remain the same */}
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;