import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { TrashIcon, PencilIcon } from '@heroicons/react/outline';

const List = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', category: '', price: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const atoken = localStorage.getItem('atoken'); 
        const response = await axios.get('https://ecommerce-rho-hazel.vercel.app/api/product/list_products', {
          headers: {
            Authorization: `Bearer ${atoken}`,
          },
        });

        if (response.data.success) {
          setProducts(response.data.products);
        } else {
          setError('Failed to fetch products');
          toast.error('Failed to fetch products');
        }
      } catch (err) {
        setError('An error occurred while fetching the products');
        toast.error('An error occurred while fetching the products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    try {
      const atoken = localStorage.getItem('atoken');
      const response = await axios.delete(`https://ecommerce-rho-hazel.vercel.app/api/product/delete_product/${productId}`, {
        headers: {
          Authorization: `Bearer ${atoken}`,
        },
      });

      if (response.data.success) {
        setProducts(products.filter((product) => product._id !== productId));
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete the product');
      }
    } catch (err) {
      toast.error('An error occurred while deleting the product');
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setEditFormData({ name: product.name, category: product.category, price: product.price });
  };

  const handleEditSubmit = async () => {
    try {
      const atoken = localStorage.getItem('atoken');
      const response = await axios.put(
        `https://ecommerce-rho-hazel.vercel.app/api/product/update_product/${editingProduct._id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${atoken}`,
          },
        }
      );

      if (response.data.success) {
        setProducts(products.map((product) => 
          product._id === editingProduct._id ? { ...product, ...editFormData } : product
        ));
        toast.success('Product updated successfully');
        setEditingProduct(null);
      } else {
        toast.error('Failed to update product');
      }
    } catch (err) {
      toast.error('An error occurred while updating the product');
    }
  };

  if (loading) {
    return <div className="text-center text-lg py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 min-h-[60vh]">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">Product List</h1>

      {/* Responsive Product List */}
      <div className="overflow-x-auto">
        {/* Desktop Table Headers */}
        <div className="hidden md:grid md:grid-cols-6 gap-4 mb-4 border-b-4 pb-2">
          <span className="font-semibold text-center">Image</span>
          <span className="font-semibold text-center">Name</span>
          <span className="font-semibold text-center">Category</span>
          <span className="font-semibold text-center">Price</span>
          <span className="font-semibold text-center col-span-2">Actions</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center text-lg text-gray-500 py-8">No products available</div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div 
                key={product._id} 
                className="md:grid md:grid-cols-6 gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="flex justify-center mb-3 md:mb-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </div>

                {/* Product Info - Stacked on mobile */}
                <div className="md:contents">
                  <div className="flex justify-between mb-2 md:hidden">
                    <span className="font-semibold">Name:</span>
                    <span className="text-right">{product.name}</span>
                  </div>
                  <div className="hidden md:block md:text-center">
                    {product.name}
                  </div>

                  <div className="flex justify-between mb-2 md:hidden">
                    <span className="font-semibold">Category:</span>
                    <span className="text-right">{product.category}</span>
                  </div>
                  <div className="hidden md:block md:text-center">
                    {product.category}
                  </div>

                  <div className="flex justify-between mb-3 md:hidden">
                    <span className="font-semibold">Price:</span>
                    <span className="text-right">${product.price}</span>
                  </div>
                  <div className="hidden md:block md:text-center">
                    ${product.price}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end md:justify-center space-x-4 md:col-span-2">
                  <button
                    onClick={() => openEditForm(product)}
                    className="text-blue-500 hover:text-blue-700"
                    aria-label="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-semibold mb-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-semibold mb-1">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={editFormData.category}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-semibold mb-1">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={editFormData.price}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop />
    </div>
  );
};

export default List;