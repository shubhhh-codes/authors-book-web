'use client';

import { useState, useRef, DragEvent } from 'react';
import Image from 'next/image';

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function MultiImageUploader({ images, onChange }: MultiImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert image file to WebP in client canvas
  const processAndCompressToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
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
            (blob) => (blob ? resolve(blob) : resolve(file)),
            'image/webp',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadSingleFile = async (rawFile: File): Promise<string | null> => {
    try {
      const webpBlob = await processAndCompressToWebP(rawFile);
      const webpFile = new File([webpBlob], rawFile.name.replace(/\.[^/.]+$/, '') + '.webp', {
        type: 'image/webp',
      });
      const formData = new FormData();
      formData.append('file', webpFile);
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) return data.url;
      } catch {}

      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(webpBlob);
      });
    } catch {
      return null;
    }
  };

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Please select valid image files (PNG, JPG, WebP, AVIF)');
      return;
    }

    setIsUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];
    for (const file of validFiles) {
      const url = await uploadSingleFile(file);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
    } else {
      setError('Failed to upload images');
    }
    setIsUploading(false);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChange([...images, urlInput.trim()]);
    setUrlInput('');
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const next = [...images];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = images.filter((_, idx) => idx !== index);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Existing Images Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
            <span>Product Photos ({images.length})</span>
            <span className="text-[11px] text-gray-500 font-normal">Photo #1 is used as Primary Cover Image</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className={`relative group rounded-xl border-2 overflow-hidden bg-gray-50 aspect-square flex flex-col justify-between transition-all ${
                  idx === 0 ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <Image src={url} alt={`Product photo ${idx + 1}`} fill className="object-cover" unoptimized />

                {/* Badge */}
                <div className="relative z-10 p-2 flex items-center justify-between">
                  {idx === 0 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                      Primary Cover
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                      #{idx + 1}
                    </span>
                  )}
                </div>

                {/* Action Overlay */}
                <div className="relative z-10 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        className="px-1.5 py-1 text-[10px] font-bold bg-white text-black rounded hover:bg-gray-100 transition-all"
                        title="Set as Primary Cover Image"
                      >
                        Set Cover
                      </button>
                    )}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        className="p-1 text-xs bg-white/20 text-white rounded hover:bg-white/40 transition-all"
                        title="Move Left"
                      >
                        ←
                      </button>
                    )}
                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        className="p-1 text-xs bg-white/20 text-white rounded hover:bg-white/40 transition-all"
                        title="Move Right"
                      >
                        →
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-xs bg-rose-600/90 hover:bg-rose-600 text-white rounded transition-all"
                    title="Remove Photo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Controls */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`font-semibold pb-1 border-b-2 transition-all ${
                activeTab === 'upload' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              + Add Photos (Drag & Drop)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`font-semibold pb-1 border-b-2 transition-all ${
                activeTab === 'url' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Add via Image URL
            </button>
          </div>

          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
            ⚡ Auto WebP Compression
          </span>
        </div>

        {activeTab === 'upload' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-black bg-gray-50 scale-[0.99]'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg">
                📸
              </div>
              <div className="text-xs font-semibold text-gray-800">
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2 text-black">
                    <svg className="w-4 h-4 btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    Compressing & Uploading Photos...
                  </span>
                ) : (
                  <span>Click to select or drag & drop product photos</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">Supports selecting multiple WebP, PNG, JPG files</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddUrl} className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/product-photo.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all"
            >
              Add Photo
            </button>
          </form>
        )}

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    </div>
  );
}
