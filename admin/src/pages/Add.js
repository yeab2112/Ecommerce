import React, { useState } from 'react';
import { asset } from '../asset/asset';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Add() {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    sizes: [],
    colors: [], // Added colors array
    bestSeller: false,
    images: [],
  });

  // Common colors for clothing
  const COLOR_OPTIONS = [
    { name: 'Black', code: '#000000' },
    { name: 'White', code: '#FFFFFF' },
    { name: 'Red', code: '#FF0000' },
    { name: 'Blue', code: '#0000FF' },
    { name: 'Green', code: '#008000' },
    { name: 'Yellow', code: '#FFFF00' },
    { name: 'Pink', code: '#FFC0CB' },
    { name: 'Gray', code: '#808080' },
  ];

  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSizeChange = (e) => {
    const { value, checked } = e.target;
    let updatedSizes = [...product.sizes];

    if (checked) {
      updatedSizes.push(value);
    } else {
      updatedSizes = updatedSizes.filter((size) => size !== value);
    }

    setProduct({
      ...product,
      sizes: updatedSizes,
    });
  };

  // Added color selection handler
  const handleColorChange = (e, color) => {
    const { checked } = e.target;
    let updatedColors = [...product.colors];

    if (checked) {
      updatedColors.push(color);
    } else {
      updatedColors = updatedColors.filter(c => c.name !== color.name);
    }

    setProduct({
      ...product,
      colors: updatedColors,
    });
  };

  const handleImageUpload = async (e, index) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }

      const updatedImages = [...product.images];
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        updatedImages[index] = file;
        setProduct({
          ...product,
          images: updatedImages,
        });
        setUploadProgress(0);
        setError('');
      }, 1000);
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...product.images];
    updatedImages[index] = null;
    setProduct({
      ...product,
      images: updatedImages,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const atoken = localStorage.getItem('atoken');
      if (!atoken) throw new Error('Authentication required');

      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('category', product.category);
      formData.append('price', product.price);
      formData.append('bestSeller', product.bestSeller);
      formData.append('sizes', JSON.stringify(product.sizes));
      formData.append('colors', JSON.stringify(product.colors)); // Added colors

      if (product.images[0]) formData.append('images1', product.images[0]);
      if (product.images[1]) formData.append('images2', product.images[1]);
      if (product.images[2]) formData.append('images3', product.images[2]);
      if (product.images[3]) formData.append('images4', product.images[3]);

      const response = await fetch('https://ecommerce-rho-hazel.vercel.app/api/product/add_products', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${atoken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }

      setProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        sizes: [],
        colors: [], // Reset colors
        bestSeller: false,
        images: [],
      });

      toast.success('Product added successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'An error occurred while adding the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">Add New Product</h2>

      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

      {/* Image Upload Fields */}
      <div className="mb-6 text-center">
        <label className="block text-sm font-medium text-gray-700 mb-2 md:mb-4">Upload Images (Max 4)</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col items-center justify-center space-y-1 md:space-y-2 relative">
              <input
                type="file"
                id={`file-input-${index}`}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, index)}
                className="hidden"
              />
              <label
                htmlFor={`file-input-${index}`}
                className="cursor-pointer w-full aspect-square bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
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
                      className="w-3/4 h-3/4 object-contain opacity-50"
                    />
                  </div>
                )}
              </label>
              {product.images[index] && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 md:p-1 hover:bg-red-600 text-xs md:text-base"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 md:mt-4">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleInputChange}
            required
            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Description</label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleInputChange}
            required
            rows="3"
            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Product Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Category</label>
          <select
            name="category"
            value={product.category}
            onChange={handleInputChange}
            required
            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Category</option>
            <option value="Women">Women</option>
            <option value="Men">Men</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        {/* Product Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Price</label>
          <input
            type="number"
            name="price"
            value={product.price}
            onChange={handleInputChange}
            required
            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Product Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Sizes</label>
          <div className="flex flex-wrap gap-3">
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <label key={size} className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  name="sizes"
                  value={size}
                  checked={product.sizes.includes(size)}
                  onChange={handleSizeChange}
                  className="h-4 w-4"
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Product Colors - Added this section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Colors</label>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((color) => (
              <label key={color.name} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="colors"
                  checked={product.colors.some(c => c.name === color.name)}
                  onChange={(e) => handleColorChange(e, color)}
                  className="h-4 w-4"
                />
                <div className="flex items-center">
                  <div 
                    className="w-5 h-5 rounded-full border border-gray-300 mr-1"
                    style={{ backgroundColor: color.code }}
                  ></div>
                  <span>{color.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Best Seller Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="bestSeller"
            checked={product.bestSeller}
            onChange={handleInputChange}
            className="h-4 w-4"
          />
          <label className="ml-2 text-sm font-medium text-gray-700">Mark as Best Seller</label>
        </div>

        {/* Add Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 md:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>

      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop />
    </div>
  );
}

export default Add;