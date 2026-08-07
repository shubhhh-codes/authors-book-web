const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const ProductSchema = new mongoose.Schema({
  inventory: {
    quantity: Number,
  }
});

const Product = mongoose.model('Product', ProductSchema);

async function runBenchmark() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  // Seed some products
  const numItems = 100;
  const products = [];
  for (let i = 0; i < numItems; i++) {
    products.push({ inventory: { quantity: 100 } });
  }

  const inserted = await Product.insertMany(products);
  const items = inserted.map(p => ({ productId: p._id, quantity: 1 }));

  // N+1 Method (Original)
  console.log(`Starting N+1 benchmark with ${numItems} items...`);
  const startNPlusOne = process.hrtime.bigint();

  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { 'inventory.quantity': -item.quantity } },
      { new: true }
    );
  }

  const endNPlusOne = process.hrtime.bigint();
  const nPlusOneMs = Number(endNPlusOne - startNPlusOne) / 1_000_000;
  console.log(`N+1 time: ${nPlusOneMs.toFixed(2)}ms`);

  // Reset inventory
  await Product.updateMany({}, { $set: { 'inventory.quantity': 100 } });

  // bulkWrite Method (Optimized)
  console.log(`Starting bulkWrite benchmark with ${numItems} items...`);
  const startBulkWrite = process.hrtime.bigint();

  const bulkOps = items.map(item => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { 'inventory.quantity': -item.quantity } },
    }
  }));
  await Product.bulkWrite(bulkOps);

  const endBulkWrite = process.hrtime.bigint();
  const bulkWriteMs = Number(endBulkWrite - startBulkWrite) / 1_000_000;
  console.log(`bulkWrite time: ${bulkWriteMs.toFixed(2)}ms`);

  console.log(`Improvement: ${(nPlusOneMs / bulkWriteMs).toFixed(2)}x faster`);

  await mongoose.disconnect();
  await mongod.stop();
}

runBenchmark().catch(console.error);
