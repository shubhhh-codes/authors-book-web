const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function createIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;

    // Products — fast lookups by handle (SEO URLs), published status, price
    await db.collection('products').createIndex({ handle: 1 }, { unique: true, sparse: true });
    await db.collection('products').createIndex({ published: 1, createdAt: -1 });
    await db.collection('products').createIndex({ type: 1, published: 1 });
    await db.collection('products').createIndex({ genre: 1 });
    await db.collection('products').createIndex({ tags: 1 });
    await db.collection('products').createIndex({ vendor: 1 });
    console.log('Products indexes created');

    // Orders — existing schema-level indexes cover most cases; add compound for admin
    await db.collection('orders').createIndex({ bookingId: 1 }, { unique: true, sparse: true });
    await db.collection('orders').createIndex({ razorpayOrderId: 1 }, { sparse: true });
    await db.collection('orders').createIndex({ discountCode: 1 }, { sparse: true });
    console.log('Orders indexes created');

    // Discounts — fast code lookup (already unique in schema, this ensures it in DB)
    await db.collection('discounts').createIndex({ code: 1 }, { unique: true });
    await db.collection('discounts').createIndex({ active: 1 });
    console.log('Discounts indexes created');

    // ShelfBooks — sort by order
    await db.collection('shelfbooks').createIndex({ order: 1 });
    await db.collection('shelfbooks').createIndex({ published: 1, order: 1 });
    console.log('ShelfBooks indexes created');

    await mongoose.disconnect();
    console.log('All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
    process.exit(1);
  }
}

createIndexes();
