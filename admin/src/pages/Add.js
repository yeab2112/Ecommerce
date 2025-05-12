import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const COLOR_OPTIONS = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Red', code: '#FF0000' },
  { name: 'Blue', code: '#0000FF' },
  { name: 'Green', code: '#008000' },
  { name: 'Yellow', code: '#FFFF00' },
  { name: 'Pink', code: '#FFC0CB' },
  { name: 'Gray', code: '#808080' }
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const Add= () => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: 'Women',
    price: '',
    sizes: [],
    colors: [],
    bestSeller: false,
    images: Array(4).fill(null)
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSizeChange = (e) => {
    const { value, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      sizes: checked
        ? [...prev.sizes, value]
        : prev.sizes.filter(size => size !== value)
    }));
  };

  const handleColorChange = (e, color) => {
    const { checked } = e.target;
    setProduct(prev => ({
      ...prev,
      colors: checked
        ? [...prev.colors, { name: color.name, code: color.code }]
        : prev.colors.filter(c => c.name !== color.name)
    }));
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const updatedImages = [...product.images];
      updatedImages[index] = file;
      setProduct(prev => ({ ...prev, images: updatedImages }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...product.images];
    updatedImages[index] = null;
    setProduct(prev => ({ ...prev, images: updatedImages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('category', product.category);
      formData.append('price', product.price);
      formData.append('bestSeller', product.bestSeller);
      formData.append('sizes', JSON.stringify(product.sizes));
      formData.append('colors', JSON.stringify(product.colors));

      product.images.forEach((image, index) => {
        if (image) formData.append(`images${index + 1}`, image);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      // Reset form on success
      setProduct({
        name: '',
        description: '',
        category: 'Women',
        price: '',
        sizes: [],
        colors: [],
        bestSeller: false,
        images: Array(4).fill(null)
      });

      toast.success('Product added successfully!');
    } catch (error) {
      toast.error(error.message || 'Error adding product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Add New Product</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Product Images (Max 4)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <input
                  type="file"
                  id={`image-upload-${index}`}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, index)}
                  className="hidden"
                />
                <label
                  htmlFor={`image-upload-${index}`}
                  className="block w-full h-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  {image ? (
                    <img
                      src={image instanceof File ? URL.createObjectURL(image) : image}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  )}
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={product.category}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Women">Women</option>
              <option value="Men">Men</option>
              <option value="Kids">Kids</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={product.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="bestSeller"
              checked={product.bestSeller}
              onChange={handleInputChange}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Mark as Best Seller
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Sizes *
          </label>
          <div className="flex flex-wrap gap-3">
            {SIZE_OPTIONS.map(size => (
              <label key={size} className="inline-flex items-center">
                <input
                  type="checkbox"
                  value={size}
                  checked={product.sizes.includes(size)}
                  onChange={handleSizeChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">{size}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Colors
          </label>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map(color => (
              <label key={color.name} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={product.colors.some(c => c.name === color.name)}
                  onChange={(e) => handleColorChange(e, color)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-2 flex items-center">
                  <div 
                    className="w-5 h-5 rounded-full mr-1 border border-gray-300"
                    style={{ backgroundColor: color.code }}
                  />
                  <span className="text-gray-700">{color.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>

      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
};

export default Add;