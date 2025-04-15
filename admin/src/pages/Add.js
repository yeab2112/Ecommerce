import React, { useState, useEffect } from 'react';
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
  });

  // Track 4 separate image files (null if not uploaded)
  const [images, setImages] = useState([null, null, null, null]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSizeChange = (e) => {
    const { value, checked } = e.target;
    setProduct({
      ...product,
      sizes: checked
        ? [...product.sizes, value]
        : product.sizes.filter((size) => size !== value),
    });
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type & size
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    // Update image with preview URL
    const updatedImages = [...images];
    updatedImages[index] = {
      file,
      preview: URL.createObjectURL(file),
    };
    setImages(updatedImages);
    setError('');
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...images];
    if (updatedImages[index]?.preview) {
      URL.revokeObjectURL(updatedImages[index].preview);
    }
    updatedImages[index] = null;
    setImages(updatedImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate at least 1 image
    if (images.every((img) => !img)) {
      setError('At least one image is required.');
      setIsSubmitting(false);
      return;
    }

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

      // Append images with explicit field names
      images.forEach((img, index) => {
        if (img?.file) {
          formData.append(`image${index + 1}`, img.file); // image1, image2, etc.
        }
      });

      const response = await fetch('https://ecommerce-rho-hazel.vercel.app/api/product/add_products', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${atoken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      // Reset form on success
      setProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        sizes: [],
        bestSeller: false,
      });
      setImages([null, null, null, null]);
      toast.success('Product added successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Add New Product</h2>
      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

      {/* Image Upload */}
      <div className="mb-6 text-center">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Upload Images (Max 4)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative">
              <input
                type="file"
                id={`file-input-${index}`}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, index)}
                className="hidden"
              />
              <label
                htmlFor={`file-input-${index}`}
                className="cursor-pointer w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
              >
                {img ? (
                  <img
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={asset.upload}
                    alt="Upload placeholder"
                    className="w-12 h-12 opacity-50"
                  />
                )}
              </label>
              {img && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Fields (unchanged) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... (keep existing form fields) ... */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {isSubmitting ? 'Adding...' : 'Add Product'}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

export default Add;