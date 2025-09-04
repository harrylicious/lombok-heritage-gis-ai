import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Map,
  TrendingUp,
  Target,
  Download,
  RefreshCw,
  Maximize2,
  Settings
} from 'lucide-react';
import HeatmapView from '@/components/dashboard/HeatmapView';
import TimeSeriesChart from '@/components/dashboard/TimeSeriesChart';
import RecommendationPanel from '@/components/dashboard/RecommendationPanel';
import EnhancedMapView from '@/components/maps/EnhancedMapView';
import SpatialAnalysisPanel from '@/components/maps/SpatialAnalysisPanel';
import { CulturalSitesService } from '@/services/cultural-sites.service';
import { TourismRoutesService } from '@/services/tourism-routes.service';
import { SpatialAnalysisService, BufferZone, SpatialOverlay } from '@/services/spatial-analysis.service';
import { Database } from '@/integrations/supabase/types';

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];
type RouteWithSites = Database['public']['Tables']['tourism_routes']['Row'];

const AnalysisReport: React.FC = () => {
  const [sites, setSites] = useState<SiteWithCategory[]>([]);
  const [routes, setRoutes] = useState<RouteWithSites[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteWithCategory | null>(null);
  const [bufferZones, setBufferZones] = useState<BufferZone[]>([]);
  const [overlays, setOverlays] = useState<SpatialOverlay[]>([]);
  const [generatedRoute, setGeneratedRoute] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'spatial' | 'heatmap' | 'trends'>('overview');

  const handleTabChange = (value: string) => {
    setActiveView(value as 'overview' | 'spatial' | 'heatmap' | 'trends');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sitesData, routesData] = await Promise.all([
        CulturalSitesService.fetchAllSites(),
        TourismRoutesService.fetchAllRoutes()
      ]);

      setSites(sitesData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBufferZonesChange = (zones: BufferZone[]) => {
    setBufferZones(zones);
  };

  const handleOverlaysChange = (newOverlays: SpatialOverlay[]) => {
    setOverlays(newOverlays);
  };

  const handleRouteGenerated = (route: [number, number][]) => {
    setGeneratedRoute(route);
  };

  const exportReport = () => {
    // Export functionality can be implemented here
    console.log('Exporting analysis report...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-cultural p-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Memuat laporan analisis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cultural">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Laporan Analisis Warisan Budaya</h1>
              <p className="text-muted-foreground mt-1">
                Analisis komprehensif data spasial dan tren pelestarian
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                {sites.length} Situs
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                {routes.length} Rute
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={exportReport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-6">
        <Tabs value={activeView} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Ringkasan
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="spatial" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Analisis Spasial
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tren & Rekomendasi
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Metrik Utama
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{sites.length}</div>
                      <div className="text-sm text-muted-foreground">Total Situs</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{routes.length}</div>
                      <div className="text-sm text-muted-foreground">Rute Wisata</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {sites.filter(s => s.is_active).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Situs Aktif</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">
                        {sites.filter(s => s.is_unesco_site).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Situs UNESCO</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Heatmap Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Pratinjau Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Klik tab "Heatmap" untuk tampilan penuh
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Series Chart */}
            <TimeSeriesChart />
          </TabsContent>

          {/* Heatmap Tab - Full Width */}
          <TabsContent value="heatmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Peta Kepadatan Situs Budaya
                </CardTitle>
                <p className="text-muted-foreground">
                  Visualisasi interaktif konsentrasi situs warisan budaya di Lombok
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[80vh] w-full">
                  <HeatmapView />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spatial Analysis Tab */}
          <TabsContent value="spatial" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Spatial Analysis Controls */}
              <div className="xl:col-span-1">
                <SpatialAnalysisPanel
                  sites={sites}
                  onBufferZonesChange={handleBufferZonesChange}
                  onOverlaysChange={handleOverlaysChange}
                  onRouteGenerated={handleRouteGenerated}
                />
              </div>

              {/* Enhanced Map View */}
              <div className="xl:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Analisis Spasial Interaktif
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[70vh] w-full">
                      <EnhancedMapView
                        sites={sites}
                        selectedSite={selectedSite}
                        onSiteSelect={setSelectedSite}
                        bufferZones={bufferZones}
                        overlays={overlays}
                        generatedRoute={generatedRoute}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Trends & Recommendations Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Time Series - Full Width on smaller screens */}
              <div className="xl:col-span-2">
                <TimeSeriesChart />
              </div>

              {/* Recommendations */}
              <div className="xl:col-span-1">
                <RecommendationPanel />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalysisReport;