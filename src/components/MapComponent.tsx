'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PropertyMarker } from '@/types/property';

interface MapComponentProps {
  properties: PropertyMarker[];
  onPropertySelect?: (property: PropertyMarker | null) => void;
  selectedProperty?: PropertyMarker | null;
  autoZoomOnSelect?: boolean;
}

// Calgary coordinates
const CALGARY_CENTER: [number, number] = [-114.0719, 51.0447];
const CALGARY_ZOOM = 11;

const SOURCE_ID = 'properties';
const LAYER_CLUSTERS = 'clusters';
const LAYER_CLUSTER_COUNT = 'cluster-count';
const LAYER_POINTS = 'unclustered-point';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function popupHtml(props: any): string {
  const statusRaw = String(props?.status ?? 'active').toLowerCase();
  const status = statusRaw === 'pending' || statusRaw === 'in_progress' ? statusRaw : 'active';
  const badgeClass =
    status === 'active'
      ? 'bg-green-100 text-green-800'
      : status === 'pending'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-blue-100 text-blue-800';

  const name = escapeHtml(String(props?.name ?? 'Unnamed Business'));
  const type = escapeHtml(String(props?.type ?? 'Business'));
  const subType = escapeHtml(String(props?.subType ?? ''));
  const address = escapeHtml(String(props?.address ?? ''));
  const community = escapeHtml(String(props?.community ?? ''));
  const id = escapeHtml(String(props?.id ?? ''));
  const issuedDate = props?.issuedDate ? new Date(props.issuedDate).toLocaleDateString() : '';

  return `
    <div class="p-4 min-w-[280px]">
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-bold text-lg text-gray-900 leading-tight pr-2">${name}</h3>
      </div>
      <div class="space-y-2">
        <div>
          <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${badgeClass}">
            ${escapeHtml(status.toUpperCase())}
          </span>
        </div>
        <div class="text-sm">
          <p class="text-gray-600 font-medium">${type}</p>
          ${subType ? `<p class="text-gray-500 text-xs">${subType}</p>` : ''}
        </div>
        <div class="text-sm text-gray-700">${address}</div>
        ${community ? `<div class="text-xs text-gray-600"><span class="font-semibold">Community:</span> ${community}</div>` : ''}
        <div class="text-xs text-gray-500 pt-2 border-t">
          ${id ? `<p>License: ${id}</p>` : ''}
          ${issuedDate ? `<p>Issued: ${escapeHtml(issuedDate)}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

export default function MapComponent({
  properties,
  onPropertySelect,
  selectedProperty,
  autoZoomOnSelect = false,
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: properties.map((p) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: p.coordinates,
        },
        properties: {
          id: p.id,
          name: p.name,
          type: p.type,
          subType: p.subType ?? '',
          address: p.address,
          status: p.status,
          issuedDate: p.issuedDate,
          expiryDate: p.expiryDate ?? '',
          community: p.community ?? '',
        },
      })),
    };
  }, [properties]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const container = mapContainer.current;
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    console.log('🗺️ MapComponent: Initializing...', {
      hasContainer: !!container,
      hasToken: !!mapboxToken,
      tokenPrefix: mapboxToken ? mapboxToken.substring(0, 15) + '...' : 'MISSING',
    });

    if (!mapboxToken) {
      console.error('❌ Mapbox token not found!');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      center: CALGARY_CENTER,
      zoom: CALGARY_ZOOM,
      attributionControl: false,
      logoPosition: 'bottom-right',
      maxZoom: 18,
      minZoom: 9,
      renderWorldCopies: false,
      refreshExpiredTiles: false,
    });

    mapRef.current = map;

    const resize = (reason: string) => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      console.log('🧭 Map container size', { reason, w, h });
      if (w > 0 && h > 0) map.resize();
    };

    const ro = new ResizeObserver(() => resize('ResizeObserver'));
    ro.observe(container);
    const onWindowResize = () => resize('window.resize');
    window.addEventListener('resize', onWindowResize);

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      setMapLoaded(true);
      resize('after-load');
    });

    map.on('error', (e) => {
      console.error('❌ Map error:', e);
    });

    setTimeout(() => resize('after-mount(0ms)'), 0);
    setTimeout(() => resize('after-mount(250ms)'), 250);
    setTimeout(() => resize('after-mount(750ms)'), 750);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWindowResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const existingSource = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(geojson as any);
      return;
    }

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: geojson as any,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

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

    map.addLayer({
      id: LAYER_POINTS,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'status'],
          'active',
          '#10b981',
          'pending',
          '#f59e0b',
          'in_progress',
          '#3b82f6',
          '#10b981',
        ],
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    });

    map.on('click', LAYER_CLUSTERS, (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_CLUSTERS] }) as any[];
      const feature = features[0];
      const clusterId = feature?.properties?.cluster_id;
      const source: any = map.getSource(SOURCE_ID);
      if (!source || clusterId == null) return;

      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;
        map.easeTo({ center: feature.geometry.coordinates, zoom });
      });
    });

    map.on('click', LAYER_POINTS, (e) => {
      const f = (e.features && e.features[0]) as any;
      if (!f) return;

      const coords = f.geometry.coordinates.slice();
      const props = f.properties || {};

      onPropertySelect?.({
        id: props.id,
        name: props.name,
        type: props.type,
        subType: props.subType,
        address: props.address,
        coordinates: coords,
        status: props.status,
        issuedDate: props.issuedDate,
        expiryDate: props.expiryDate,
        community: props.community,
        ward: '',
        postalCode: '',
      } as any);

      new mapboxgl.Popup({ offset: 15, closeButton: true, closeOnClick: true, maxWidth: '320px' })
        .setLngLat(coords)
        .setHTML(popupHtml(props))
        .addTo(map);
    });

    const setCursorPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const clearCursor = () => {
      map.getCanvas().style.cursor = '';
    };
    map.on('mouseenter', LAYER_CLUSTERS, setCursorPointer);
    map.on('mouseleave', LAYER_CLUSTERS, clearCursor);
    map.on('mouseenter', LAYER_POINTS, setCursorPointer);
    map.on('mouseleave', LAYER_POINTS, clearCursor);
  }, [geojson, mapLoaded, onPropertySelect]);

  useEffect(() => {
    if (!mapRef.current || !selectedProperty || !autoZoomOnSelect) return;
    mapRef.current.flyTo({
      center: selectedProperty.coordinates,
      zoom: 15,
      duration: 800,
    });
  }, [selectedProperty, autoZoomOnSelect]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 600 }}>
      <div ref={mapContainer} className="absolute inset-0 hw-accelerate" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calgary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading Calgary Map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
