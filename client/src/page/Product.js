import { useParams } from 'react-router-dom';
import axios from 'axios'; // Import axios to make API requests
import { assets } from '../asset/asset';
import RelatedProduct from '../component/Relatedproduct';
import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';

const Product = () => {
  const { productId } = useParams(); // Get the product ID from the URL
  const [product, setProduct] = useState(null);
  const { products, addToCart, currency } = useContext(ShopContext);
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    

    const fetchProduct = async () => {
      try {
        setLoading(true); // Start loading
        // Fetch the specific product details
        const response = await axios.get(`http://localhost:5000/api/product/detail_products/${productId}`);
        if (response.data) {
          // Parse the sizes if it's a string
          const sizes = response.data.sizes ? JSON.parse(response.data.sizes) : [];
          setProduct({
            ...response.data,
            sizes, // Ensure sizes is an array now
          });
          setCurrentImage(response.data.images[0] || null);  // Set the first image as default
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Product not found');
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchProduct(); // Fetch the current product details
  }, [productId]);
  const handleAddToCart = () => {
    if (!selectedSize) {
      setError('Please select a size.');
      return;
    }
    setError('');
    addToCart(product._id, selectedSize); // Passing product ID and selected size
  };

  const rating = 4; // Example rating
  const totalStars = 5;


  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!product) return <div className="text-center py-8">{error || 'Product not found'}</div>;

  return (
    <div className="product-detail-container p-6 flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {/* First Column: Thumbnails */}
        <div className="thumbnails flex flex-col gap-4">
          {product.images?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Product thumbnail ${index + 1}`}
              onClick={() => setCurrentImage(img)}
              className={`w-20 h-20 cursor-pointer rounded-md shadow-md ${
                currentImage === img ? 'border-2 border-blue-500' : ''
              }`}
            />
          ))}
        </div>

        {/* Second Column: Main Image */}
        <div className="main-image flex justify-center items-center">
          <img
            src={currentImage || product.image || assets.placeholder}
            alt={product.name}
            className="max-w-md w-full h-auto max-h-[500px] object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Third Column: Product Details */}
        <div className="details-section flex flex-col gap-4">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          {/* Stars/Rating */}
          <div className="rating flex items-center mb-4">
            <span className="text-yellow-500">⭐⭐⭐⭐☆</span>
            {/* Replace above with dynamic rating logic if needed */}
          </div>

          {/* Price */}
          <p className="text-xl font-semibold text-gray-800">{`$${product.price}`}</p>

          {/* Description */}
          <p className="text-gray-600 mb-4">{product.description}</p>

          {/* Size Selection */}
          <div className="size-selection mb-4">
            <label htmlFor="size" className="text-lg font-semibold block mb-2">
              Select Size:
            </label>
            <select
              id="size"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="p-2 border rounded-md w-full max-w-xs"
            >
              <option value="">Choose a size</option>
              {product.sizes?.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 w-36"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Related Products */}
      <RelatedProduct category={product.category} currentProductId={product._id} products={products} />
    </div>
  );
};

export default Product;
