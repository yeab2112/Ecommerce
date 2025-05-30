import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String
  },
  conditionChecks: {
    allItemsReceived: {
      type: Boolean,
      required: true
    },
    itemsInGoodCondition: {
      type: Boolean,
      required: true
    }
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Prevent model overwrite during hot reloads
export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
