import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  cartdata: { type: Object, default: {} },
  createdAt: { type: Date, default: () => Date.now(), immutable: true },

  // 👇 ADD THESE FIELDS FOR PASSWORD RESET
  resetToken: { type: String },
  resetTokenExpiration: { type: Date }
}, { minimize: false });

  
  const UserModel = mongoose.model('User', UserSchema);
  export default UserModel;