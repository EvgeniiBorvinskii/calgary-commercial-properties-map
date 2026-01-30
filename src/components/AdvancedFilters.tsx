'use client';

import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterState {
  communities: string[];
  types: string[];
  statuses: string[];
  expiryFilter?: 'all' | 'week' | 'month' | 'quarter' | 'year' | 'expired';
  dateFrom?: string;
  dateTo?: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function AdvancedFilters({
  onFilterChange,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    communities: [],
    types: [],
    statuses: [],
    expiryFilter: 'all',
  });
  const [availableCommunities, setAvailableCommunities] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const statuses = ['active', 'pending', 'in_progress'];

  // Load available filter options from API
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch('/api/properties/light');
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Extract unique communities and types
        const communities = new Set<string>();
        const types = new Set<string>();
        
        data.features.forEach((feature: any) => {
          const props = feature.properties;
          if (props.community) communities.add(props.community);
          if (props.type) types.add(props.type);
        });
        
        setAvailableCommunities(Array.from(communities).sort());
        setAvailableTypes(Array.from(types).sort());
      } catch (err) {
        console.error('[Filters] Failed to load options:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadOptions();
  }, []);

  // Live filtering - apply filters immediately when they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleReset = () => {
    const resetFilters: FilterState = {
      communities: [],
      types: [],
      statuses: [],
      expiryFilter: 'all',
    };
    setFilters(resetFilters);
  };

  const toggleArrayFilter = (
    key: 'communities' | 'types' | 'statuses',
    value: string
  ) => {
    setFilters((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const activeFilterCount =
    filters.communities.length +
    filters.types.length +
    filters.statuses.length +
    (filters.expiryFilter && filters.expiryFilter !== 'all' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"
      >
        <Filter size={20} />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold bg-calgary-blue dark:bg-blue-600 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Advanced Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {loading && (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading options...</div>
              )}
              
              {!loading && (
                <>
              {/* Status */}
              <div>
                <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Status</label>
                <div className="space-y-2">
                  {statuses.map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.statuses.includes(status)}
                        onChange={() => toggleArrayFilter('statuses', status)}
                        className="w-4 h-4 text-calgary-blue rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{status.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Business Type</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableTypes.slice(0, 20).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={() => toggleArrayFilter('types', type)}
                        className="w-4 h-4 text-calgary-blue rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Community */}
              <div>
                <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Community</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableCommunities.slice(0, 30).map((community) => (
                    <label key={community} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.communities.includes(community)}
                        onChange={() => toggleArrayFilter('communities', community)}
                        className="w-4 h-4 text-calgary-blue rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{community}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* License Expiry Filter */}
              <div>
                <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">
                  License Expiry
                </label>
                <select
                  value={filters.expiryFilter || 'all'}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, expiryFilter: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Licenses</option>
                  <option value="expired">Already Expired</option>
                  <option value="week">Expires within 1 Week</option>
                  <option value="month">Expires within 1 Month</option>
                  <option value="quarter">Expires within 3 Months</option>
                  <option value="year">Expires within 1 Year</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block font-semibold text-sm mb-2 text-gray-900 dark:text-white">Issue Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="To"
                  />
                </div>
              </div>
              </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
