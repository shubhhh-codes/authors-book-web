import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Security Patch: Restrict MIME types to image formats only
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid file type. Only image files are allowed.' }, { status: 400 });
    }

    // Security Patch: Max file size limit 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum allowed limit of 10MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try writing to public/uploads (local dev). Fallback to Data URI on Vercel serverless functions.
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const ext = path.extname(originalName) || '.webp';
      const baseName = path.basename(originalName, ext);
      const filename = `product-${Date.now()}-${baseName}${ext.endsWith('.webp') ? '.webp' : ext}`;
      
      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${filename}`,
        filename,
        size: file.size,
      });
    } catch (fsError) {
      console.warn('Filesystem write not available (Vercel serverless mode). Returning optimized Data URI:', fsError);
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'image/webp';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        isDataUri: true,
        size: file.size,
      });
    }
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save file' },
      { status: 500 }
    );
  }
}
