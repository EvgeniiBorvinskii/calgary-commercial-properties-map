'use client';

import { useState } from 'react';
import { Target, X } from 'lucide-react';

export interface RadiusSearchResult {
  center: [number, number];
  radiusKm: number;
  properties: Array<{
    id: string;
    name: string;
    type: string;
    distance: number;
  }>;
  stats: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

interface RadiusSearchProps {
  onSearch: (center: [number, number], radiusKm: number) => void;
  isActive: boolean;
  onToggle: () => void;
  result: RadiusSearchResult | null;
}

export default function RadiusSearch({
  onSearch,
  isActive,
  onToggle,
  result,
}: RadiusSearchProps) {
  const [radiusKm, setRadiusKm] = useState(1);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xl text-gray-900 dark:text-white">Radius Search</h3>
        <button onClick={onToggle} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <X size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Click on the map to search properties within a radius
      </p>

      <div className="mb-6">
        <label className="block font-medium text-sm mb-3 text-gray-900 dark:text-white">
          Radius: {radiusKm} km
        </label>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-calgary-blue"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>0.5 km</span>
          <span>10 km</span>
        </div>
      </div>

      {result && (
        <div className="border-t dark:border-gray-700 pt-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="font-semibold text-lg text-gray-900 dark:text-white">{result.stats.total} properties found</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">within {result.radiusKm} km radius</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">By Type:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(result.stats.byType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{type}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">By Status:</h4>
            <div className="space-y-1">
              {Object.entries(result.stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{status.replace('_', ' ')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              const csv = [
                ['Name', 'Type', 'Distance (km)'],
                ...result.properties.map((p) => [
                  p.name,
                  p.type,
                  p.distance.toFixed(2),
                ]),
              ]
                .map((row) => row.join(','))
                .join('\n');

              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `radius-search-${radiusKm}km.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Export Results (CSV)
          </button>
        </div>
      )}
    </div>
  );
}
