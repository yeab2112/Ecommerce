import mongoose from 'mongoose';

// Define product schema

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: ['Women', 'Men', 'Kids']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  images: [{ 
    type: String, 
    required: [true, 'At least one image is required'],
    validate: {
      validator: images => images.length > 0,
      message: 'At least one image is required'
    }
  }],
  colors: [{
    name: { 
      type: String, 
      required: [true, 'Color name is required']
    },
    code: { 
      type: String, 
      required: [true, 'Color code is required'],
      validate: {
        validator: v => /^#([0-9a-f]{3}){1,2}$/i.test(v),
        message: props => `${props.value} is not a valid hex color code!`
      }
    }
  }],
  sizes: [{ 
    type: String, 
    required: [true, 'At least one size is required'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  }],
  bestSeller: { 
    type: Boolean, 
    default: false 
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Product = mongoose.model('Product', productSchema);

export  {Product};