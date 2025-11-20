import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface HeatmapPoint {
  zip: string;
  count: number;
  coordinates: [number, number];
  intensity: number;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    coordinates: [number, number];
    title: string;
    address?: string;
    capacity?: string;
    programType?: string;
    installDate?: string;
    id?: string;
    color?: string;
    source?: 'existing' | 'api' | 'target';
  }>;
  heatmapData?: HeatmapPoint[];
  showLegend?: boolean;
  className?: string;
  onMarkerClick?: (id: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => void;
  enableDynamicLoading?: boolean;
  isLoadingMapData?: boolean;
}

const Map = ({ center = [-97.7431, 30.2672], zoom = 10, markers = [], heatmapData = [], className = "", showLegend = false, onMarkerClick, onBoundsChange, enableDynamicLoading = false, isLoadingMapData = false }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = (window as any).MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Attach/detach bounds change listener without recreating the map
  useEffect(() => {
    if (!map.current) return;

    const handleBoundsChange = () => {
      if (!map.current) return;
      const bounds = map.current.getBounds();
      const currentZoom = map.current.getZoom();
      
      // Only trigger if zoomed in enough (zoom > 11)
      if (currentZoom > 11 && enableDynamicLoading && onBoundsChange) {
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          zoom: currentZoom
        });
      }
    };

    if (enableDynamicLoading && onBoundsChange) {
      map.current.on('moveend', handleBoundsChange);
    }

    return () => {
      if (map.current) {
        map.current.off('moveend', handleBoundsChange);
      }
    };
  }, [enableDynamicLoading, onBoundsChange]);

  // Handle heatmap rendering
  useEffect(() => {
    if (!map.current || !heatmapData || heatmapData.length === 0) return;

    const addHeatmapLayers = () => {
      if (!map.current) return;

      // Remove existing layers if they exist
      if (map.current.getLayer('solar-labels')) map.current.removeLayer('solar-labels');
      if (map.current.getLayer('solar-circles')) map.current.removeLayer('solar-circles');
      if (map.current.getLayer('solar-heatmap')) map.current.removeLayer('solar-heatmap');
      if (map.current.getSource('solar-permits')) map.current.removeSource('solar-permits');

      // Create GeoJSON for heatmap
      const geojson: any = {
        type: 'FeatureCollection',
        features: heatmapData.map(point => ({
          type: 'Feature',
          properties: {
            zip: point.zip,
            count: point.count,
            intensity: point.intensity
          },
          geometry: {
            type: 'Point',
            coordinates: point.coordinates
          }
        }))
      };

      console.log('Adding heatmap with', heatmapData.length, 'points');

      // Add source
      map.current.addSource('solar-permits', {
        type: 'geojson',
        data: geojson
      });

      // Add heatmap layer
      map.current.addLayer({
        id: 'solar-heatmap',
        type: 'heatmap',
        source: 'solar-permits',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            0, 0,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 20
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            14, 0
          ]
        }
      });

      // Add circle layer for higher zoom levels
      map.current.addLayer({
        id: 'solar-circles',
        type: 'circle',
        source: 'solar-permits',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            1, 4,
            100, 20
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            1, 'rgb(103,169,207)',
            50, 'rgb(239,138,98)',
            100, 'rgb(178,24,43)'
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0,
            14, 0.8
          ]
        }
      });

      // Add labels for ZIP codes
      map.current.addLayer({
        id: 'solar-labels',
        type: 'symbol',
        source: 'solar-permits',
        layout: {
          'text-field': ['concat', ['get', 'zip'], '\n', ['to-string', ['get', 'count']], ' permits'],
          'text-size': 11,
          'text-offset': [0, 0.5]
        },
        paint: {
          'text-color': '#000',
          'text-halo-color': '#fff',
          'text-halo-width': 2,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            12, 1
          ]
        }
      });

      // Add click event for info
      map.current.on('click', 'solar-circles', (e) => {
        if (!e.features || !e.features[0] || !map.current) return;
        const props = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 12px;">
              <strong style="font-size: 14px;">ZIP ${props?.zip}</strong><br/>
              <span style="font-size: 13px; color: #666;">${props?.count} solar permits</span>
            </div>
          `)
          .addTo(map.current);
      });

      map.current.on('mouseenter', 'solar-circles', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'solar-circles', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    };

    // Check if map is already loaded
    if (map.current.loaded()) {
      addHeatmapLayers();
    } else {
      map.current.on('load', addHeatmapLayers);
    }
  }, [heatmapData]);

  // Handle marker rendering
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    if (!map.current) return;

    const renderMarkers = () => {
      if (!map.current) return;
      console.log('Rendering markers on map:', markers.length);

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers
      markers.forEach(({ coordinates, title, address, capacity, programType, installDate, id, color = '#22c55e' }) => {
        // Container element (Mapbox positions this element via CSS transform)
        const el = document.createElement('div');
        el.className = 'marker-container';
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.cursor = 'pointer';

        // Inner dot (we scale this so we don't override Mapbox's translate transform)
        const dot = document.createElement('div');
        dot.className = 'marker';
        dot.style.backgroundColor = color;
        // Make target property marker larger
        const isTargetProperty = id === 'target-property';
        const markerSize = isTargetProperty ? '18px' : '14px';
        dot.style.width = markerSize;
        dot.style.height = markerSize;
        dot.style.borderRadius = '50%';
        dot.style.border = isTargetProperty ? '3px solid white' : '2px solid white';
        dot.style.boxShadow = isTargetProperty ? '0 3px 8px rgba(239,68,68,0.5)' : '0 2px 4px rgba(0,0,0,0.3)';
        dot.style.transition = 'transform 0.2s';
        el.appendChild(dot);
        
        el.addEventListener('mouseenter', () => {
          dot.style.transform = 'scale(1.3)';
          el.style.zIndex = '1000';
        });
        
        el.addEventListener('mouseleave', () => {
          dot.style.transform = 'scale(1)';
          el.style.zIndex = 'auto';
        });

        // Prefer meaningful titles and avoid generic numbered labels
        const computedTitle =
          (title && !/^Solar Installation\b/i.test(title) ? title : '') ||
          address ||
          (programType ? `${programType}${capacity ? ` • ${capacity}` : ''}` : '') ||
          (capacity ? `Installed Capacity: ${capacity}` : 'Installation');

        const popupContent = `
          <div style="padding: 12px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="font-weight: 700; margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a;">${computedTitle}</h3>
            ${address && computedTitle !== address ? `
              <div style="display: flex; align-items: start; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top: 2px; flex-shrink: 0; color: #666;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.4;">${address}</p>
              </div>
            ` : ''}
            ${capacity ? `
              <div style="display: flex; align-items: center; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; color: #666;">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666;"><strong>Capacity:</strong> ${capacity}</p>
              </div>
            ` : ''}
            ${programType ? `
              <div style="display: flex; align-items: center; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; color: #666;">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666;">${programType}</p>
              </div>
            ` : ''}
            ${installDate ? `
              <div style="display: flex; align-items: center; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; color: #666;">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666;"><strong>Date:</strong> ${new Date(installDate).toLocaleDateString()}</p>
              </div>
            ` : ''}
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          maxWidth: '350px'
        }).setHTML(popupContent);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    };

    // Ensure markers render after map loads
    if (map.current.loaded()) {
      renderMarkers();
    } else {
      const onLoad = () => renderMarkers();
      map.current.once('load', onLoad);
    }

    // Listen for custom marker click events
    const handleMarkerClick = (e: any) => {
      if (onMarkerClick) {
        onMarkerClick(e.detail);
      }
    };

    window.addEventListener('marker-click', handleMarkerClick);

    return () => {
      window.removeEventListener('marker-click', handleMarkerClick);
    };
  }, [markers, onMarkerClick]);

  // Auto-fit bounds to markers (disabled when dynamic loading is enabled)
  useEffect(() => {
    if (!map.current || !markers || markers.length === 0 || enableDynamicLoading) return;

    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(({ coordinates }) => bounds.extend(coordinates));
      map.current.fitBounds(bounds, { padding: 50 });
    } else if (markers.length === 1) {
      map.current.flyTo({ center: markers[0].coordinates, zoom: 14 });
    }
  }, [markers, enableDynamicLoading]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      {isLoadingMapData && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm font-medium">Loading installations...</span>
          </div>
        </div>
      )}
      {showLegend && markers.length > 0 && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10 border border-border">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Map Legend</h3>
          <div className="space-y-2">
            {markers.some(m => m.source === 'existing' || m.color === '#22c55e') && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Existing Installations</span>
              </div>
            )}
            {markers.some(m => m.source === 'api' || m.color === '#f59e0b') && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Pending Permits (last 180 days)</span>
              </div>
            )}
            {markers.some(m => m.source === 'target' || m.id === 'target-property') && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Your Property</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
