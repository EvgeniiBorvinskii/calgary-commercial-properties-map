'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PropertyLightGeoJSON } from '@/types/property-light';
import { PropertyHeavy } from '@/types/property-heavy';
import { propertyDetailsCache } from '@/lib/property-cache';
import { FilterState } from '@/components/AdvancedFilters';

interface MapComponentOptimizedProps {
  onPropertySelect?: (propertyId: string | null) => void;
  selectedPropertyId?: string | null;
  filters?: FilterState;
  isDarkMode?: boolean;
}

const CALGARY_CENTER: [number, number] = [-114.0719, 51.0447];
const CALGARY_ZOOM = 11;

const SOURCE_ID = 'properties-light';
const LAYER_CLUSTERS = 'clusters';
const LAYER_CLUSTER_COUNT = 'cluster-count';
const LAYER_POINTS = 'unclustered-point';

export default function MapComponentOptimized({
  onPropertySelect,
  selectedPropertyId,
  filters,
  isDarkMode,
}: MapComponentOptimizedProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const errorHandledRef = useRef(false);
  const loadTimeoutRef = useRef<number | null>(null);
  const isLoadingRef = useRef(true);
  const mapLoadedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const originalDataRef = useRef<PropertyLightGeoJSON | null>(null);
  const currentDataRef = useRef<PropertyLightGeoJSON | null>(null);
  const prevThemeRef = useRef<boolean | undefined>(isDarkMode);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapWarning, setMapWarning] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  const addDiagnostic = useCallback((msg: string) => {
    console.log('[Map Diagnostic]', msg);
    setDiagnostics(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)}: ${msg}`]);
  }, []);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    mapLoadedRef.current = mapLoaded;
  }, [mapLoaded]);

  // Lazy load property details
  const loadPropertyDetails = useCallback(async (propertyId: string): Promise<PropertyHeavy | null> => {
    // Проверяем кэш
    const cached = propertyDetailsCache.get(propertyId);
    if (cached) {
      console.log('[Map] Using cached details for', propertyId);
      return cached;
    }

    // Загружаем с сервера
    try {
      console.log('[Map] Fetching details for', propertyId);
      const response = await fetch(`/api/properties/${propertyId}/details`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Сохраняем в кэш
        propertyDetailsCache.set(propertyId, result.data);
        return result.data;
      }

      return null;
    } catch (err) {
      console.error('[Map] Failed to load property details:', err);
      return null;
    }
  }, []);

  // Show popup with property details
  const showPropertyPopup = useCallback(async (
    propertyId: string,
    coordinates: [number, number],
    basicInfo: { name: string; type: string; status: string }
  ) => {
    try {
      if (!mapRef.current) return;

      // Показываем базовый popup сразу
      const loadingPopup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '320px',
        offset: 15
      })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2">${basicInfo.name}</h3>
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 rounded mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        `)
        .addTo(mapRef.current);

      popupRef.current = loadingPopup;

    // Загружаем детали
    const details = await loadPropertyDetails(propertyId);

    if (details && popupRef.current === loadingPopup) {
      const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
      };

      const html = `
        <div class="p-4 min-w-[280px]">
          <h3 class="font-bold text-lg mb-2">${details.fullDetails.name}</h3>
          <div class="space-y-2">
            <div>
              <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${statusColors[details.fullDetails.status] || 'bg-gray-100'}">
                ${details.fullDetails.status.toUpperCase()}
              </span>
            </div>
            <div class="text-sm">
              <p class="text-gray-600 font-medium">${details.fullDetails.type}</p>
              ${details.fullDetails.subType ? `<p class="text-gray-500 text-xs">${details.fullDetails.subType}</p>` : ''}
            </div>
            <div class="text-sm text-gray-700">${details.fullDetails.address}</div>
            <div class="text-xs text-gray-600">
              <p><span class="font-semibold">Community:</span> ${details.fullDetails.community}</p>
            </div>
            <div class="text-xs text-gray-500 pt-2 border-t">
              <p>Issued: ${new Date(details.fullDetails.issuedDate).toLocaleDateString()}</p>
              ${details.fullDetails.expiryDate ? `<p>Expires: ${new Date(details.fullDetails.expiryDate).toLocaleDateString()}</p>` : ''}
            </div>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('property-details-click', { detail: '${propertyId}' }))"
              class="w-full mt-2 px-3 py-2 bg-calgary-blue text-white text-sm font-semibold rounded hover:bg-blue-700 transition"
            >
              View Full Details →
            </button>
          </div>
        </div>
      `;

      loadingPopup.setHTML(html);
    }
  } catch (err) {
    console.error('[Map] Error showing popup:', err);
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }
  }, [loadPropertyDetails]);

  // Initialize map
  useEffect(() => {
    addDiagnostic('Component mounted, starting map init...');
    
    if (!mapContainer.current) {
      addDiagnostic('ERROR: mapContainer ref is null');
      return;
    }
    
    if (mapRef.current) {
      addDiagnostic('Map already exists, skipping init');
      return;
    }

    const handleFatalError = (message: string) => {
      if (errorHandledRef.current) return;
      errorHandledRef.current = true;
      console.error('[Map] Fatal error:', message);
      setError(message);
      setIsLoading(false);
    };

    addDiagnostic('Checking WebGL support...');
    if (!mapboxgl.supported()) {
      addDiagnostic('ERROR: WebGL not supported');
      setError('WebGL is not supported in this browser/device. The map cannot be displayed.');
      setIsLoading(false);
      return;
    }
    addDiagnostic('WebGL is supported ✓');

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      addDiagnostic('ERROR: Mapbox token not found in env');
      setError('Mapbox token not configured');
      setIsLoading(false);
      return;
    }
    addDiagnostic(`Mapbox token found: ${mapboxToken.slice(0, 8)}...`);

    addDiagnostic('Creating Mapbox GL Map instance...');

    mapboxgl.accessToken = mapboxToken;

    let map: mapboxgl.Map;
    try {
      addDiagnostic('Calling new mapboxgl.Map()...');
      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
        center: CALGARY_CENTER,
        zoom: CALGARY_ZOOM,
        maxZoom: 18,
        minZoom: 9,
      });
      addDiagnostic('Map instance created successfully ✓');
    } catch (err: any) {
      addDiagnostic(`ERROR creating map: ${err.message || err}`);
      handleFatalError(`Failed to create map: ${err.message || err}`);
      return;
    }

    mapRef.current = map;

    addDiagnostic('Adding map controls...');
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    addDiagnostic('Controls added ✓');

    // Mapbox can initialize while the container is still 0x0 (layout not finalized).
    // In that case the canvas stays blank until a manual resize.
    const containerEl = mapContainer.current;
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect();
      addDiagnostic(`Container size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      
      // If container has 0 height, aggressively retry resize
      if (rect.height === 0) {
        addDiagnostic('⚠️ Container has 0 height! Retrying resize...');
        const retryResize = () => {
          try {
            const newRect = containerEl.getBoundingClientRect();
            addDiagnostic(`Retry: Container size now ${Math.round(newRect.width)}x${Math.round(newRect.height)}`);
            map.resize();
            if (newRect.height > 0) {
              addDiagnostic('✅ Height fixed! Map resized.');
            }
          } catch {}
        };
        
        // Try multiple times with increasing delays
        setTimeout(retryResize, 100);
        setTimeout(retryResize, 300);
        setTimeout(retryResize, 500);
        setTimeout(retryResize, 1000);
      }
      
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(() => {
          try {
            map.resize();
          } catch {
            // ignore
          }
        });
        resizeObserverRef.current.observe(containerEl);
        addDiagnostic('ResizeObserver attached ✓');
      }
    }

    // One extra resize after mount/layout.
    window.setTimeout(() => {
      try {
        map.resize();
      } catch {
        // ignore
      }
    }, 0);

    const describeMapboxError = (raw: any) => {
      const status = typeof raw?.status === 'number' ? raw.status : undefined;
      const url = typeof raw?.url === 'string' ? raw.url : undefined;
      const message =
        (raw && typeof raw.message === 'string' && raw.message) ||
        (typeof raw === 'string' && raw) ||
        'Mapbox failed to load some resources.';
      return { status, url, message };
    };

    // If style/tiles fail (401/403/adblock/proxy), Mapbox emits "error" events.
    map.on('error', (e) => {
      const anyEvent = e as any;
      const raw = anyEvent?.error;

      const { status, url, message } = describeMapboxError(raw);
      const urlHint = url ? ` URL: ${url}` : '';

      // Always surface the warning so the page isn't "blank with no explanation".
      // Make it fatal only during initial load.
      const hint =
        ' If this persists, verify the Mapbox token is valid and not restricted (Allowed URLs should include https://calgary.ypilo.com) and that api.mapbox.com/tiles.mapbox.com are not blocked by adblock/proxy.';

      const statusHint = status ? ` (HTTP ${status})` : '';
      const full = `${message}${statusHint}.${urlHint}${hint}`;

      console.error('[Map] Mapbox error:', raw);
      setMapWarning(full);

      if (isLoadingRef.current) {
        handleFatalError(full);
      }
    });

    // Hard timeout so users don't see an endless spinner.
    loadTimeoutRef.current = window.setTimeout(() => {
      if (mapLoadedRef.current || errorHandledRef.current) return;
      handleFatalError(
        'Map is taking too long to load. This usually means Mapbox requests are blocked (adblock/CSP) or the token is invalid/restricted.'
      );
    }, 12000);

    map.on('load', async () => {
      addDiagnostic('🎉 map.on("load") fired! Style loaded.');
      console.log('[Map] Map loaded, fetching light GeoJSON...');

      try {
        map.resize();
        addDiagnostic('map.resize() called');
      } catch {
        // ignore
      }
      
      try {
        addDiagnostic('Fetching /api/properties/light...');
        const response = await fetch('/api/properties/light');
        
        if (!response.ok) {
          throw new Error(`Failed to load properties: HTTP ${response.status}`);
        }

        const geojson: PropertyLightGeoJSON = await response.json();
        addDiagnostic(`Loaded ${geojson.count} properties ✓`);
        
        // Store original data for filtering
        originalDataRef.current = geojson;
        currentDataRef.current = geojson;
        
        console.log('[Map] Loaded', geojson.count, 'properties');

        // Add source
        addDiagnostic('Adding GeoJSON source to map...');
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: geojson as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
        addDiagnostic('Source added ✓');

        // Clusters layer
        map.addLayer({
          id: LAYER_CLUSTERS,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#0066b3',
            'circle-radius': ['step', ['get', 'point_count'], 18, 100, 24, 750, 30],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Cluster count
        map.addLayer({
          id: LAYER_CLUSTER_COUNT,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: { 'text-color': '#ffffff' },
        });

        // Individual points
        map.addLayer({
          id: LAYER_POINTS,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'status'],
              'active', '#10b981',
              'pending', '#f59e0b',
              'in_progress', '#3b82f6',
              '#10b981'
            ],
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });

        // Click on cluster → zoom
        map.on('click', LAYER_CLUSTERS, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_CLUSTERS] });
          const feature = features[0] as any;
          const clusterId = feature?.properties?.cluster_id;
          const source: any = map.getSource(SOURCE_ID);
          
          if (!source || clusterId == null) return;

          source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            map.easeTo({ center: feature.geometry.coordinates, zoom });
          });
        });

        // Click on point → show popup
        map.on('click', LAYER_POINTS, (e) => {
          try {
            const feature = e.features?.[0];
            if (!feature) return;

            const props = feature.properties as any;
            const coords = (feature.geometry as any).coordinates.slice() as [number, number];

            showPropertyPopup(props.id, coords, {
              name: props.name,
              type: props.type,
              status: props.status
            });

            if (onPropertySelect) {
              onPropertySelect(props.id);
            }
          } catch (err) {
            console.error('[Map] Error handling point click:', err);
          }
        });

        // Cursor pointer on hover
        map.on('mouseenter', LAYER_CLUSTERS, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', LAYER_CLUSTERS, () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', LAYER_POINTS, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', LAYER_POINTS, () => {
          map.getCanvas().style.cursor = '';
        });

        addDiagnostic('✅ MAP FULLY LOADED AND READY');
        setMapLoaded(true);
        setIsLoading(false);
        if (loadTimeoutRef.current) {
          window.clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }

        // Detect "blank map" cases where style loads but tiles never do (blocked domains/adblock/proxy).
        // We wait a few seconds for tiles, otherwise show a visible warning.
        window.setTimeout(() => {
          try {
            if (mapRef.current && !mapRef.current.areTilesLoaded()) {
              setMapWarning(
                'Map tiles are not loading. This usually means Mapbox domains are blocked (adblock/corporate proxy) or the token is restricted. Please allow api.mapbox.com and tiles.mapbox.com.'
              );
            }
          } catch {
            // ignore
          }
        }, 6000);
        
      } catch (err: any) {
        addDiagnostic(`ERROR in map load handler: ${err.message || err}`);
        console.error('[Map] Error loading properties:', err);
        setError(err.message);
        setIsLoading(false);
        if (loadTimeoutRef.current) {
          window.clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
      }
    });

    addDiagnostic('map.on("load") listener registered. Waiting for style to load...');

    // Fallback: if map never loads after 10s, show diagnostic error.
    const fallbackTimeout = window.setTimeout(() => {
      if (!mapLoadedRef.current && !errorHandledRef.current) {
        addDiagnostic('⚠️ TIMEOUT: Map did not fire "load" event after 10s');
        handleFatalError(
          'Map initialization timed out. The Mapbox style or tiles may be blocked. Check browser console for details and ensure api.mapbox.com is accessible.'
        );
      }
    }, 10000);

    return () => {
      window.clearTimeout(fallbackTimeout);
      
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch {
          // ignore
        }
        resizeObserverRef.current = null;
      }

      addDiagnostic('Cleanup: removing map');
      map.remove();
      mapRef.current = null;
    };
  }, [showPropertyPopup, onPropertySelect, addDiagnostic]);

  // Apply filters to map by updating source data
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !originalDataRef.current) return;

    const map = mapRef.current;
    
    // Check if any filters are active
    const hasActiveFilters = 
      (filters?.statuses && filters.statuses.length > 0) ||
      (filters?.types && filters.types.length > 0) ||
      (filters?.communities && filters.communities.length > 0) ||
      (filters?.expiryFilter && filters.expiryFilter !== 'all');
    
    let filteredFeatures = originalDataRef.current.features;
    
    // Filter by status
    if (filters?.statuses && filters.statuses.length > 0) {
      filteredFeatures = filteredFeatures.filter(f => 
        filters.statuses.includes(f.properties.status)
      );
    }
    
    // Filter by type
    if (filters?.types && filters.types.length > 0) {
      filteredFeatures = filteredFeatures.filter(f =>
        filters.types.includes(f.properties.type)
      );
    }
    
    // Filter by community
    if (filters?.communities && filters.communities.length > 0) {
      filteredFeatures = filteredFeatures.filter(f =>
        filters.communities.includes(f.properties.community)
      );
    }
    
    // Filter by license expiry
    if (filters?.expiryFilter && filters.expiryFilter !== 'all') {
      const now = new Date();
      filteredFeatures = filteredFeatures.filter(f => {
        const expiryDate = f.properties.expiryDate;
        if (!expiryDate) return false;
        
        const expiry = new Date(expiryDate);
        const diffMs = expiry.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        switch (filters.expiryFilter) {
          case 'expired':
            return diffDays < 0;
          case 'week':
            return diffDays >= 0 && diffDays <= 7;
          case 'month':
            return diffDays >= 0 && diffDays <= 30;
          case 'quarter':
            return diffDays >= 0 && diffDays <= 90;
          case 'year':
            return diffDays >= 0 && diffDays <= 365;
          default:
            return true;
        }
      });
    }
    
    // Create filtered GeoJSON and update source
    const filteredGeoJSON: PropertyLightGeoJSON = {
      ...originalDataRef.current,
      features: filteredFeatures,
      count: filteredFeatures.length
    };
    
    // Store current filtered data
    currentDataRef.current = filteredGeoJSON;
    
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(filteredGeoJSON);
      console.log(`[Map] Filtered to ${filteredFeatures.length} of ${originalDataRef.current.features.length} properties`);
    }
  }, [filters, mapLoaded]);

  // Switch map theme when dark mode changes
  useEffect(() => {
    // Skip if theme hasn't changed
    if (prevThemeRef.current === isDarkMode) {
      return;
    }
    
    if (!mapRef.current || !mapLoaded || !currentDataRef.current) return;

    // Update previous theme
    prevThemeRef.current = isDarkMode;

    const map = mapRef.current;
    const newStyle = isDarkMode 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
    
    // When we call setStyle(), it removes all sources and layers
    // So we need to re-add them after the style loads
    const onStyleLoad = () => {
      console.log('[Map] Style loaded, re-adding sources and layers...');
      
      // Re-add source with current filtered data
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: currentDataRef.current as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
      }
      
      // Re-add layers
      if (!map.getLayer(LAYER_CLUSTERS)) {
        map.addLayer({
          id: LAYER_CLUSTERS,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#0066b3',
            'circle-radius': ['step', ['get', 'point_count'], 18, 100, 24, 750, 30],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
      
      if (!map.getLayer(LAYER_CLUSTER_COUNT)) {
        map.addLayer({
          id: LAYER_CLUSTER_COUNT,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: { 'text-color': '#ffffff' },
        });
      }
      
      if (!map.getLayer(LAYER_POINTS)) {
        map.addLayer({
          id: LAYER_POINTS,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'status'],
              'active', '#10b981',
              'pending', '#f59e0b',
              'in_progress', '#3b82f6',
              '#10b981'
            ],
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });
      }
      
      console.log('[Map] Theme switched to', isDarkMode ? 'dark' : 'light');
    };
    
    map.once('style.load', onStyleLoad);
    map.setStyle(newStyle);
  }, [isDarkMode, mapLoaded]);

  // Listen for property details panel open event
  useEffect(() => {
    const handleDetailsClick = (event: CustomEvent) => {
      const propertyId = event.detail;
      onPropertySelect?.(propertyId);
    };

    window.addEventListener('property-details-click' as any, handleDetailsClick);
    return () => {
      window.removeEventListener('property-details-click' as any, handleDetailsClick);
    };
  }, [onPropertySelect]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
          <div className="text-red-600 text-xl font-bold mb-4">⚠️ Error Loading Map</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full" />

      {mapWarning && !error && (
        <div className="absolute top-4 right-4 z-20 max-w-[520px] bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg shadow p-3">
          <div className="text-sm font-semibold">Map warning</div>
          <div className="text-xs mt-1 break-words">{mapWarning}</div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calgary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading Optimized Map...</p>
            <p className="text-gray-500 text-sm mt-2">Fetching 21k+ properties</p>
          </div>
        </div>
      )}
    </div>
  );
}
