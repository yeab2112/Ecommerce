import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebare";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./Components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: ''
  });

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <Navbar 
            onLogout={handleLogout} 
            user={user} 
            onToggleSidebar={toggleSidebar} 
          />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <Routes>
                <Route path="/add" element={<Add />} />
                <Route path="/list" element={<List />} />
                <Route path="/order" element={<Orders />} />
              </Routes>
            </main>
          </div>
        </>
      )}
    </div>
  );
}

export default App;