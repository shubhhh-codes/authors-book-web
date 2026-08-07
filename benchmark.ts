import { connectDB } from './lib/db';
import Order from './lib/schemas/Order';
import mongoose from 'mongoose';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

// Use public DNS for reliable MongoDB Atlas SRV record resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Auto-load .env.local if MONGODB_URI is not set in environment
if (!process.env.MONGODB_URI) {
  const envPath = path.join(__dirname, '.env.local');
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

async function runBenchmark() {
  await connectDB();
  console.log('Connected to DB');

  // Insert test data if not enough
  const count = await Order.countDocuments();
  const targetCount = 10000;
  if (count < targetCount) {
    console.log(`Inserting ${targetCount - count} mock orders...`);
    const batchSize = 1000;
    for (let i = 0; i < targetCount - count; i += batchSize) {
      const docs = Array.from({ length: Math.min(batchSize, targetCount - count - i) }).map(() => ({
        total: Math.random() * 1000,
        status: 'delivered'
      }));
      await Order.insertMany(docs);
      console.log(`Inserted ${i + docs.length} / ${targetCount - count}`);
    }
  }

  // Force GC if possible, otherwise just wait a bit
  if (global.gc) {
    global.gc();
  }

  // Benchmark 1: find().lean()
  console.log('\n--- Running find().lean() Benchmark ---');
  const startMem1 = process.memoryUsage().heapUsed;
  const startTime1 = performance.now();

  const orders = await Order.find({}).lean();
  const totalSales = orders.reduce((sum, o: any) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;

  const endTime1 = performance.now();
  const endMem1 = process.memoryUsage().heapUsed;

  console.log(`Time: ${(endTime1 - startTime1).toFixed(2)} ms`);
  console.log(`Memory Used: ${((endMem1 - startMem1) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Result: ${totalSales} sales, ${totalOrders} orders`);

  if (global.gc) {
    global.gc();
  }

  // Benchmark 2: aggregate()
  console.log('\n--- Running aggregate() Benchmark ---');
  const startMem2 = process.memoryUsage().heapUsed;
  const startTime2 = performance.now();

  const aggResult = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);
  const aggTotalSales = aggResult[0]?.totalSales || 0;
  const aggTotalOrders = aggResult[0]?.totalOrders || 0;

  const endTime2 = performance.now();
  const endMem2 = process.memoryUsage().heapUsed;

  console.log(`Time: ${(endTime2 - startTime2).toFixed(2)} ms`);
  console.log(`Memory Used: ${((endMem2 - startMem2) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Result: ${aggTotalSales} sales, ${aggTotalOrders} orders`);

  process.exit(0);
}

runBenchmark().catch(console.error);
