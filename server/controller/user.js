import mongoose  from "mongoose";
import  UserModel  from "../moduls/user.js"; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import validator from 'validator';  
import Order from "../moduls/order.js";
dotenv.config({ path: './config/.env' });
import nodemailer from "nodemailer"

const UserRegister = async (req, res) => {
try {
    const { name, email, password } = req.body;

    if (!name || !email || !password ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists in the database
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new UserModel({ name, email, password: hashedPassword });

    // Save the user to the database
    const result = await newUser.save();

    // Remove the password field from the response
    const userA = { ...result.toObject(), password: undefined };

    // Send success response
    res.status(201).json({ success: true, userA });

  } catch (error) {
    console.error('Error saving User:', error);
    res.status(500).json({ message: 'Failed to submit user' });
  }
};

// User Login
const UserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'The Email does not exit' });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET, { expiresIn: "3d" }
    );

    // Remove password from user object for response
    const userA = { ...user._doc, password: undefined };

    // Send success response with token and user info
    res.json({ success: true, token, userA,message:"Login successful!" });
 } catch (error) {
  console.error('❌ Order creation error:', error.message);
  console.error(error.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
}
}

// Admin Login 

const AdminLogin = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Ensure environment variables are loaded
  if (!process.env.ADMIN_EMAIL || !process.env.JWT_SECRET|| !process.env.JWT_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Validate admin credentials
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    try {
      // Create a token with a payload (admin email and role)
      const atoken = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "3d" });

      // Send token in response
      return res.status(200).json({ success: true, message: "Login successful", atoken });
    } catch (error) {
      console.error("Error generating token:", error);
      return res.status(500).json({ error: "Server error" });
    }
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
};

const getCurrentUser = async (req, res) => {
  const auditLog = {
    userId: req.user._id,
    startTime: new Date(),
    actions: []
  };

  try {
    // 1. Initialize session with retry logic
    const session = await mongoose.startSession();
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      session.startTransaction();
      auditLog.attempt = attempt;

      try {
        // 2. Fetch user with consistency checks
        const user = await UserModel.findById(req.user._id)
          .session(session)
          .setOptions({ lean: true });

        if (!user) {
          await session.abortTransaction();
          auditLog.actions.push('user_not_found');
          return res.status(404).json({ 
            success: false, 
            message: 'User not found',
            auditId: auditLog._id
          });
        }

        // 3. Parallel data validation
        const [dbOrders, validRefs] = await Promise.all([
          Order.find({ user: req.user._id })
            .select('_id')
            .session(session)
            .lean(),
          Order.find({
            _id: { $in: user.orders || [] },
            user: req.user._id
          })
          .select('_id')
          .session(session)
          .lean()
        ]);

        // 4. Identify discrepancies
        const dbOrderIds = new Set(dbOrders.map(o => o._id.toString()));
        const userOrderIds = new Set(user.orders?.map(o => o.toString()) || []);
        const validOrderIds = new Set(validRefs.map(o => o._id.toString()));

        const missingFromUser = [...dbOrderIds].filter(id => !userOrderIds.has(id));
        const invalidRefs = [...userOrderIds].filter(id => !validOrderIds.has(id));

        auditLog.stats = {
          dbOrders: dbOrderIds.size,
          userRefs: userOrderIds.size,
          validRefs: validOrderIds.size,
          missing: missingFromUser.length,
          invalid: invalidRefs.length
        };

        // 5. Conditional repair
        if (missingFromUser.length > 0 || invalidRefs.length > 0) {
          const newRefs = [
            ...validRefs.map(o => o._id),
            ...missingFromUser.map(id => new mongoose.Types.ObjectId(id))
          ];

          await UserModel.findByIdAndUpdate(
            req.user._id,
            { $set: { orders: newRefs } },
            { session }
          );

          auditLog.actions.push({
            type: 'reference_repair',
            added: missingFromUser,
            removed: invalidRefs
          });
        }

        // 6. Final data fetch
        const finalUser = await UserModel.findById(req.user._id)
          .populate({
            path: 'orders',
            select: 'deliveryInfo items total createdAt status paymentMethod',
            options: { sort: { createdAt: -1 } }
          })
          .session(session)
          .lean();

        await session.commitTransaction();
        auditLog.status = 'success';
        auditLog.endTime = new Date();

        // Log audit trail (consider storing in DB)
        console.log('[AUDIT]', JSON.stringify(auditLog, null, 2));

        return res.status(200).json({
          success: true,
          user: {
            ...finalUser,
            orders: finalUser.orders || []
          },
          audit: {
            id: auditLog._id,
            repaired: auditLog.actions.length > 0
          }
        });

      } catch (operationError) {
        await session.abortTransaction();
        
        if (attempt === maxAttempts) {
          throw operationError;
        }

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 100 * Math.pow(2, attempt))
        );
        continue;
      } finally {
        session.endSession();
      }
    }
  } catch (error) {
    auditLog.status = 'failed';
    auditLog.error = {
      message: error.message,
      stack: error.stack
    };
    auditLog.endTime = new Date();

    console.error('[FATAL]', JSON.stringify(auditLog, null, 2));

    return res.status(500).json({
      success: false,
      message: 'Failed to load user data',
      auditId: auditLog._id,
      reference: 'USER_FETCH_FAILURE'
    });
  }
};
//update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, deliveryInfo } = req.body;

    // 1. Update user name
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    );

    // 2. Find latest order for this user
    const latestOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });

    if (latestOrder) {
      latestOrder.deliveryInfo = deliveryInfo;
      await latestOrder.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile and delivery info updated successfully',
      user,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Forgot Password

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'The email does not exist' });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; 
    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "yeabsiraaychiluhim2112@gmail.com", 
        pass: "ya23547840",  
      },
    });

    // Send reset email
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `
        <p>You requested a password reset.</p>
        <p>Click this <a href="${resetLink}">link</a> to set a new password.</p>
      `,
    });
    
    res.status(200).json('Reset link sent to your email');
      
  } catch (error) {
    console.error('Error saving User:', error);
    res.status(500).json({ message: 'Failed to submit user' });
  }
};

// Reset Password
const Reset = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  let user;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = await UserModel.findOne({ email: decoded.email, resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
  } catch (err) {
    return res.status(400).send('Invalid or expired token');
  }

  if (!user) {
    return res.status(404).send('User not found');
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiration = undefined;
  await user.save();

  res.send('Password has been reset');
};

export { UserLogin, UserRegister, AdminLogin, getCurrentUser,updateUserProfile, forgotPassword, Reset };
