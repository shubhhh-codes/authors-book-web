import { connectDB } from '@/lib/db';
import ShelfBook from '@/lib/schemas/ShelfBook';
import {
  AdminShelfBookUpdateSchema,
  parseRequestBody,
  errorResponse,
  successResponse,
  getSafeErrorMessage,
} from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    const book = await ShelfBook.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id: id }],
    }).lean();

    if (!book) {
      return errorResponse('Shelf book not found', 404);
    }

    return successResponse(book);
  } catch (error) {
    console.error('Admin GET shelf-book [id] error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const updateData = await parseRequestBody(request, AdminShelfBookUpdateSchema);

    const book = await ShelfBook.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id: id }] },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!book) {
      return errorResponse('Shelf book not found', 404);
    }

    return successResponse(book);
  } catch (error) {
    console.error('Admin PUT shelf-book [id] error:', error);
    return errorResponse(getSafeErrorMessage(error), 400);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedBook = await ShelfBook.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id: id }],
    });

    if (!deletedBook) {
      return errorResponse('Shelf book not found', 404);
    }

    return successResponse({ success: true, message: 'Shelf book deleted successfully' });
  } catch (error) {
    console.error('Admin DELETE shelf-book [id] error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
