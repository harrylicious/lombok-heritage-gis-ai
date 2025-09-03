import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, DollarSign } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface CulturalSite {
  id: string;
  name: string;
  local_name: string;
  description: string;
  latitude: number;
  longitude: number;
  category_name: string;
  category_color: string;
  preservation_status: string;
  cultural_significance_score: number;
  tourism_popularity_score: number;
  visiting_hours: string;
  entrance_fee: number;
  village: string;
  district: string;
}

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

interface MapViewProps {
  sites?: CulturalSite[];
  routes?: RouteWithSites[];
  selectedSite?: CulturalSite | null;
  onSiteSelect?: (site: CulturalSite) => void;
}

const MapView: React.FC<MapViewProps> = ({ sites = [], routes = [], selectedSite, onSiteSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const routeLayers = useRef<L.Polyline[]>([]);

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
        const marker = L.marker([site.latitude, site.longitude])
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
                <span>${site.village}, ${site.district}</span>
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

    // Fit map to show all markers and routes
    const allLayers = [...markers.current, ...routeLayers.current];
    if (allLayers.length > 0) {
      const group = L.featureGroup(allLayers);
      map.current.fitBounds(group.getBounds().pad(0.1));
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
      map.current.setView([selectedSite.latitude, selectedSite.longitude], 14);
    }
  }, [selectedSite]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapContainer} 
        className="h-full w-full rounded-lg overflow-hidden shadow-cultural"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map Legend */}
      <Card className="absolute top-4 right-4 p-4 bg-background/95 backdrop-blur-sm shadow-elegant">
        <h4 className="font-semibold text-sm mb-2">Warisan Budaya Sasak</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-heritage rounded-full"></div>
            <span>Situs Bersejarah</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            <span>Pusat Kerajinan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Rumah Tradisional</span>
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
                  <Star className="w-4 h-4 text-heritage fill-current" />
                  <span>{selectedSite.cultural_significance_score}/10</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{selectedSite.visiting_hours}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>{selectedSite.entrance_fee === 0 ? 'Gratis' : `Rp ${selectedSite.entrance_fee.toLocaleString()}`}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MapView;