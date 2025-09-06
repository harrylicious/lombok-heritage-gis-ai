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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Calendar, Clock, Star, List, Timeline } from "lucide-react";

// Import services
import { HistoricalRecordsService } from "@/services/historical-records.service";
import { CulturalSitesService } from "@/services/cultural-sites.service";

const recordSchema = z.object({
  site_id: z.string({ required_error: "Pilih situs budaya" }),
  event_title: z.string().min(3, "Judul event minimal 3 karakter"),
  event_description: z.string().optional().or(z.literal("")),
  event_date: z.string().optional().or(z.literal("")),
  historical_period: z.string().optional().or(z.literal("")),
  significance_level: z.coerce.number().min(1).max(10).optional(),
  sources: z.array(z.string()).optional(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface Site {
  id: string;
  name: string;
}

type HistoricalRecord = Awaited<ReturnType<typeof HistoricalRecordsService.fetchAllRecords>>[0];

const HistoricalRecordsManagement: React.FC = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<HistoricalRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [timelineData, setTimelineData] = useState<{
    year: number;
    events: HistoricalRecord[];
  }[]>([]);

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      site_id: "",
      event_title: "",
      event_description: "",
      event_date: "",
      historical_period: "",
      significance_level: undefined,
      sources: [],
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

      // Load sites and records
      await Promise.all([
        loadSites(),
        loadRecords()
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

  const loadSites = async () => {
    try {
      const sitesData = await CulturalSitesService.fetchAllSites();
      setSites(sitesData.map(site => ({ id: site.id!, name: site.name! })));
    } catch (error: any) {
      console.error('Error loading sites:', error);
    }
  };

  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const recordsData = await HistoricalRecordsService.fetchAllRecords();
      setRecords(recordsData);

      // Load timeline data for all sites
      const timelinePromises = sites.map(site =>
        HistoricalRecordsService.getSiteTimeline(site.id)
      );
      const timelineResults = await Promise.all(timelinePromises);
      const allTimelineData = timelineResults.flat();
      setTimelineData(allTimelineData);
    } catch (error: any) {
      console.error('Error loading records:', error);
      toast({
        title: "Gagal memuat catatan",
        description: error?.message || "Terjadi kesalahan saat memuat data catatan",
        variant: "destructive",
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleEditRecord = async (record: HistoricalRecord) => {
    setEditingRecord(record);
    setRecordFormOpen(true);
    form.reset({
      site_id: record.site_id,
      event_title: record.event_title,
      event_description: record.event_description || "",
      event_date: record.event_date || "",
      historical_period: record.historical_period || "",
      significance_level: record.significance_level || undefined,
      sources: record.sources || [],
    });
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setRecordFormOpen(true);
    form.reset({
      site_id: "",
      event_title: "",
      event_description: "",
      event_date: "",
      historical_period: "",
      significance_level: undefined,
      sources: [],
    });
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await HistoricalRecordsService.deleteRecord(recordId);
      toast({
        title: "Berhasil",
        description: "Catatan sejarah berhasil dihapus",
      });
      await loadRecords();
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error: any) {
      console.error('Error deleting record:', error);
      toast({
        title: "Gagal menghapus",
        description: error?.message || "Terjadi kesalahan saat menghapus catatan",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: RecordFormValues) => {
    try {
      const payload = {
        site_id: values.site_id,
        event_title: values.event_title,
        event_description: values.event_description || null,
        event_date: values.event_date || null,
        historical_period: values.historical_period || null,
        significance_level: values.significance_level || null,
        sources: values.sources || null,
        created_by: userId,
      };

      if (editingRecord) {
        await HistoricalRecordsService.updateRecord(editingRecord.id, payload);
        toast({
          title: "Berhasil",
          description: "Catatan sejarah berhasil diperbarui"
        });
      } else {
        await HistoricalRecordsService.createRecord(payload);
        toast({
          title: "Berhasil",
          description: "Catatan sejarah berhasil disimpan"
        });
      }

      form.reset();
      setEditingRecord(null);
      setRecordFormOpen(false);
      await loadRecords();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal menyimpan",
        description: err?.message || "Pastikan Anda sudah login",
        variant: "destructive",
      });
    }
  };

  // Filter records based on search and site
  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchQuery ||
      record.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.event_description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSite = !selectedSite || record.site_id === selectedSite;

    return matchesSearch && matchesSite;
  });

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  const getSignificanceColor = (level?: number | null) => {
    if (!level) return "secondary";
    if (level >= 8) return "destructive"; // High significance
    if (level >= 6) return "default"; // Medium significance
    return "secondary"; // Low significance
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Catatan Sejarah</h2>
          <Button onClick={handleAddRecord}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Catatan Baru
          </Button>
        </div>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">
              <List className="w-4 h-4 mr-2" />
              Tabel
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Timeline className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            <Card className="p-6">
              {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedSite || "all"} onValueChange={(value) => setSelectedSite(value === "all" ? "" : value)}>
            <SelectTrigger className="w-48">
              <Search className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter Situs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Situs</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingRecords ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {records.length === 0 ? "Belum ada catatan sejarah. Klik 'Tambah Catatan Baru' untuk memulai." : "Tidak ada catatan yang sesuai dengan filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Event</TableHead>
                  <TableHead>Situs</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Tingkat Signifikansi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{record.event_title}</div>
                        {record.event_description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {record.event_description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSiteName(record.site_id)}
                    </TableCell>
                    <TableCell>
                      {record.event_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.event_date).toLocaleDateString('id-ID')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.historical_period || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {record.significance_level ? (
                        <Badge variant={getSignificanceColor(record.significance_level)}>
                          <Star className="w-3 h-3 mr-1" />
                          {record.significance_level}/10
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRecordToDelete(record.id);
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
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            {/* Timeline View */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Timeline Sejarah</h3>
              {timelineData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data timeline untuk ditampilkan
                </div>
              ) : (
                <div className="space-y-6">
                  {timelineData.map((yearData) => (
                    <div key={yearData.year} className="relative">
                      {/* Year Header */}
                      <div className="flex items-center mb-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold text-lg mr-4">
                          {yearData.year}
                        </div>
                        <div className="h-px bg-border flex-1"></div>
                      </div>

                      {/* Events for this year */}
                      <div className="ml-16 space-y-4">
                        {yearData.events.map((event, index) => (
                          <div key={event.id} className="relative">
                            {/* Timeline line */}
                            {index < yearData.events.length - 1 && (
                              <div className="absolute left-6 top-12 w-px h-full bg-border"></div>
                            )}

                            {/* Event card */}
                            <div className="flex items-start">
                              <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-full mr-4 flex-shrink-0">
                                <Calendar className="w-5 h-5 text-accent-foreground" />
                              </div>
                              <Card className="flex-1 p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg">{event.event_title}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {getSiteName(event.site_id)}
                                    </p>
                                    {event.event_description && (
                                      <p className="text-sm mb-3">{event.event_description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      {event.event_date && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {new Date(event.event_date).toLocaleDateString('id-ID')}
                                        </div>
                                      )}
                                      {event.historical_period && (
                                        <Badge variant="outline">{event.historical_period}</Badge>
                                      )}
                                      {event.significance_level && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3 h-3" />
                                          {event.significance_level}/10
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditRecord(event)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setRecordToDelete(event.id);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Record Form Modal */}
      <Dialog open={recordFormOpen} onOpenChange={setRecordFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "Edit Catatan Sejarah" : "Tambah Catatan Sejarah Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingRecord ? "Perbarui informasi catatan sejarah" : "Masukkan informasi catatan sejarah baru"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="site_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situs Budaya</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih situs budaya" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Event</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Pendirian Masjid Kuno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Event</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi detail tentang event sejarah"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="event_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Event</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="historical_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periode Sejarah</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Zaman Majapahit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="significance_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tingkat Signifikansi (1-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        placeholder="1-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRecordFormOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={!userId}>
                  {editingRecord ? "Perbarui Catatan" : "Simpan Catatan"}
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
            <DialogTitle>Hapus Catatan Sejarah</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus catatan sejarah ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => recordToDelete && handleDeleteRecord(recordToDelete)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoricalRecordsManagement;