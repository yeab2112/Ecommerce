import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    colors: [{ 
      type: String, 
      required: true 
    }],
    sizes: [{ type: String, required: true }],
    rating: { type: Number, default: 0 },
    bestSeller: { type: Boolean, default: false },
    description: { type: String, required: true },
  },
  { timestamps: true } // This adds createdAt and updatedAt automatically
);

const Product = mongoose.model('Product', productSchema);

export { Product };