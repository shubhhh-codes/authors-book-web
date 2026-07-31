import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ThemeSetting from '@/lib/schemas/ThemeSetting';

// GET active theme settings
export async function GET() {
  try {
    await connectDB();
    let settings = await ThemeSetting.findOne({}).lean();
    if (!settings) {
      settings = await ThemeSetting.create({});
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST save theme settings
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    let settings = await ThemeSetting.findOne({});
    if (settings) {
      Object.assign(settings, body, { updatedAt: new Date() });
      await settings.save();
    } else {
      settings = await ThemeSetting.create(body);
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
