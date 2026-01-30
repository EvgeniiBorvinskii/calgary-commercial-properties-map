'use client';

import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ChangelogPage() {
  const changelog = [
    {
      version: "2.0.0",
      date: "2026-01-22",
      title: "Major Feature Update",
      changes: [
        "Added live filtering - filters now apply instantly without clicking Apply",
        "Added license expiry filter - find businesses with licenses expiring soon",
        "Expanded business type filters to include all categories from Calgary Open Data",
        "Created documentation page at /docs",
        "Created changelog page at /changelog",
        "Improved filter UX with real-time updates",
      ]
    },
    {
      version: "1.5.0",
      date: "2026-01-21",
      title: "Search & UI Improvements",
      changes: [
        "Fixed smart search - now loads all 21,849 properties and searches by name, address, type, and community",
        "Replaced logo with simple SVG Calgary icon",
        "Removed Active licenses stat from header for cleaner mobile view",
        "Smart search now shows up to 15 results with live suggestions",
        "Added console logging for search debugging",
        "Fixed property data loading from API",
      ]
    },
    {
      version: "1.4.0",
      date: "2026-01-21",
      title: "Mobile Optimization",
      changes: [
        "Optimized header for mobile devices - responsive text and spacing",
        "Hid subtitle and Last Updated on small screens",
        "Made stats compact on mobile (smaller text, hidden labels)",
        "Added search icon to header with modal popup",
        "Returned smart search feature with dark mode support",
        "Removed stats badge from map (properties loaded indicator)",
      ]
    },
    {
      version: "1.3.0",
      date: "2026-01-21",
      title: "Dark Mode & Filters",
      changes: [
        "Implemented full dark mode support across all components",
        "Added theme toggle button (moon/sun icon) in header",
        "Dark mode persists in localStorage",
        "Map switches between light-v11 and dark-v11 styles",
        "Fixed filters to actually work - now filters source data, not just display",
        "Fixed markers disappearing on load - proper theme change detection",
        "Made light theme default for all users",
      ]
    },
    {
      version: "1.2.0",
      date: "2026-01-20",
      title: "Filter System Implementation",
      changes: [
        "Added AdvancedFilters component with status, type, and community filters",
        "Filters load real data from /api/properties/light",
        "Fixed filter application to update map source data correctly",
        "Added currentDataRef to preserve filtered state during theme changes",
        "Removed RadiusSearch to simplify UI",
      ]
    },
    {
      version: "1.1.0",
      date: "2026-01-19",
      title: "Map Stability Fixes",
      changes: [
        "Fixed map visibility issues - markers now appear on initial load",
        "Implemented aggressive resize retry (100ms, 300ms, 500ms, 1000ms intervals)",
        "Fixed marker click crash - added optional chaining for coordinates",
        "Resolved React hydration errors (#418, #423, #425)",
        "Added diagnostic logging for map initialization",
      ]
    },
    {
      version: "1.0.0",
      date: "2026-01-18",
      title: "Initial Release",
      changes: [
        "Launched Calgary Commercial Properties mapping application",
        "Integrated with City of Calgary Open Data API",
        "Implemented Mapbox GL clustering for 21,849 properties",
        "Added property details panel with full information",
        "Created optimized map component with lazy loading",
        "Deployed to production server (5.249.160.54) with PM2",
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-calgary-blue hover:text-blue-700 dark:text-blue-400 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Changelog
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Development history and feature updates for Calgary Commercial Properties
          </p>

          <div className="space-y-8">
            {changelog.map((release) => (
              <div key={release.version} className="border-l-4 border-calgary-blue pl-6 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-block bg-calgary-blue text-white px-3 py-1 rounded-full text-sm font-semibold">
                    v{release.version}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {release.date}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {release.title}
                </h2>
                <ul className="space-y-2">
                  {release.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-green-500 dark:text-green-400 mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
