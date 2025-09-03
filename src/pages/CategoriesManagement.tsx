import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Plus, Tag, Search, BarChart3 } from "lucide-react";

// Import services
import { CategoriesService } from "@/services/categories.service";
import { Database } from "@/integrations/supabase/types";

// Import components
import RichTextEditor from "@/components/RichTextEditor";
import RichTextViewer from "@/components/RichTextViewer";

const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional().or(z.literal("")),
  color_hex: z.string().optional().or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

type HeritageCategory = Database['public']['Tables']['heritage_categories']['Row'];

const CategoriesManagement: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<HeritageCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HeritageCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [stats, setStats] = useState<{
    total_categories: number;
    categories_in_use: number;
    unused_categories: number;
  } | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color_hex: "",
    },
  });

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadStats();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const categoriesData = await CategoriesService.fetchAllCategories();
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast({
        title: "Gagal memuat kategori",
        description: error?.message || "Terjadi kesalahan saat memuat data kategori",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CategoriesService.getCategoryUsageStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const payload = {
        name: values.name,
        description: values.description || null,
        color_hex: values.color_hex || null,
      };

      if (editingCategory) {
        await CategoriesService.updateCategory(editingCategory.id, payload);
        toast({
          title: "Berhasil",
          description: "Kategori berhasil diperbarui"
        });
      } else {
        await CategoriesService.createCategory(payload);
        toast({
          title: "Berhasil",
          description: "Kategori berhasil ditambahkan"
        });
      }

      form.reset();
      setEditingCategory(null);
      setCategoryFormOpen(false);
      await loadCategories();
      await loadStats();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: "Gagal menyimpan",
        description: error?.message || "Terjadi kesalahan saat menyimpan kategori",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: HeritageCategory) => {
    setEditingCategory(category);
    setCategoryFormOpen(true);
    form.reset({
      name: category.name,
      description: category.description || "",
      color_hex: category.color_hex || "",
    });
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
    form.reset({
      name: "",
      description: "",
      color_hex: "",
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if category is in use
      const isInUse = await CategoriesService.isCategoryInUse(categoryId);
      if (isInUse) {
        toast({
          title: "Tidak dapat dihapus",
          description: "Kategori ini sedang digunakan oleh situs budaya",
          variant: "destructive",
        });
        return;
      }

      await CategoriesService.deleteCategory(categoryId);
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      });

      await loadCategories();
      await loadStats();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Gagal menghapus",
        description: error?.message || "Terjadi kesalahan saat menghapus kategori",
        variant: "destructive",
      });
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    !searchQuery ||
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Kategori</p>
                <p className="text-2xl font-bold">{stats.total_categories}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kategori Digunakan</p>
                <p className="text-2xl font-bold">{stats.categories_in_use}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kategori Tidak Digunakan</p>
                <p className="text-2xl font-bold">{stats.unused_categories}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Categories List Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Manajemen Kategori Warisan Budaya
          </h2>
          <Button onClick={handleAddCategory}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kategori
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {categories.length === 0 ? "Belum ada kategori. Klik 'Tambah Kategori' untuk memulai." : "Tidak ada kategori yang sesuai dengan pencarian."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <RichTextViewer content={category.description || ""} />
                    </TableCell>
                    <TableCell>
                      {category.color_hex ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: category.color_hex }}
                          />
                          <span className="text-sm font-mono">{category.color_hex}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Aktif</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCategoryToDelete(category.id);
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

      {/* Category Form Modal */}
      <Dialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Perbarui informasi kategori" : "Masukkan informasi kategori baru"}
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
                      <FormLabel>Nama Kategori</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Arsitektur Tradisional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color_hex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warna (Hex)</FormLabel>
                      <FormControl>
                        <Input placeholder="#FF5733" {...field} />
                      </FormControl>
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
                        placeholder="Deskripsi kategori (opsional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCategoryFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {editingCategory ? "Perbarui" : "Simpan"}
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
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan dan mungkin mempengaruhi situs yang menggunakan kategori ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManagement;