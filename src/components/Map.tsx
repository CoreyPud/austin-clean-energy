import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  }>;
  className?: string;
  onMarkerClick?: (id: string) => void;
}

const Map = ({ center = [-97.7431, 30.2672], zoom = 10, markers = [], className = "", onMarkerClick }: MapProps) => {
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
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ coordinates, title, address, capacity, programType, installDate, id, color = '#22c55e' }) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = color;
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';
      el.style.position = 'relative';
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.zIndex = '1000';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = 'auto';
      });

      const popupContent = `
        <div style="padding: 12px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="font-weight: 700; margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a;">${title}</h3>
          ${address ? `
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
          ${id && onMarkerClick ? `
            <button 
              onclick="window.dispatchEvent(new CustomEvent('marker-click', { detail: '${id}' }))"
              style="
                margin-top: 12px;
                width: 100%;
                padding: 8px 12px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
              "
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
            >
              View Full Details →
            </button>
          ` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        maxWidth: '350px'
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

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

    // Fit bounds to markers if there are multiple
    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(({ coordinates }) => bounds.extend(coordinates));
      map.current.fitBounds(bounds, { padding: 50 });
    } else if (markers.length === 1) {
      map.current.flyTo({ center: markers[0].coordinates, zoom: 14 });
    }
  }, [markers]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
    </div>
  );
};

export default Map;
