import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { asset } from '../asset/asset';
import { Bell } from 'lucide-react';
const Navbar = ({ onLogout, user, onToggleSidebar }) => {
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

  const [state, setState] = useState({
    showProfile: false,
    showSettings: false,
    showDropdown: false,
    showNoti: false,
    notifications: [],
    unreadCount: 0,
    isMobile: false,
    activeTab: 'received',
  });

  const fetchNotifications = useCallback(async () => {
    try {
      // The backend should only send "order received" notifications
      const { data } = await axios.get(
        'https://ecommerce-rho-hazel.vercel.app/api/notification/get-notifications'
      );
      
      setState(prev => ({
        ...prev,
        notifications: data,
        unreadCount: data.filter(n => !n.read).length,
      }));
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
    }
  }, []);

  const markAllAsRead = async () => {
    try {
      const response = await axios.put('https://ecommerce-rho-hazel.vercel.app/api/notification/mark-all-read');

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
        return response.data.message;
      } else {
        throw new Error(response.data.message || 'Failed to mark notifications as read');
      }
    } catch (err) {
      console.error('Mark read failed:', err.response?.data?.message || err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleResize = () =>
      setState((prev) => ({
        ...prev,
        isMobile: window.innerWidth < 640,
      }));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = (key) => setState((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, showProfile: false }));
  };

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    setState((prev) => ({ ...prev, showSettings: false }));
  };

 const renderNotification = (n) => (
    <li
      key={n._id}
      className={`p-2 rounded ${!n.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-transparent'}`}
    >
      <p className="font-medium">✅ Order Received</p>
      <div className="text-xs text-gray-500 mt-1">
        <p>Order ID: {n.orderId?._id?.slice(-6)}</p>
        <p>Time: {new Date(n.createdAt).toLocaleString()}</p>
        <p>Total: ${n.orderId?.total?.toFixed(2)}</p>
      </div>
    </li>
  );

  return (
    <>
      <header className="border-b p-4 flex justify-between items-center dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="md:hidden">
            ☰
          </button>
          <img src={asset.admin} alt="Admin" className="w-10 h-10 rounded-full border" />
          <h1 className="text-lg font-semibold dark:text-white">Admin Dashboard</h1>
        </div>

        <div className="flex items-center gap-4 relative">
          <button onClick={() => toggle('showNoti')} className="relative">
            <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            {state.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                {state.unreadCount}
              </span>
            )}
          </button>

           {state.showNoti && (
        <div className={`absolute ${state.isMobile ? 'left-1/2 -translate-x-1/2' : 'right-0'} 
          top-12 w-96 bg-white dark:bg-gray-800 p-4 rounded shadow z-50 max-h-[80vh] overflow-y-auto`}
        >
          <div className="flex justify-between mb-2">
            <p className="font-semibold dark:text-white">Order Notifications</p>
            {state.unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400"
              >
                Mark all as read
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {state.notifications.length === 0 ? (
              <li className="text-gray-500 dark:text-gray-400">
                No new order notifications
              </li>
            ) : (
              state.notifications.map(renderNotification)
            )}
          </ul>
        </div>
      )}

          <button onClick={() => toggle('showDropdown')}>
            <img
              src={profileData.avatar}
              alt="Profile"
              className="w-10 h-10 rounded-full border"
            />
          </button>

          {state.showDropdown && (
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-700 rounded shadow z-50">
              <button
                onClick={() => toggle('showProfile')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Profile
              </button>
              <button
                onClick={() => toggle('showSettings')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Settings
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Profile Modal */}
      {state.showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleProfileSubmit}
            className="bg-white dark:bg-gray-800 p-6 rounded w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Edit Profile</h2>
            <input
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
              placeholder="Name"
            />
            <input
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
              placeholder="Email"
            />
            <input
              value={profileData.avatar}
              onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
              placeholder="Avatar URL"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => toggle('showProfile')}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Modal */}
      {state.showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSettingsSubmit}
            className="bg-white dark:bg-gray-800 p-6 rounded w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Settings</h2>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <label className="block mb-2">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({ ...settings, notifications: e.target.checked })
                }
                className="mr-2"
              />
              Enable Notifications
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => toggle('showSettings')}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default React.memo(Navbar);
