import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config({ path: "./config/.env" });

// Create a connection function
const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // Removed deprecated options
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

connection();
