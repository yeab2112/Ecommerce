import { useParams } from 'react-router-dom'; 
import axios from 'axios';  
import { assets } from '../asset/asset';  
import RelatedProduct from '../component/Relatedproduct';  
import React, { useContext, useState, useEffect } from 'react';  
import { ShopContext } from '../context/ShopContext';  

const Product = () => {
  const { productId } = useParams(); 
  const [product, setProduct] = useState(null); 
  const { products, addToCart } = useContext(ShopContext);  
  const [currentImage, setCurrentImage] = useState(null); 
  const [selectedSize, setSelectedSize] = useState(''); 
  const [selectedColor, setSelectedColor] = useState(null); 
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(true);  

  // Helper function to normalize color data
  const normalizeColor = (color) => {
    if (typeof color === 'string') {
      return {
        name: color,
        code: getColorCode(color),
        id: color.toLowerCase()
      };
    }
    return {
      name: color.name || 'Unknown',
      code: color.code || getColorCode(color.name),
      id: color._id || color.id || color.name.toLowerCase()
    };
  };

  // Get color code from name
  const getColorCode = (colorName) => {
    const colorMap = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'pink': '#FFC0CB',
      'gray': '#808080',
    };
    return colorMap[colorName?.toLowerCase()] || '#CCCCCC';
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true); 
        const response = await axios.get(
          `https://ecommerce-rho-hazel.vercel.app/api/product/detail_products/${productId}`
        );
        
        if (response.data) {
          // Normalize colors to ensure consistent format
          const normalizedColors = Array.isArray(response.data.colors) 
            ? response.data.colors.map(normalizeColor)
            : [normalizeColor('Black')]; // Default color

          setProduct({
            ...response.data,
            sizes: response.data.sizes || [], 
            colors: normalizedColors,
            rating: response.data.rating || 4.2,  
          });
          
          setCurrentImage(response.data.images?.[0] || assets.placeholder); 
          
          // Auto-select first color if available
          if (normalizedColors.length > 0) {
            setSelectedColor(normalizedColors[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching product details:', error); 
        setError('Product not found'); 
      } finally {
        setLoading(false); 
      }
    };

    fetchProduct();
  }, [productId,]);  

  const handleAddToCart = () => {
    if (!selectedSize) {
      setError('Please select a size.');  
      return;
    }
    if (!selectedColor) {
      setError('Please select a color.');
      return;
    }
    setError('');  
   addToCart(product._id, selectedSize, selectedColor); // ✅ Correct

  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);  
    const halfStar = rating - fullStars >= 0.5;  
    const totalStars = 5;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-500 text-xl">★</span>
        ))}
        {halfStar && <span className="text-yellow-500 text-xl">☆</span>}
        {Array.from({ length: totalStars - fullStars - (halfStar ? 1 : 0) }).map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-xl">★</span>
        ))}
        <span className="text-sm text-gray-600 ml-2">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;  
  if (!product) return <div className="text-center py-8">{error || 'Product not found'}</div>;  

  return (
    <div className="product-detail-container p-6 flex flex-col gap-8 w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* Image Gallery Column */}
        <div className="flex flex-col gap-4 order-1">
          {/* Main Image */}
          <div className="main-image bg-white p-4 rounded-lg shadow-md">
            <img
              src={currentImage}  
              alt={product.name}
              className="w-full h-auto max-h-[500px] object-contain mx-auto"
            />
          </div>
          
          {/* Thumbnails */}
          <div className="thumbnails flex flex-wrap gap-3 justify-center">
            {product.images?.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Product thumbnail ${index + 1}`}
                onClick={() => setCurrentImage(img)} 
                className={`w-16 h-16 cursor-pointer object-cover rounded-md ${
                  currentImage === img ? 'ring-2 ring-blue-500' : 'opacity-80 hover:opacity-100'
                } transition-all`}  
              />
            ))}
          </div>
        </div>

        {/* Product Details Column */}
        <div className="details-section flex flex-col gap-4 order-2 lg:order-3 xl:order-2">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          
          <div className="flex items-center gap-2">
            {renderStars(product.rating)}
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-600">SKU: {product._id.slice(-6)}</span>
          </div>
          
          <p className="text-2xl font-semibold text-gray-800 my-2">
            ${product.price.toFixed(2)}
          </p>
          
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          {/* Size Selection - Updated to show label and options on same row */}
          <div className="size-selection mb-4">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-lg font-semibold">Size:</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-md ${
                      selectedSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-blue-500'
                    } transition-colors`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            {error && !selectedSize && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Color Selection - Updated to square format */}
          <div className="color-selection mb-6">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-lg font-semibold">Color:</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors?.map((color) => {
                  const normalizedColor = normalizeColor(color);
                  return (
                    <button
                      key={normalizedColor.id}
                      onClick={() => setSelectedColor(normalizedColor)}
                      className={`w-10 h-10 flex items-center justify-center border rounded-md ${
                        selectedColor?.id === normalizedColor.id 
                          ? 'ring-2 ring-blue-500 border-blue-600'
                          : 'border-gray-300 hover:border-blue-500'
                      } transition-colors`}
                      style={{ backgroundColor: normalizedColor.code }}
                      title={normalizedColor.name}
                    >
                      {selectedColor?.id === normalizedColor.id && (
                        <svg 
                          className="w-5 h-5 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && !selectedColor && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart} 
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md 
                      font-medium text-lg transition-colors w-full max-w-md"
          >
            Add to Cart
          </button>
        </div>

        {/* Product Highlights/Details Column */}
        <div className="product-info order-3 lg:order-2 xl:order-3 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Product Details</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Category: {product.category}</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Available Colors: {product.colors?.map(c => c.name || c).join(', ')}</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Available Sizes: {product.sizes?.join(', ')}</span>
            </li>
            {product.bestSeller && (
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-blue-600">Bestseller Product</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <RelatedProduct 
          category={product.category} 
          currentProductId={product._id} 
          products={products} 
        />
      </div>
    </div>
  );
};

export default Product;