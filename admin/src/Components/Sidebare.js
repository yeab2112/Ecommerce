import React from 'react';
import { Link } from 'react-router-dom';
import { asset } from '../asset/asset';

function Sidebar() {
  const { addicon, listicon, order } = asset;

  return (
    <div className="group">
      {/* Mobile Toggle Button */}
      <label
        htmlFor="sidebar-toggle"
        className="md:hidden fixed z-50 top-4 left-4 p-2 bg-white rounded-md shadow-lg cursor-pointer"
      >
        ☰
      </label>

      {/* Hidden checkbox for mobile toggle state */}
      <input type="checkbox" id="sidebar-toggle" className="hidden peer" />

      {/* Overlay on mobile */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden hidden peer-checked:block transition-opacity duration-300"
      ></label>

      {/* Sidebar */}
      <div className="
        peer-checked:translate-x-0
        fixed md:static
        z-50
        h-full md:h-auto
        w-64 sm:w-56 md:w-48
        bg-white
        border-r border-gray-200
        text-gray-800
        p-4
        space-y-2
        shadow-lg
        transform
        -translate-x-full
        md:translate-x-0
        transition-transform duration-300 ease-in-out
        md:flex-shrink-0
      ">
        {/* Close Button (mobile only) */}
        <label
          htmlFor="sidebar-toggle"
          className="md:hidden absolute top-2 right-2 p-1 cursor-pointer text-xl"
        >
          ✕
        </label>

        {/* Navigation Links */}
        <Link
          to="/add"
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 border-b border-gray-100 transition-all duration-200"
        >
          <img src={addicon} alt="Add Icon" className="w-5 h-5" />
          <span className="text-sm font-medium">Add</span>
        </Link>

        <Link
          to="/list"
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 border-b border-gray-100 transition-all duration-200"
        >
          <img src={listicon} alt="List Icon" className="w-5 h-5" />
          <span className="text-sm font-medium">List</span>
        </Link>

        <Link
          to="/order"
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 border-b border-gray-100 transition-all duration-200"
        >
          <img src={order} alt="Order Icon" className="w-5 h-5" />
          <span className="text-sm font-medium">Order</span>
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;