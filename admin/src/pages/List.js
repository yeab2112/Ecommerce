import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { TrashIcon, PencilIcon } from '@heroicons/react/outline'; 

const List = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null); // State to hold the product being edited
  const [editFormData, setEditFormData] = useState({ name: '', category: '', price: '' }); // Form data

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

  // Function to handle deleting a product
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
        setError('Failed to delete the product');
        toast.error('Failed to delete the product');
      }
    } catch (err) {
      setError('An error occurred while deleting the product');
      toast.error('An error occurred while deleting the product');
    }
  };

  // Handle form changes for the product edit
  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Open edit form with the current product data
  const openEditForm = (product) => {
    setEditingProduct(product);
    setEditFormData({ name: product.name, category: product.category, price: product.price });
  };

  // Submit the edited product
  const handleEditSubmit = async () => {
    try {
      const atoken = localStorage.getItem('atoken');
      const response = await axios.put(`https://ecommerce-rho-hazel.vercel.app/api/product/update_product/${editingProduct._id}`, editFormData, {
        headers: {
          Authorization: `Bearer ${atoken}`,
        },
      });

      if (response.data.success) {
        setProducts(products.map((product) => (product._id === editingProduct._id ? { ...product, ...editFormData } : product)));
        toast.success('Product updated successfully');
        setEditingProduct(null); // Close the edit form
      } else {
        toast.error('Failed to update product');
      }
    } catch (err) {
      toast.error('An error occurred while updating the product');
    }
  };

  if (loading) {
    return <div className="text-center text-lg">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Product List</h1>

      {/* Product List */}
      <div className="grid grid-cols-6 gap-4 mb-4 border-b-4 pb-2">
        <span className="font-semibold text-center">Image</span>
        <span className="font-semibold text-center">Name</span>
        <span className="font-semibold text-center">Category</span>
        <span className="font-semibold text-center">Price</span>
        <span className="font-semibold text-center">Action</span>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-lg text-gray-500">No products available</div>
      ) : (
        products.map((product) => (
          <div key={product._id} className="grid grid-cols-6 gap-4 py-4 border-b">
            <img
              src={product.images[0]} // Display the first image
              alt={product.name}
              className="w-16 h-16 object-cover rounded-md mx-auto"
            />
            <span className="text-center">{product.name}</span>
            <span className="text-center">{product.category}</span>
            <span className="text-center">${product.price}</span>
            <div className="flex justify-center">
              {/* Edit button */}
              <PencilIcon
                onClick={() => openEditForm(product)}
                className="w-6 h-6 text-blue-500 cursor-pointer hover:text-blue-600"
              />
              {/* Delete button */}
              <TrashIcon
                onClick={() => handleDelete(product._id)}
                className="w-6 h-6 text-red-500 cursor-pointer hover:text-red-600"
              />
            </div>
          </div>
        ))
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-semibold">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-semibold">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={editFormData.category}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-semibold">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={editFormData.price}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleEditSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="ml-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
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
