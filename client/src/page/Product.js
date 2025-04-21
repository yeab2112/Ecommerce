import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import { assets } from '../asset/asset';
import RelatedProduct from '../component/Relatedproduct';
import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';

const Product = () => {
  const { productId } = useParams(); 
  const [product, setProduct] = useState(null);
  const { products, addToCart, currency } = useContext(ShopContext);
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true); 
        const response = await axios.get(`https://ecommerce-rho-hazel.vercel.app/api/product/detail_products/${productId}`);
        if (response.data) {
          const sizes = Array.isArray(response.data.sizes) 
          ? response.data.sizes 
          : typeof response.data.sizes === 'string' 
            ? response.data.sizes.split(',').map(s => s.trim()) : [];           
             setProduct({
            ...response.data,
            sizes,
          });
          setCurrentImage(response.data.images[0] || null);
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
    setError('');
    addToCart(product._id, selectedSize);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!product) return <div className="text-center py-8">{error || 'Product not found'}</div>;

  return (
    <div className="product-detail-container p-6 flex flex-col gap-8 w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 w-full justify-center gap-8 ">
        {/* First Column: Thumbnails */}
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

        {/* Second Column: Main Image */}
        <div className="main-image flex justify-center w-2/3">
          <img
            src={currentImage || product.image || assets.placeholder}
            alt={product.name}
            className="max-w-md w-full h-auto max-h-[500px] object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Third Column: Product Details */}
        <div className="details-section flex flex-col gap-4 w-2/3">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          {/* Stars/Rating */}
          <div className="rating flex items-center mb-4">
            <span className="text-yellow-500">⭐⭐⭐⭐☆</span>
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
