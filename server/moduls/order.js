import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  color: {
    type: String,
    default: 'default'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  image: String
});

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
});

const paymentDetailsSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'verified'],
    default: 'pending'
  },
  method: String, // 'chapa', 'cod', etc.
  reference: String, // Full Chapa tx_ref
  shortReference: {
    type: String,
    index: true // For fast lookup during callback
  },
  verification: Object, // Raw response from Chapa verification
  lastCallback: Date
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryInfo: {
    type: deliveryInfoSchema,
    required: true
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
    validate: v => Array.isArray(v) && v.length > 0
  },
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
