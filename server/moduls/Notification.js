import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  customerName: String,
  customerEmail: String,
  confirmationTime: Date,
  note: String,
  conditionChecks: {
    allItemsReceived: Boolean,
    itemsInGoodCondition: Boolean
  },
  read: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification