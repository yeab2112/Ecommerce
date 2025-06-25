import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: { type: String, required: true },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    validate: {
      validator: async function(orderIds) {
        const count = await mongoose.model('Order').countDocuments({ 
          _id: { $in: orderIds },
          user: this._id 
        });
        return count === orderIds.length;
      },
      message: 'Some orders do not belong to this user'
    }
  }],
  cartdata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  createdAt: { 
    type: Date, 
    default: () => Date.now(), 
    immutable: true 
  },
  resetToken: { type: String },
  resetTokenExpiration: { type: Date }
}, { 
  minimize: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ 'orders': 1 });

// Virtual for order count
UserSchema.virtual('orderCount').get(function() {
  return this.orders?.length || 0;
});

const UserModel = mongoose.model('User', UserSchema);
export default UserModel;