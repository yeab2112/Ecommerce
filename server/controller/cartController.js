import UserModel from "../moduls/user.js";
import { Product } from "../moduls/product.js";
import mongoose from 'mongoose';

// ===================== GET CART =====================
const getCart = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select('cartdata').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.cartdata) {
      return res.status(200).json({ success: true, cartdata: {} });
    }

    // Extract productIds
    const productIds = Object.values(user.cartdata)
      .map(item => item?.product || item?.productId) // Handle both cases
      .filter(productId => productId && mongoose.Types.ObjectId.isValid(productId));

    const products = await Product.find({ _id: { $in: productIds } }).select('name price images');
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = product;
    });

    // Build structured cart
    const cartdata = {};
    Object.entries(user.cartdata).forEach(([cartKey, cartItem]) => {
      if (!cartItem || (!cartItem.product && !cartItem.productId)) return;

      try {
        const productId = (cartItem.product || cartItem.productId).toString();
        const product = productMap[productId];

        const [parsedProductId, size, color] = cartKey.split('_');

        cartdata[cartKey] = {
          productId: cartItem.product || cartItem.productId,
          size,
          color,
          quantity: cartItem.quantity || 1,
          price: cartItem.price || product?.price || 0,
          name: product?.name || 'Unknown Product',
          image: product?.images?.[0] || '',
          lastUpdated: cartItem.lastUpdated || cartItem.addedAt || new Date()
        };
      } catch (err) {
        console.error('Error processing cart item:', cartKey, err);
      }
    });

    res.status(200).json({ success: true, cartdata });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load cart',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
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