import { unlink } from 'fs/promises';
import path from 'path';

/**
 * Deletes local files from public/uploads if image URL starts with /uploads/
 */
export async function deleteLocalImages(images?: Array<{ url?: string } | string>): Promise<void> {
  if (!images || !Array.isArray(images)) return;

  for (const img of images) {
    const url = typeof img === 'string' ? img : img?.url;
    if (url && url.startsWith('/uploads/')) {
      try {
        const filename = url.replace(/^\/uploads\//, '');
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        await unlink(filePath);
      } catch {
        // File may already be deleted or not exist on disk
      }
    }
  }
}
