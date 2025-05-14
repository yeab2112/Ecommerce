import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import Title from '../component/Title';

function Collection() {
  const { products, search, getProducts } = useContext(ShopContext);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortOption, setSortOption] = useState('relevant');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  if (!products) return <div>Loading products...</div>;
  const safeProducts = Array.isArray(products) ? products : [];

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) 
        ? prev.filter((item) => item !== category) 
        : [...prev, category]
    );
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const filteredProducts = safeProducts
    .filter((product) =>
      (!selectedCategories.length || selectedCategories.includes(product.category)) &&
      (!search || product.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOption === 'high-low') return b.price - a.price;
      if (sortOption === 'low-high') return a.price - b.price;
      return 0;
    });

  return (
    <div className="px-4 py-6 md:px-8">
      {/* Mobile Header with Filter/Sort */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Filters
        </button>
        
        <div className="flex-grow text-center">
          <Title title1="All" title2="Collection" />
        </div>
        
        <select
          className="border p-2 rounded shadow-sm text-gray-700 text-sm"
          value={sortOption}
          onChange={handleSortChange}
        >
          <option value="relevant">Relevant</option>
          <option value="high-low">High to Low</option>
          <option value="low-high">Low to High</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Section */}
        <div className={`fixed md:static inset-0 z-40 md:z-auto bg-white md:bg-transparent transform ${
          showFilters ? 'translate-x-0' : '-translate-x-full'
        } md:transform-none transition-transform duration-300 ease-in-out md:w-1/6 p-4 md:border-r-2 md:border-gray-300 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h2 className="text-xl font-bold">Filters</h2>
            <button 
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-6">
            <p className="font-semibold text-gray-700 mb-2">Categories</p>
            {['Men', 'Women', 'Kids'].map((category) => (
              <label key={category} className="flex items-center text-gray-600 mb-2">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 accent-blue-500"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        {showFilters && (
          <div 
            className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Products Section */}
        <div className="w-full md:w-5/6">
          <div className="hidden md:flex items-center justify-between mb-6">
            <Title title1="All" title2="Collection" />
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Sort by:</span>
              <select
                className="border p-2 rounded shadow-sm text-gray-700"
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="relevant">Relevant</option>
                <option value="high-low">High to Low</option>
                <option value="low-high">Low to High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {product.bestSeller && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Best Seller
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                    <div className="flex items-center mt-1 space-x-1">
                      {product.colors?.slice(0, 3).map((color, i) => (
                        <div 
                          key={i}
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.code }}
                          title={color.name}
                        />
                      ))}
                      {product.colors?.length > 3 && (
                        <span className="text-xs text-gray-400">+{product.colors.length - 3}</span>
                      )}
                    </div>
                    <p className="font-bold text-blue-600 mt-1">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No products found matching your criteria</p>
                <button 
                  onClick={() => {
                    setSelectedCategories([]);
                    setSortOption('relevant');
                  }}
                  className="mt-4 text-blue-500 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Collection;