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
    bestSeller: false,
    images: Array(4).fill(null), // Initialize with 4 null values for 4 image slots
  });

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
    setProduct({ ...product, sizes: updatedSizes });
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      const updatedImages = [...product.images];
      updatedImages[index] = file;
      
      setProduct({
        ...product,
        images: updatedImages,
      });
      
      setUploadProgress(0);
      setError('');
    }, 1000);
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...product.images];
    updatedImages[index] = null;
    setProduct({ ...product, images: updatedImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const atoken = localStorage.getItem('atoken');
      if (!atoken) throw new Error('Authentication required');

      const formData = new FormData();
      
      // Append product data
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('category', product.category);
      formData.append('price', product.price);
      formData.append('bestSeller', product.bestSeller);
      formData.append('sizes', JSON.stringify(product.sizes));

      // Append images with numbered field names (image1, image2, etc.)
      product.images.forEach((image, index) => {
        if (image) {
          formData.append(`image${index + 1}`, image);
        }
      });

      const response = await fetch('https://ecommerce-rho-hazel.vercel.app/api/product/add_products', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${atoken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      // Reset form
      setProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        sizes: [],
        bestSeller: false,
        images: Array(4).fill(null),
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
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Add New Product</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

      <div className="mb-6 text-center">
        <label className="block text-sm font-medium text-gray-700 mb-4">Upload Images (Max 4)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col items-center justify-center space-y-2 relative">
              <input
                type="file"
                id={`file-input-${index}`}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, index)}
                className="hidden"
              />
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
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields remain exactly the same as in your original code */}
        {/* ... */}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isSubmitting ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop />
    </div>
  );
}

export default Add;