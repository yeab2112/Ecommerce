import React, { useState } from 'react';
import { asset } from '../asset/asset'; // Import assets (e.g., default image)
import { ToastContainer, toast } from 'react-toastify'; // Import Toastify
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify styles

function Add() {
  // State to manage form inputs
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    sizes: [], // Array of sizes
    bestSeller: false,
    images: [], // List of uploaded images
  });

  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [error, setError] = useState(''); // Track error messages
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle size selection
  const handleSizeChange = (e) => {
    const { value, checked } = e.target;
    let updatedSizes = [...product.sizes];

    if (checked) {
      updatedSizes.push(value); // Add size to the array
    } else {
      updatedSizes = updatedSizes.filter((size) => size !== value); // Remove size from the array
    }

    setProduct({
      ...product,
      sizes: updatedSizes,
    });
  };

  // Handle image upload
  const handleImageUpload = async (e, index) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }

      // Validate file size (e.g., 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }

      const updatedImages = [...product.images];

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 100);

      // Simulate API call for image upload
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        updatedImages[index] = file; // Store the file object for later submission
        setProduct({
          ...product,
          images: updatedImages,
        });
        setUploadProgress(0);
        setError('');
      }, 1000);
    }
  };

  // Handle remove image
  const handleRemoveImage = (index) => {
    const updatedImages = [...product.images];
    updatedImages[index] = null; // Remove the image
    setProduct({
      ...product,
      images: updatedImages,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const atoken = localStorage.getItem('atoken');
      if (!atoken) throw new Error('Authentication required');

      const formData = new FormData();
      
      // Append all fields to formData
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('category', product.category);
      formData.append('price', product.price);
      formData.append('bestSeller', product.bestSeller);
      formData.append('sizes', JSON.stringify(product.sizes));

      // Append all images
      product.images.forEach((image, index) => {
        if (image) formData.append(`image${index + 1}`, image); 
      });

      const response = await fetch('https://ecomm-backend-livid.vercel.app/api/product/add_products', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${atoken}`,
          // Do not set 'Content-Type' explicitly when using FormData
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }

      // Reset form on success
      setProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        sizes: [],
        bestSeller: false,
        images: [], // Reset images after submission
      });

      // Show success notification
      toast.success('Product added successfully!');
    } catch (err) {
      setError(err.message);
      // Show error notification
      toast.error(err.message || 'An error occurred while adding the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Add New Product</h2>

      {/* Error Message */}
      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

      {/* Image Upload Fields */}
      <div className="mb-6 text-center">
        <label className="block text-sm font-medium text-gray-700 mb-4">Upload Images (Max 4)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col items-center justify-center space-y-2 relative">
              {/* Hidden file input */}
              <input
                type="file"
                id={`file-input-${index}`}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, index)}
                className="hidden"
              />
              {/* Label (image preview) */}
              <label
                htmlFor={`file-input-${index}`}
                className="cursor-pointer w-24 h-24 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
              >
                {product.images[index] ? (
                  <img
                    src={URL.createObjectURL(product.images[index])}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <img
                      src={asset.upload || 'default-image-path.jpg'}
                      alt="Upload"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </label>
              {/* Remove button */}
              {product.images[index] && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Product Description */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">Product Description</label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Product Category */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">Product Category</label>
          <select
            name="category"
            value={product.category}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Category</option>
            <option value="Women">Women</option>
            <option value="Men">Men</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        {/* Product Price */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">Product Price</label>
          <input
            type="number"
            name="price"
            value={product.price}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Product Sizes */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700">Product Sizes</label>
          <div className="flex space-x-4">
            {['S', 'M', 'L'].map((size) => (
              <label key={size} className="flex items-center">
                <input
                  type="checkbox"
                  name="sizes"
                  value={size}
                  checked={product.sizes.includes(size)}
                  onChange={handleSizeChange}
                  className="mr-2"
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        {/* Best Seller Checkbox */}
        <div className="form-group flex items-center">
          <input
            type="checkbox"
            name="bestSeller"
            checked={product.bestSeller}
            onChange={handleInputChange}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">Best Seller</label>
        </div>

        {/* Add Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isSubmitting ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>

      {/* Toastify container */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop />
    </div>
  );
}

export default Add;