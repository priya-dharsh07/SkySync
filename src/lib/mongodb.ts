import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

function getMongoURI(): string | undefined {
  return process.env.MONGODB_URI;
}

async function connectDB(): Promise<typeof mongoose | null> {
  const uri = getMongoURI();
  if (!uri) {
    console.warn("MONGODB_URI is not set in environment.");
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2500,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected successfully");
    return cached.conn;
  } catch (err: any) {
    console.error("MongoDB connection error in connectDB:", err?.message || err);
    cached.promise = null;
    return null;
  }
}

export default connectDB;