import React, { createContext, } from 'react';
import Home from './page/Home.js';
import AuthPage from './page/Login.js';
import About from './page/About.js';
import NavBar from './component/NavBar.js';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import Contact from './page/Contact.js';
import Footer from './component/footer.js';
import 'react-toastify/dist/ReactToastify.min.css';
import Cart from './page/Cart.js';
import Product from './page/Product.js';
import Collection from './page/Collection.js';
import PlaceOrder from './page/PlaceOrder.js';
import Order from './page/Order.js';
import SearchBar from './component/searchBar.js';
import Profile from "./page/Profile.js";
import EditProfile from "./page/EditProfile.js";
import ForgotPasswordPage from './page/ForgotPasswordPage .js.js';
import ResetPasswordPage from './page/ResetPasswordPage.js'
export const AuthContext = createContext(null);

function App() {

  return (
    <div className="App">
      <ToastContainer />
      <NavBar />
      <SearchBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/product/:productId' element={<Product />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/collection' element={<Collection />} />
        <Route path='/place-order' element={<PlaceOrder />} />
        <Route path='/order-confirmation' element={<Order />} />
        <Route path='/order-confirmation/:orderId' element={<Order />} />
        <Route path='/login' element={<AuthPage />} />
        <Route path='/signup' element={<AuthPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
export default App;
