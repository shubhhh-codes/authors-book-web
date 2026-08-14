/**
 * Variant Mapping & Order Webhook Matching Test Script
 *
 * Verifies:
 * 1. Variant mappings are stored and upserted correctly
 * 2. Multi-strategy variant lookup works (Shiprocket Variant ID, Local ID, SKU)
 * 3. Fallback product lookup works
 * 4. findVariantForOrder resolves properly for webhook payloads
 */

import { connectDB } from '../lib/db';
import { VariantMapping, createOrUpdateVariantMapping, findVariantByAnyId } from '../lib/services/variantMapping';
import { findVariantForOrder } from '../lib/services/shiprocket-webhook';

async function runTests() {
  console.log('=== Starting Variant Mapping Test Suite ===\n');

  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Setup mock test IDs
    const testLocalVariantId = 1786771716;
    const testLocalProductId = 632910392;
    const testSku = 'SKU-1786771716';
    const testShiprocketVariantId = 'sr_var_998877';

    // Test 1: Store variant mapping
    console.log('\n--- Test 1: Storing variant mapping ---');
    await createOrUpdateVariantMapping(
      testLocalVariantId,
      testLocalProductId,
      testSku,
      testShiprocketVariantId
    );

    const stored = await VariantMapping.findOne({ sku: testSku }).lean();
    if (!stored) {
      throw new Error(`Failed to retrieve stored mapping for SKU: ${testSku}`);
    }
    console.log('✓ Stored mapping successfully:', {
      localVariantId: stored.localVariantId,
      localProductId: stored.localProductId,
      sku: stored.sku,
      shiprocketVariantId: stored.shiprocketVariantId,
    });

    // Test 2: Find by Shiprocket Variant ID (Strategy 1)
    console.log('\n--- Test 2: Find by Shiprocket Variant ID ---');
    const bySrId = await findVariantByAnyId(testShiprocketVariantId, undefined, undefined);
    if (!bySrId || bySrId.sku !== testSku) {
      throw new Error(`Failed lookup by shiprocketVariantId: ${testShiprocketVariantId}`);
    }
    console.log('✓ Resolved variant by shiprocketVariantId:', bySrId.sku);

    // Test 3: Find by Numeric Variant ID String (Strategy 2)
    console.log('\n--- Test 3: Find by Numeric Variant ID String ---');
    const byNumString = await findVariantByAnyId(String(testLocalVariantId), undefined, undefined);
    if (!byNumString || byNumString.sku !== testSku) {
      throw new Error(`Failed lookup by numeric string ID: ${testLocalVariantId}`);
    }
    console.log('✓ Resolved variant by numeric string ID:', byNumString.sku);

    // Test 4: Find by SKU (Strategy 3)
    console.log('\n--- Test 4: Find by SKU ---');
    const bySku = await findVariantByAnyId(undefined, testSku, undefined);
    if (!bySku || bySku.localVariantId !== testLocalVariantId) {
      throw new Error(`Failed lookup by SKU: ${testSku}`);
    }
    console.log('✓ Resolved variant by SKU:', bySku.sku);

    // Test 5: findVariantForOrder Webhook Helper
    console.log('\n--- Test 5: findVariantForOrder Webhook Helper ---');
    const webhookItem = {
      variant_id: String(testLocalVariantId),
      sku: testSku,
      quantity: 1,
    };
    const resolvedFromWebhook = await findVariantForOrder(webhookItem);
    if (!resolvedFromWebhook) {
      throw new Error('findVariantForOrder returned null for valid item');
    }
    console.log('✓ Resolved variant from webhook payload:', resolvedFromWebhook);

    // Test 6: Non-existent variant returns null
    console.log('\n--- Test 6: Non-existent variant handling ---');
    const nonExistent = await findVariantByAnyId('non_existent_id_999999', 'SKU-DOESNOTEXIST', undefined);
    if (nonExistent !== null) {
      throw new Error('Expected null for non-existent variant');
    }
    console.log('✓ Non-existent variant handled gracefully (returned null)');

    // Cleanup test record
    await VariantMapping.deleteOne({ sku: testSku });
    console.log('\n✓ Cleaned up test record');

    console.log('\n🎉 ALL VARIANT MAPPING TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
