const mongoose = require("mongoose");
const dns = require("dns");


try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {

}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn("No MONGODB_URI provided in .env. Running with in-memory fallback.");
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(` MongoDB Connected Successfully: ${conn.connection.host} (${conn.connection.name})`);

    mongoose.connection.on("error", (err) => {
      console.error(" MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("  MongoDB disconnected. Attempting reconnection...");
    });

    return conn;
  } catch (error) {
    console.error(` MongoDB connection error: ${error.message}`);
    console.warn(" Running with in-memory room manager as fallback.");
  }
};

module.exports = connectDB;