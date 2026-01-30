'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import PropertyDetailsPanel from '@/components/PropertyDetailsPanel';
import AdvancedFilters, { FilterState } from '@/components/AdvancedFilters';
import SearchBar from '@/components/SearchBar';
import type { PropertyMarker } from '@/types/property';

// Dynamic import for optimized map component
const MapComponentOptimized = dynamic(
  () => import('@/components/MapComponentOptimized'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-calgary-blue mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Optimized Map...</p>
          <p className="text-gray-500 text-sm mt-2">21k+ properties with lazy loading</p>
        </div>
      </div>
    ),
  }
);

export default function HomeOptimized() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    communities: [],
    types: [],
    statuses: [],
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [properties, setProperties] = useState<PropertyMarker[]>([]);
  // IMPORTANT: must be deterministic between server render and first client render
  // to avoid React hydration errors in production.
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLastUpdated(new Date().toISOString());
    
    // Load properties for search
    fetch('/api/properties')
      .then(res => res.json())
      .then(response => {
        if (response.success && Array.isArray(response.data)) {
          setProperties(response.data);
          console.log('[Search] Loaded', response.data.length, 'properties');
        }
      })
      .catch(err => console.error('Failed to load properties:', err));
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    console.log('[Filters applied]', newFilters);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Header */}
      <Header 
        totalProperties={21875} 
        activeProperties={21875} 
        lastUpdated={lastUpdated}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Map Container */}
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 80px)' }}>
          {/* Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <AdvancedFilters
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Map */}
          <MapComponentOptimized
            onPropertySelect={setSelectedPropertyId}
            selectedPropertyId={selectedPropertyId}
            filters={filters}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Property Details Panel */}
        {selectedPropertyId && (
          <PropertyDetailsPanel
            propertyId={selectedPropertyId}
            onClose={() => setSelectedPropertyId(null)}
          />
        )}

        {/* Smart Search Modal */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsSearchOpen(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">Smart Search</h3>
                  <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <SearchBar
                  properties={properties}
                  onSearch={(query) => console.log('Search:', query)}
                  onPropertySelect={(property) => {
                    if (property) {
                      setSelectedPropertyId(property.id);
                      setIsSearchOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
