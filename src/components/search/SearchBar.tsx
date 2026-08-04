'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Suggestion {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: { name: string } | string;
}

// ── localStorage helpers ──────────────────────────────────────────────
const STORAGE_KEY = 'eshop_recent_searches';
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const updated = [query, ...getRecent().filter(s => s !== query)].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function removeRecent(query: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(getRecent().filter(s => s !== query))
    );
  } catch {}
}

function clearRecent() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Component ─────────────────────────────────────────────────────────
interface Props {
  autoFocus?: boolean;
  placeholder?: string;
  onSearch?: () => void; // called after navigating (e.g. to close an overlay)
}

export default function SearchBar({
  autoFocus = false,
  placeholder = 'Search products...',
  onSearch,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [fetchingIdx, setFetchingIdx] = useState(0); // prevents stale responses

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus on mount if autoFocus
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Reload recent searches every time dropdown opens
  useEffect(() => {
    if (open) setRecentSearches(getRecent());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced suggestions fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const idx = fetchingIdx + 1;
    setFetchingIdx(idx);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/suggestions?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        // Only apply if this is still the latest request
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const navigate = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;
      saveRecent(trimmed);
      setOpen(false);
      setQuery('');
      setSuggestions([]);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      onSearch?.();
    },
    [router, onSearch]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate(query);
  };

  const handleRemoveRecent = (
    e: React.MouseEvent,
    search: string
  ) => {
    e.stopPropagation();
    removeRecent(search);
    setRecentSearches(getRecent());
  };

  const handleClearAll = () => {
    clearRecent();
    setRecentSearches([]);
  };

  const showRecent = open && !query.trim() && recentSearches.length > 0;
  const showSuggestions = open && query.trim().length >= 2;
  const showEmpty =
    showSuggestions && suggestions.length === 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 bg-gray-100 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-indigo-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (showRecent || showSuggestions || showEmpty) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

          {/* Recent searches */}
          {showRecent && (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Recent Searches
                </span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
              {recentSearches.map(search => (
                <button
                  key={search}
                  onClick={() => navigate(search)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 text-gray-300 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{search}</span>
                  </div>
                  <span
                    role="button"
                    onClick={e => handleRemoveRecent(e, search)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-gray-500 transition-all rounded"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <>
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Products
                </span>
              </div>
              {suggestions.map(product => {
                const catName =
                  typeof product.category === 'object' &&
                  product.category !== null
                    ? product.category.name
                    : '';
                return (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    onClick={() => {
                      saveRecent(query.trim());
                      setOpen(false);
                      setQuery('');
                      onSearch?.();
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      {catName && (
                        <p className="text-xs text-gray-400">{catName}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      ${product.price.toFixed(2)}
                    </span>
                  </Link>
                );
              })}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  saveRecent(query.trim());
                  setOpen(false);
                  setQuery('');
                  onSearch?.();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-semibold transition-colors border-t border-indigo-100"
              >
                See all results for &quot;{query.trim()}&quot;
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </>
          )}

          {/* No results */}
          {showEmpty && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-500">
                No results for &quot;{query}&quot;
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  navigate(query);
                }}
                className="mt-3 inline-block text-xs text-indigo-600 hover:underline font-medium"
              >
                Search anyway →
              </Link>
            </div>
          )}

          {/* Empty state when focused with no query and no history */}
          {open && !query.trim() && recentSearches.length === 0 && (
            <div className="px-4 py-6 text-center">
              <svg
                className="w-8 h-8 text-gray-200 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                />
              </svg>
              <p className="text-sm text-gray-400">
                Type to search products
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}