const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const connectionUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nodeapp';
  await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 5000 });
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
