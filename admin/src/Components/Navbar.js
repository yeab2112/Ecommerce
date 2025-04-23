import React, { useState } from 'react';
import { asset } from '../asset/asset';

const Navbar = ({ onLogout, user, onToggleSidebar }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

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
        {/* Left Section with Toggle Button */}
        <div className="flex items-center space-x-3">
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

        {/* Right Section with User Dropdown */}
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="flex items-center focus:outline-none"
          >
            <img
              src={profileData.avatar}
              alt="User"
              className="rounded-full w-10 h-10 border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition duration-300 dark:border-gray-600"
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 dark:bg-gray-700">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(true);
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
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
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Avatar URL</label>
                <input
                  type="text"
                  value={profileData.avatar}
                  onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
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
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({...settings, theme: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="notifications" className="text-gray-700 dark:text-gray-300">Enable Notifications</label>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;