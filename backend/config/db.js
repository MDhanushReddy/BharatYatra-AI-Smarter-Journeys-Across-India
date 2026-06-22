import mongoose from 'mongoose';

// Fallback to in-memory MongoDB for local dev when MONGO_URI is not available
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.warn('MONGO_URI not set. Falling back to in-memory MongoDB for development.');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      // Keep reference on global to prevent GC in dev
      global._mongod = mongod;
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB; 