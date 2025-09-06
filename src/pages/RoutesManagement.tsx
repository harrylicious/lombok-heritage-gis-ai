import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash2, MapPin, Clock, Route as RouteIcon, Settings, X, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { TourismRoutesService, RouteWithSites } from "@/services/tourism-routes.service";
import { CulturalSitesService } from "@/services/cultural-sites.service";
import { SitesWithCategories } from "@/types/sites-with-categories";
import MapView from "@/components/MapView";
import { toast } from "sonner";

const RoutesManagement: React.FC = () => {
  const [routes, setRoutes] = useState<RouteWithSites[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteWithSites | null>(null);
  const [managingRoute, setManagingRoute] = useState<RouteWithSites | null>(null);
  const [availableSites, setAvailableSites] = useState<SitesWithCategories[]>([]);
  const [isSitesDialogOpen, setIsSitesDialogOpen] = useState(false);
  const [previewRoute, setPreviewRoute] = useState<RouteWithSites | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_hours: 0,
    estimated_cost: 0,
    is_active: true
  });

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      const routesData = await TourismRoutesService.fetchAllRoutes();
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading routes:', error);
      toast.error('Gagal memuat data rute');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleCreateRoute = async () => {
    try {
      await TourismRoutesService.createRoute(formData);
      toast.success('Rute berhasil dibuat');
      setIsCreateDialogOpen(false);
      resetForm();
      loadRoutes();
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Gagal membuat rute');
    }
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute) return;

    try {
      await TourismRoutesService.updateRoute(editingRoute.id, formData);
      toast.success('Rute berhasil diperbarui');
      setEditingRoute(null);
      resetForm();
      loadRoutes();
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Gagal memperbarui rute');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await TourismRoutesService.deleteRoute(routeId);
      toast.success('Rute berhasil dihapus');
      loadRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Gagal menghapus rute');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration_hours: 0,
      estimated_cost: 0,
      is_active: true
    });
  };

  const openEditDialog = (route: RouteWithSites) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      description: route.description || "",
      duration_hours: route.duration_hours || 0,
      estimated_cost: route.estimated_cost || 0,
      is_active: route.is_active
    });
  };

  const openSitesManagement = async (route: RouteWithSites) => {
    setManagingRoute(route);
    setIsSitesDialogOpen(true);

    try {
      // Load all available sites
      const sites = await CulturalSitesService.fetchAllSites();
      setAvailableSites(sites);
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Gagal memuat data situs');
    }
  };

  const addSiteToRoute = async (siteId: string) => {
    if (!managingRoute) return;

    try {
      const nextSequence = (managingRoute.route_sites?.length || 0) + 1;
      await TourismRoutesService.addSiteToRoute(managingRoute.id, siteId, nextSequence);
      toast.success('Situs berhasil ditambahkan ke rute');
      loadRoutes(); // Refresh routes data
    } catch (error) {
      console.error('Error adding site to route:', error);
      toast.error('Gagal menambahkan situs ke rute');
    }
  };

  const removeSiteFromRoute = async (siteId: string) => {
    if (!managingRoute) return;

    try {
      await TourismRoutesService.removeSiteFromRoute(managingRoute.id, siteId);
      toast.success('Situs berhasil dihapus dari rute');
      loadRoutes(); // Refresh routes data
    } catch (error) {
      console.error('Error removing site from route:', error);
      toast.error('Gagal menghapus situs dari rute');
    }
  };

  const isSiteInRoute = (siteId: string): boolean => {
    if (!managingRoute) return false;
    return managingRoute.route_sites?.some(rs => rs.site_id === siteId) || false;
  };

  const openRoutePreview = (route: RouteWithSites) => {
    setPreviewRoute(route);
    setIsPreviewDialogOpen(true);
  };

  const moveSiteUp = async (siteId: string) => {
    if (!managingRoute) return;

    const routeSites = managingRoute.route_sites || [];
    const currentIndex = routeSites.findIndex(rs => rs.site_id === siteId);

    if (currentIndex > 0) {
      try {
        // Swap sequence with the previous item
        const currentSite = routeSites[currentIndex];
        const previousSite = routeSites[currentIndex - 1];

        await TourismRoutesService.updateSiteSequence(managingRoute.id, currentSite.site_id, previousSite.sequence_order);
        await TourismRoutesService.updateSiteSequence(managingRoute.id, previousSite.site_id, currentSite.sequence_order);

        toast.success('Urutan situs berhasil diubah');
        loadRoutes(); // Refresh routes data
      } catch (error) {
        console.error('Error reordering sites:', error);
        toast.error('Gagal mengubah urutan situs');
      }
    }
  };

  const moveSiteDown = async (siteId: string) => {
    if (!managingRoute) return;

    const routeSites = managingRoute.route_sites || [];
    const currentIndex = routeSites.findIndex(rs => rs.site_id === siteId);

    if (currentIndex < routeSites.length - 1) {
      try {
        // Swap sequence with the next item
        const currentSite = routeSites[currentIndex];
        const nextSite = routeSites[currentIndex + 1];

        await TourismRoutesService.updateSiteSequence(managingRoute.id, currentSite.site_id, nextSite.sequence_order);
        await TourismRoutesService.updateSiteSequence(managingRoute.id, nextSite.site_id, currentSite.sequence_order);

        toast.success('Urutan situs berhasil diubah');
        loadRoutes(); // Refresh routes data
      } catch (error) {
        console.error('Error reordering sites:', error);
        toast.error('Gagal mengubah urutan situs');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Rute Wisata</h2>
          <p className="text-muted-foreground">
            Kelola rute wisata budaya Sasak
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Buat Rute Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Buat Rute Wisata Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Rute</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama rute"
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Masukkan deskripsi rute"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Durasi (jam)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Estimasi Biaya (Rp)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateRoute}>
                  Buat Rute
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routes List */}
      <div className="grid gap-4">
        {routes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <RouteIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Belum ada rute wisata
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Buat rute wisata pertama untuk memulai
              </p>
            </CardContent>
          </Card>
        ) : (
          routes.map((route) => (
            <Card key={route.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RouteIcon className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant={route.is_active ? "default" : "secondary"}>
                          {route.is_active ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {route.duration_hours || 0} jam
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          Rp {route.estimated_cost?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(route)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Rute</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus rute "{route.name}"?
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRoute(route.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {route.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {route.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {route.route_sites?.length || 0} situs budaya
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSitesManagement(route)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Kelola Situs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRoute} onOpenChange={(open) => !open && setEditingRoute(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Rute Wisata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Rute</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama rute"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi rute"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-duration">Durasi (jam)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-cost">Estimasi Biaya (Rp)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingRoute(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdateRoute}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sites Management Dialog */}
      <Dialog open={isSitesDialogOpen} onOpenChange={setIsSitesDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Kelola Situs dalam Rute: {managingRoute?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Sites in Route */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Situs dalam Rute</h3>
              <ScrollArea className="h-64 border rounded-md p-3">
                {managingRoute?.route_sites && managingRoute.route_sites.length > 0 ? (
                  <div className="space-y-2">
                    {managingRoute.route_sites
                      .sort((a, b) => a.sequence_order - b.sequence_order)
                      .map((routeSite) => (
                        <div
                          key={routeSite.site_id}
                          className="flex items-center justify-between p-2 bg-muted rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground w-6">
                              {routeSite.sequence_order}
                            </span>
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium text-sm">
                                {routeSite.sites_with_categories?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {routeSite.sites_with_categories?.local_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveSiteUp(routeSite.site_id)}
                              disabled={routeSite.sequence_order === 1}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveSiteDown(routeSite.site_id)}
                              disabled={routeSite.sequence_order === managingRoute.route_sites?.length}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSiteFromRoute(routeSite.site_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Belum ada situs dalam rute ini
                  </p>
                )}
              </ScrollArea>
            </div>

            {/* Available Sites to Add */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tambah Situs</h3>
              <ScrollArea className="h-64 border rounded-md p-3">
                <div className="space-y-2">
                  {availableSites
                    .filter(site => !isSiteInRoute(site.id || ''))
                    .map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{site.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {site.local_name}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSiteToRoute(site.id || '')}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  {availableSites.filter(site => !isSiteInRoute(site.id || '')).length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Semua situs sudah ditambahkan ke rute
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsSitesDialogOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutesManagement;
