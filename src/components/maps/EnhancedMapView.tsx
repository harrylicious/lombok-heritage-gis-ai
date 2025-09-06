import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers, Route as RouteIcon, Target } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';
import { SpatialAnalysisService, BufferZone, SpatialOverlay } from '@/services/spatial-analysis.service';
import { Database } from '@/integrations/supabase/types';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Declare HeatLayer type for leaflet.heat plugin
declare module 'leaflet' {
  interface HeatLayer extends Layer {
    setLatLngs(latlngs: [number, number, number][]): this;
    setOptions(options: HeatLayerOptions): this;
  }

  interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    gradient?: { [key: number]: string };
  }

  function heatLayer(latlngs: [number, number, number][], options?: HeatLayerOptions): HeatLayer;
}

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

interface RouteWithSites {
  id: string;
  name: string;
  route_coordinates: Json; // GeoJSON from Supabase
  route_sites: Array<{
    sites_with_categories: {
      id: string;
      name: string;
      local_name: string;
      latitude: number;
      longitude: number;
      category_name: string;
      category_color: string;
      cultural_significance_score: number;
    };
    sequence_order: number;
  }>;
}

interface EnhancedMapViewProps {
  sites?: SiteWithCategory[];
  routes?: RouteWithSites[];
  selectedSite?: SiteWithCategory | null;
  onSiteSelect?: (site: SiteWithCategory) => void;
  bufferZones?: BufferZone[];
  overlays?: SpatialOverlay[];
  generatedRoute?: [number, number][];
  className?: string;
}

