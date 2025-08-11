import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

function BestSeller() {
  const { products, getProducts } = useContext(ShopContext);
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    if (Array.isArray(products)) {
      const filteredBestSellers = products.filter((item) => item.bestSeller);
      setBestSellers(filteredBestSellers.slice(0, 5)); // Limit to top 5 best sellers
    }
    getProducts();
  }, [products, getProducts]);

  return (
    <div className="p-6 bg-gray-300 mx-4 min-h-[60vh]">
      <Title title1="Best" title2="Sellers" />
      <p className="text-lg font-medium text-gray-700 text-center mt-4 mb-6">
        Discover our top-selling products, handpicked for you!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {bestSellers.length > 0 ? (
          bestSellers.slice(0, 5).map((product) => ( // Limit to 5 products
            <div
              className="bg-blue-100 shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow group mx-4"
              key={product._id}
            >
              {/* Image container with proper size */}
              <div className="w-full h-64 mb-2 relative">
                <img
                  src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg'; // Fallback if image fails to load
                  }}
                />
              </div>

              {/* Text content below the image */}
              <div className="flex flex-col justify-start h-full mt-4 space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 mt-2 group-hover:text-blue-600">
                  {product.name}
                </h3>
                {product.price && (
                  <p className="text-xl font-bold text-green-800 mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                    {`${product.currency || '$'}${product.price}`}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full py-10">
            No best sellers available.
          </p>
        )}
      </div>
    </div>
  );
}

export default BestSeller;
