'use client';

import { useState, useEffect } from 'react';
import { PropertyMarker } from '@/types/property';

interface FilterPanelProps {
  properties: PropertyMarker[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  businessType: string;
  status: string;
  community: string;
}

export default function FilterPanel({ properties, onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    businessType: '',
    status: '',
    community: '',
  });
  const [isOpen, setIsOpen] = useState(false);

  // Extract unique values
  const businessTypes = Array.from(new Set(properties.map(p => p.type))).sort();
  const communities = Array.from(
    new Set(properties.map(p => p.community).filter(Boolean) as string[])
  ).sort();
  const statuses: Array<{ value: FilterState['status']; label: string }> = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending Renewal' },
    { value: 'in_progress', label: 'In Progress' },
  ];

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      businessType: '',
      status: '',
      community: '',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-semibold text-gray-900">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-calgary-blue text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 animate-slide-up">
          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type
            </label>
            <select
              value={filters.businessType}
              onChange={e => handleFilterChange('businessType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-calgary-blue focus:border-transparent"
            >
              <option value="">All Types</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-calgary-blue focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {statuses.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Community */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Community</label>
            <select
              value={filters.community}
              onChange={e => handleFilterChange('community', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-calgary-blue focus:border-transparent"
            >
              <option value="">All Communities</option>
              {communities.map(community => (
                <option key={community} value={community}>
                  {community}
                </option>
              ))}
            </select>
          </div>

          {/* Clear button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-calgary-blue bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
