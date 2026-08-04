'use client';

import { useState, useRef, useCallback } from 'react';

interface UploadedImage {
  url: string;
  publicId: string;
  uploading?: boolean;
  error?: string;
  localPreview?: string; // blob URL for instant preview before upload completes
  id: string; // client-side unique ID for tracking
}

interface Props {
  value: string[];               // current list of image URLs
  onChange: (urls: string[]) => void; // called when URLs change
  maxImages?: number;
}

let clientIdCounter = 0;
function generateId() {
  return `img-${++clientIdCounter}-${Date.now()}`;
}

export default function ImageUpload({ value, onChange, maxImages = 5 }: Props) {
  const [images, setImages] = useState<UploadedImage[]>(
    value.map(url => ({ url, publicId: '', id: generateId() }))
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload a single File to the server
  const uploadFile = useCallback(
    async (file: File, clientId: string) => {
      const localPreview = URL.createObjectURL(file);

      // Add placeholder with preview immediately so user sees the image right away
      setImages(prev => [
        ...prev,
        {
          url: '',
          publicId: '',
          uploading: true,
          localPreview,
          id: clientId,
        },
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        // Replace placeholder with real URL
        setImages(prev => {
          const updated = prev.map(img =>
            img.id === clientId
              ? {
                  url: data.url,
                  publicId: data.publicId,
                  uploading: false,
                  localPreview,
                  id: clientId,
                }
              : img
          );
          // Notify parent with the new URL list (only successfully uploaded ones)
          onChange(updated.filter(i => i.url && !i.uploading).map(i => i.url));
          return updated;
        });
      } catch (err: any) {
        // Mark as failed
        setImages(prev => {
          const updated = prev.map(img =>
            img.id === clientId
              ? {
                  ...img,
                  uploading: false,
                  error: err.message || 'Upload failed',
                }
              : img
          );
          // Don't include failed uploads in parent value
          onChange(updated.filter(i => i.url && !i.uploading && !i.error).map(i => i.url));
          return updated;
        });
      }
    },
    [onChange]
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.filter(i => !i.error).length;
      const toUpload = fileArray.slice(0, remaining);

      if (toUpload.length === 0) {
        alert(`Maximum ${maxImages} images allowed.`);
        return;
      }

      toUpload.forEach(file => {
        uploadFile(file, generateId());
      });
    },
    [images, maxImages, uploadFile]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (clientId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== clientId);
      onChange(updated.filter(i => i.url && !i.uploading && !i.error).map(i => i.url));
      return updated;
    });
  };

  const reorderImages = (fromIdx: number, toIdx: number) => {
    setImages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      onChange(updated.filter(i => i.url && !i.uploading && !i.error).map(i => i.url));
      return updated;
    });
  };

  const canAddMore = images.filter(i => !i.error).length < maxImages;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
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
            onChange={handleFileInput}
            className="hidden"
          />

          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
            dragOver ? 'bg-indigo-100' : 'bg-gray-100'
          }`}>
            <svg
              className={`w-6 h-6 transition-colors ${dragOver ? 'text-indigo-600' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="text-center">
            <p className={`text-sm font-semibold transition-colors ${dragOver ? 'text-indigo-600' : 'text-gray-700'}`}>
              {dragOver ? 'Drop images here' : 'Drag & drop images'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              or <span className="text-indigo-600 font-medium">click to browse</span>
            </p>
            <p className="text-xs text-gray-300 mt-1">
              JPEG, PNG, WebP, GIF · Max 10MB each · Up to {maxImages} images
            </p>
          </div>
        </div>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                img.error
                  ? 'border-red-200 bg-red-50'
                  : img.uploading
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-gray-100 hover:border-indigo-300'
              }`}
            >
              {/* Image preview */}
              {(img.localPreview || img.url) && !img.error && (
                <img
                  src={img.localPreview || img.url}
                  alt={`Product image ${idx + 1}`}
                  className={`w-full h-full object-cover transition-opacity ${
                    img.uploading ? 'opacity-50' : 'opacity-100'
                  }`}
                />
              )}

              {/* First image badge */}
              {idx === 0 && !img.error && !img.uploading && (
                <div className="absolute bottom-1.5 left-1.5">
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                    Main
                  </span>
                </div>
              )}

              {/* Uploading overlay */}
              {img.uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-xs text-indigo-600 font-medium">Uploading...</span>
                </div>
              )}

              {/* Error overlay */}
              {img.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-red-500 font-medium">Upload failed</p>
                  <p className="text-[10px] text-red-400 leading-tight">{img.error}</p>
                </div>
              )}

              {/* Remove button */}
              {!img.uploading && (
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Reorder arrows (only for uploaded images) */}
              {!img.uploading && !img.error && img.url && (
                <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={() => reorderImages(idx, idx - 1)}
                      className="w-5 h-5 bg-black/50 text-white rounded flex items-center justify-center text-[10px] hover:bg-black/70 transition-colors"
                      title="Move left"
                    >
                      ←
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      onClick={() => reorderImages(idx, idx + 1)}
                      className="w-5 h-5 bg-black/50 text-white rounded flex items-center justify-center text-[10px] hover:bg-black/70 transition-colors"
                      title="Move right"
                    >
                      →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-400">
        {images.filter(i => i.url && !i.uploading && !i.error).length} / {maxImages} images uploaded.
        {images.length > 0 && ' First image is the main product photo.'}
        {images.length > 1 && ' Use ← → arrows to reorder.'}
      </p>
    </div>
  );
}