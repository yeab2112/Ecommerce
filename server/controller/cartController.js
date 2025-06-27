import UserModel from "../moduls/user.js";
import { Product } from "../moduls/product.js";
import mongoose from 'mongoose';

// ===================== GET CART =====================
const getCart = async (req, res) => {
  try {
    // 1. Fetch user with only cartdata
    const user = await UserModel.findById(req.user._id)
      .select('cartdata')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // 2. Handle empty cart case
    if (!user.cartdata || Object.keys(user.cartdata).length === 0) {
      return res.status(200).json({ 
        success: true, 
        cartdata: {} 
      });
    }

    // 3. Extract and validate product IDs
    const productIds = [];
    const cartKeys = Object.keys(user.cartdata);
    
    cartKeys.forEach(cartKey => {
      const item = user.cartdata[cartKey];
      if (!item) return;
      
      const productId = item.product || item.productId;
      if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        productIds.push(productId);
      }
    });

    // 4. Early return if no valid products
    if (productIds.length === 0) {
      return res.status(200).json({ 
        success: true, 
        cartdata: {} 
      });
    }

    // 5. Fetch products in single query with projection
    const products = await Product.find({ 
      _id: { $in: productIds } 
    }).select('name price images stock slug').lean();

    // 6. Create product map for quick lookup
    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});

    // 7. Build structured cart data
    const cartdata = {};
    let hasInvalidItems = false;

    cartKeys.forEach(cartKey => {
      const cartItem = user.cartdata[cartKey];
      if (!cartItem) return;

      try {
        const productId = (cartItem.product || cartItem.productId).toString();
        const product = productMap[productId];

        // Skip if product doesn't exist
        if (!product) {
          hasInvalidItems = true;
          return;
        }

        // Parse cart key components (productId_size_color)
        const [parsedProductId, size, color] = cartKey.split('_');

        cartdata[cartKey] = {
          productId,
          size: size || '',
          color: color || '',
          quantity: Math.max(1, cartItem.quantity || 1),
          price: cartItem.price || product.price || 0,
          name: product.name,
          image: product.images?.[0] || '',
          stock: product.stock || 0,
          slug: product.slug || '',
          lastUpdated: cartItem.lastUpdated || cartItem.addedAt || new Date()
        };

        // Auto-correct quantity if exceeds stock
        if (product.stock && cartdata[cartKey].quantity > product.stock) {
          cartdata[cartKey].quantity = product.stock;
          hasInvalidItems = true;
        }

      } catch (err) {
        console.error(`Error processing cart item ${cartKey}:`, err);
        hasInvalidItems = true;
      }
    });

    // 8. Clean invalid items if needed
    if (hasInvalidItems) {
      await UserModel.updateOne(
        { _id: req.user._id },
        { $set: { cartdata } }
      );
    }

    res.status(200).json({ 
      success: true, 
      cartdata,
      ...(hasInvalidItems && { 
        message: 'Some items were adjusted due to availability changes' 
      })
    });

  } catch (error) {
    console.error('Error fetching cart:', {
      userId: req.user?._id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to load cart',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  }
};

// ===================== ADD TO CART =====================
const addToCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!productId || !size || !color) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, size and color are required' 
      });
    }

    const userData = await UserModel.findById(userId);
    const cartData = userData.cartdata || {};

    const itemKey = `${productId}_${size.toUpperCase()}_${color}`;

    if (cartData[itemKey]) {
      cartData[itemKey].quantity += 1;
      cartData[itemKey].lastUpdated = new Date();
    } else {
      cartData[itemKey] = {
        productId,  // Consistent field name
        size: size.toUpperCase(),
        color,
        quantity: 1,
        addedAt: new Date(),
        lastUpdated: new Date()
      };
    }

    await UserModel.findByIdAndUpdate(userId, { cartdata: cartData });

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully!',
      cartdata: cartData
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while adding the product to the cart.'
    });
  }
};

// ===================== UPDATE CART ITEM =====================
const updateCartItem = async (req, res) => {
  try {
    const { productId, size, color, quantity } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!productId || !size || !color) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, size and color are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const quantityNumber = Number(quantity);
    if (isNaN(quantityNumber) || quantityNumber < 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const itemKey = `${productId}_${size.toUpperCase()}_${color}`;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cartData = user.cartdata || {};

    if (quantityNumber <= 0) {
      delete cartData[itemKey];
    } else {
      if (!cartData[itemKey]) {
        cartData[itemKey] = {
          productId,
          size: size.toUpperCase(),
          color,
          quantity: quantityNumber,
          addedAt: new Date(),
          lastUpdated: new Date()
        };
      } else {
        cartData[itemKey].quantity = quantityNumber;
        cartData[itemKey].lastUpdated = new Date();
      }
    }

    await UserModel.findByIdAndUpdate(userId, { cartdata: cartData });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      cartdata: cartData
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating cart',
      error: error.message
    });
  }
};

export { getCart, addToCart, updateCartItem };