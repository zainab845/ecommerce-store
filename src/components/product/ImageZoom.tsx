'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Props {
  images: string[];
  productName: string;
  isOutOfStock?: boolean;
  isLowStock?: boolean;
  stock?: number;
  discountPct?: number;
  isPremiumOnly?: boolean;
  isLocked?: boolean;
}

export default function ImageZoom({ 
  images, 
  productName,
  isOutOfStock,
  isLowStock,
  stock,
  discountPct = 0,
  isPremiumOnly,
  isLocked
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentage

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxOpen(false); setZoomed(false); }
      if (e.key === 'ArrowRight') setSelectedIdx(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setSelectedIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, images.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }, []);

  const mainImage = images[selectedIdx] ?? '/placeholder.png';

  return (
    <>
      {/* Main image area */}
      <div className="space-y-3">
        {/* Primary image */}
        <div
          className={`relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group ${isLocked ? '' : 'cursor-zoom-in'}`}
          onClick={() => { if (!isLocked) setLightboxOpen(true); }}
        >
          <img
            src={mainImage}
            alt={`${productName} - image ${selectedIdx + 1}`}
            className={`w-full h-full object-cover transition-all duration-500 ${isLocked ? 'blur-md' : 'group-hover:scale-105'}`}
          />
          
          {/* Overlaid Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isOutOfStock && (
              <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Out of Stock
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Only {stock} left
              </span>
            )}
            {discountPct > 0 && !isOutOfStock && !isLocked && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                -{discountPct}%
              </span>
            )}
            {isPremiumOnly && (
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">
                Premium
              </span>
            )}
          </div>

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="font-bold text-gray-900">Premium Members Only</p>
              <Link href="/subscription"
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                Upgrade to Access
              </Link>
            </div>
          )}

          {/* Zoom hint */}
          {!isLocked && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0M10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Click to zoom
            </div>
          )}

          {/* Image count badge */}
          {images.length > 1 && !isLocked && (
            <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-lg">
              {selectedIdx + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedIdx === idx
                    ? 'border-indigo-500 shadow-md scale-105'
                    : 'border-gray-100 hover:border-gray-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => { setLightboxOpen(false); setZoomed(false); }}
        >
          {/* Close button */}
          <button
            onClick={() => { setLightboxOpen(false); setZoomed(false); }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Keyboard hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs">
            {images.length > 1 && '← → to navigate · '}Esc to close · Click to zoom
          </div>

          {/* Navigation prev */}
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setSelectedIdx(i => (i - 1 + images.length) % images.length); setZoomed(false); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Navigation next */}
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setSelectedIdx(i => (i + 1) % images.length); setZoomed(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Main lightbox image with zoom */}
          <div
            className={`relative max-w-4xl max-h-[85vh] mx-16 ${zoomed ? 'cursor-zoom-out overflow-hidden' : 'cursor-zoom-in'}`}
            onClick={e => { e.stopPropagation(); setZoomed(z => !z); }}
            onMouseMove={zoomed ? handleMouseMove : undefined}
          >
            <img
              src={mainImage}
              alt={`${productName} - zoomed`}
              className={`max-w-full max-h-[85vh] object-contain rounded-lg select-none transition-transform duration-200 ${
                zoomed ? 'scale-[2.5]' : 'scale-100'
              }`}
              style={zoomed ? {
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              } : undefined}
              draggable={false}
            />
          </div>

          {/* Thumbnail strip in lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={e => { e.stopPropagation(); setSelectedIdx(idx); setZoomed(false); }}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIdx === idx ? 'border-white' : 'border-white/30 opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}