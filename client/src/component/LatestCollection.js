import React, { useContext, useEffect, useState, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import Title from './Title';
import { toast } from 'react-toastify';

function LatestCollection() {
  const { products, getProducts } = useContext(ShopContext);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      await getProducts();
      toast.success('Products loaded successfully!');
    } catch (error) {
      toast.error('Failed to load products!');
    } finally {
      setLoading(false);
    }
  }, [getProducts]);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [products, fetchProducts]);

  if (loading) {
    return <div className="text-center py-10 text-xl text-gray-600">Loading products...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 mx-4 min-h-[60vh]">
      <Title title1="Latest" title2="Collection" />
      <div className="text-center mb-6 text-gray-600">
        <p className="text-lg font-medium text-gray-700 mt-2">
          Explore the newest products in our collection.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.length > 0 ? (
          products.slice(0, 8).map((product) => (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="bg-blue-100 shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow group mx-4"
            >
              {/* Image container with proper positioning */}
              <div className="w-full h-64 mb-4">
                <img
                  src={product.images?.length > 0 ? product.images[0] : '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg'; // Fallback if image fails to load
                  }}
                />
              </div>

              {/* Product name and price container */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mt-2 group-hover:text-blue-600">
                  {product.name}
                </h3>
                {product.price && (
                  <p className="text-xl font-bold text-green-700 mt-2">
                    ${product.price.toFixed(2)}
                  </p>
                )}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full py-10">
            No products available in the collection.
          </p>
        )}
      </div>
    </div>
  );
}

export default LatestCollection;
