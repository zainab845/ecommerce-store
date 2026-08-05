'use client';

import { useState, useRef, useCallback } from 'react';

interface UploadedImage {
  url: string;
  publicId: string;
  uploading?: boolean;
  error?: string;
  localPreview?: string;
  id: string;
}

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

let clientIdCounter = 0;
function generateId() {
  return `img-${++clientIdCounter}-${Date.now()}`;
}

export default function ImageUpload({ value, onChange, maxImages = 5 }: Props) {
  const [images, setImages] = useState<UploadedImage[]>(
    // Initialize from existing URLs (editing a product)
    value
      .filter(Boolean)
      .map(url => ({ url, publicId: '', id: generateId() }))
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifyParent = useCallback(
    (imgs: UploadedImage[]) => {
      onChange(
        imgs
          .filter(i => i.url && !i.uploading && !i.error)
          .map(i => i.url)
      );
    },
    [onChange]
  );

  const uploadFile = useCallback(
    async (file: File, clientId: string) => {
      const localPreview = URL.createObjectURL(file);

      setImages(prev => {
        const next = [
          ...prev,
          { url: '', publicId: '', uploading: true, localPreview, id: clientId },
        ];
        notifyParent(next);
        return next;
      });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Upload failed');

        setImages(prev => {
          const next = prev.map(img =>
            img.id === clientId
              ? { url: data.url, publicId: data.publicId, uploading: false, localPreview, id: clientId }
              : img
          );
          notifyParent(next);
          return next;
        });
      } catch (err: any) {
        setImages(prev => {
          const next = prev.map(img =>
            img.id === clientId
              ? { ...img, uploading: false, error: err.message || 'Upload failed' }
              : img
          );
          notifyParent(next);
          return next;
        });
      }
    },
    [notifyParent]
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const currentValid = images.filter(i => !i.error && !i.uploading).length;
      const remaining = maxImages - currentValid;
      if (remaining <= 0) {
        alert(`Maximum ${maxImages} images allowed.`);
        return;
      }
      arr.slice(0, remaining).forEach(file => uploadFile(file, generateId()));
    },
    [images, maxImages, uploadFile]
  );

  const removeImage = useCallback(
    async (img: UploadedImage) => {
      // Delete from Cloudinary if we have a publicId
      if (img.publicId) {
        try {
          await fetch('/api/upload/image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: img.publicId }),
          });
        } catch {
          // Deletion failure is non-blocking
        }
      }
      
      // Release the blob URL to free browser memory
      if (img.localPreview) URL.revokeObjectURL(img.localPreview);

      setImages(prev => {
        const next = prev.filter(i => i.id !== img.id);
        notifyParent(next);
        return next;
      });
    },
    [notifyParent]
  );

  const reorderImages = useCallback(
    (fromIdx: number, toIdx: number) => {
      setImages(prev => {
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        notifyParent(next);
        return next;
      });
    },
    [notifyParent]
  );

  const validCount = images.filter(i => !i.error).length;
  const canAddMore = validCount < maxImages;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all select-none ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
            className="hidden"
          />
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dragOver ? 'bg-indigo-100' : 'bg-gray-100'}`}>
            <svg className={`w-6 h-6 ${dragOver ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${dragOver ? 'text-indigo-600' : 'text-gray-700'}`}>
              {dragOver ? 'Drop to upload' : 'Drag & drop images here'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              or <span className="text-indigo-600 font-medium">click to browse</span>
            </p>
            <p className="text-xs text-gray-300 mt-1">
              JPEG, PNG, WebP · Max 10MB each · Up to {maxImages} images
            </p>
          </div>
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 group ${
                img.error ? 'border-red-200 bg-red-50' :
                img.uploading ? 'border-indigo-200' :
                idx === 0 ? 'border-indigo-400' :
                'border-gray-100 hover:border-indigo-200'
              }`}
            >
              {/* Image */}
              {(img.localPreview || img.url) && !img.error && (
                <img
                  src={img.localPreview || img.url}
                  alt={`Product image ${idx + 1}`}
                  className={`w-full h-full object-cover ${img.uploading ? 'opacity-40' : ''}`}
                />
              )}

              {/* Main badge */}
              {idx === 0 && !img.error && !img.uploading && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-indigo-600 text-white px-1 py-0.5 rounded">
                  MAIN
                </span>
              )}

              {/* Uploading spinner */}
              {img.uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/70">
                  <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-[10px] text-indigo-600 font-medium">Uploading</span>
                </div>
              )}

              {/* Error state */}
              {img.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[10px] text-red-500 leading-tight">{img.error}</p>
                </div>
              )}

              {/* Remove */}
              {!img.uploading && (
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Reorder */}
              {!img.uploading && !img.error && img.url && images.length > 1 && (
                <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => reorderImages(idx, idx - 1)}
                      className="w-4 h-4 bg-black/60 text-white rounded text-[9px] flex items-center justify-center hover:bg-black/80"
                    >←</button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => reorderImages(idx, idx + 1)}
                      className="w-4 h-4 bg-black/60 text-white rounded text-[9px] flex items-center justify-center hover:bg-black/80"
                    >→</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {validCount}/{maxImages} images.{' '}
        {images.length > 0 && 'First image is the main photo.'}{' '}
        {images.length > 1 && 'Hover to reorder or remove.'}
      </p>
    </div>
  );
}