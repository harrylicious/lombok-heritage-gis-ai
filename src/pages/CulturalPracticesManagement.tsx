import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Users, Edit, Trash2, Plus, Search, AlertTriangle, BookOpen, Users as UsersIcon } from "lucide-react";

// Import services
import { CulturalPracticesService } from "@/services/cultural-practices.service";
import { CulturalSitesService } from "@/services/cultural-sites.service";
import { Database } from "@/integrations/supabase/types";

// Import components
import RichTextEditor from "@/components/RichTextEditor";
import RichTextViewer from "@/components/RichTextViewer";

const practiceSchema = z.object({
  name: z.string().min(2, "Nama praktik minimal 2 karakter"),
  local_name: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  practice_type: z.string().optional().or(z.literal("")),
  threat_level: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Pilih tingkat ancaman"
  }),
  documentation_level: z.enum(["none", "low", "medium", "high"], {
    required_error: "Pilih tingkat dokumentasi"
  }),
  practitioners_count: z.coerce.number().min(0).optional(),
  seasonal_timing: z.string().optional().or(z.literal("")),
  transmission_method: z.string().optional().or(z.literal("")),
});

type PracticeFormValues = z.infer<typeof practiceSchema>;

type CulturalPractice = Database['public']['Tables']['cultural_practices']['Row'];
type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

