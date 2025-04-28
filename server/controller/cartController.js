import  UserModel  from "../moduls/user.js";
import { Product } from "../moduls/product.js";
import mongoose from 'mongoose'; 
const getCart = async (req, res) => {
  try {
      // 1. Find the user with cartdata
      const user = await UserModel.findById(req.user._id)
          .select('cartdata')
          .lean();

      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found'
          });
      }

      // Initialize if cartdata doesn't exist
      if (!user.cartdata) {
          return res.status(200).json({
              success: true,
              cartdata: {}
          });
      }

      // 2. Prepare array of valid product IDs for population
      const productIds = Object.values(user.cartdata)
          .map(item => item?.product)
          .filter(productId => productId && mongoose.Types.ObjectId.isValid(productId));

      // 3. Fetch all products in cart in a single query
      const products = await Product.find({
          _id: { $in: productIds }
      }).select('name price images');

      // 4. Create product map for quick lookup
      const productMap = {};
      products.forEach(product => {
          productMap[product._id.toString()] = product;
      });

      // 5. Build the response object with null checks
      const cartdata = {};
      Object.entries(user.cartdata).forEach(([cartKey, cartItem]) => {
          // Skip if cartItem is invalid
          if (!cartItem || !cartItem.product) return;

          try {
              const productId = cartItem.product.toString();
              const product = productMap[productId];
              
              cartdata[cartKey] = {
                  product: cartItem.product,
                  size: cartItem.size,
                  quantity: cartItem.quantity || 1, // Default to 1 if missing
                  price: cartItem.price || (product?.price || 0), // Fallback prices
                  name: product?.name || 'Unknown Product',
                  image: product?.images?.[0] || '',
                  lastUpdated: cartItem.lastUpdated || new Date()
              };
          } catch (error) {
              console.error('Error processing cart item:', cartKey, error);
              // Skip this item if there's an error
          }
      });

      // 6. Send the response
      res.status(200).json({
          success: true,
          cartdata: cartdata
      });

  } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to load cart',
          ...(process.env.NODE_ENV === 'development' && {
              error: error.message
          })
      });
  }
};
const addToCart = async (req, res) => {
  try {
    const { productId, size } = req.body;  
    const userId = req.user._id; 

    const userData = await UserModel.findById(userId);  
    const cartData = userData.cartdata;  // Extract the cart data from the user's data
    // Check  if the productId exists in the cartData
    if (cartData[productId]) {
      // If the product exists, check if the size already exists
      if (cartData[productId][size]) {
        // If the size already exists, increment the quantity by 1
        cartData[productId][size] += 1;
      } else {
        // If the size doesn't exist, initialize the size with a quantity of 1
        cartData[productId][size] = 1;
      }
    } else {
      // If the productId doesn't exist, initialize the product in the cart with an empty object
      cartData[productId] = {};
      // Then set the size with a quantity of 1
      cartData[productId][size] = 1;
    }

    // Update the user's cart data in the database
    await UserModel.findByIdAndUpdate(userId, { cartdata: cartData });

    // Send a success response to the client
    res.status(200).json({ message: 'Product added to cart successfully!' });

  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error);
    res.status(500).json({ message: 'An error occurred while adding the product to the cart.' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Convert quantity to number and validate
    const quantityNumber = Number(quantity);
    if (isNaN(quantityNumber)) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize cartdata if it doesn't exist
    if (!user.cartdata) {
      user.cartdata = {};
    }

    // Initialize product entry if it doesn't exist
    if (!user.cartdata[productId]) {
      user.cartdata[productId] = {};
    }

    // Update the quantity for the specific size
    if (quantityNumber <= 0) {
      // Remove size entry if quantity is 0 or less
      delete user.cartdata[productId][size];
      
      // Remove product entry if no sizes left
      if (Object.keys(user.cartdata[productId]).length === 0) {
        delete user.cartdata[productId];
      }
    } else {
      // Set the quantity as a number
      user.cartdata[productId][size] = quantityNumber;
    }

    // Save the updated user data - FIXED THIS LINE
    await UserModel.findByIdAndUpdate(userId, { cartdata: user.cartdata });

    return res.status(200).json({ 
      success: true,
      message: 'Product updated successfully!',
      cartdata: user.cartdata
    });

  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while updating cart',
      error: error.message 
    });
  }
};
;

export { getCart, addToCart, updateCartItem };
