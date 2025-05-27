import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  message:{
    type:String,
    required:true
  },
   type: {
    type: String,
    required: true,
    enum: ['order_received', 'system_alert', 'customer_message'],
    default: 'order_received'
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  note: String,
  conditionChecks: {
    allItemsReceived: { type: Boolean, required: true },
    itemsInGoodCondition: { type: Boolean, required: true }
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;