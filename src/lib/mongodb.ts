import mongoose from "mongoose";

let isConnected = false;

export async function connectToDB() {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("⚠️ MONGODB_URI not found in .env file");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "SocialNest",
    });

    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}
