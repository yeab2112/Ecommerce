import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./Components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const atoken = localStorage.getItem('atoken');
      // Add your actual token verification logic here
      setIsAuthenticated(!!atoken);
      setIsLoading(false);
    };
    verifyAuth();
  }, []);

  const handleLogin = (atoken) => {
    localStorage.setItem('atoken', atoken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('atoken');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <Navbar onLogout={handleLogout} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <Routes location={location} key={location.pathname}>
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