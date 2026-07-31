import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const MONGODB_URI = process.env.MONGODB_URI;


if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

declare global {
  var mongoose: { conn: any; promise: any } | undefined;
}

let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

