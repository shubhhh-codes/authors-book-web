import mongoose from 'mongoose';

// Simulate data
const NUM_ITEMS = 5000;

const items = Array.from({ length: NUM_ITEMS }, (_, i) => ({
  productId: new mongoose.Types.ObjectId().toString(),
  quantity: 1,
  title: `Product ${i}`,
  price: 100,
}));

const dbProducts = items.map(item => ({
  _id: new mongoose.Types.ObjectId(item.productId),
  price: 100,
  inventory: { quantity: 100 },
}));

// Baseline approach
function baseline() {
  const start = performance.now();
  for (const item of items) {
    const dbProduct = dbProducts.find(p => p._id.toString() === item.productId);
    if (!dbProduct) throw new Error("not found");
  }
  return performance.now() - start;
}

// Optimized approach
function optimized() {
  const start = performance.now();

  const productMap = new Map();
  for (const p of dbProducts) {
    productMap.set(p._id.toString(), p);
  }

  for (const item of items) {
    const dbProduct = productMap.get(item.productId);
    if (!dbProduct) throw new Error("not found");
  }
  return performance.now() - start;
}

const b1 = baseline();
console.log(`Baseline: ${b1.toFixed(2)} ms`);
const o1 = optimized();
console.log(`Optimized: ${o1.toFixed(2)} ms`);
