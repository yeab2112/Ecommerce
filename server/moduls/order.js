import mongoose from 'mongoose';
const trackingSchema = new mongoose.Schema({
  carrier: { type: String, default: 'Not specified' },
  trackingNumber: { type: String, default: 'Not available' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });
// Sub-schemas with _id disabled to reduce overhead
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  size: {
    type: String,
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  color: { type: String, default: 'default' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: String
}, { _id: false });

const deliveryInfoSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: false });

const paymentDetailsSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'verified'],
    default: 'pending'
  },
  method: { type: String, default: null },
  reference: { type: String, default: null },
  shortReference: { type: String, default: null },
  verification: { type: Object, default: null },
  lastCallback: { type: Date, default: null }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true  // Define index here instead of in middleware
  },
  deliveryInfo: { type: deliveryInfoSchema, required: true },
  tracking:{
    type:trackingSchema,
    default:{}
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Online Payment'],
    required: true
  },
  paymentDetails: paymentDetailsSchema,
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: v => Array.isArray(v) && v.length > 0,
      message: 'Order must contain at least one item'
    }
  },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true  // Index for faster status queries
  },
  isPaid: { type: Boolean, default: false },
  paidAt: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define indexes at schema level (prevents duplicate indexes)
orderSchema.index({ 'paymentDetails.shortReference': 1 }); // For callback lookups
orderSchema.index({ createdAt: -1 }); // For sorting recent orders

// Virtual for order number
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

export default mongoose.model('Order', orderSchema);