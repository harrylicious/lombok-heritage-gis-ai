import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Image as ImageIcon, Edit, Trash2, Plus, Search, Filter } from "lucide-react";
import { classifyImage } from "@/lib/cnn";

// Import services
import { CulturalSitesService } from "@/services/cultural-sites.service";
import { SiteMediaService } from "@/services/site-media.service";
import { CategoriesService } from "@/services/categories.service";

// Import components
import RichTextEditor from "@/components/RichTextEditor";

// Fix Leaflet default markers
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const siteSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  local_name: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  category_id: z.string({ required_error: "Pilih kategori" }),
  latitude: z.coerce.number({ required_error: "Pilih titik di peta" }),
  longitude: z.coerce.number({ required_error: "Pilih titik di peta" }),
  visiting_hours: z.string().optional().or(z.literal("")),
  entrance_fee: z.coerce.number().min(0).default(0),
  village: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  established_year: z.coerce.number().int().optional().or(z.nan()).transform(v => Number.isNaN(v) ? undefined : v),
});

type SiteFormValues = z.infer<typeof siteSchema>;

interface Category {
  id: string;
  name: string;
  color_hex: string | null;
}

type SiteWithCategory = Awaited<ReturnType<typeof CulturalSitesService.fetchAllSites>>[0];

const SitesManagement: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<SiteWithCategory[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<{ label: string; score: number }[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [editingSite, setEditingSite] = useState<SiteWithCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [siteFormOpen, setSiteFormOpen] = useState(false);

  // Map refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: "",
      local_name: "",
      description: "",
      category_id: "",
      latitude: -8.65,
      longitude: 116.3241,
      visiting_hours: "",
      entrance_fee: 0,
      village: "",
      district: "",
      established_year: undefined,
    },
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get current user
      const { data: auth } = await import("@/integrations/supabase/client").then(({ supabase }) =>
        supabase.auth.getUser()
      );
      setUserId(auth.user?.id ?? null);

      // Load categories and sites
      await Promise.all([
        loadCategories(),
        loadSites()
      ]);
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Gagal memuat data",
        description: error?.message || "Terjadi kesalahan saat memuat data",
        variant: "destructive",
      });
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await CategoriesService.fetchAllCategories();
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const sitesData = await CulturalSitesService.fetchAllSites();
      setSites(sitesData);
    } catch (error: any) {
      console.error('Error loading sites:', error);
      toast({
        title: "Gagal memuat situs",
        description: error?.message || "Terjadi kesalahan saat memuat data situs",
        variant: "destructive",
      });
    } finally {
      setLoadingSites(false);
    }
  };

  const handleEditSite = async (site: SiteWithCategory) => {
    setEditingSite(site);
    setCreatedSiteId(site.id!);
    setSiteFormOpen(true);
    form.reset({
      name: site.name || "",
      local_name: site.local_name || "",
      description: site.description || "",
      category_id: site.category_id || "",
      latitude: site.latitude || -8.65,
      longitude: site.longitude || 116.3241,
      visiting_hours: site.visiting_hours || "",
      entrance_fee: site.entrance_fee || 0,
      village: site.village || "",
      district: site.district || "",
      established_year: site.established_year || undefined,
    });

    // Load existing images for this site
    if (site.id) {
      try {
        const images = await SiteMediaService.fetchSiteImages(site.id);
        setExistingImages(images);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    }
  };

  const handleAddSite = () => {
    setEditingSite(null);
    setCreatedSiteId(null);
    setSiteFormOpen(true);
    form.reset({
      name: "",
      local_name: "",
      description: "",
      category_id: "",
      latitude: -8.65,
      longitude: 116.3241,
      visiting_hours: "",
      entrance_fee: 0,
      village: "",
      district: "",
      established_year: undefined,
    });
    setExistingImages([]);
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      await CulturalSitesService.deleteSite(siteId);
      toast({
        title: "Berhasil",
        description: "Situs budaya berhasil dihapus",
      });
      await loadSites();
      setDeleteDialogOpen(false);
      setSiteToDelete(null);
    } catch (error: any) {
      console.error('Error deleting site:', error);
      toast({
        title: "Gagal menghapus",
        description: error?.message || "Terjadi kesalahan saat menghapus situs",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !createdSiteId) {
      toast({
        title: "Pilih gambar",
        description: "Pilih gambar dan simpan situs terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(true);
    try {
      await SiteMediaService.uploadImages(files, createdSiteId, userId!);
      toast({
        title: "Berhasil",
        description: `${files.length} gambar berhasil diupload`,
      });
      setUploadedImages([]);

      // Refresh existing images
      const images = await SiteMediaService.fetchSiteImages(createdSiteId);
      setExistingImages(images);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Gagal upload",
        description: error?.message || "Terjadi kesalahan saat upload gambar",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: string, fileUrl: string) => {
    try {
      await SiteMediaService.deleteImage(imageId, fileUrl);
      toast({
        title: "Berhasil",
        description: "Gambar berhasil dihapus",
      });

      if (createdSiteId) {
        const images = await SiteMediaService.fetchSiteImages(createdSiteId);
        setExistingImages(images);
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Gagal menghapus",
        description: error?.message || "Terjadi kesalahan saat menghapus gambar",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: SiteFormValues) => {
    try {
      const payload = {
        name: values.name,
        local_name: values.local_name || null,
        description: values.description || null,
        category_id: values.category_id,
        latitude: values.latitude,
        longitude: values.longitude,
        visiting_hours: values.visiting_hours || null,
        entrance_fee: values.entrance_fee ?? 0,
        village: values.village || null,
        district: values.district || null,
        established_year: values.established_year,
        created_by: userId,
      };

      if (editingSite) {
        await CulturalSitesService.updateSite(editingSite.id!, payload);
        toast({
          title: "Berhasil",
          description: "Situs budaya berhasil diperbarui"
        });
      } else {
        const newSite = await CulturalSitesService.createSite(payload);
        setCreatedSiteId(newSite.id);
        toast({
          title: "Berhasil",
          description: "Situs budaya berhasil disimpan"
        });
      }

      form.reset();
      setEditingSite(null);
      setSiteFormOpen(false);
      await loadSites();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal menyimpan",
        description: err?.message || "Pastikan Anda sudah login (RLS mengharuskan pengguna terautentik)",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!createdSiteId || !selectedImage) {
      toast({ title: "Lengkapi data", description: "Simpan situs dan pilih gambar terlebih dahulu" });
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysis(null);
      const results = await classifyImage(selectedImage);
      setAnalysis(results);
      const top = results[0];
      toast({
        title: "Analisis selesai",
        description: `Prediksi: ${top.label} (${Math.round(top.score * 100)}%)`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal analisis",
        description: err?.message || "Terjadi kesalahan saat memproses gambar",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Filter sites based on search and category
  const filteredSites = sites.filter(site => {
    const matchesSearch = !searchQuery ||
      site.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.local_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || site.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Sites List Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Daftar Situs Budaya</h2>
          <Button onClick={handleAddSite}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Situs Baru
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari situs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingSites ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : filteredSites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {sites.length === 0 ? "Belum ada situs budaya. Klik 'Tambah Situs Baru' untuk memulai." : "Tidak ada situs yang sesuai dengan filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{site.name}</div>
                        {site.local_name && (
                          <div className="text-sm text-muted-foreground">{site.local_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.category_name ? (
                        <Badge variant="secondary">{site.category_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {site.village && <div>{site.village}</div>}
                        {site.district && <div>{site.district}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={site.is_active ? "default" : "secondary"}>
                        {site.is_active ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSite(site)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSiteToDelete(site.id!);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Site Form Modal */}
      <Dialog open={siteFormOpen} onOpenChange={setSiteFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSite ? "Edit Situs Budaya" : "Tambah Situs Budaya Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingSite ? "Perbarui informasi situs budaya" : "Masukkan informasi situs budaya baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <Card className="p-6 lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Situs</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Desa Adat Sade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="local_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lokal</FormLabel>
                          <FormControl>
                            <Input placeholder="Sasak name (opsional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Sejarah singkat, nilai budaya, dll"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="visiting_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jam Kunjungan</FormLabel>
                          <FormControl>
                            <Input placeholder="08.00 - 17.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entrance_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biaya Masuk (Rp)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="established_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun Berdiri</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="mis. 1800" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desa</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama desa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kecamatan</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama kecamatan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setSiteFormOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={!userId}>
                      {editingSite ? "Perbarui Situs" : "Simpan Situs"}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>

            {/* Map & Media Section */}
            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-heritage" />
                  <h3 className="font-semibold">Pilih Titik Koordinat</h3>
                </div>
                <div ref={mapContainer} className="h-64 w-full rounded-md overflow-hidden shadow-cultural" />
                <p className="text-xs text-muted-foreground mt-2">Klik pada peta untuk menentukan lokasi.</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">Media Situs Budaya</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="images">Upload Gambar Situs (Multiple)</Label>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          setUploadedImages(Array.from(files));
                          handleImageUpload(files);
                        }
                      }}
                      disabled={!createdSiteId || uploadingImages}
                    />
                  </div>

                  {uploadingImages && (
                    <p className="text-sm text-muted-foreground">Mengupload gambar...</p>
                  )}

                  {!createdSiteId && (
                    <p className="text-xs text-muted-foreground">Simpan situs terlebih dahulu untuk upload gambar.</p>
                  )}

                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Gambar Tersimpan</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {existingImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.file_url}
                              alt={image.title || "Site image"}
                              className="w-full h-20 object-cover rounded-md"
                              loading="lazy"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteImage(image.id, image.file_url)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Preview */}
                  {uploadedImages.length > 0 && !uploadingImages && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Preview Upload</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {uploadedImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">Analisis CNN (Gambar)</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="image">Unggah Gambar Situs</Label>
                    <Input id="image" type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
                  </div>
                  <Button variant="secondary" onClick={handleAnalyze} disabled={!createdSiteId || !selectedImage || analyzing}>
                    {analyzing ? "Menganalisis..." : "Jalankan Analisis CNN (Tanpa Token)"}
                  </Button>
                  {!createdSiteId && (
                    <p className="text-xs text-muted-foreground">Simpan situs terlebih dahulu untuk mengaktifkan analisis.</p>
                  )}
                  {selectedImage && (
                    <div className="pt-2">
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Gambar situs untuk analisis CNN"
                        className="w-full h-40 object-cover rounded-md"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {analysis && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-1">Hasil Analisis</h4>
                      <ul className="space-y-1">
                        {analysis.slice(0, 5).map((r, i) => (
                          <li key={i} className="text-sm flex items-center justify-between">
                            <span className="text-muted-foreground">{r.label}</span>
                            <span className="font-medium">{Math.round(r.score * 100)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Situs Budaya</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus situs budaya ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => siteToDelete && handleDeleteSite(siteToDelete)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitesManagement;