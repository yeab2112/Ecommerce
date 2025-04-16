import fs from 'fs';
import { Product } from "../moduls/product.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
  api_key: process.env.CLOUDINARY_API_KEY ,
  api_secret: process.env.CLOUDINARY_API_SECRET ,
});

const AddProducts = async (req, res) => {
  try {
    const { name, price, description, category, bestSeller, sizes } = req.body;

    // Get all uploaded files
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required." });
    }

    // Process all uploaded images
    const imageUrls = [];
    for (const fieldName in files) {
      const fileArray = files[fieldName];
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, { 
            resource_type: "image" 
          });
          fs.unlinkSync(file.path); // Delete temp file
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          // Don't fail the whole request if one image fails
          continue;
        }
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "Failed to upload any images." });
    }

    // Rest of your controller logic...
    const parsedSizes = Array.isArray(sizes) ? sizes : (sizes ? [sizes] : ['M']);

    const newProduct = new Product({
      name,
      price: Number(price),
      images: imageUrls,
      bestSeller: bestSeller === 'true',
      sizes: parsedSizes,
      description,
      category,
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
};

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

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

// Get product details (used for details page)
const productDetail = async (req, res) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
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
export { AddProducts, productDetail, ListProducts, deleteProduct, updateProduct, getProductById ,updateProducts};
