'use client';

import { useMemo } from 'react';
import { PropertyMarker } from '@/types/property';

interface StatsCardProps {
  properties: PropertyMarker[];
}

export default function StatsCard({ properties }: StatsCardProps) {
  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);

  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter(p => p.status === 'active').length;
    const pending = properties.filter(p => p.status === 'pending').length;
    const inProgress = properties.filter(p => p.status === 'in_progress').length;
    
    const businessTypes = new Map<string, number>();
    properties.forEach(p => {
      businessTypes.set(p.type, (businessTypes.get(p.type) || 0) + 1);
    });
    
    const topTypes = Array.from(businessTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const communities = new Set(properties.map(p => p.community).filter(Boolean));
    
    return {
      total,
      active,
      pending,
      inProgress,
      topTypes,
      communitiesCount: communities.size,
    };
  }, [properties]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-calgary-blue to-blue-600 text-white">
        <h3 className="font-bold text-lg">📊 Statistics</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Status breakdown */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            License Status
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Active</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {numberFormatter.format(stats.active)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Pending Renewal</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {numberFormatter.format(stats.pending)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">In Progress</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {numberFormatter.format(stats.inProgress)}
              </span>
            </div>
          </div>
        </div>

        {/* Top business types */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Top Business Types
          </div>
          <div className="space-y-2">
            {stats.topTypes.map(([type, count], index) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate" title={type}>
                  {index + 1}. {type.length > 20 ? type.slice(0, 20) + '...' : type}
                </span>
                <span className="font-semibold text-gray-900 ml-2">
                  {numberFormatter.format(count)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Communities */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Communities</span>
            <span className="text-lg font-bold text-calgary-blue">
              {stats.communitiesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
