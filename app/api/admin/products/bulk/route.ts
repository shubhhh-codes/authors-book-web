import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { deleteLocalImages } from '@/lib/fileUtils';
import { errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const body = await request.json();
    const { action, productIds, payload } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse('No products selected for bulk action', 400);
    }

    switch (action) {
      case 'delete': {
        const productsToDelete = await Product.find({ _id: { $in: productIds } }).lean();
        for (const prod of productsToDelete) {
          if (prod.images && Array.isArray(prod.images)) {
            await deleteLocalImages(prod.images);
          }
        }

        const result = await Product.deleteMany({ _id: { $in: productIds } });
        return successResponse({
          success: true,
          message: `Deleted ${result.deletedCount} products`,
          affectedCount: result.deletedCount,
        });
      }

      case 'publish': {
        const result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { published: true } }
        );
        return successResponse({
          success: true,
          message: `Published ${result.modifiedCount} products`,
          affectedCount: result.modifiedCount,
        });
      }

      case 'unpublish': {
        const result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { published: false } }
        );
        return successResponse({
          success: true,
          message: `Unpublished ${result.modifiedCount} products`,
          affectedCount: result.modifiedCount,
        });
      }

      case 'add_tag': {
        const tag = String(payload?.tag || '').trim();
        if (!tag) return errorResponse('Tag string is required', 400);

        const result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $addToSet: { tags: tag } }
        );
        return successResponse({
          success: true,
          message: `Added tag "${tag}" to ${result.modifiedCount} products`,
          affectedCount: result.modifiedCount,
        });
      }

      case 'remove_tag': {
        const tag = String(payload?.tag || '').trim();
        if (!tag) return errorResponse('Tag string is required', 400);

        const result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $pull: { tags: tag } }
        );
        return successResponse({
          success: true,
          message: `Removed tag "${tag}" from ${result.modifiedCount} products`,
          affectedCount: result.modifiedCount,
        });
      }

      case 'update_stock': {
        const quantity = Number(payload?.quantity);
        if (isNaN(quantity) || quantity < 0) {
          return errorResponse('Valid quantity is required', 400);
        }

        const result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { 'inventory.quantity': quantity } }
        );
        return successResponse({
          success: true,
          message: `Updated stock to ${quantity} for ${result.modifiedCount} products`,
          affectedCount: result.modifiedCount,
        });
      }

      default:
        return errorResponse(`Unsupported bulk action: ${action}`, 400);
    }
  } catch (error) {
    console.error('Bulk products API error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
