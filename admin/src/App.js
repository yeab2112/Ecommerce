import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebare"; // Fixed typo (Sidebare -> Sidebar)
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import { Routes, Route, Navigate } from 'react-router-dom';  // Import Navigate for redirection
import React, { useState, useEffect } from 'react';
import Login from "./Components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for token on initial load
  useEffect(() => {
    const atoken = localStorage.getItem('atoken'); // Retrieve token from localStorage
    if (atoken) {
      setIsAuthenticated(true); // Set authenticated to true if token exists
    }
  }, []);

  // Handle login (set token and update state)
  const handleLogin = (atoken) => {
    localStorage.setItem('atoken', atoken); // Store token in localStorage
    setIsAuthenticated(true); // Update authentication state
  };

  const handleLogout = () => {
    console.log("Logout triggered");
    localStorage.removeItem('atoken');
    setIsAuthenticated(false);
  };

  return (
    <div className="flex flex-col ">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <Navbar onLogout={handleLogout} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-6 bg-gray-100">
              <Routes>
                {/* Add a route for protected pages */}
                <Route path="/add" element={isAuthenticated ? <Add /> : <Navigate to="/" />} />
                <Route path="/list" element={isAuthenticated ? <List /> : <Navigate to="/" />} />
                <Route path="/order" element={isAuthenticated ? <Orders /> : <Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </>
      )}
    </div>
  );
  
}

export default App;
