import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Map, Grid3X3, Brain, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import HeroBanner from '@/components/HeroBanner';
import SiteCard from '@/components/SiteCard';
import CategoryFilter from '@/components/CategoryFilter';
import MapView from '@/components/MapView';

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

const Index = () => {
  const [sites, setSites] = useState<CulturalSite[]>([]);
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

      // Fetch cultural sites with category information
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites_with_categories')
        .select('*')
        .order('cultural_significance_score', { ascending: false });

      if (sitesError) {
        console.error('Error fetching sites:', sitesError);
        toast({
          title: "Error",
          description: "Gagal memuat data situs budaya",
          variant: "destructive",
        });
        return;
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('heritage_categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        toast({
          title: "Error",
          description: "Gagal memuat data kategori",
          variant: "destructive",
        });
        return;
      }

      setSites(sitesData || []);
      setCategories(categoriesData || []);
      
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
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Beranda
              </TabsTrigger>
              <TabsTrigger value="explore" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Jelajahi
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                Peta Digital
              </TabsTrigger>
            </TabsList>
          </Card>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <HeroBanner 
              onExploreClick={handleExploreClick}
              onSearchFocus={handleSearchFocus}
              totalSites={sites.length}
              aiAnalyzedSites={sites.filter(s => s.ai_analysis_count && s.ai_analysis_count > 0).length}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-heritage to-heritage/80 text-heritage-foreground shadow-heritage">
                <div className="flex items-center gap-4">
                  <MapPin className="w-10 h-10" />
                  <div>
                    <div className="text-2xl font-bold">{sites.length}</div>
                    <div className="text-heritage-foreground/80">Situs Budaya</div>
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

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card className="p-4">
              <div className="h-[70vh]">
                <MapView 
                  sites={filteredSites}
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
