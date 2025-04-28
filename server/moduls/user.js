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
        ref: 'Order'  // Must match mongoose.model('Order', ...)
    }],
    cartdata: {
        type: Object,
        default: {}
    }
}, { minimize: false });

// ✅ Compile the schema into a model
const UserModel = mongoose.model('User', UserSchema);
export default UserModel;