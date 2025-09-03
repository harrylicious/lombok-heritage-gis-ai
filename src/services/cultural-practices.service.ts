import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CulturalPractice = Database['public']['Tables']['cultural_practices']['Row'];
type CulturalPracticeInsert = Database['public']['Tables']['cultural_practices']['Insert'];
type CulturalPracticeUpdate = Database['public']['Tables']['cultural_practices']['Update'];

export class CulturalPracticesService {
  /**
   * Fetch all cultural practices
   */
  static async fetchAllPractices(): Promise<CulturalPractice[]> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single cultural practice by ID
   */
  static async fetchPracticeById(practiceId: string): Promise<CulturalPractice | null> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .eq('id', practiceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  }

  /**
   * Create a new cultural practice
   */
  static async createPractice(practiceData: CulturalPracticeInsert): Promise<CulturalPractice> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .insert(practiceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing cultural practice
   */
  static async updatePractice(practiceId: string, updates: CulturalPracticeUpdate): Promise<CulturalPractice> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .update(updates)
      .eq('id', practiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a cultural practice
   */
  static async deletePractice(practiceId: string): Promise<void> {
    const { error } = await supabase
      .from('cultural_practices')
      .delete()
      .eq('id', practiceId);

    if (error) throw error;
  }

  /**
   * Search practices by name or description
   */
  static async searchPractices(query: string): Promise<CulturalPractice[]> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,local_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Filter practices by practice type
   */
  static async filterByPracticeType(practiceType: string): Promise<CulturalPractice[]> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .eq('practice_type', practiceType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Filter practices by threat level
   */
  static async filterByThreatLevel(threatLevel: string): Promise<CulturalPractice[]> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .eq('threat_level', threatLevel)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get practices linked to a specific site
   */
  static async getPracticesBySite(siteId: string): Promise<CulturalPractice[]> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .contains('related_sites', [siteId])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Link practice to sites
   */
  static async linkPracticeToSites(practiceId: string, siteIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('cultural_practices')
      .update({ related_sites: siteIds })
      .eq('id', practiceId);

    if (error) throw error;
  }

  /**
   * Add sites to existing practice links
   */
  static async addSitesToPractice(practiceId: string, siteIds: string[]): Promise<void> {
    const practice = await this.fetchPracticeById(practiceId);
    if (!practice) throw new Error('Practice not found');

    const currentSites = practice.related_sites || [];
    const updatedSites = [...new Set([...currentSites, ...siteIds])];

    await this.linkPracticeToSites(practiceId, updatedSites);
  }

  /**
   * Remove sites from practice links
   */
  static async removeSitesFromPractice(practiceId: string, siteIds: string[]): Promise<void> {
    const practice = await this.fetchPracticeById(practiceId);
    if (!practice) throw new Error('Practice not found');

    const currentSites = practice.related_sites || [];
    const updatedSites = currentSites.filter(siteId => !siteIds.includes(siteId));

    await this.linkPracticeToSites(practiceId, updatedSites);
  }

  /**
   * Get practices by documentation level
   */
  static async getPracticesByDocumentationLevel(level: string): Promise<CulturalPractice[]> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .eq('documentation_level', level)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update practice threat level
   */
  static async updateThreatLevel(practiceId: string, threatLevel: string): Promise<void> {
    const { error } = await supabase
      .from('cultural_practices')
      .update({ threat_level: threatLevel })
      .eq('id', practiceId);

    if (error) throw error;
  }

  /**
   * Update practice documentation level
   */
  static async updateDocumentationLevel(practiceId: string, level: string): Promise<void> {
    const { error } = await supabase
      .from('cultural_practices')
      .update({ documentation_level: level })
      .eq('id', practiceId);

    if (error) throw error;
  }

  /**
   * Get practice statistics
   */
  static async getPracticeStatistics(): Promise<{
    total: number;
    by_type: Record<string, number>;
    by_threat_level: Record<string, number>;
    by_documentation_level: Record<string, number>;
  }> {
    const practices = await this.fetchAllPractices();

    const stats = {
      total: practices.length,
      by_type: {} as Record<string, number>,
      by_threat_level: {} as Record<string, number>,
      by_documentation_level: {} as Record<string, number>,
    };

    practices.forEach(practice => {
      // Count by practice type
      if (practice.practice_type) {
        stats.by_type[practice.practice_type] = (stats.by_type[practice.practice_type] || 0) + 1;
      }

      // Count by threat level
      if (practice.threat_level) {
        stats.by_threat_level[practice.threat_level] = (stats.by_threat_level[practice.threat_level] || 0) + 1;
      }

      // Count by documentation level
      if (practice.documentation_level) {
        stats.by_documentation_level[practice.documentation_level] = (stats.by_documentation_level[practice.documentation_level] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Bulk update threat levels
   */
  static async bulkUpdateThreatLevels(practiceIds: string[], threatLevel: string): Promise<void> {
    const { error } = await supabase
      .from('cultural_practices')
      .update({ threat_level: threatLevel })
      .in('id', practiceIds);

    if (error) throw error;
  }

  /**
   * Get practices needing attention (high threat level, low documentation)
   */
  static async getPracticesNeedingAttention(): Promise<CulturalPractice[]> {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .or('threat_level.eq.critical,threat_level.eq.high,documentation_level.eq.low,documentation_level.eq.none')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}