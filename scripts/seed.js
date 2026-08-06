const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dns = require('dns');

// Use public DNS for reliable MongoDB Atlas SRV record resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

// Auto-load .env.local if MONGODB_URI is not set in environment
if (!process.env.MONGODB_URI) {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const ProductSchema = new mongoose.Schema({
  handle: String,
  title: String,
  description: String,
  vendor: String,
  category: String,
  type: String,
  tags: [String],
  published: Boolean,
  sku: String,
  weight: Number,
  price: Number,
  compareAtPrice: Number,
  inventory: {
    quantity: Number,
    policy: String,
  },
  images: [
    {
      url: String,
      alt: String,
      position: Number,
    },
  ],
  seoTitle: String,
  seoDescription: String,
  bookmarkShape: String,
  color: String,
  material: String,
  targetAudience: String,
  genre: String,
  language: String,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function runSeed() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas');

    const productMap = {};

    fs.createReadStream(path.join(__dirname, '../products_export_1.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const handleKey = Object.keys(row).find(k => k.includes('Handle'));
        const handle = handleKey ? row[handleKey] : row.Handle;

        if (!handle) return;

        if (!productMap[handle]) {
          productMap[handle] = {
            handle,
            title: row.Title || '',
            description: row['Body (HTML)'] || '',
            vendor: row.Vendor || '',
            category: row['Product Category'] || '',
            type: row.Type || '',
            tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [],
            published: row.Published === 'true' || row.Published === 'TRUE',
            sku: row['Variant SKU'] || '',
            weight: parseFloat(row['Variant Grams']) || 0,
            price: parseFloat(row['Variant Price']) || 0,
            compareAtPrice: parseFloat(row['Variant Compare At Price']) || null,
            inventory: {
              quantity: parseInt(row['Variant Inventory Qty']) || 0,
              policy: row['Variant Inventory Policy'] || 'deny',
            },
            images: [],
            seoTitle: row['SEO Title'] || '',
            seoDescription: row['SEO Description'] || '',
            bookmarkShape: row['Bookmark shape'] || '',
            color: row['Color'] || '',
            material: row['Material'] || '',
            targetAudience: row['Target audience'] || '',
            genre: row['Genre'] || '',
            language: row['Language version'] || undefined,
          };
        }

        if (row['Image Src']) {
          productMap[handle].images.push({
            url: row['Image Src'],
            alt: row['Image Alt Text'] || row.Title,
            position: parseInt(row['Image Position']) || 0,
          });
        }
      })
      .on('end', async () => {
        try {
          await Product.deleteMany({});
          console.log('✅ Cleared existing products');

          const products = Object.values(productMap).map(p => ({
            ...p,
            images: p.images.sort((a, b) => a.position - b.position),
          }));

          await Product.insertMany(products);
          console.log(`✅ Seeded ${products.length} products`);

          await mongoose.disconnect();
          process.exit(0);
        } catch (error) {
          console.error('❌ Seeding error:', error);
          process.exit(1);
        }
      });
  } catch (err) {
    console.error('❌ MongoDB Connection failed:', err);
    process.exit(1);
  }
}

runSeed();
