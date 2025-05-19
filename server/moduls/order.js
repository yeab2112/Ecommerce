import mongoose from 'mongoose';
import './user.js';

const orderItemSchema = new mongoose.Schema({
  product: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  color: {
    type: String,
    required: true,
    default: 'default',
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    set: v => parseFloat(v.toFixed(2))
  },
  image: {
    type: String,
    default: '/images/product-placeholder.jpg'
  }
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
  payment: {
    type: Boolean,
    default: false,
    required: true
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
 status: {
  type: String,
  enum: ['pending', 'processing', 'shipped', 'delivered', 'received', 'cancelled'],
  default: 'pending'
}
,
  tracking: {
    carrier: String,
    trackingNumber: String,
    updatedAt: Date
  },
 receivedConfirmation: {
  confirmed: { type: Boolean, default: false },
  confirmedAt: Date,
  note: String,
  allItemsReceived: Boolean,
  itemsInGoodCondition: Boolean
}

}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;