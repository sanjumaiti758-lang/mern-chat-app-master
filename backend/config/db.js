const mongoose = require("mongoose");
const colors = require("colors");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/userModel");

let mongod = null;

const seedUsers = async () => {
  try {
    const defaultUsers = [
      {
        name: "Sanju Maiti",
        email: "sanjumaiti758@gmail.com",
        password: "password123",
      },
      {
        name: "Tirtha Biswas",
        email: "bwubca24360@brainwareuniversity.ac.in",
        password: "password123",
      },
      {
        name: "Ma",
        email: "tanusreemaiti712401@gmail.com",
        password: "password123",
      },
      {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      },
      {
        name: "Guest User",
        email: "guest@example.com",
        password: "123456",
      },
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
      }
    }
  } catch (err) {
    console.log("Seeding error:", err.message);
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  let uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  // On Vercel serverless environment, connect to remote MongoDB Atlas directly
  if (process.env.VERCEL) {
    if (!uri) {
      console.error("Error: MONGO_URI environment variable is missing on Vercel!".red.bold);
      return;
    }
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected (Vercel): ${conn.connection.host}`.cyan.underline);
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error on Vercel: ${error.message}`.red.bold);
      return;
    }
  }

  // Local development: Try Atlas/Remote URI first if provided
  if (uri && uri !== "memory" && !uri.includes("<db_password>")) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
      await seedUsers();
      return;
    } catch (error) {
      console.log(`Could not connect to remote MongoDB (${error.message}). Starting local in-memory database...`.yellow);
    }
  }

  // Fallback to local in-memory MongoDB so the app always runs locally
  try {
    if (!mongod) {
      mongod = await MongoMemoryServer.create();
    }
    uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected (Local In-Memory DB): ${conn.connection.host}`.green.underline.bold);
    await seedUsers();
  } catch (error) {
    console.error(`Error starting MongoDB: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB;
