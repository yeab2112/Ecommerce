import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { asset } from '../asset/asset';
import { Bell } from 'lucide-react';

const Navbar = ({ onLogout, user, onToggleSidebar }) => {
  // State management
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // User profile data
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@example.com',
    avatar: user?.avatar || asset.user,
  });

  // Settings configuration
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    language: 'en',
  });

  // Responsive design effect
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notification handling
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/notification/get-notifications');
      const receivedNotifications = data.filter(n => 
        n.type === 'order_received' && n.orderId
      );
      const unread = receivedNotifications.filter(n => !n.read);
      setNotifications(receivedNotifications);
      setUnreadCount(unread.length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axios.put('https://ecommerce-rho-hazel.vercel.app/api/notification/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark as read:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Settings handler
  const handleSettingsUpdate = useCallback((updatedSettings) => {
    setSettings(updatedSettings);
    setShowSettingsModal(false);
    document.documentElement.classList.toggle('dark', updatedSettings.theme === 'dark');
  }, []);

  // Profile handler
  const handleProfileUpdate = useCallback((updatedData) => {
    setProfileData(updatedData);
    setShowProfileModal(false);
  }, []);

  // UI handlers
  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);

  // Notification content renderer
  const renderNotificationContent = useCallback((notification) => {
    const order = notification.orderId;
    return (
      <>
        <p className="font-medium">✅ Order Received</p>
        {order && (
          <div className="text-xs text-gray-500 mt-1">
            <p>Order ID: {order._id?.slice(-6)}</p>
            <p>Customer: {order.user?.name || 'Unknown'}</p>
            <p>Time: {new Date(notification.receivedAt).toLocaleString()}</p>
            {order.total && <p>Total: ${order.total.toFixed(2)}</p>}
          </div>
        )}
      </>
    );
  }, []);

  return (
    <>
      <header className="border-b border-gray-200 p-4 flex items-center justify-between dark:border-gray-700 dark:bg-gray-800">
        {/* Left section - Logo and menu toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden mr-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
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

        {/* Right section - Notifications and user menu */}
        <div className="relative flex items-center space-x-4">
          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className={`
                fixed sm:absolute 
                ${isMobile ? 'left-1/2 transform -translate-x-1/2 w-[calc(100vw-2rem)]' : 'right-0 w-72'}
                sm:w-80 md:w-96
                top-16 sm:top-auto sm:mt-2
                bg-white dark:bg-gray-800 
                shadow-lg rounded-md z-50 
                max-h-[70vh] overflow-y-auto
              `}>
                <div className="p-4 text-sm text-gray-700 dark:text-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">Received Orders</p>
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
                      <li className="text-gray-500 dark:text-gray-400">No new order receipts</li>
                    ) : (
                      notifications.map((n) => (
                        <li 
                          key={n._id} 
                          className={`flex items-start space-x-2 p-2 rounded ${!n.read ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                        >
                          <div className="text-sm flex-1">
                            {renderNotificationContent(n)}
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

          {/* User avatar dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center focus:outline-none"
              aria-label="User menu"
            >
              <img
                src={profileData.avatar}
                alt="User profile"
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
                aria-label="Close profile modal"
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
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Avatar URL</label>
                <input
                  type="text"
                  value={profileData.avatar}
                  onChange={(e) => setProfileData(prev => ({ ...prev, avatar: e.target.value }))}
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
                aria-label="Close settings modal"
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
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
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
                  onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="notifications" className="text-gray-700 dark:text-gray-300">Enable Notifications</label>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 dark:text-gray-300">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
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

export default React.memo(Navbar);