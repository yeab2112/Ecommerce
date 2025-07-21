
import { Product } from "../moduls/product.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();//

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AddProducts = async (req, res) => {
  try {
    console.log('Received files:', req.files);
    console.log('Request body:', req.body);
    
    const { name, price, description, category, bestSeller, sizes, colors } = req.body;

    // File handling
    const image1 = req.files?.images1?.[0];
    const image2 = req.files?.images2?.[0];
    const image3 = req.files?.images3?.[0];
    const image4 = req.files?.images4?.[0];
    const images = [image1, image2, image3, image4].filter(Boolean);

    if (images.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one image is required' 
      });
    }

    // Upload images to Cloudinary
    const imageUrls = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image"
        });
        return result.secure_url;
      })
    );

    // Parse sizes and colors
    let parsedSizes = ['M']; // Default size
    try {
      parsedSizes = JSON.parse(sizes);
      if (!Array.isArray(parsedSizes)) {
        parsedSizes = ['M'];
      }
    } catch (e) {
      console.log('Error parsing sizes, using default', e);
    }

    let parsedColors = []; // Default empty array
    try {
      parsedColors = JSON.parse(colors);
      if (!Array.isArray(parsedColors)) {
        parsedColors = [];
      }
    } catch (e) {
      console.log('Error parsing colors, using default', e);
    }

    // Create new product
    const newProduct = new Product({
      name,
      price: Number(price),
      images: imageUrls,
      bestSeller: bestSeller === 'true',
      sizes: parsedSizes,
      colors: parsedColors, // Now properly included
      description,
      category,
      date: Date.now()
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });

  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error adding product' 
    });
  }
};;
// List all products
const ListProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    console.log(`Attempting to delete product with ID: ${productId}`);

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (deletedProduct) {
      console.log(`Product with ID: ${productId} deleted successfully`);
      return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } else {
      console.log(`Product with ID: ${productId} not found`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// Update a product
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, { new: true });

    if (updatedProduct) {
      res.status(200).json(updatedProduct);  // Send back the updated product
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Get product details (used for details page)
const productDetail = async (req, res) => {
  try {
    // First get the product
    const product = await Product.findById(req.params.productId).lean();
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Then get all reviews for this product
    const reviews = await Review.find({ productId: product._id })
      .populate('userId', 'name')
      .populate('orderId', 'orderNumber');

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    }

    // Prepare response
    const responseData = {
      ...product,
      reviews, // Add the populated reviews
      averageRating,
      reviewCount: reviews.length
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error in productDetail:', error);
    res.status(500).json({ message: error.message });
  }
};
const updateProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, category, price, images } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(productId, { name, category, price, images }, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

// Export all controller functions
export { AddProducts, productDetail, ListProducts, deleteProduct, updateProduct ,updateProducts};
