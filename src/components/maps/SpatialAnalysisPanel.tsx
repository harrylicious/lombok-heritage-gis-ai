import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  Circle,
  Route,
  Layers,
  Settings,
  Target,
  Navigation
} from 'lucide-react';
import { SpatialAnalysisService, BufferZone, SpatialOverlay, RoutePoint } from '@/services/spatial-analysis.service';
import { CulturalSitesService } from '@/services/cultural-sites.service';
import { Database } from '@/integrations/supabase/types';

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

interface SpatialAnalysisPanelProps {
  sites: SiteWithCategory[];
  onBufferZonesChange?: (bufferZones: BufferZone[]) => void;
  onOverlaysChange?: (overlays: SpatialOverlay[]) => void;
  onRouteGenerated?: (route: [number, number][]) => void;
}

const SpatialAnalysisPanel: React.FC<SpatialAnalysisPanelProps> = ({
  sites,
  onBufferZonesChange,
  onOverlaysChange,
  onRouteGenerated
}) => {
  const [bufferRadius, setBufferRadius] = useState([500]); // meters
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [bufferZones, setBufferZones] = useState<BufferZone[]>([]);
  const [overlays, setOverlays] = useState<SpatialOverlay[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);

  // Initialize overlays
  useEffect(() => {
    const initOverlays = async () => {
      try {
        const defaultBounds: L.LatLngBounds = L.latLngBounds(
          [-8.2, 115.8], // Southwest
          [-9.1, 116.8]  // Northeast
        );

        const [roadsOverlay, riversOverlay, villagesOverlay] = await Promise.all([
          SpatialAnalysisService.getRoadsOverlay(defaultBounds),
          SpatialAnalysisService.getRiversOverlay(defaultBounds),
          SpatialAnalysisService.getVillagesOverlay(defaultBounds)
        ]);

        const initialOverlays = [roadsOverlay, riversOverlay, villagesOverlay];
        setOverlays(initialOverlays);
        onOverlaysChange?.(initialOverlays);
      } catch (error) {
        console.error('Error initializing overlays:', error);
      }
    };

    initOverlays();
  }, []);

  // Generate buffer zones when sites or radius changes
  useEffect(() => {
    if (selectedSites.length === 0) {
      setBufferZones([]);
      onBufferZonesChange?.([]);
      return;
    }

    const selectedSiteObjects = sites.filter(site => selectedSites.includes(site.id));
    const zones = SpatialAnalysisService.createBufferZones(selectedSiteObjects, bufferRadius[0]);
    setBufferZones(zones);
    onBufferZonesChange?.(zones);
  }, [selectedSites, bufferRadius, sites]);

  const handleSiteSelection = (siteId: string) => {
    setSelectedSites(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleOverlayToggle = (overlayId: string, visible: boolean) => {
    const updatedOverlays = overlays.map(overlay =>
      overlay.id === overlayId
        ? { ...overlay, visible }
        : overlay
    );
    setOverlays(updatedOverlays);
    onOverlaysChange?.(updatedOverlays);
  };

  const handleOverlayOpacityChange = (overlayId: string, opacity: number) => {
    const updatedOverlays = overlays.map(overlay =>
      overlay.id === overlayId
        ? { ...overlay, opacity }
        : overlay
    );
    setOverlays(updatedOverlays);
    onOverlaysChange?.(updatedOverlays);
  };

  const addToRoute = (site: SiteWithCategory) => {
    const routePoint: RoutePoint = {
      lat: site.latitude!,
      lng: site.longitude!,
      name: site.name || 'Unknown Site',
      description: site.local_name || ''
    };

    setRoutePoints(prev => {
      // Check if site is already in route
      if (prev.some(p => p.lat === routePoint.lat && p.lng === routePoint.lng)) {
        return prev.filter(p => !(p.lat === routePoint.lat && p.lng === routePoint.lng));
      }
      return [...prev, routePoint];
    });
  };

  const generateRoute = async () => {
    if (routePoints.length < 2) return;

    setIsGeneratingRoute(true);
    try {
      const route = SpatialAnalysisService.generateRoute(routePoints);
      onRouteGenerated?.(route);
    } catch (error) {
      console.error('Error generating route:', error);
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const clearRoute = () => {
    setRoutePoints([]);
    onRouteGenerated?.([]);
  };

  const clearBuffers = () => {
    setSelectedSites([]);
    setBufferZones([]);
    onBufferZonesChange?.([]);
  };

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" />
          Analisis Spasial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Buffer Analysis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            <Label className="font-medium">Buffer Analysis</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Radius: {bufferRadius[0]}m</Label>
            <Slider
              value={bufferRadius}
              onValueChange={setBufferRadius}
              max={2000}
              min={100}
              step={50}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Select Sites ({selectedSites.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {sites.slice(0, 10).map(site => (
                <div key={site.id} className="flex items-center space-x-2">
                  <Switch
                    checked={selectedSites.includes(site.id)}
                    onCheckedChange={() => handleSiteSelection(site.id)}
                  />
                  <Label className="text-xs truncate">{site.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearBuffers}
              className="flex-1"
            >
              Clear
            </Button>
            <Badge variant="secondary">
              {bufferZones.length} zones
            </Badge>
          </div>
        </div>

        {/* Overlay Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <Label className="font-medium">Overlays</Label>
          </div>

          <div className="space-y-3">
            {overlays.map(overlay => (
              <div key={overlay.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{overlay.name}</Label>
                  <Switch
                    checked={overlay.visible}
                    onCheckedChange={(checked) => handleOverlayToggle(overlay.id, checked)}
                  />
                </div>
                {overlay.visible && (
                  <div className="space-y-1">
                    <Label className="text-xs">Opacity: {Math.round(overlay.opacity * 100)}%</Label>
                    <Slider
                      value={[overlay.opacity]}
                      onValueChange={([value]) => handleOverlayOpacityChange(overlay.id, value)}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Route Generation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            <Label className="font-medium">Route Generation</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Route Points ({routePoints.length})</Label>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {routePoints.map((point, index) => (
                <div key={`${point.lat}-${point.lng}`} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="truncate">{point.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Add Sites to Route</Label>
            <Select onValueChange={(siteId) => {
              const site = sites.find(s => s.id === siteId);
              if (site) addToRoute(site);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select site..." />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateRoute}
              disabled={routePoints.length < 2 || isGeneratingRoute}
              className="flex-1"
            >
              {isGeneratingRoute ? 'Generating...' : 'Generate Route'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearRoute}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Spatial Statistics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <Label className="font-medium">Statistics</Label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="font-medium">{sites.length}</div>
              <div className="text-xs text-muted-foreground">Total Sites</div>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="font-medium">{bufferZones.length}</div>
              <div className="text-xs text-muted-foreground">Buffer Zones</div>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="font-medium">{routePoints.length}</div>
              <div className="text-xs text-muted-foreground">Route Points</div>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="font-medium">{overlays.filter(o => o.visible).length}</div>
              <div className="text-xs text-muted-foreground">Active Overlays</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpatialAnalysisPanel;