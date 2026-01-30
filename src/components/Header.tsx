'use client';

import { useState } from 'react';
import { Moon, Sun, Search } from 'lucide-react';

interface HeaderProps {
  totalProperties: number;
  activeProperties: number;
  lastUpdated?: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSearch: () => void;
}

export default function Header({ totalProperties, activeProperties, lastUpdated, isDarkMode, onToggleDarkMode, onToggleSearch }: HeaderProps) {
  const numberFormatter = new Intl.NumberFormat('en-US');
  const lastUpdatedText = lastUpdated
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(lastUpdated))
    : null;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md transition-colors">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 md:gap-4">
            <CalgaryLogo />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 md:gap-6">
            <div className="text-right">
              <div className="text-lg md:text-2xl font-bold text-calgary-blue dark:text-blue-400 transition-colors">{numberFormatter.format(totalProperties)}</div>
              <div className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 uppercase transition-colors">Total</div>
            </div>
            {lastUpdatedText && (
              <>
                <div className="hidden lg:block w-px h-12 bg-gray-300 dark:bg-gray-600 transition-colors"></div>
                <div className="hidden lg:block text-right">
                  <div className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-1 transition-colors">Last Updated</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                    {lastUpdatedText} UTC
                  </div>
                </div>
              </>
            )}
            
            {/* Search Icon */}
            <div className="w-px h-8 md:h-12 bg-gray-300 dark:bg-gray-600 transition-colors"></div>
            <button
              onClick={onToggleSearch}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300" />
            </button>
            
            {/* Dark Mode Toggle */}
            <div className="w-px h-8 md:h-12 bg-gray-300 dark:bg-gray-600 transition-colors"></div>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function CalgaryLogo() {
  return (
    <div className="flex items-center">
      <svg className="h-12 w-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#D52B1E" />
        <path d="M30 35 L50 25 L70 35 L70 65 L50 75 L30 65 Z" fill="white" />
        <text x="50" y="55" fontSize="20" fontWeight="bold" fill="#D52B1E" textAnchor="middle">C</text>
      </svg>
    </div>
  );
}
