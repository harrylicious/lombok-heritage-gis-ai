import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Clock, DollarSign, Users, Star, Route, Calendar, Mountain } from 'lucide-react';
import { TourismRoutesService, RouteWithSites } from '@/services/tourism-routes.service';
import { useToast } from '@/hooks/use-toast';

const RouteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [route, setRoute] = useState<RouteWithSites | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchRouteData();
    }
  }, [id]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      const routeData = await TourismRoutesService.fetchRouteById(id!);

      if (!routeData) {
        toast({
          title: "Route not found",
          description: "The requested tourism route could not be found.",
          variant: "destructive",
        });
        return;
      }

      setRoute(routeData);
    } catch (error) {
      console.error('Error fetching route data:', error);
      toast({
        title: "Error",
        description: "Failed to load route details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'difficult': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRouteTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cultural': return 'bg-purple-100 text-purple-800';
      case 'historical': return 'bg-blue-100 text-blue-800';
      case 'spiritual': return 'bg-indigo-100 text-indigo-800';
      case 'craft': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-cultural">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-heritage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat detail rute...</p>
        </Card>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-cultural">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Rute Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">Rute wisata yang Anda cari tidak tersedia.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const routeStats = TourismRoutesService.calculateRouteStats(route);
  const sortedSites = route.route_sites?.sort((a, b) => a.sequence_order - b.sequence_order) || [];

  return (
    <div className="min-h-screen bg-gradient-cultural">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
        </div>

        {/* Route Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-heritage to-heritage/80 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Route className="w-8 h-8" />
                  <h1 className="text-3xl md:text-4xl font-bold">{route.name}</h1>
                </div>
                <p className="text-white/90 text-lg mb-4">{route.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getDifficultyColor(route.difficulty_level)}>
                    <Mountain className="w-3 h-3 mr-1" />
                    {route.difficulty_level}
                  </Badge>
                  <Badge className={getRouteTypeColor(route.route_type)}>
                    {route.route_type}
                  </Badge>
                  {route.guide_required && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <Users className="w-3 h-3 mr-1" />
                      Pandu Diperlukan
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Route Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Route className="w-8 h-8 text-heritage mx-auto mb-2" />
              <div className="text-2xl font-bold">{routeStats.totalSites}</div>
              <div className="text-sm text-muted-foreground">Situs Budaya</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{routeStats.totalDuration}</div>
              <div className="text-sm text-muted-foreground">Menit</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{routeStats.totalDistance}</div>
              <div className="text-sm text-muted-foreground">KM</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{routeStats.averageRating}</div>
              <div className="text-sm text-muted-foreground">Rating Rata-rata</div>
            </CardContent>
          </Card>
        </div>

        {/* Route Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sites List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Rute Perjalanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedSites.map((routeSite, index) => {
                  const site = routeSite.sites_with_categories;
                  return (
                    <div key={routeSite.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-heritage text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link to={`/site/${site.id}`} className="hover:text-heritage transition-colors">
                              <h3 className="font-semibold text-lg">{site.name}</h3>
                            </Link>
                            <p className="text-muted-foreground text-sm mb-2">{site.local_name}</p>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{routeSite.visit_duration_minutes} menit</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>{site.cultural_significance_score}/10</span>
                              </div>
                            </div>

                            {routeSite.special_notes && (
                              <p className="text-sm text-muted-foreground italic">
                                {routeSite.special_notes}
                              </p>
                            )}
                          </div>

                          <div className="flex-shrink-0 ml-4">
                            <Badge variant="secondary" style={{
                              backgroundColor: `${site.category_color}20`,
                              color: site.category_color
                            }}>
                              {site.category_name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Route Information Sidebar */}
          <div className="space-y-6">
            {/* Route Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Rute</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium text-muted-foreground">Durasi:</span>
                  <p className="font-semibold">{route.duration_hours} jam</p>
                </div>

                <Separator />

                <div>
                  <span className="font-medium text-muted-foreground">Estimasi Biaya:</span>
                  <p className="font-semibold">Rp {route.estimated_cost?.toLocaleString() || 'N/A'}</p>
                </div>

                <Separator />

                <div>
                  <span className="font-medium text-muted-foreground">Kapasitas Grup:</span>
                  <p className="font-semibold">Maksimal {route.max_group_size} orang</p>
                </div>

                {route.recommended_season && (
                  <>
                    <Separator />
                    <div>
                      <span className="font-medium text-muted-foreground">Musim Terbaik:</span>
                      <p className="font-semibold">{route.recommended_season}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Lihat di Peta Lengkap
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Pesan Tur
                </Button>
                <Button className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Hubungi Pandu
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetail;