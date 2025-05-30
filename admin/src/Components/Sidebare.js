import React from 'react';
import { Link } from 'react-router-dom';
import { asset } from '../asset/asset';

function Sidebar({ isOpen, onClose }) {
  const { addicon, listicon, order } = asset;

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`
        fixed md:relative
        inset-y-0 left-0
        w-64
        bg-white
        border-r border-gray-200
        transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        transition-transform duration-300 ease-in-out
        z-30
        overflow-y-auto
      `}>
        <div className="p-4 space-y-3">
          {/* Close Button (mobile only) */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>

          {/* Navigation Links */}
          <Link
            to="/add"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            <img src={addicon} alt="Add" className="w-5 h-5" />
            <span className="text-sm font-medium">Add</span>
          </Link>

          <Link
            to="/list"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            <img src={listicon} alt="List" className="w-5 h-5" />
            <span className="text-sm font-medium">List</span>
          </Link>

          <Link
            to="/order"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            <img src={order} alt="Orders" className="w-5 h-5" />
            <span className="text-sm font-medium">Orders</span>
          </Link>
        </div>
      </div>
    </>
  );
}

export default Sidebar;