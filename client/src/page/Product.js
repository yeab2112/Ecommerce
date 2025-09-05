import { useParams } from "react-router-dom";
import axios from "axios";
import { assets } from "../asset/asset";
import RelatedProduct from "../component/Relatedproduct";
import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";

const Product = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const { products, addToCart } = useContext(ShopContext);
  const [currentImage, setCurrentImage] = useState(assets.placeholder);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState({ name: "", code: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://ecommerce-rho-hazel.vercel.app/api/product/detail_products/${productId}`
        );

        if (!response.data) {
          throw new Error("Product not found");
        }

        const productData = response.data;

        setProduct({
          ...productData,
          sizes: productData.sizes || [],
          colors: productData.colors || [],
          averageRating: productData.averageRating || 0,
          reviews: productData.reviews || [],
        });

        setCurrentImage(productData.images?.[0] || assets.placeholder);

        // Auto-select defaults
        if (productData.sizes?.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }
        if (productData.colors?.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        setError(error.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setError("Please select a size.");
      return;
    }
    if (!selectedColor.name) {
      setError("Please select a color.");
      return;
    }
    setError("");
    addToCart(product._id, selectedSize, selectedColor.name);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-500 text-lg">
            ★
          </span>
        ))}
        {hasHalfStar && <span className="text-yellow-500 text-lg">½</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-lg">
            ★
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-2">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (loading) return <div className="text-center py-10">Loading product details...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!product) return <div className="text-center py-10">Product not found</div>;

  return (
    <div className="product-detail-container p-6 w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Left: Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-auto max-h-[500px] object-contain mx-auto"
              onError={() => setCurrentImage(assets.placeholder)}
            />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {product.images?.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name} thumbnail ${index + 1}`}
                onClick={() => setCurrentImage(img)}
                className={`w-16 h-16 cursor-pointer object-cover rounded-md ${
                  currentImage === img
                    ? "ring-2 ring-blue-500"
                    : "opacity-80 hover:opacity-100"
                } transition-all`}
                onError={(e) => {
                  e.target.src = assets.placeholder;
                }}
              />
            ))}
          </div>
        </div>

        {/* Middle: Product Details */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            {renderStars(product.averageRating)}
            <span className="text-gray-500">|</span>
            <span className="text-sm text-gray-600">
              {product.reviewCount || 0} review
              {product.reviewCount !== 1 ? "s" : ""}
            </span>
          </div>

          <p className="text-2xl font-semibold text-gray-800">
            ${product.price.toFixed(2)}
          </p>

          {product.bestSeller && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded">
              Bestseller
            </span>
          )}

          <p className="text-gray-600">{product.description}</p>

          {/* Sizes */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Size:</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded-md ${
                    selectedSize === size
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-800 border-gray-300 hover:border-blue-500"
                  } transition-colors`}
                >
                  {size}
                </button>
              ))}
            </div>
            {error && !selectedSize && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Color:</h3>
            <div className="flex flex-wrap gap-2">
              {product.colors?.map((color, index) => (
                <button
                  key={`${color.name}-${index}`}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-md border-2 ${
                    selectedColor.name === color.name
                      ? "ring-2 ring-blue-500 border-blue-600"
                      : "border-gray-300 hover:border-blue-500"
                  }`}
                  style={{ backgroundColor: color.code }}
                  title={color.name}
                  aria-label={color.name}
                >
                  {selectedColor.name === color.name && (
                    <svg
                      className="w-5 h-5 text-white mx-auto"
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
              ))}
            </div>
            {error && !selectedColor.name && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-medium text-lg transition-colors w-full max-w-md"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add to Cart"}
          </button>
        </div>

        {/* Right: Product Highlights */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Product Details</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✔</span>
              <span>
                <strong>Category:</strong> {product.category}
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✔</span>
              <span>
                <strong>Available Colors:</strong>{" "}
                {product.colors?.map((c) => c.name).join(", ")}
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✔</span>
              <span>
                <strong>Available Sizes:</strong> {product.sizes?.join(", ")}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
        {product.reviews?.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review) => {
              const userData =
                review.user || (typeof review.userId === "object" ? review.userId : null);
              const userName = userData?.name || "Anonymous";
              const userInitial = userName.charAt(0);
              const reviewDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString()
                : "";

              return (
                <div
                  key={review._id || Math.random()}
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {userInitial}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{userName}</p>
                      {reviewDate && (
                        <p className="text-sm text-gray-500">{reviewDate}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < (review.rating || 0)
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>

      {/* Related Products */}
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
