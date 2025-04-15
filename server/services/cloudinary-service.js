import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'products',
      resource_type: 'image'
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const cleanupFiles = (files) => {
  if (!files) return;
  
  Object.values(files).flat().forEach(file => {
    try {
      if (file.path) fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Error deleting temp file: ${file.path}`, err);
    }
  });
};