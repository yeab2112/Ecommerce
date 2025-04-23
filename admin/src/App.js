import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar"; // Make sure the filename is correct
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./Components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const atoken = localStorage.getItem('atoken');
    if (atoken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (atoken) => {
    localStorage.setItem('atoken', atoken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('atoken');
    setIsAuthenticated(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <Navbar onLogout={handleLogout} />
          {/* Adjust height: assumes navbar is 64px tall */}
          <div className="flex flex-1 h-[calc(100vh-64px)]">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 bg-gray-100 overflow-y-auto">
              <Routes>
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
