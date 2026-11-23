const mongoose = require("mongoose");

require("dotenv").config();

const mongoUrl = process.env.MONGODB_URI || process.env.mongourl;

if (!mongoUrl) {
  throw new Error("Set MONGODB_URI in noteapp/.env before starting the server.");
}

const connection = mongoose.connect(mongoUrl, {
  serverSelectionTimeoutMS: 10000
});

module.exports = { connection };
