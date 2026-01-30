'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
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
            Calgary Commercial Properties
          </h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              Project Overview
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Calgary Commercial Properties is a real-time interactive mapping application that visualizes 
              over 21,000 business licenses from the City of Calgary Open Data portal. The platform provides 
              an intuitive interface for exploring commercial properties across Calgary.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              Key Features
            </h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Interactive Map:</strong> Explore 21,849 properties with clustering and smooth navigation</li>
              <li><strong>Smart Search:</strong> Find properties by name, address, type, or community</li>
              <li><strong>Advanced Filters:</strong> Filter by status, business type, community, and license expiry</li>
              <li><strong>Real-time Updates:</strong> Data synced with Calgary Open Data</li>
              <li><strong>Dark Mode:</strong> Eye-friendly dark theme with seamless switching</li>
              <li><strong>Mobile Optimized:</strong> Responsive design for all devices</li>
              <li><strong>Live Filtering:</strong> Instant results without clicking Apply</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              Technology Stack
            </h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong>Frontend:</strong> Next.js 14 (App Router), React 18, TypeScript</li>
              <li><strong>Styling:</strong> Tailwind CSS with dark mode support</li>
              <li><strong>Mapping:</strong> Mapbox GL JS with clustering</li>
              <li><strong>Data Source:</strong> City of Calgary Open Data API</li>
              <li><strong>Deployment:</strong> PM2 on VPS (5.249.160.54)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              Data & Licensing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              All business license data is sourced from the <a 
                href="https://data.calgary.ca/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-calgary-blue hover:underline"
              >
                City of Calgary Open Data portal
              </a>. The data includes business names, addresses, types, license status, 
              and expiry dates.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              License Status Explained
            </h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li><strong className="text-green-600 dark:text-green-400">Active:</strong> Business license is valid and current</li>
              <li><strong className="text-yellow-600 dark:text-yellow-400">Pending:</strong> License renewal in progress or awaiting approval</li>
              <li><strong className="text-blue-600 dark:text-blue-400">In Progress:</strong> Business relocation or closure in process</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              Usage Guide
            </h2>
            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Use the map to explore properties - click clusters to zoom in</li>
              <li>Click individual markers to view detailed property information</li>
              <li>Use Smart Search (magnifying glass icon) to find specific businesses</li>
              <li>Apply filters to narrow down results by type, status, community, or expiry date</li>
              <li>Toggle dark mode with the moon/sun icon for comfortable viewing</li>
            </ol>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              Performance Optimization
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The application uses several optimization techniques to handle 21,000+ properties:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Map clustering for efficient rendering of large datasets</li>
              <li>Lazy loading of components for faster initial page load</li>
              <li>GeoJSON source optimization for reduced payload size (2-3 MB)</li>
              <li>Server-side caching with 10-minute TTL</li>
              <li>Client-side filtering for instant results</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              Contact & Support
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions, feedback, or issues, please visit our{' '}
              <Link href="/changelog" className="text-calgary-blue hover:underline">
                changelog
              </Link>{' '}
              to see the latest updates and development progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
