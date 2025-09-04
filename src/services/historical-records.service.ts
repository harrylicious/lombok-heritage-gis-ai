import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type HistoricalRecord = Database['public']['Tables']['historical_records']['Row'];
type HistoricalRecordInsert = Database['public']['Tables']['historical_records']['Insert'];
type HistoricalRecordUpdate = Database['public']['Tables']['historical_records']['Update'];

export class HistoricalRecordsService {
  /**
   * Fetch all historical records
   */
  static async fetchAllRecords(): Promise<HistoricalRecord[]> {
    const { data, error } = await supabase
      .from('historical_records')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch historical records for a specific site
   */
  static async fetchRecordsBySite(siteId: string): Promise<HistoricalRecord[]> {
    const { data, error } = await supabase
      .from('historical_records')
      .select('*')
      .eq('site_id', siteId)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single historical record by ID
   */
  static async fetchRecordById(recordId: string): Promise<HistoricalRecord | null> {
    const { data, error } = await supabase
      .from('historical_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  }

  /**
   * Create a new historical record
   */
  static async createRecord(recordData: HistoricalRecordInsert): Promise<HistoricalRecord> {
    const { data, error } = await supabase
      .from('historical_records')
      .insert(recordData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing historical record
   */
  static async updateRecord(recordId: string, updates: HistoricalRecordUpdate): Promise<HistoricalRecord> {
    const { data, error } = await supabase
      .from('historical_records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a historical record
   */
  static async deleteRecord(recordId: string): Promise<void> {
    const { error } = await supabase
      .from('historical_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;
  }

  /**
   * Search historical records by title or description
   */
  static async searchRecords(query: string): Promise<HistoricalRecord[]> {
    const { data, error } = await supabase
      .from('historical_records')
      .select('*')
      .or(`event_title.ilike.%${query}%,event_description.ilike.%${query}%`)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Filter records by historical period
   */
  static async filterByPeriod(period: string): Promise<HistoricalRecord[]> {
    const { data, error } = await supabase
      .from('historical_records')
      .select('*')
      .eq('historical_period', period)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get records with significance level above threshold
   */
  static async getHighSignificanceRecords(minLevel: number = 7): Promise<HistoricalRecord[]> {
    const { data, error } = await supabase
      .from('historical_records')
      .select('*')
      .gte('significance_level', minLevel)
      .order('significance_level', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get timeline data for a site (events grouped by year)
   */
  static async getSiteTimeline(siteId: string): Promise<{
    year: number;
    events: HistoricalRecord[];
  }[]> {
    const records = await this.fetchRecordsBySite(siteId);

    // Group by year
    const groupedByYear = records.reduce((acc, record) => {
      if (!record.event_date) return acc;

      const year = new Date(record.event_date).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(record);
      return acc;
    }, {} as Record<number, HistoricalRecord[]>);

    // Convert to array and sort by year descending
    return Object.entries(groupedByYear)
      .map(([year, events]) => ({
        year: parseInt(year),
        events: events.sort((a, b) => {
          if (!a.event_date || !b.event_date) return 0;
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        })
      }))
      .sort((a, b) => b.year - a.year);
  }
}