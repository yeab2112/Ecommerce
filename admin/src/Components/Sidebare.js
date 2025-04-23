import React from 'react';
import { Link } from 'react-router-dom';
import { asset } from '../asset/asset';

function Sidebar() {
  const { addicon, listicon, order } = asset;

  return (
    <>
      {/* Mobile Toggle Button */}
      <label
        htmlFor="sidebar-toggle"
        className="md:hidden fixed z-50 top-4 left-4 p-2 bg-white rounded-md shadow-lg cursor-pointer"
      >
        ☰
      </label>

      {/* Hidden checkbox for state management */}
      <input type="checkbox" id="sidebar-toggle" className="hidden peer" />

      {/* Sidebar Container */}
      <div className="
        fixed md:relative
        inset-y-0 left-0
        z-40
        w-64
        transform
        -translate-x-full
        md:translate-x-0
        transition-transform duration-300 ease-in-out
        peer-checked:translate-x-0
        bg-white
        border-r border-gray-200
        overflow-y-auto
      ">
        <div className="p-4 space-y-3">
          {/* Close Button (mobile only) */}
          <label
            htmlFor="sidebar-toggle"
            className="md:hidden absolute top-3 right-3 p-1 cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ✕
          </label>

          {/* Navigation Links */}
          <Link
            to="/add"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            <img src={addicon} alt="Add" className="w-5 h-5" />
            <span className="text-sm font-medium">Add</span>
          </Link>

          <Link
            to="/list"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            <img src={listicon} alt="List" className="w-5 h-5" />
            <span className="text-sm font-medium">List</span>
          </Link>

          <Link
            to="/order"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            <img src={order} alt="Orders" className="w-5 h-5" />
            <span className="text-sm font-medium">Orders</span>
          </Link>
        </div>
      </div>

      {/* Overlay (mobile only) */}
      <label
        htmlFor="sidebar-toggle"
        className="
          fixed inset-0
          bg-black bg-opacity-50
          z-30
          opacity-0
          pointer-events-none
          md:hidden
          peer-checked:opacity-100
          peer-checked:pointer-events-auto
          transition-opacity duration-300
        "
      ></label>
    </>
  );
}

export default Sidebar;