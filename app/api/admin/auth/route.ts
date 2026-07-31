import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { timingSafePasswordCheck, signAdminSessionToken } from '@/lib/adminAuth';

// POST Admin Login
export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!password || !timingSafePasswordCheck(String(password), validPassword)) {
      return NextResponse.json(
        { error: 'Invalid admin credentials. Access denied.' },
        { status: 401 }
      );
    }

    // Generate cryptographically signed HMAC token
    const token = await signAdminSessionToken();

    const cookieStore = await cookies();
    cookieStore.set('ab_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, message: 'Admin authenticated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE Admin Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('ab_admin_session');
  return NextResponse.json({ success: true, message: 'Logged out' });
}
