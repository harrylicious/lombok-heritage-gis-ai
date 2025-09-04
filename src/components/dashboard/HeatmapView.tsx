import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, MapPin, Eye, EyeOff } from 'lucide-react';
import { EnhancedDashboardService, HeatmapDataPoint } from '@/services/enhanced-dashboard.service';
import { Database } from '@/integrations/supabase/types';

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

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

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface HeatmapViewProps {
  className?: string;
}

const HeatmapView: React.FC<HeatmapViewProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const heatLayer = useRef<L.HeatLayer | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<SiteWithCategory | null>(null);

  // Lombok center coordinates
  const LOMBOK_CENTER: [number, number] = [-8.6500, 116.3241];

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: LOMBOK_CENTER,
      zoom: 9,
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

    // Initialize layers
    markersLayer.current = L.layerGroup().addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load heatmap data
  useEffect(() => {
    const loadHeatmapData = async () => {
      try {
        setIsLoading(true);
        const data = await EnhancedDashboardService.getHeatmapData();
        setHeatmapData(data);
      } catch (error) {
        console.error('Error loading heatmap data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHeatmapData();
  }, []);

  // Update heatmap and markers when data changes
  useEffect(() => {
    if (!map.current || heatmapData.length === 0) return;

    // Clear existing layers
    if (heatLayer.current) {
      map.current.removeLayer(heatLayer.current);
      heatLayer.current = null;
    }

    if (markersLayer.current) {
      markersLayer.current.removeLayer(markersLayer.current);
      markersLayer.current = L.layerGroup().addTo(map.current);
    }

    // Add heatmap layer
    if (showHeatmap) {
      const heatData: [number, number, number][] = heatmapData.map(point => [
        point.lat,
        point.lng,
        point.intensity
      ]);

      heatLayer.current = (L as typeof L & { heatLayer: typeof L.heatLayer }).heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.2: '#fbbf24', // yellow
          0.4: '#f59e0b', // amber
          0.6: '#d97706', // orange
          0.8: '#dc2626', // red
          1.0: '#991b1b'  // dark red
        }
      }).addTo(map.current);
    }

    // Add markers if enabled
    if (showMarkers && markersLayer.current) {
      heatmapData.forEach(point => {
        const marker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: 'heatmap-marker',
            html: `<div style="background-color: ${getMarkerColor(point.intensity)}; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })
        })
          .addTo(markersLayer.current!)
          .on('click', () => {
            setSelectedSite(point.site);
          });

        // Add popup
        const popupContent = `
          <div class="p-2 min-w-48">
            <h3 class="font-semibold text-sm">${point.site.name}</h3>
            <p class="text-xs text-muted-foreground">${point.site.local_name}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="px-1 py-0.5 text-xs rounded" style="background-color: ${point.site.category_color}20; color: ${point.site.category_color}">
                ${point.site.category_name}
              </span>
            </div>
            <div class="text-xs mt-1">
              Intensity: ${(point.intensity * 100).toFixed(0)}%
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });
    }

    // Fit map to show all data points
    if (heatmapData.length > 0) {
      const bounds = L.latLngBounds(
        heatmapData.map(point => [point.lat, point.lng])
      );
      map.current.fitBounds(bounds.pad(0.1));
    }
  }, [heatmapData, showHeatmap, showMarkers]);

  const getMarkerColor = (intensity: number): string => {
    if (intensity >= 0.8) return '#dc2626'; // red
    if (intensity >= 0.6) return '#d97706'; // orange
    if (intensity >= 0.4) return '#f59e0b'; // amber
    return '#fbbf24'; // yellow
  };

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const toggleMarkers = () => {
    setShowMarkers(!showMarkers);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Cultural Heritage Density</CardTitle>
            <p className="text-sm text-muted-foreground">
              Heatmap showing concentration of cultural sites across Lombok
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showHeatmap ? "default" : "outline"}
              size="sm"
              onClick={toggleHeatmap}
              className="flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              Heatmap
            </Button>
            <Button
              variant={showMarkers ? "default" : "outline"}
              size="sm"
              onClick={toggleMarkers}
              className="flex items-center gap-2"
            >
              {showMarkers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Markers
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            ref={mapContainer}
            className="h-96 w-full rounded-lg overflow-hidden shadow-sm"
            style={{ minHeight: '400px' }}
          />

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading heatmap data...</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-sm">
            <h4 className="font-semibold text-sm mb-2">Intensity</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[#fbbf24]"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[#d97706]"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
                <span>Very High</span>
              </div>
            </div>
          </div>

          {/* Selected Site Info */}
          {selectedSite && (
            <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedSite.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedSite.local_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" style={{ backgroundColor: `${selectedSite.category_color}20`, color: selectedSite.category_color }}>
                      {selectedSite.category_name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Significance: {selectedSite.cultural_significance_score}/10
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSite(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapView;