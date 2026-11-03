const mongoose = require("mongoose");
require("dotenv").config();

const connection = mongoose.connect(process.env.mongourl, {
    serverSelectionTimeoutMS: 10000
});

module.exports = { connection };