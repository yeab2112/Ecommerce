import React from 'react';
import { Link } from 'react-router-dom';
import { asset } from '../asset/asset';

function Sidebar() {
  const { addicon, listicon, order } = asset;

  return (
    <div className="group">
      {/* Mobile toggle button - hidden on desktop */}
      <label
        htmlFor="sidebar-toggle"
        className="md:hidden fixed z-50 top-4 left-4 p-2 bg-white rounded shadow-md cursor-pointer"
      >
        ☰
      </label>

      {/* Hidden checkbox to control state */}
      <input type="checkbox" id="sidebar-toggle" className="hidden peer" />

      {/* Overlay - only shown when sidebar is open on mobile */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden hidden peer-checked:block"
      ></label>

      {/* Sidebar */}
      <div
        className="fixed md:static z-40 h-full w-48 bg-white border-r border-gray-200 text-gray-800 p-4 space-y-2 shadow-lg transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out peer-checked:translate-x-0"
      >
        {/* Close button for mobile */}
        <label
          htmlFor="sidebar-toggle"
          className="md:hidden absolute top-2 right-2 p-1 cursor-pointer"
        >
          ✕
        </label>

        {/* Add Icon with Text */}
        <Link
          to="/add"
          className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-all duration-200 border-b border-gray-200"
        >
          <img src={addicon} alt="Add Icon" className="w-6 h-6" />
          <span className="text-sm">Add</span>
        </Link>

        {/* List Icon with Text */}
        <Link
          to="/list"
          className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-all duration-200 border-b border-gray-200"
        >
          <img src={listicon} alt="List Icon" className="w-6 h-6" />
          <span className="text-sm">List</span>
        </Link>

        {/* Order Icon with Text */}
        <Link
          to="/order"
          className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-all duration-200 border-b border-gray-200"
        >
          <img src={order} alt="Order Icon" className="w-6 h-6" />
          <span className="text-sm">Order</span>
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;