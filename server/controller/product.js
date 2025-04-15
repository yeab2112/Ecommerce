import { Product } from "../moduls/product.js";
import { uploadToCloudinary, cleanupFiles } from '../services/cloudinary-service.js';


// List all products
const ListProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// Add new product with image upload to Cloudinary

const AddProducts = async (req, res) => {
  try {
    const { name, price, description, category, bestSeller, sizes } = req.body;
    const files = req.files;

    // Validate required fields
    if (!name || !price || !description || !category) {
      cleanupFiles(files);
      return res.status(400).json({
        success: false,
        message: "Name, price, description, and category are required"
      });
    }

    // Validate at least one image
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }

    // Process all uploaded files
    const uploadResults = await Promise.all(
      Object.values(files).flat().map(async (file) => {
        try {
          const result = await uploadToCloudinary(file.path);
          return result.secure_url;
        } catch (error) {
          throw error;
        } finally {
          // Clean up temp file regardless of upload result
          if (file.path) fs.unlinkSync(file.path);
        }
      })
    );

    // Create new product
    const product = new Product({
      name,
      price: Number(price),
      images: uploadResults,
      bestSeller: bestSeller === 'true',
      sizes: Array.isArray(sizes) ? sizes : (sizes ? [sizes] : ['M']),
      description,
      category
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product
    });

  } catch (error) {
    console.error('Product creation error:', error);
    cleanupFiles(req.files);
    
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add product"
    });
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
