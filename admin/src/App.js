import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebare"; // Make sure the import name matches your file
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
  const location = useLocation();

  useEffect(() => {
    const atoken = localStorage.getItem('atoken');
    if (atoken) {
      setIsAuthenticated(true);
    }
  }, []);

  // Close sidebar when route changes (on mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

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
          <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar with proper mobile styling */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {/* Main content with click overlay for mobile */}
            {sidebarOpen && (
              <div 
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <Routes>
                <Route path="/add" element={<Add />} />
                <Route path="/list" element={<List />} />
                <Route path="/order" element={<Orders />} />
                <Route path="*" element={<Navigate to="/list" replace />} />
              </Routes>
            </main>
          </div>
        </>
      )}
    </div>
  );
}

export default App;