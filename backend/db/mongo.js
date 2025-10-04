const mongoose = require('mongoose');
require('dotenv').config();

async function connect() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civic_db';
  // Use recommended options
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB:', uri);
}

module.exports = { connect, mongoose };
