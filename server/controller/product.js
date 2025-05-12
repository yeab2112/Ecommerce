
import { Product } from "../moduls/product.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();//

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import Product from '../models/Product.js';
import cloudinary from 'cloudinary';

const addProduct = async (req, res) => {
  try {
    // 1. Validate required fields
    const requiredFields = ['name', 'price', 'description', 'category'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    // 2. Handle image uploads
    const images = [
      req.files?.images1?.[0],
      req.files?.images2?.[0],
      req.files?.images3?.[0],
      req.files?.images4?.[0]
    ].filter(Boolean);

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // 3. Upload images to Cloudinary
    const imageUploads = images.map(file => 
      cloudinary.uploader.upload(file.path, {
        folder: 'ecommerce/products',
        width: 800,
        height: 800,
        crop: 'fill'
      })
    );

    const imageResults = await Promise.all(imageUploads);
    const imageUrls = imageResults.map(result => result.secure_url);

    // 4. Parse and validate colors
    let colors = [];
    try {
      const parsedColors = JSON.parse(req.body.colors || '[]');
      if (Array.isArray(parsedColors)) {
        colors = parsedColors.map(color => ({
          name: color?.name?.trim() || 'Unnamed',
          code: color?.code?.match(/^#([0-9a-f]{3}){1,2}$/i) 
            ? color.code 
            : '#000000'
        }));
      }
    } catch (error) {
      console.error('Color parsing error:', error);
    }

    // 5. Parse and validate sizes
    let sizes = ['M']; // Default size
    try {
      const parsedSizes = JSON.parse(req.body.sizes || '[]');
      if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
        sizes = parsedSizes.filter(size => 
          ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size)
        );
      }
    } catch (error) {
      console.error('Size parsing error:', error);
    }

    // 6. Create product
    const product = new Product({
      name: req.body.name,
      price: parseFloat(req.body.price),
      description: req.body.description,
      category: req.body.category,
      bestSeller: req.body.bestSeller === 'true',
      images: imageUrls,
      colors,
      sizes
    });

    await product.save();

    // 7. Return success response
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export { addProduct };
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
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Normalize sizes to always be an array of strings
    const normalizeSizes = (sizes) => {
      if (!sizes) return [];

      if (
        Array.isArray(sizes) &&
        sizes.length === 1 &&
        typeof sizes[0] === 'string' &&
        sizes[0].startsWith('[')
      ) {
        try {
          return JSON.parse(sizes[0]);
        } catch {
          return sizes[0].replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
        }
      }

      if (Array.isArray(sizes)) return sizes;
      if (typeof sizes === 'string') return sizes.split(',').map(s => s.trim());

      return [];
    };

    // Normalize color to always be an array of strings
    const normalizeColors = (colors) => {
      if (!colors) return [];

      if (
        Array.isArray(colors) &&
        colors.length === 1 &&
        typeof colors[0] === 'string' &&
        colors[0].startsWith('[')
      ) {
        try {
          return JSON.parse(colors[0]);
        } catch {
          return colors[0].replace(/[\[\]"]/g, '').split(',').map(c => c.trim());
        }
      }

      if (Array.isArray(colors)) return colors;
      if (typeof colors === 'string') return colors.split(',').map(c => c.trim());

      return [];
    };

    const sizes = normalizeSizes(product.sizes || product.size);
    const colors = normalizeColors(product.colors || product.color);

    res.status(200).json({
      ...product.toObject(),
      sizes,
      colors,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
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
