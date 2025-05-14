import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: { 
      type: String, 
      required: [true, 'Product description is required'],
      trim: true
    },
    category: { 
      type: String, 
      required: [true, 'Product category is required'],
      enum: {
        values: ['Women', 'Men', 'Kids'],
        message: 'Please select valid category'
      }
    },
    price: { 
      type: Number, 
      required: [true, 'Product price is required'],
      min: [0, 'Price must be at least 0']
    },
    sizes: [{ 
      type: String, 
      required: true,
      enum: ['S', 'M', 'L', 'XL', 'XXL'],
      default: ['M']
    }],
    colors: [{
      name: { 
        type: String, 
        required: [true, 'Color name is required']
      },
      code: { 
        type: String, 
        required: [true, 'Color code is required'],
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color code format']
      }
    }],
    bestSeller: { 
      type: Boolean, 
      default: false 
    },
    images: [{ 
      type: String, 
      required: [true, 'Product images are required'],
      validate: {
        validator: function(images) {
          return images.length > 0;
        },
        message: 'At least one image is required'
      }
    }],
    date: { 
      type: Date, 
      default: Date.now 
    },
    rating: { 
      type: Number, 
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  { 
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add index for better performance on frequent queries
productSchema.index({ name: 'text', category: 1, bestSeller: 1 });

const Product = mongoose.model('Product', productSchema);

export { Product };