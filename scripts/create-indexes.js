const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('../dns-preload.cjs');

// Parse .env.local manually — no dotenv dependency needed
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function safeCreateIndex(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
    console.log(`  ✓ Index created: ${JSON.stringify(keys)}`);
  } catch (err) {
    if (err.codeName === 'IndexOptionsConflict' || err.code === 85 || err.message.includes('existing index')) {
      console.log(`  ℹ Index already exists: ${JSON.stringify(keys)}`);
    } else {
      console.warn(`  ⚠ Warning creating index ${JSON.stringify(keys)}:`, err.message);
    }
  }
}

async function createIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;

    // Products
    console.log('\n[Products]');
    const products = db.collection('products');
    await safeCreateIndex(products, { handle: 1 }, { unique: true, sparse: true });
    await safeCreateIndex(products, { published: 1, createdAt: -1 });
    await safeCreateIndex(products, { type: 1, published: 1 });
    await safeCreateIndex(products, { genre: 1 });
    await safeCreateIndex(products, { tags: 1 });
    await safeCreateIndex(products, { vendor: 1 });

    // Orders
    console.log('\n[Orders]');
    const orders = db.collection('orders');
    await safeCreateIndex(orders, { bookingId: 1 }, { unique: true });
    await safeCreateIndex(orders, { razorpayOrderId: 1 }, { sparse: true });
    await safeCreateIndex(orders, { discountCode: 1 }, { sparse: true });
    await safeCreateIndex(orders, { customerEmail: 1, 'timestamps.created': -1 });

    // Discounts
    console.log('\n[Discounts]');
    const discounts = db.collection('discounts');
    await safeCreateIndex(discounts, { code: 1 }, { unique: true });
    await safeCreateIndex(discounts, { active: 1 });

    // ShelfBooks
    console.log('\n[ShelfBooks]');
    const shelfbooks = db.collection('shelfbooks');
    await safeCreateIndex(shelfbooks, { order: 1 });
    await safeCreateIndex(shelfbooks, { published: 1, order: 1 });

    await mongoose.disconnect();
    console.log('\n✅ All database indexes processed successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
    process.exit(1);
  }
}

createIndexes();
