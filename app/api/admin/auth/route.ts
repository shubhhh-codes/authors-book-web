import { cookies } from 'next/headers';
import { timingSafePasswordCheck, signAdminSessionToken } from '@/lib/adminAuth';
import { AdminLoginSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD is not set. Define it in .env.local.');
}

const adminPassword: string = ADMIN_PASSWORD;

export async function POST(request: Request): Promise<Response> {
  try {
    const { password } = await parseRequestBody(request, AdminLoginSchema);

    if (!timingSafePasswordCheck(String(password), adminPassword)) {
      return errorResponse('Invalid admin credentials. Access denied.', 401);
    }

    const token = await signAdminSessionToken();

    const cookieStore = await cookies();
    cookieStore.set('ab_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return successResponse({ success: true, message: 'Admin authenticated successfully' });
  } catch (error) {
    console.error('Admin auth error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function DELETE(): Promise<Response> {
  const cookieStore = await cookies();
  cookieStore.delete('ab_admin_session');
  return successResponse({ success: true, message: 'Logged out' });
}