const EnhancedMapView: React.FC<EnhancedMapViewProps> = ({
  sites = [],
  routes = [],
  selectedSite,
  onSiteSelect,
  bufferZones = [],
  overlays = [],
  generatedRoute = [],
  className
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const routeLayers = useRef<L.Polyline[]>([]);
  const bufferLayers = useRef<L.Circle[]>([]);
  const overlayLayers = useRef<L.LayerGroup[]>([]);
  const generatedRouteLayer = useRef<L.Polyline | null>(null);

  // Lombok center coordinates
  const LOMBOK_CENTER: [number, number] = [-8.6500, 116.3241];

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: LOMBOK_CENTER,
      zoom: 10,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map.current);

    // Add Lombok boundary highlight
    const lombokBounds = L.latLngBounds(
      [-8.2, 115.8], // Southwest
      [-9.1, 116.8]  // Northeast
    );

    L.rectangle(lombokBounds, {
      color: 'hsl(var(--heritage))',
      weight: 2,
      fillOpacity: 0.05,
      dashArray: '5, 5'
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update buffer zones
  useEffect(() => {
    if (!map.current) return;

    // Clear existing buffer layers
    bufferLayers.current.forEach(layer => {
      map.current?.removeLayer(layer);
    });
    bufferLayers.current = [];

    // Add new buffer zones
    bufferZones.forEach(zone => {
      const bufferLayer = L.circle(zone.center, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.2,
        weight: 2,
        radius: zone.radius
      }).addTo(map.current!);

      // Add popup to buffer zone
      bufferLayer.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold">${zone.siteName}</h3>
          <p class="text-sm text-muted-foreground">Buffer Zone: ${zone.radius}m radius</p>
        </div>
      `);

      bufferLayers.current.push(bufferLayer);
    });
  }, [bufferZones]);

  // Update overlays
  useEffect(() => {
    if (!map.current) return;

    // Clear existing overlay layers
    overlayLayers.current.forEach(layer => {
      map.current?.removeLayer(layer);
    });
    overlayLayers.current = [];

    // Add new overlays
    overlays.forEach(overlay => {
      if (!overlay.visible) return;

      const overlayGroup = L.layerGroup();

      // For now, add placeholder overlays
      // In production, this would parse actual GeoJSON data
      if (overlay.type === 'roads') {
        // Add road-like lines as placeholders
        const roadLine = L.polyline([
          [LOMBOK_CENTER[0] - 0.1, LOMBOK_CENTER[1] - 0.1],
          [LOMBOK_CENTER[0] + 0.1, LOMBOK_CENTER[1] + 0.1]
        ], {
          color: '#666',
          weight: 3,
          opacity: overlay.opacity
        });
        overlayGroup.addLayer(roadLine);
      } else if (overlay.type === 'rivers') {
        // Add river-like lines as placeholders
        const riverLine = L.polyline([
          [LOMBOK_CENTER[0] - 0.05, LOMBOK_CENTER[1] - 0.15],
          [LOMBOK_CENTER[0] + 0.05, LOMBOK_CENTER[1] + 0.15]
        ], {
          color: '#0066cc',
          weight: 4,
          opacity: overlay.opacity
        });
        overlayGroup.addLayer(riverLine);
      } else if (overlay.type === 'villages') {
        // Add village markers as placeholders
        const villageMarker = L.marker([LOMBOK_CENTER[0] + 0.02, LOMBOK_CENTER[1] + 0.02], {
          icon: L.divIcon({
            className: 'village-marker',
            html: '<div style="background-color: #8B4513; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
            iconSize: [8, 8],
            iconAnchor: [4, 4]
          })
        });
        overlayGroup.addLayer(villageMarker);
      }

      overlayGroup.addTo(map.current!);
      overlayLayers.current.push(overlayGroup);
    });
  }, [overlays]);

  // Update generated route
  useEffect(() => {
    if (!map.current) return;

    // Clear existing generated route
    if (generatedRouteLayer.current) {
      map.current.removeLayer(generatedRouteLayer.current);
      generatedRouteLayer.current = null;
    }

    // Add new generated route
    if (generatedRoute.length > 1) {
      generatedRouteLayer.current = L.polyline(generatedRoute, {
        color: '#ff6b35',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map.current);

      // Add numbered markers for route points
      generatedRoute.forEach((point, index) => {
        const marker = L.marker(point, {
          icon: L.divIcon({
            className: 'route-point-marker',
            html: `<div style="background-color: #ff6b35; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white;">${index + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map.current!);

        markers.current.push(marker);
      });
    }
  }, [generatedRoute]);

  // Update markers and routes when sites or routes change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => {
      map.current?.removeLayer(marker);
    });
    markers.current = [];

    // Clear existing route layers
    routeLayers.current.forEach(layer => {
      map.current?.removeLayer(layer);
    });
    routeLayers.current = [];

    // Add route visualizations first
    routes.forEach((route, routeIndex) => {
      const routeSites = route.route_sites?.sort((a, b) => a.sequence_order - b.sequence_order) || [];

      if (routeSites.length > 0) {
        let coordinates: [number, number][] = [];

        // Try to use stored route coordinates first, fallback to generating from sites
        if (route.route_coordinates && typeof route.route_coordinates === 'object') {
          const geoJson = route.route_coordinates as { type?: string; coordinates?: number[][] };
          if (geoJson.type === 'LineString' && geoJson.coordinates) {
            coordinates = geoJson.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
          }
        }

        // If no stored coordinates, generate from sites
        if (coordinates.length === 0) {
          coordinates = routeSites.map(rs => [
            rs.sites_with_categories.latitude,
            rs.sites_with_categories.longitude
          ] as [number, number]);
        }

        if (coordinates.length > 1) {
          const routeLine = L.polyline(coordinates, {
            color: `hsl(${routeIndex * 60}, 70%, 50%)`,
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10'
          }).addTo(map.current!);

          routeLayers.current.push(routeLine);
        }

        // Add numbered markers for route sites
        routeSites.forEach((routeSite, index) => {
          const site = routeSite.sites_with_categories;
          const marker = L.marker([site.latitude, site.longitude], {
            icon: L.divIcon({
              className: 'custom-route-marker',
              html: `<div style="background-color: hsl(${routeIndex * 60}, 70%, 50%); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white;">${index + 1}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          })
            .addTo(map.current!)
            .on('click', () => {
              onSiteSelect?.(site as SiteWithCategory);
            });

          // Create custom popup content
          const popupContent = `
            <div class="p-2 min-w-64">
              <h3 class="font-semibold text-lg text-foreground">${site.name}</h3>
              <p class="text-sm text-muted-foreground italic">${site.local_name}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="px-2 py-1 text-xs rounded-full" style="background-color: ${site.category_color}20; color: ${site.category_color}">
                  ${site.category_name}
                </span>
                <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  Stop ${index + 1}
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm">
                <div class="flex items-center gap-1">
                  <span class="text-heritage">★</span>
                  <span>${site.cultural_significance_score}/10</span>
                </div>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'cultural-popup'
          });

          markers.current.push(marker);
        });
      }
    });

    // Add markers for individual sites (not part of routes)
    sites.forEach(site => {
      // Check if this site is already marked as part of a route
      const isInRoute = routes.some(route =>
        route.route_sites?.some(rs => rs.sites_with_categories.id === site.id)
      );

      if (!isInRoute) {
        const marker = L.marker([site.latitude!, site.longitude!])
          .addTo(map.current!)
          .on('click', () => {
            onSiteSelect?.(site);
          });

        // Create custom popup content
        const popupContent = `
          <div class="p-2 min-w-64">
            <h3 class="font-semibold text-lg text-foreground">${site.name}</h3>
            <p class="text-sm text-muted-foreground italic">${site.local_name}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="px-2 py-1 text-xs rounded-full" style="background-color: ${site.category_color}20; color: ${site.category_color}">
                ${site.category_name}
              </span>
            </div>
            <div class="flex items-center gap-4 mt-2 text-sm">
              <div class="flex items-center gap-1">
                <span class="text-heritage">★</span>
                <span>${site.cultural_significance_score}/10</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-muted-foreground">📍</span>
                <span>${site.village || 'Unknown'}, ${site.district || 'Unknown'}</span>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'cultural-popup'
        });

        markers.current.push(marker);
      }
    });

    // Fit map to show all markers, routes, buffers, and overlays
    const boundsLayers: L.Layer[] = [];

    // Add markers (they have getLatLng)
    boundsLayers.push(...markers.current);

    // Add route layers (polylines have getBounds)
    boundsLayers.push(...routeLayers.current);

    // Add buffer layers (circles have getBounds)
    boundsLayers.push(...bufferLayers.current);

    // Add generated route (polyline has getBounds)
    if (generatedRouteLayer.current) {
      boundsLayers.push(generatedRouteLayer.current);
    }

    // For overlay layers, we need to get their individual components
    overlayLayers.current.forEach(layerGroup => {
      layerGroup.eachLayer(layer => {
        // Only add layers that have bounds (markers, polylines, etc.)
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) {
          boundsLayers.push(layer);
        }
      });
    });

    if (boundsLayers.length > 0) {
      try {
        const group = L.featureGroup(boundsLayers);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.current.fitBounds(bounds.pad(0.1));
        }
      } catch (error) {
        console.warn('Could not fit map bounds:', error);
        // Fallback to default view
        map.current.setView(LOMBOK_CENTER, 10);
      }
    }
  }, [sites, routes, onSiteSelect]);

  // Highlight selected site
  useEffect(() => {
    if (!selectedSite || !map.current) return;

    // Find and highlight the selected marker
    const selectedMarker = markers.current.find(marker => {
      const pos = marker.getLatLng();
      return pos.lat === selectedSite.latitude && pos.lng === selectedSite.longitude;
    });

    if (selectedMarker) {
      selectedMarker.openPopup();
      map.current.setView([selectedSite.latitude!, selectedSite.longitude!], 14);
    }
  }, [selectedSite]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        ref={mapContainer}
        className="h-full w-full rounded-lg overflow-hidden shadow-cultural"
        style={{ minHeight: '400px' }}
      />

      {/* Map Legend */}
      <Card className="absolute top-4 right-4 p-4 bg-background/95 backdrop-blur-sm shadow-elegant max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Spatial Analysis</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-heritage rounded-full"></div>
            <span>Cultural Sites</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary rounded-full bg-primary/20"></div>
            <span>Buffer Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-orange-500 border-dashed border-t-2"></div>
            <span>Generated Routes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Rivers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <span>Roads</span>
          </div>
        </div>
      </Card>

      {/* Selected Site Info */}
      {selectedSite && (
        <Card className="absolute bottom-4 left-4 right-4 p-4 bg-background/95 backdrop-blur-sm shadow-heritage">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{selectedSite.name}</h3>
              <p className="text-sm text-muted-foreground italic">{selectedSite.local_name}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary" style={{ backgroundColor: `${selectedSite.category_color}20`, color: selectedSite.category_color }}>
                  {selectedSite.category_name}
                </Badge>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedSite.cultural_significance_score}/10</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>{selectedSite.village}, {selectedSite.district}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedMapView;