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
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Calendar, DollarSign, Building, Target, TrendingUp } from "lucide-react";
import { ConservationProjectsService } from "@/services/conservation-projects.service";
import { CulturalSitesService } from "@/services/cultural-sites.service";
import { SitesWithCategories } from "@/types/sites-with-categories";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ConservationProject = Database['public']['Tables']['conservation_projects']['Row'];

const ConservationProjectsManagement: React.FC = () => {
  const [projects, setProjects] = useState<ConservationProject[]>([]);
  const [sites, setSites] = useState<SitesWithCategories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ConservationProject | null>(null);
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    site_id: "",
    budget: 0,
    funding_source: "",
    lead_organization: "",
    contact_person: "",
    start_date: "",
    end_date: "",
    status: "planning",
    progress_percentage: 0,
    outcomes: "",
    project_type: ""
  });

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsData = await ConservationProjectsService.fetchAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Gagal memuat data proyek');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const sitesData = await CulturalSitesService.fetchAllSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Gagal memuat data situs');
    }
  };

  useEffect(() => {
    loadProjects();
    loadSites();
  }, []);

  const handleCreateProject = async () => {
    try {
      await ConservationProjectsService.createProject(formData);
      toast.success('Proyek konservasi berhasil dibuat');
      setIsCreateDialogOpen(false);
      resetForm();
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Gagal membuat proyek konservasi');
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    try {
      await ConservationProjectsService.updateProject(editingProject.id, formData);
      toast.success('Proyek konservasi berhasil diperbarui');
      setEditingProject(null);
      resetForm();
      loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Gagal memperbarui proyek konservasi');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await ConservationProjectsService.deleteProject(projectId);
      toast.success('Proyek konservasi berhasil dihapus');
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Gagal menghapus proyek konservasi');
    }
  };

  const handleUpdateProgress = async (projectId: string, progress: number) => {
    try {
      await ConservationProjectsService.updateProjectProgress(projectId, progress);
      toast.success('Progress proyek berhasil diperbarui');
      loadProjects();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Gagal memperbarui progress');
    }
  };

  const resetForm = () => {
    setFormData({
      project_name: "",
      description: "",
      site_id: "",
      budget: 0,
      funding_source: "",
      lead_organization: "",
      contact_person: "",
      start_date: "",
      end_date: "",
      status: "planning",
      progress_percentage: 0,
      outcomes: "",
      project_type: ""
    });
  };

  const openEditDialog = (project: ConservationProject) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name,
      description: project.description || "",
      site_id: project.site_id,
      budget: project.budget || 0,
      funding_source: project.funding_source || "",
      lead_organization: project.lead_organization || "",
      contact_person: project.contact_person || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status || "planning",
      progress_percentage: project.progress_percentage || 0,
      outcomes: project.outcomes || "",
      project_type: project.project_type || ""
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active':
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'active':
      case 'in_progress': return 'Aktif';
      case 'on_hold': return 'Ditunda';
      case 'cancelled': return 'Dibatalkan';
      case 'planning': return 'Perencanaan';
      default: return 'Tidak Diketahui';
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
          <h2 className="text-2xl font-bold">Manajemen Proyek Konservasi</h2>
          <p className="text-muted-foreground">
            Kelola proyek konservasi warisan budaya Sasak
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Buat Proyek Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Proyek Konservasi Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project_name">Nama Proyek</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="Masukkan nama proyek"
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Masukkan deskripsi proyek"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="site_id">Situs Budaya</Label>
                <Select value={formData.site_id} onValueChange={(value) => setFormData({ ...formData, site_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih situs budaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id || ''}>
                        {site.name} - {site.local_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Anggaran (Rp)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="funding_source">Sumber Dana</Label>
                  <Input
                    id="funding_source"
                    value={formData.funding_source}
                    onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
                    placeholder="Sumber pendanaan"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_organization">Organisasi Pelaksana</Label>
                  <Input
                    id="lead_organization"
                    value={formData.lead_organization}
                    onChange={(e) => setFormData({ ...formData, lead_organization: e.target.value })}
                    placeholder="Nama organisasi"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Kontak Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Nama kontak"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Tanggal Mulai</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Tanggal Selesai</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Perencanaan</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="in_progress">Dalam Proses</SelectItem>
                      <SelectItem value="on_hold">Ditunda</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="project_type">Tipe Proyek</Label>
                  <Input
                    id="project_type"
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    placeholder="Tipe proyek"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateProject}>
                  Buat Proyek
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects List */}
      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Belum ada proyek konservasi
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Buat proyek konservasi pertama untuk memulai
              </p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{project.project_name}</CardTitle>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                        {project.progress_percentage !== null && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4" />
                            <span>{project.progress_percentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(project)}
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
                          <AlertDialogTitle>Hapus Proyek</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus proyek "{project.project_name}"?
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description}
                  </p>
                )}

                {/* Progress Bar */}
                {project.progress_percentage !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-2" />
                  </div>
                )}

                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  {project.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Rp {project.budget.toLocaleString()}</span>
                    </div>
                  )}
                  {project.lead_organization && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{project.lead_organization}</span>
                    </div>
                  )}
                  {project.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(project.start_date).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                  {project.contact_person && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">👤</span>
                      <span>{project.contact_person}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Proyek Konservasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-project_name">Nama Proyek</Label>
              <Input
                id="edit-project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="Masukkan nama proyek"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi proyek"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-site_id">Situs Budaya</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({ ...formData, site_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih situs budaya" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id || ''}>
                      {site.name} - {site.local_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-budget">Anggaran (Rp)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-progress">Progress (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_percentage}
                  onChange={(e) => setFormData({ ...formData, progress_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Perencanaan</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="in_progress">Dalam Proses</SelectItem>
                    <SelectItem value="on_hold">Ditunda</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-project_type">Tipe Proyek</Label>
                <Input
                  id="edit-project_type"
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                  placeholder="Tipe proyek"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdateProject}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConservationProjectsManagement;