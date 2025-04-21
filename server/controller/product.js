
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
    console.log('Received files:', req.files); // Debug log
    
    const { name, price, description, category, bestSeller, sizes } = req.body;
    console.log('req.files:', req.files);
console.log('req.body:', req.body);

    // Safer file access
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
    const imageUrls = await Promise.all(
      images.map(async(item)=>{
let result=await cloudinary.uploader.upload(item.path,{resource_type:"image"})
return  result.secure_url
      })
    )
   
    // Parse sizes (frontend sends as JSON string)
    let parsedSizes;
    try {
      parsedSizes = JSON.parse(sizes);
      if (!Array.isArray(parsedSizes)) {
        parsedSizes = ['M']; // Default size if not an array
      }
    } catch (e) {
      parsedSizes = ['M']; // Default size if parsing fails
    }

    const newProduct = new Product({
      name,
      price: Number(price),
      images: imageUrls,
      bestSeller: bestSeller === 'true'? true:false,
      sizes: parsedSizes,
      description,
      category,
      date:Date.now()
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
      
      // Case 1: Array containing a JSON string (["[\"S\",\"M\",\"L\"]"])
      if (Array.isArray(sizes) && sizes.length === 1 && 
          typeof sizes[0] === 'string' && sizes[0].startsWith('[')) {
        try {
          return JSON.parse(sizes[0]);
        } catch {
          return sizes[0].replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
        }
      }
      
      // Case 2: Already proper array (["S","M","L"]) or string ("S,M,L")
      if (Array.isArray(sizes)) return sizes;
      if (typeof sizes === 'string') return sizes.split(',').map(s => s.trim());
      
      return [];
    };

    const sizes = normalizeSizes(product.sizes);

    res.status(200).json({
      ...product.toObject(),
      sizes, // Now always a clean array
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
