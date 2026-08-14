/**
 * Variant ID Consistency Audit Script
 *
 * Scans all products in MongoDB and verifies that all products and variants
 * generate valid, positive, pure numeric IDs.
 *
 * Usage: npx tsx scripts/audit-variant-ids.ts
 */

import { connectDB } from '../lib/db';
import Product from '../lib/schemas/Product';
import { formatProductForShiprocket, validateVariantIdConsistency } from '../lib/services/catalogTransform';

async function runAudit() {
  console.log('--- Starting Shiprocket Variant ID Consistency Audit ---');
  await connectDB();

  const products = await Product.find({}).lean();
  console.log(`Found ${products.length} total products in database.`);

  let validCount = 0;
  let invalidCount = 0;
  const invalidProducts: Array<{ id: string; title: string; reason: string }> = [];

  for (const product of products) {
    try {
      const formatted = formatProductForShiprocket(product);

      if (typeof formatted.id !== 'number' || isNaN(formatted.id) || formatted.id <= 0) {
        invalidCount++;
        invalidProducts.push({
          id: String(product._id),
          title: product.title || 'Untitled',
          reason: `Invalid product ID: ${formatted.id}`,
        });
        continue;
      }

      if (!validateVariantIdConsistency(formatted)) {
        invalidCount++;
        invalidProducts.push({
          id: String(product._id),
          title: product.title || 'Untitled',
          reason: 'Variant ID consistency validation failed',
        });
        continue;
      }

      validCount++;
    } catch (err: any) {
      invalidCount++;
      invalidProducts.push({
        id: String(product._id),
        title: product.title || 'Untitled',
        reason: `Transformation error: ${err.message}`,
      });
    }
  }

  console.log('--- Audit Summary ---');
  console.log(`✅ Valid Products: ${validCount}`);
  console.log(`❌ Invalid Products: ${invalidCount}`);

  if (invalidProducts.length > 0) {
    console.error('Inconsistent Products Detected:', JSON.stringify(invalidProducts, null, 2));
    process.exit(1);
  } else {
    console.log('🎉 All products and variants have 100% consistent numeric IDs!');
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit script failed:', err);
  process.exit(1);
});
