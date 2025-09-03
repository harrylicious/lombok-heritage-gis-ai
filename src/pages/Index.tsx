import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Map, Grid3X3, Brain, MapPin, Sparkles, Route, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import HeroBanner from '@/components/HeroBanner';
import SiteCard from '@/components/SiteCard';
import CategoryFilter from '@/components/CategoryFilter';
import MapView from '@/components/MapView';
import { TourismRoutesService, RouteWithSites } from '@/services/tourism-routes.service';

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
  established_year?: number;
  ai_analysis_count?: number;
  review_count?: number;
  average_rating?: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color_hex: string;
}

interface RouteSite {
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
}

const Index = () => {
  const [sites, setSites] = useState<CulturalSite[]>([]);
  const [routes, setRoutes] = useState<RouteWithSites[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSites, setFilteredSites] = useState<CulturalSite[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter sites based on search and category
  useEffect(() => {
    let filtered = sites;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(site => site.category_name === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(site => 
        site.name.toLowerCase().includes(query) ||
        site.local_name.toLowerCase().includes(query) ||
        site.description.toLowerCase().includes(query) ||
        site.village.toLowerCase().includes(query) ||
        site.district.toLowerCase().includes(query)
      );
    }

    setFilteredSites(filtered);
  }, [sites, selectedCategory, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch data in parallel
      const [sitesResult, categoriesResult, routesResult] = await Promise.allSettled([
        supabase
          .from('sites_with_categories')
          .select('*')
          .order('cultural_significance_score', { ascending: false }),
        supabase
          .from('heritage_categories')
          .select('*')
          .order('name'),
        TourismRoutesService.fetchAllRoutes()
      ]);

      // Handle sites data
      if (sitesResult.status === 'fulfilled') {
        const { data: sitesData, error: sitesError } = sitesResult.value;
        if (sitesError) {
          console.error('Error fetching sites:', sitesError);
          toast({
            title: "Error",
            description: "Gagal memuat data situs budaya",
            variant: "destructive",
          });
        } else {
          setSites(sitesData || []);
        }
      }

      // Handle categories data
      if (categoriesResult.status === 'fulfilled') {
        const { data: categoriesData, error: categoriesError } = categoriesResult.value;
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          toast({
            title: "Error",
            description: "Gagal memuat data kategori",
            variant: "destructive",
          });
        } else {
          setCategories(categoriesData || []);
        }
      }

      // Handle routes data
      if (routesResult.status === 'fulfilled') {
        setRoutes(routesResult.value);
      } else {
        console.error('Error fetching routes:', routesResult.reason);
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan yang tidak terduga",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSelect = (site: CulturalSite) => {
    setSelectedSite(site);
    if (activeTab !== 'map') {
      setActiveTab('map');
    }
  };

  const handleExploreClick = () => {
    setActiveTab('explore');
  };

  const handleSearchFocus = () => {
    setActiveTab('map');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-cultural">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-heritage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat warisan budaya Sasak...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cultural">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="p-4 bg-background/80 backdrop-blur-sm shadow-cultural">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Beranda
              </TabsTrigger>
              <TabsTrigger value="explore" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Jelajahi
              </TabsTrigger>
              <TabsTrigger value="routes" className="flex items-center gap-2">
                <Route className="w-4 h-4" />
                Rute Wisata
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                Peta Digital
              </TabsTrigger>
            </TabsList>
          </Card>
          <div className="flex justify-end mt-2">
            <Link to="/auth">
              <Button variant="outline" size="sm">Login Admin</Button>
            </Link>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <HeroBanner 
              onExploreClick={handleExploreClick}
              onSearchFocus={handleSearchFocus}
              totalSites={sites.length}
              aiAnalyzedSites={sites.filter(s => s.ai_analysis_count && s.ai_analysis_count > 0).length}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 bg-gradient-to-br from-heritage to-heritage/80 text-heritage-foreground shadow-heritage">
                <div className="flex items-center gap-4">
                  <MapPin className="w-10 h-10" />
                  <div>
                    <div className="text-2xl font-bold">{sites.length}</div>
                    <div className="text-heritage-foreground/80">Situs Budaya</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-600/80 text-white shadow-heritage">
                <div className="flex items-center gap-4">
                  <Route className="w-10 h-10" />
                  <div>
                    <div className="text-2xl font-bold">{routes.length}</div>
                    <div className="text-blue-100">Rute Wisata</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-heritage">
                <div className="flex items-center gap-4">
                  <Brain className="w-10 h-10" />
                  <div>
                    <div className="text-2xl font-bold">
                      {sites.filter(s => s.ai_analysis_count && s.ai_analysis_count > 0).length}
                    </div>
                    <div className="text-accent-foreground/80">Analisis AI/CNN</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-heritage">
                <div className="flex items-center gap-4">
                  <Filter className="w-10 h-10" />
                  <div>
                    <div className="text-2xl font-bold">{categories.length}</div>
                    <div className="text-primary-foreground/80">Kategori</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Featured Sites */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-heritage" />
                Situs Unggulan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.slice(0, 6).map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onViewDetails={handleSiteSelect}
                    onViewOnMap={handleSiteSelect}
                  />
                ))}
              </div>
            </Card>

            {/* Featured Routes */}
            {routes.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Route className="w-6 h-6 text-heritage" />
                  Rute Wisata Unggulan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {routes.slice(0, 2).map((route) => {
                    const stats = TourismRoutesService.calculateRouteStats(route);
                    return (
                      <Card key={route.id} className="hover:shadow-heritage transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-heritage/10 rounded-lg flex items-center justify-center">
                              <Route className="w-6 h-6 text-heritage" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-1">{route.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {route.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span>{stats.totalSites} situs</span>
                                <span>{stats.totalDuration} menit</span>
                                <span>{stats.totalDistance} KM</span>
                              </div>
                              <Link to={`/route/${route.id}`}>
                                <Button size="sm" className="w-full">
                                  Jelajahi Rute
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <Link to="#routes" onClick={() => setActiveTab('routes')}>
                    <Button variant="outline">
                      Lihat Semua Rute Wisata
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Explore Tab */}
          <TabsContent value="explore" className="space-y-6">
            {/* Search and Filter */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari situs budaya, lokasi, atau kata kunci..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Reset Filter
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Category Filter Sidebar */}
              <div className="lg:col-span-1">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  siteCount={filteredSites.length}
                />
              </div>

              {/* Sites Grid */}
              <div className="lg:col-span-3">
                {filteredSites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSites.map((site) => (
                      <SiteCard
                        key={site.id}
                        site={site}
                        onViewDetails={handleSiteSelect}
                        onViewOnMap={handleSiteSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Tidak ada situs ditemukan</h3>
                    <p className="text-muted-foreground">
                      Coba ubah kata kunci pencarian atau filter kategori
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                  <Route className="w-8 h-8 text-heritage" />
                  Rute Wisata Lombok
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Jelajahi warisan budaya Sasak melalui rute wisata yang telah dirancang khusus.
                  Setiap rute menawarkan pengalaman unik mengunjungi situs-situs bersejarah dengan panduan yang terstruktur.
                </p>
              </div>

              {routes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {routes.map((route) => {
                    const stats = TourismRoutesService.calculateRouteStats(route);
                    return (
                      <Card key={route.id} className="hover:shadow-heritage transition-all duration-300 hover:scale-[1.02]">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{route.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {route.description}
                              </p>
                            </div>
                          </div>

                          {/* Route Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-heritage">{stats.totalSites}</div>
                              <div className="text-xs text-muted-foreground">Situs</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{stats.totalDuration}</div>
                              <div className="text-xs text-muted-foreground">Menit</div>
                            </div>
                          </div>

                          {/* Route Info */}
                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Map className="w-4 h-4 text-muted-foreground" />
                              <span>{stats.totalDistance} KM</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>Rating: {stats.averageRating}/10</span>
                            </div>
                          </div>

                          {/* Route Type & Difficulty */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="secondary" className="text-xs">
                              {route.difficulty_level}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {route.route_type}
                            </Badge>
                          </div>

                          <Link to={`/route/${route.id}`}>
                            <Button className="w-full">
                              <Route className="w-4 h-4 mr-2" />
                              Lihat Rute Detail
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Route className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum ada rute wisata</h3>
                  <p className="text-muted-foreground">
                    Rute wisata akan segera ditambahkan untuk memudahkan Anda menjelajahi warisan budaya Sasak.
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card className="p-4">
              <div className="h-[70vh]">
                <MapView
                  sites={filteredSites}
                  routes={routes}
                  selectedSite={selectedSite}
                  onSiteSelect={setSelectedSite}
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
