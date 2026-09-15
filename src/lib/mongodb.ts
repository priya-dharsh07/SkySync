import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
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
  return process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;
}

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = getMongoURI();
  if (!uri) {
    console.warn("MONGODB_URI is not set. Using local JSON store fallback.");
    return null;
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 100000, // 9-second timeout for quick fallback when offline
      connectTimeoutMS: 100000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log("Connected to MongoDB successfully.");
        return m;
      })
      .catch((err) => {
        console.warn("MongoDB connection failed, using JSON DB fallback:", err.message);
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.promise = null;
    cached.conn = null;
    return null;
  }

  return cached.conn;
}

export default connectDB;