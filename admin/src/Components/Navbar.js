import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Add axios
import { asset } from '../asset/asset';
import { Bell } from 'lucide-react';

const Navbar = ({ onLogout, user, onToggleSidebar }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const fetchNotifications = async () => {
  try {
    const res = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/notifications/get-notifications');
    const allNotifications = res.data;
    
    // Calculate unread count by filtering notifications where read is false
    const unreadNotifications = allNotifications.filter(n => !n.read);
    
    setNotifications(allNotifications);
    setUnreadCount(unreadNotifications.length);
  } catch (err) {
    console.error('Failed to fetch notifications:', err.message);
    // Consider adding user feedback here (e.g., toast notification)
  }
};

 const markAllAsRead = async () => {
  try {
    await axios.put('https://ecommerce-rho-hazel.vercel.app/api/notifications/mark-all-read');
    // Optimistically update the UI before refetching
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  } catch (err) {
    console.error('Failed to mark as read:', err.message);
    // Consider adding user feedback here
  }
};

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        {/* Left Section */}
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

        {/* Right Section */}
        <div className="relative flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50 max-h-96 overflow-y-auto">
                <div className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">Recent Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                 <ul className="space-y-2">
  {notifications.length === 0 ? (
    <li className="text-gray-500 dark:text-gray-400">No notifications</li>
  ) : (
    notifications.map((n) => (
      <li key={n._id} className={`flex items-start space-x-2 p-2 ${!n.read ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
        <div className="text-sm">
          {n.message || '🔔 Notification'}
          {n.orderId && typeof n.orderId === 'object' && (
            <div className="text-xs text-gray-500 mt-1">
              <p>Order ID: {n.orderId._id?.slice(-6)}</p>
              <p>Status: {n.orderId.status}</p>
              <p>Total: ${n.orderId.total?.toFixed(2)}</p>
            </div>
          )}
          {n.orderId && typeof n.orderId === 'string' && (
            <span className="block text-xs text-gray-500">
              Order ID: {n.orderId.slice(-6)}
            </span>
          )}
        </div>
        {!n.read && (
          <span className="text-xs text-red-500 ml-auto">●</span>
        )}
      </li>
    ))
  )}
</ul>
                </div>
              </div>
            )}

          </div>

          {/* User Avatar and Dropdown */}
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
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Avatar URL</label>
                <input
                  type="text"
                  value={profileData.avatar}
                  onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
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
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
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
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="notifications" className="text-gray-700 dark:text-gray-300">Enable Notifications</label>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
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
