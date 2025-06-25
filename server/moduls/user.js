import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    unique: true,  // This automatically creates an index
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: { type: String, required: true },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    validate: {
      validator: async function(orderIds) {
        if (!orderIds.length) return true;
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

// Remove this duplicate index declaration:
// UserSchema.index({ email: 1 });  // ← Comment out or delete this line

// Keep other indexes
UserSchema.index({ 'orders': 1 });

// Virtual for order count
UserSchema.virtual('orderCount').get(function() {
  return this.orders?.length || 0;
});

const UserModel = mongoose.model('User', UserSchema);
export default UserModel;