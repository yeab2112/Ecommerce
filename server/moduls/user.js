import mongoose from 'mongoose';
import './order.js'; 

const UserSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      unique: true, 
      required: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    orders: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order' 
    }],
    cartdata: { 
      type: Object, 
      default: {} 
    },
    createdAt: { 
      type: Date,
      default: () => Date.now(), // Dynamic timestamp
      immutable: true // Prevents accidental updates
    }
  }, { minimize: false });
  
  const UserModel = mongoose.model('User', UserSchema);
  export default UserModel;