// multer.js
import multer from 'multer';
import path from 'path';

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './uploads'); // Save to 'uploads' directory temporarily
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}_${file.originalname}`); // Use current timestamp to avoid name collisions
  },
});

// File filter to accept only image files
const fileFilter = (req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    return callback(new Error('Only image files are allowed'), false);
  }
  callback(null, true);
};

// Create multer instance with file size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
});

export default upload;