const CulturalPracticesManagement: React.FC = () => {
  const { toast } = useToast();
  const [practices, setPractices] = useState<CulturalPractice[]>([]);
  const [sites, setSites] = useState<SiteWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPractice, setEditingPractice] = useState<CulturalPractice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [practiceToDelete, setPracticeToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreatLevel, setSelectedThreatLevel] = useState<string>("");
  const [selectedDocumentationLevel, setSelectedDocumentationLevel] = useState<string>("");
  const [practiceFormOpen, setPracticeFormOpen] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    by_type: Record<string, number>;
    by_threat_level: Record<string, number>;
    by_documentation_level: Record<string, number>;
  } | null>(null);

  const form = useForm<PracticeFormValues>({
    resolver: zodResolver(practiceSchema),
    defaultValues: {
      name: "",
      local_name: "",
      description: "",
      practice_type: "",
      threat_level: "low",
      documentation_level: "none",
      practitioners_count: undefined,
      seasonal_timing: "",
      transmission_method: "",
    },
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadPractices(),
        loadSites(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPractices = async () => {
    setLoading(true);
    try {
      const practicesData = await CulturalPracticesService.fetchAllPractices();
      setPractices(practicesData);
    } catch (error: any) {
      console.error('Error loading practices:', error);
      toast({
        title: "Gagal memuat praktik",
        description: error?.message || "Terjadi kesalahan saat memuat data praktik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const sitesData = await CulturalSitesService.fetchAllSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CulturalPracticesService.getPracticeStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onSubmit = async (values: PracticeFormValues) => {
    try {
      const payload = {
        name: values.name,
        local_name: values.local_name || null,
        description: values.description || null,
        practice_type: values.practice_type || null,
        threat_level: values.threat_level,
        documentation_level: values.documentation_level,
        practitioners_count: values.practitioners_count || null,
        seasonal_timing: values.seasonal_timing || null,
        transmission_method: values.transmission_method || null,
      };

      if (editingPractice) {
        await CulturalPracticesService.updatePractice(editingPractice.id, payload);
        toast({
          title: "Berhasil",
          description: "Praktik budaya berhasil diperbarui"
        });
      } else {
        await CulturalPracticesService.createPractice(payload);
        toast({
          title: "Berhasil",
          description: "Praktik budaya berhasil ditambahkan"
        });
      }

      form.reset();
      setEditingPractice(null);
      setPracticeFormOpen(false);
      await loadPractices();
      await loadStats();
    } catch (error: any) {
      console.error('Error saving practice:', error);
      toast({
        title: "Gagal menyimpan",
        description: error?.message || "Terjadi kesalahan saat menyimpan praktik",
        variant: "destructive",
      });
    }
  };

  const handleEditPractice = (practice: CulturalPractice) => {
    setEditingPractice(practice);
    setPracticeFormOpen(true);
    form.reset({
      name: practice.name,
      local_name: practice.local_name || "",
      description: practice.description || "",
      practice_type: practice.practice_type || "",
      threat_level: practice.threat_level as any || "low",
      documentation_level: practice.documentation_level as any || "none",
      practitioners_count: practice.practitioners_count || undefined,
      seasonal_timing: practice.seasonal_timing || "",
      transmission_method: practice.transmission_method || "",
    });
  };

  const handleAddPractice = () => {
    setEditingPractice(null);
    setPracticeFormOpen(true);
    form.reset({
      name: "",
      local_name: "",
      description: "",
      practice_type: "",
      threat_level: "low",
      documentation_level: "none",
      practitioners_count: undefined,
      seasonal_timing: "",
      transmission_method: "",
    });
  };

  const handleDeletePractice = async (practiceId: string) => {
    try {
      await CulturalPracticesService.deletePractice(practiceId);
      toast({
        title: "Berhasil",
        description: "Praktik budaya berhasil dihapus",
      });

      await loadPractices();
      await loadStats();
      setDeleteDialogOpen(false);
      setPracticeToDelete(null);
    } catch (error: any) {
      console.error('Error deleting practice:', error);
      toast({
        title: "Gagal menghapus",
        description: error?.message || "Terjadi kesalahan saat menghapus praktik",
        variant: "destructive",
      });
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getDocumentationLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      case 'none': return 'destructive';
      default: return 'outline';
    }
  };

  // Filter practices based on search and filters
  const filteredPractices = practices.filter(practice => {
    const matchesSearch = !searchQuery ||
      practice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (practice.local_name && practice.local_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (practice.description && practice.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesThreatLevel = !selectedThreatLevel || practice.threat_level === selectedThreatLevel;
    const matchesDocumentationLevel = !selectedDocumentationLevel || practice.documentation_level === selectedDocumentationLevel;

    return matchesSearch && matchesThreatLevel && matchesDocumentationLevel;
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Praktik</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tingkat Ancaman Tinggi</p>
                <p className="text-2xl font-bold">{(stats.by_threat_level.critical || 0) + (stats.by_threat_level.high || 0)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terdokumentasi Baik</p>
                <p className="text-2xl font-bold">{stats.by_documentation_level.high || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perlu Perhatian</p>
                <p className="text-2xl font-bold">{stats.by_documentation_level.none || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Practices List Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manajemen Praktik Budaya
          </h2>
          <Button onClick={handleAddPractice}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Praktik
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari praktik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedThreatLevel || "all"} onValueChange={(value) => setSelectedThreatLevel(value === "all" ? "" : value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ancaman" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="low">Rendah</SelectItem>
              <SelectItem value="medium">Sedang</SelectItem>
              <SelectItem value="high">Tinggi</SelectItem>
              <SelectItem value="critical">Kritis</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDocumentationLevel || "all"} onValueChange={(value) => setSelectedDocumentationLevel(value === "all" ? "" : value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Dokumentasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="none">Tidak Ada</SelectItem>
              <SelectItem value="low">Rendah</SelectItem>
              <SelectItem value="medium">Sedang</SelectItem>
              <SelectItem value="high">Tinggi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : filteredPractices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {practices.length === 0 ? "Belum ada praktik budaya. Klik 'Tambah Praktik' untuk memulai." : "Tidak ada praktik yang sesuai dengan filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Praktik</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Ancaman</TableHead>
                  <TableHead>Dokumentasi</TableHead>
                  <TableHead>Pelaku</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPractices.map((practice) => (
                  <TableRow key={practice.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{practice.name}</div>
                        {practice.local_name && (
                          <div className="text-sm text-muted-foreground">{practice.local_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {practice.practice_type || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getThreatLevelColor(practice.threat_level || 'low') as any}>
                        {practice.threat_level === 'critical' ? 'Kritis' :
                         practice.threat_level === 'high' ? 'Tinggi' :
                         practice.threat_level === 'medium' ? 'Sedang' : 'Rendah'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDocumentationLevelColor(practice.documentation_level || 'none') as any}>
                        {practice.documentation_level === 'high' ? 'Tinggi' :
                         practice.documentation_level === 'medium' ? 'Sedang' :
                         practice.documentation_level === 'low' ? 'Rendah' : 'Tidak Ada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {practice.practitioners_count ? `${practice.practitioners_count} orang` : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPractice(practice)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPracticeToDelete(practice.id);
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

      {/* Practice Form Modal */}
      <Dialog open={practiceFormOpen} onOpenChange={setPracticeFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPractice ? "Edit Praktik Budaya" : "Tambah Praktik Budaya Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingPractice ? "Perbarui informasi praktik budaya" : "Masukkan informasi praktik budaya baru"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Praktik</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Tari Tradisional Sasak" {...field} />
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
                        <Input placeholder="Nama dalam bahasa Sasak" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="practice_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Praktik</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Tari, Musik, Upacara" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="practitioners_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Pelaku</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="threat_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tingkat Ancaman</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tingkat ancaman" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Rendah</SelectItem>
                          <SelectItem value="medium">Sedang</SelectItem>
                          <SelectItem value="high">Tinggi</SelectItem>
                          <SelectItem value="critical">Kritis</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentation_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tingkat Dokumentasi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tingkat dokumentasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Tidak Ada</SelectItem>
                          <SelectItem value="low">Rendah</SelectItem>
                          <SelectItem value="medium">Sedang</SelectItem>
                          <SelectItem value="high">Tinggi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        placeholder="Deskripsi praktik budaya"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seasonal_timing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Musiman</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Hari Raya, Panen" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transmission_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metode Transmisi</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Lisan, Demonstrasi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPracticeFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {editingPractice ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Praktik Budaya</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus praktik budaya ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => practiceToDelete && handleDeletePractice(practiceToDelete)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CulturalPracticesManagement;