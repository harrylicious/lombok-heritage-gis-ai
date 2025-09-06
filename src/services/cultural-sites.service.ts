import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CulturalSite = Database['public']['Tables']['cultural_sites']['Row'];
type CulturalSiteInsert = Database['public']['Tables']['cultural_sites']['Insert'];
type CulturalSiteUpdate = Database['public']['Tables']['cultural_sites']['Update'];
type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

export class CulturalSitesService {
  /**
   * Fetch all cultural sites with category information
   */
  static async fetchAllSites(): Promise<SiteWithCategory[]> {
    const { data, error } = await supabase
      .from('sites_with_categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single site by ID
   */
  static async fetchSiteById(siteId: string): Promise<SiteWithCategory | null> {
    const { data, error } = await supabase
      .from('sites_with_categories')
      .select('*')
      .eq('id', siteId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  }

  /**
   * Create a new cultural site
   */
  static async createSite(siteData: CulturalSiteInsert): Promise<CulturalSite> {
    const { data, error } = await supabase
      .from('cultural_sites')
      .insert(siteData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing cultural site
   */
  static async updateSite(siteId: string, updates: CulturalSiteUpdate): Promise<CulturalSite> {
    const { data, error } = await supabase
      .from('cultural_sites')
      .update(updates)
      .eq('id', siteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a cultural site
   */
  static async deleteSite(siteId: string): Promise<void> {
    const { error } = await supabase
      .from('cultural_sites')
      .delete()
      .eq('id', siteId);

    if (error) throw error;
  }

  /**
   * Search sites by name or description
   */
  static async searchSites(query: string): Promise<SiteWithCategory[]> {
    const { data, error } = await supabase
      .from('sites_with_categories')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,local_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Filter sites by category
   */
  static async filterByCategory(categoryId: string): Promise<SiteWithCategory[]> {
    const { data, error } = await supabase
      .from('sites_with_categories')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Filter sites by status (active/inactive)
   */
  static async filterByStatus(isActive: boolean): Promise<SiteWithCategory[]> {
    const { data, error } = await supabase
      .from('sites_with_categories')
      .select('*')
      .eq('is_active', isActive)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get sites within a geographic bounds
   */
  static async getSitesInBounds(
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number }
  ): Promise<SiteWithCategory[]> {
    const { data, error } = await supabase
      .from('sites_with_categories')
      .select('*')
      .gte('latitude', southWest.lat)
      .lte('latitude', northEast.lat)
      .gte('longitude', southWest.lng)
      .lte('longitude', northEast.lng);

    if (error) throw error;
    return data || [];
  }

  /**
   * Update site verification status
   */
  static async updateVerificationStatus(
    siteId: string,
    verifiedBy: string,
    isVerified: boolean = true
  ): Promise<void> {
    const { error } = await supabase
      .from('cultural_sites')
      .update({
        verified_at: isVerified ? new Date().toISOString() : null,
        verified_by: isVerified ? verifiedBy : null,
      })
      .eq('id', siteId);

    if (error) throw error;
  }

  /**
   * Bulk update site status
   */
  static async bulkUpdateStatus(siteIds: string[], isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('cultural_sites')
      .update({ is_active: isActive })
      .in('id', siteIds);

    if (error) throw error;
  }

  /**
   * Get site statistics
   */
  static async getSiteStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
  }> {
    const { data, error } = await supabase
      .from('cultural_sites')
      .select('is_active, verified_at');

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(site => site.is_active).length,
      inactive: data.filter(site => !site.is_active).length,
      verified: data.filter(site => site.verified_at).length,
    };

    return stats;
  }
}