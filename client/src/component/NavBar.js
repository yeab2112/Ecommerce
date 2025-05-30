import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { assets } from "../asset/asset.js";
import { ShopContext } from "../context/ShopContext.js";
import { Link } from "react-router-dom";

function NavBar() {
  const [visible, setVisible] = useState(false); // For mobile menu visibility
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // For profile dropdown visibility
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  // Accessing context values
  const { setShowSearch, cart, token, setToken } = useContext(ShopContext);
  const handleLogout = () => {
    setIsDropdownVisible(false)
    MySwal.fire({
      title: "Are you sure?",
      text: "You want to Exit!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, I want!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        setToken(""); // Clear token from context
        navigate("/login");
      }
    });
  };

  const toggleSearchBar = () => {
    setShowSearch(true); // Toggle the search bar visibility
  };

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible); // Toggle dropdown visibility
  };

  return (
    <div className="w-full px-4 py-4">
      <div className="flex items-center justify-between border-b-2 border-gray-300 w-full">
        <div className="flex-none">
          {visible ? (
            <button
              onClick={() => setVisible(false)} // Close mobile menu
              className="flex items-center text-gray-700"
            >
              <img
                src={assets.backIcon}
                alt="Back"
                className="h-6 w-6 mr-2"
              />
              <span>Back</span>
            </button>
          ) : (
            <NavLink to="/">
              <img
                src={assets.logo}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </NavLink>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex flex-1 justify-center space-x-20">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-500 font-semibold border-b-2 border-blue-500 pb-1"
                  : "text-gray-700 hover:text-blue-500"
              }
            >
              HOME
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/collection"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-500 font-semibold border-b-2 border-blue-500 pb-1"
                  : "text-gray-700 hover:text-blue-500"
              }
            >
              COLLECTION
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-500 font-semibold border-b-2 border-blue-500 pb-1"
                  : "text-gray-700 hover:text-blue-500"
              }
            >
              ABOUT
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-500 font-semibold border-b-2 border-blue-500 pb-1"
                  : "text-gray-700 hover:text-blue-500"
              }
            >
              CONTACT
            </NavLink>
          </li>
        </ul>

        {/* Search, Profile, Cart, and Hamburger Menu */}
        <div className="flex items-center space-x-4">
          {/* Search Icon */}
          <img
            src={assets.search}
            alt="Search Icon"
            className="h-8 w-8 cursor-pointer"
            onClick={toggleSearchBar}
          />

          {/* Profile Dropdown (Only visible if token exists) */}
          {token && (
            <div className="relative">
              <img
                src={assets.profile}
                alt="Profile Icon"
                className="h-6 w-6 cursor-pointer"
                onClick={toggleDropdown} // Toggle the dropdown on click
              />
              {isDropdownVisible && (
                <div className="absolute right-0 bg-white shadow-lg rounded-lg p-4 mt-2 w-40 z-20">

                  <p
                    className="cursor-pointer hover:text-blue-500"
                    onClick={() => {
                      navigate('/profile');
                      setIsDropdownVisible(false); // Close dropdown when navigating
                    }}
                  >
                    My Profile
                  </p>
                  <p
                    className="cursor-pointer hover:text-blue-500"
                    onClick={() =>{
                      navigate('/order-confirmation');
                      setIsDropdownVisible(false); // Close dropdown when navigating

                    }
                      
                    }
                  >
                    Orders
                  </p>
                  <p
                    className="cursor-pointer hover:text-blue-500"
                    onClick={handleLogout}
                  >
                    Logout
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="relative">
            <img src={assets.cart} alt="Cart Icon" className="h-6 w-6 cursor-pointer" />
            {/* Dynamic Cart Length */}
            <p className="absolute -top-2 -right-2 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {cart?.length || 0} {/* Default to 0 if cart is undefined */}
            </p>
          </Link>

          {/* Hamburger Menu for Mobile */}
          <div className="relative">
            {/* Visible only on small screens (below md) */}
            <img
              onClick={() => setVisible(!visible)} // Toggle mobile menu
              src={assets.menu}
              alt="Menu Icon"
              className="h-6 w-6 cursor-pointer md:hidden" // `md:hidden` will hide it on medium and larger screens
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {visible && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md z-10">

          <ul className="flex flex-col space-y-4 p-4 z-10">
            <li className="w-1/3">
              <NavLink
                to="/"
                className="block  text-gray-700 hover:bg-blue-400 hover:text-white py-2 px-4"
                onClick={() => setVisible(false)} // Close menu on link click
              >
                HOME
              </NavLink>
            </li>

            <li className="w-1/3">
              <NavLink
                to="/collection"
                className="block  text-gray-700 hover:bg-blue-400 hover:text-white py-2 px-4"
                onClick={() => setVisible(false)} // Close menu on link click
              >
                COLLECTION
              </NavLink>
            </li>
            <li className="w-1/3">
              <NavLink
                to="/about"
                className="block  text-gray-700 hover:bg-blue-400 hover:text-white py-2 px-4"
                onClick={() => setVisible(false)} // Close menu on link click
              >
                ABOUT
              </NavLink>
            </li>
            <li className="w-1/3">
              <NavLink
                to="/contact"
                className="block  text-gray-700 hover:bg-blue-400 hover:text-white py-2 px-4"
                onClick={() => setVisible(false)} // Close menu on link click
              >
                CONTACT
              </NavLink>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default NavBar;
