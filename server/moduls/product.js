import mongoose, { Types } from 'mongoose';

// Define product schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    colors: [{
      type: String, // Schema expects strings
      required: true,
    }],
    sizes: [{ type: String, required: true }], // Array of sizes
    rating: { type: Number, default: 0 },
    bestSeller: { type: Boolean, default: false },
    description: { type: String, required: true },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

const Product = mongoose.model('Product', productSchema);

export { Product };
