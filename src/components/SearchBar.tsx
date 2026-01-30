'use client';

import { useState, useEffect, useMemo } from 'react';
import { PropertyMarker } from '@/types/property';

interface SearchBarProps {
  properties: PropertyMarker[];
  onSearch: (query: string) => void;
  onPropertySelect: (property: PropertyMarker | null) => void;
}

export default function SearchBar({
  properties,
  onSearch,
  onPropertySelect,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PropertyMarker[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter properties whenever query or properties change
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      onSearch('');
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = properties
      .filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.address.toLowerCase().includes(searchLower) ||
          p.type.toLowerCase().includes(searchLower) ||
          (p.community && p.community.toLowerCase().includes(searchLower))
      )
      .slice(0, 15);

    setSuggestions(filtered);
    onSearch(query);
    console.log('[SearchBar] Found', filtered.length, 'results for:', query);
  }, [query, properties]);

  const handleSelectSuggestion = (property: PropertyMarker) => {
    setQuery(property.name);
    setShowSuggestions(false);
    onPropertySelect(property);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search by name, address, or business type..."
          className="w-full px-4 py-3 pl-12 pr-4 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-calgary-blue focus:border-transparent shadow-sm transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              onSearch('');
              onPropertySelect(null);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {suggestions.map(property => (
            <div
              key={property.id}
              onClick={() => handleSelectSuggestion(property)}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white text-sm">{property.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{property.address}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">{property.type}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    property.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : property.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {property.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
