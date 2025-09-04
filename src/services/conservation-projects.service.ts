import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ConservationProject = Database['public']['Tables']['conservation_projects']['Row'];
type ConservationProjectInsert = Database['public']['Tables']['conservation_projects']['Insert'];
type ConservationProjectUpdate = Database['public']['Tables']['conservation_projects']['Update'];

export interface ConservationProjectWithSite extends ConservationProject {
  cultural_sites?: {
    id: string;
    name: string;
    local_name: string;
    category_name: string;
    village: string;
    district: string;
  } | null;
}

export class ConservationProjectsService {
  /**
   * Fetch all conservation projects
   */
  static async fetchAllProjects(): Promise<ConservationProject[]> {
    const { data, error } = await supabase
      .from('conservation_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single conservation project by ID
   */
  static async fetchProjectById(projectId: string): Promise<ConservationProject | null> {
    const { data, error } = await supabase
      .from('conservation_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  }

  /**
   * Create a new conservation project
   */
  static async createProject(projectData: ConservationProjectInsert): Promise<ConservationProject> {
    const { data, error } = await supabase
      .from('conservation_projects')
      .insert(projectData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing conservation project
   */
  static async updateProject(projectId: string, updates: ConservationProjectUpdate): Promise<ConservationProject> {
    const { data, error } = await supabase
      .from('conservation_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a conservation project
   */
  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('conservation_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }

  /**
   * Get projects by status
   */
  static async getProjectsByStatus(status: string): Promise<ConservationProject[]> {
    const { data, error } = await supabase
      .from('conservation_projects')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get projects by site
   */
  static async getProjectsBySite(siteId: string): Promise<ConservationProject[]> {
    const { data, error } = await supabase
      .from('conservation_projects')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update project progress
   */
  static async updateProjectProgress(projectId: string, progressPercentage: number): Promise<void> {
    const { error } = await supabase
      .from('conservation_projects')
      .update({
        progress_percentage: progressPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) throw error;
  }

  /**
   * Get project statistics
   */
  static async getProjectStatistics(): Promise<{
    total: number;
    active: number;
    completed: number;
    totalBudget: number;
  }> {
    const { data, error } = await supabase
      .from('conservation_projects')
      .select('status, budget');

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      completed: data.filter(p => p.status === 'completed').length,
      totalBudget: data.reduce((sum, p) => sum + (p.budget || 0), 0),
    };

    return stats;
  }
}