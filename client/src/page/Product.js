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
  const [selectedColor, setSelectedColor] = useState(''); // New state for the selected color
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(true);  

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true); 
        const response = await axios.get(`https://ecommerce-rho-hazel.vercel.app/api/product/detail_products/${productId}`);
        
        if (response.data) {
          setProduct({
            ...response.data,
            sizes: response.data.sizes || [], 
            colors: response.data.colors || [], // Fallback to an empty array if no colors are provided
            rating: response.data.rating || 4.2,  
          });
          setCurrentImage(response.data.images?.[0] || assets.placeholder); 
        }
      } catch (error) {
        console.error('Error fetching product details:', error); 
        setError('Product not found'); 
      } finally {
        setLoading(false); 
      }
    };

    fetchProduct();
  }, [productId]);  

  const handleAddToCart = () => {
    if (!selectedSize) {
      setError('Please select a size.');  
      return;
    }
    if (!selectedColor) {
      setError('Please select a color.'); // Show error if no color is selected
      return;
    }
    setError('');  
    addToCart(product._id, selectedSize, selectedColor);  // Add selected color to the cart
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
    <div className="product-detail-container p-6 flex flex-col gap-8 w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 w-full justify-center gap-8">
        
        {/* Thumbnails Column */}
        <div className="thumbnails flex flex-col gap-3 w-1/3">
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

        {/* Main Image Column */}
        <div className="main-image flex justify-center w-2/3">
          <img
            src={currentImage}  
            alt={product.name}
            className="max-w-md w-full h-auto max-h-[500px] object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Product Details Column */}
        <div className="details-section flex flex-col gap-4 w-2/3">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          {/* Dynamic Rating */}
          <div className="rating mb-4">
            {renderStars(product.rating)}  
          </div>
          
          <p className="text-xl font-semibold text-gray-800">{`$${product.price}`}</p>
          
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

          {/* Color Selection */}
          <div className="color-selection mb-4">
            <label htmlFor="color" className="text-lg font-semibold block mb-2">
              Select Color:
            </label>
            <select
              id="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)} 
              className="p-2 border rounded-md w-full max-w-xs"
            >
              <option value="">Choose a color</option>
              {product.colors?.map((color, index) => (
                <option key={index} value={color}>
                  {color}
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
      <RelatedProduct 
        category={product.category} 
        currentProductId={product._id} 
        products={products} 
      />
    </div>
  );
};

export default Product;
