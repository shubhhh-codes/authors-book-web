const fs = require('fs');
const path = require('path');
const readline = require('readline');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dns = require('dns');

// Use public DNS for reliable MongoDB Atlas SRV record resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
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
  isActive: { type: Boolean, default: true },
  shiprocketVariantId: String,
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function runSeed() {
  const args = process.argv.slice(2);
  let shouldCleanOld = false;

  if (args.includes('--clean') || args.includes('--delete') || args.includes('--force-clean')) {
    shouldCleanOld = true;
  } else if (args.includes('--keep') || args.includes('--upsert')) {
    shouldCleanOld = false;
  } else {
    console.log('\n============================================================');
    console.log('🌱  DATABASE SEEDING');
    console.log('============================================================');
    console.log('Do you want to clean up (DELETE) old products first before seeding?');
    console.log("  • Type 'y' / 'yes' to DELETE all existing products and seed fresh.");
    console.log("  • Type 'n' / 'no' (or press Enter) to KEEP old products and upsert/seed new ones.\n");

    const answer = await askConfirmation('Clean up (delete) old products first? (y/N): ');
    shouldCleanOld = answer === 'y' || answer === 'yes';
  }

  try {
    console.log('\n⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas');

    const existingCount = await Product.countDocuments();
    console.log(`ℹ️  Found ${existingCount} existing products in database.`);

    const csvFilePath = path.join(__dirname, '../products_export_1.csv');
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at: ${csvFilePath}`);
    }

    const productMap = {};

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const handleKey = Object.keys(row).find((k) => k.toLowerCase().includes('handle'));
        const handle = (handleKey ? row[handleKey] : row.Handle || '').trim();

        if (!handle) return;

        const findVal = (substr) => {
          const k = Object.keys(row).find((key) => key.toLowerCase().includes(substr.toLowerCase()));
          return k && row[k] ? String(row[k]).trim() : '';
        };

        if (!productMap[handle]) {
          const cleanTitle = (row.Title || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
          const cleanSeoTitle = (row['SEO Title'] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
          const cleanSeoDesc = (row['SEO Description'] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
          const descriptionHtml = row['Body (HTML)'] || '';

          const genreVal = findVal('genre');
          const bookmarkShapeVal = findVal('bookmark-shape');
          const colorVal = findVal('color-pattern');
          const materialVal = findVal('material');
          const targetAudienceVal = findVal('target-audience');
          const languageVal = findVal('language-version');

          productMap[handle] = {
            handle,
            title: cleanTitle || handle,
            description: descriptionHtml,
            vendor: row.Vendor || 'Author’s book & bookmarks',
            category: row['Product Category'] || 'Media > Books',
            type: row.Type || 'book',
            tags: row.Tags ? row.Tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            published: row.Published === 'true' || row.Published === 'TRUE' || row.Published === true,
            sku: row['Variant SKU'] || `SKU-${handle}`,
            weight: parseFloat(row['Variant Grams']) || 0,
            price: parseFloat(row['Variant Price']) || 0,
            compareAtPrice: parseFloat(row['Variant Compare At Price']) || null,
            inventory: {
              quantity: parseInt(row['Variant Inventory Qty'], 10) || 10,
              policy: row['Variant Inventory Policy'] || 'deny',
            },
            images: [],
            seoTitle: cleanSeoTitle || `${cleanTitle} | Author's Book & Bookmarks`,
            seoDescription: cleanSeoDesc || `${cleanTitle} by Author’s book & bookmarks. Order your copy.`,
            bookmarkShape: bookmarkShapeVal,
            color: colorVal,
            material: materialVal,
            targetAudience: targetAudienceVal,
            genre: genreVal,
            language: languageVal || undefined,
            isActive: true,
          };
        }

        if (row['Image Src']) {
          productMap[handle].images.push({
            url: row['Image Src'],
            alt: row['Image Alt Text'] || row.Title || '',
            position: parseInt(row['Image Position'], 10) || 1,
          });
        }
      })
      .on('end', async () => {
        try {
          const products = Object.values(productMap).map((p) => ({
            ...p,
            images: p.images.sort((a, b) => a.position - b.position),
          }));

          if (shouldCleanOld) {
            console.log('🗑️  Option selected: Deleting existing products from database...');
            await Product.deleteMany({});
            console.log('✅ Cleared old products');

            const inserted = await Product.insertMany(products);
            console.log(`\n🎉 SEED COMPLETE (Fresh Clean Import)`);
            console.log(`------------------------------------------------------------`);
            console.log(`✅ Total Products Inserted:  ${inserted.length}`);
          } else {
            console.log('📦 Option selected: Keeping existing products & upserting/merging CSV data...');
            const bulkOps = products.map((p) => ({
              updateOne: {
                filter: { handle: p.handle },
                update: { $set: p },
                upsert: true,
              },
            }));

            const bulkResult = await Product.bulkWrite(bulkOps);
            console.log(`\n🎉 SEED COMPLETE (Safe Upsert / Merge)`);
            console.log(`------------------------------------------------------------`);
            console.log(`✅ Total Products Processed: ${products.length}`);
            console.log(`✅ Matched & Updated:        ${bulkResult.matchedCount}`);
            console.log(`✅ Newly Inserted:           ${bulkResult.upsertedCount}`);
          }

          console.log(`✅ Descriptions Populated:   ${products.filter((p) => p.description).length}`);
          console.log(`✅ SEO Titles Populated:     ${products.filter((p) => p.seoTitle).length}`);
          console.log(`✅ SEO Descriptions:         ${products.filter((p) => p.seoDescription).length}`);
          console.log(`✅ Genres Populated:         ${products.filter((p) => p.genre).length}`);
          console.log(`✅ Image Galleries Seeded:   ${products.filter((p) => p.images.length > 0).length}`);
          console.log(`------------------------------------------------------------\n`);

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
