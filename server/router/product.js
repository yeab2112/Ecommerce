import express from 'express';
import authoAdmin from '../middleware/autho.js';
import upload from '../middleware/multer.js';

import {
  AddProducts,
  ListProducts,
  deleteProduct,
  updateProduct,
 productDetail,
  updateProducts
} from '../controller/product.js';

const productRouter = express.Router();

// Add a new product (Admin only) with image upload
// POST request for adding a product, uses admin auth and file upload middlewares
productRouter.post(
  '/add_products',
  authoAdmin,
  upload.fields([
    { name: 'images1', maxCount: 1 },
    { name: 'images2', maxCount: 1 },
    { name: 'images3', maxCount: 1 },
    { name: 'images4', maxCount: 1 }
  ]),AddProducts
);
// List all products
productRouter.get('/list_products', ListProducts);  // Adjusted route to follow REST conventions


// Ensure that you are using the DELETE method, not GET
productRouter.delete('/delete_product/:productId', authoAdmin,deleteProduct);

// Update a product by ID (Admin only)
productRouter.put('/products/:id', authoAdmin, updateProduct);

// Get detailed product information by ID (change this to avoid conflicts)
productRouter.get('/detail_products/:productId', productDetail);  
productRouter.put('/update_product/:productId',authoAdmin, updateProducts);

export default productRouter;
