import { connectDB } from '@/lib/db';
import ThemeSetting from '@/lib/schemas/ThemeSetting';
import { AdminThemeUpdateSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function GET(): Promise<Response> {
  try {
    await connectDB();
    let settings = await ThemeSetting.findOne({}).lean();
    if (!settings) {
      settings = await ThemeSetting.create({});
    }
    return successResponse(settings);
  } catch (error) {
    console.error('Admin GET theme error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const data = await parseRequestBody(request, AdminThemeUpdateSchema);

    let settings = await ThemeSetting.findOne({});
    if (settings) {
      Object.assign(settings, data, { updatedAt: new Date() });
      await settings.save();
    } else {
      settings = await ThemeSetting.create(data);
    }

    return successResponse({ success: true, settings });
  } catch (error) {
    console.error('Admin POST theme error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
