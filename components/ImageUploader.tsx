'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert image file to optimized WebP blob via HTML5 Canvas
  const processAndCompressToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // If it's already webp, resolve directly
      if (file.type === 'image/webp') {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions (1600px width/height for crisp quality)
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (rawFile: File) => {
    if (!rawFile.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, AVIF)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Compress to WebP in browser
      const webpBlob = await processAndCompressToWebP(rawFile);
      const webpFile = new File([webpBlob], rawFile.name.replace(/\.[^/.]+$/, '') + '.webp', {
        type: 'image/webp',
      });

      const formData = new FormData();
      formData.append('file', webpFile);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to process and upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`font-semibold transition-colors ${
              activeTab === 'upload' ? 'text-black underline underline-offset-4' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Drag & Drop Upload
          </button>
          <span className="text-gray-300">•</span>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`font-semibold transition-colors ${
              activeTab === 'url' ? 'text-black underline underline-offset-4' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Image URL Link
          </button>
        </div>

        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
          ⚡ Auto WebP Compression
        </span>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-black bg-gray-50 scale-[1.01]'
              : value
              ? 'border-gray-200 bg-gray-50/50 hover:border-gray-400'
              : 'border-gray-300 hover:border-gray-500 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/avif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="py-6 space-y-2">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-gray-700">Converting to WebP & uploading...</p>
            </div>
          ) : value ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
              <div className="relative w-24 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 shadow-2xs">
                <Image src={value} alt="Product cover" fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-bold text-gray-900 truncate">{value}</p>
                <p className="text-[11px] text-gray-500">Image uploaded to /uploads in WebP format.</p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1 rounded-md bg-white border border-gray-300 hover:border-black text-[11px] font-semibold text-gray-700"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange('');
                    }}
                    className="px-3 py-1 rounded-md bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[11px] font-semibold text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-2">
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto text-xl shadow-2xs">
                📁
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Drag and drop product cover image here
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  or <span className="text-blue-600 underline font-semibold">browse files</span> (PNG, JPG, WebP auto-compressed)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... or /uploads/..."
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-xs font-mono"
          />
          {value && (
            <div className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
