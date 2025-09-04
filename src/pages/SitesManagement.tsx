import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";

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
import { MapPin, Image as ImageIcon, Edit, Trash2, Plus, Search, Filter, Download } from "lucide-react";
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
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    category_id: '',
    is_active: null as boolean | null,
  });

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

  const handleParseCsv = () => {
    if (!csvFile) return;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const validData: any[] = [];

        results.data.forEach((row: any, index: number) => {
          // Validate required fields
          if (!row.name || row.name.trim() === '') {
            errors.push(`Baris ${index + 2}: Nama situs wajib diisi`);
            return;
          }

          if (!row.category_id || row.category_id.trim() === '') {
            errors.push(`Baris ${index + 2}: Category ID wajib diisi`);
            return;
          }

          // Validate latitude and longitude
          const lat = parseFloat(row.latitude);
          const lng = parseFloat(row.longitude);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push(`Baris ${index + 2}: Latitude tidak valid (${row.latitude})`);
            return;
          }
          if (isNaN(lng) || lng < -180 || lng > 180) {
            errors.push(`Baris ${index + 2}: Longitude tidak valid (${row.longitude})`);
            return;
          }

          // Validate entrance fee
          const fee = parseFloat(row.entrance_fee);
          if (isNaN(fee) || fee < 0) {
            errors.push(`Baris ${index + 2}: Biaya masuk tidak valid (${row.entrance_fee})`);
            return;
          }

          // Validate established year if provided
          if (row.established_year && row.established_year.trim() !== '') {
            const year = parseInt(row.established_year);
            if (isNaN(year) || year < 1000 || year > new Date().getFullYear()) {
              errors.push(`Baris ${index + 2}: Tahun berdiri tidak valid (${row.established_year})`);
              return;
            }
          }

          // Add validated data
          validData.push({
            name: row.name.trim(),
            local_name: row.local_name?.trim() || null,
            description: row.description?.trim() || null,
            category_id: row.category_id.trim(),
            latitude: lat,
            longitude: lng,
            visiting_hours: row.visiting_hours?.trim() || null,
            entrance_fee: fee,
            village: row.village?.trim() || null,
            district: row.district?.trim() || null,
            established_year: row.established_year && row.established_year.trim() !== '' ? parseInt(row.established_year) : null,
            created_by: userId,
            is_active: true,
          });
        });

        setCsvData(validData);
        setCsvErrors(errors);
      },
      error: (error) => {
        toast({
          title: "Gagal parse CSV",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleImportCsv = async () => {
    if (csvData.length === 0 || !userId) return;

    setImportingCsv(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const siteData of csvData) {
        try {
          await CulturalSitesService.createSite(siteData);
          successCount++;
        } catch (error: any) {
          console.error('Error importing site:', siteData.name, error);
          errorCount++;
        }
      }

      toast({
        title: "Import selesai",
        description: `${successCount} situs berhasil diimport${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      // Refresh sites list
      await loadSites();

      // Reset state
      setCsvImportOpen(false);
      setCsvFile(null);
      setCsvData([]);
      setCsvErrors([]);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Gagal import",
        description: error?.message || "Terjadi kesalahan saat import data",
        variant: "destructive",
      });
    } finally {
      setImportingCsv(false);
    }
  };

  const handleBulkEdit = async () => {
    if (selectedSites.length === 0) return;

    try {
      const updates: any = {};
      if (bulkEditData.category_id) {
        updates.category_id = bulkEditData.category_id;
      }
      if (bulkEditData.is_active !== null) {
        updates.is_active = bulkEditData.is_active;
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: "Tidak ada perubahan",
          description: "Pilih setidaknya satu field untuk diubah",
          variant: "destructive",
        });
        return;
      }

      // Update each selected site
      for (const siteId of selectedSites) {
        await CulturalSitesService.updateSite(siteId, updates);
      }

      toast({
        title: "Berhasil",
        description: `${selectedSites.length} situs berhasil diperbarui`,
      });

      // Reset state and refresh
      setBulkEditOpen(false);
      setSelectedSites([]);
      setBulkEditData({ category_id: '', is_active: null });
      await loadSites();
    } catch (error: any) {
      console.error('Bulk edit error:', error);
      toast({
        title: "Gagal edit massal",
        description: error?.message || "Terjadi kesalahan saat memperbarui situs",
        variant: "destructive",
      });
    }
  };

  const handleExportCsv = () => {
    if (filteredSites.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada situs yang dapat diekspor",
        variant: "destructive",
      });
      return;
    }

    // Prepare CSV data
    const csvData = filteredSites.map(site => ({
      name: site.name || '',
      local_name: site.local_name || '',
      description: site.description || '',
      category_id: site.category_id || '',
      category_name: site.category_name || '',
      latitude: site.latitude || '',
      longitude: site.longitude || '',
      visiting_hours: site.visiting_hours || '',
      entrance_fee: site.entrance_fee || '',
      village: site.village || '',
      district: site.district || '',
      established_year: site.established_year || '',
      is_active: site.is_active ? 'true' : 'false',
      created_at: site.created_at || '',
      updated_at: site.updated_at || '',
    }));

    // Convert to CSV using PapaParse
    const csv = Papa.unparse(csvData);

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cultural-sites-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: `${filteredSites.length} situs berhasil diekspor ke CSV`,
    });
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCsvImportOpen(true)}
              disabled={selectedSites.length > 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setBulkEditOpen(true)}
              disabled={selectedSites.length === 0}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Massal ({selectedSites.length})
            </Button>
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleAddSite}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Situs Baru
            </Button>
          </div>
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
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedSites.length === filteredSites.length && filteredSites.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSites(filteredSites.map(site => site.id!));
                        } else {
                          setSelectedSites([]);
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
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
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedSites.includes(site.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSites(prev => [...prev, site.id!]);
                          } else {
                            setSelectedSites(prev => prev.filter(id => id !== site.id));
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
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

      {/* CSV Import Dialog */}
      <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Situs Budaya dari CSV</DialogTitle>
            <DialogDescription>
              Upload file CSV dengan data situs budaya. Pastikan format sesuai dengan template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Pilih File CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCsvFile(file);
                    setCsvData([]);
                    setCsvErrors([]);
                  }
                }}
              />
            </div>

            {csvFile && (
              <div className="space-y-2">
                <Button
                  onClick={() => handleParseCsv()}
                  disabled={!csvFile}
                >
                  Parse CSV
                </Button>
              </div>
            )}

            {csvErrors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Error Validasi:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {csvErrors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              </div>
            )}

            {csvData.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Preview Data ({csvData.length} baris):</h4>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell>{row.category_name || '-'}</TableCell>
                          <TableCell>{row.village || row.district ? `${row.village || ''} ${row.district || ''}`.trim() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={row.is_active ? "default" : "secondary"}>
                              {row.is_active ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData.length > 5 && (
                    <p className="text-sm text-muted-foreground p-2">
                      ... dan {csvData.length - 5} baris lainnya
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p><strong>Format CSV yang diharapkan:</strong></p>
              <p>Header: name,local_name,description,category_id,latitude,longitude,visiting_hours,entrance_fee,village,district,established_year</p>
              <p>Contoh: "Desa Sade","Sade","Deskripsi...", "uuid-kategori", -8.65, 116.32, "08:00-17:00", 5000, "Sade", "Lombok Tengah", 1800</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvImportOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleImportCsv}
              disabled={csvData.length === 0 || csvErrors.length > 0 || importingCsv}
            >
              {importingCsv ? "Mengimport..." : `Import ${csvData.length} Situs`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Massal Situs Budaya</DialogTitle>
            <DialogDescription>
              Edit {selectedSites.length} situs yang dipilih. Kosongkan field yang tidak ingin diubah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-category">Kategori Baru</Label>
              <Select
                value={bulkEditData.category_id}
                onValueChange={(value) => setBulkEditData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori baru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak diubah</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-status">Status Aktif</Label>
              <Select
                value={bulkEditData.is_active === null ? '' : bulkEditData.is_active.toString()}
                onValueChange={(value) => setBulkEditData(prev => ({
                  ...prev,
                  is_active: value === '' ? null : value === 'true'
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status baru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak diubah</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleBulkEdit}>
              Terapkan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitesManagement;