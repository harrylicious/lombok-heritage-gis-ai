import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

export interface HeatmapDataPoint {
  lat: number;
  lng: number;
  intensity: number;
  site: SiteWithCategory;
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
  cumulative: number;
}

export interface PreservationStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export class EnhancedDashboardService {
  /**
   * Get heatmap data for cultural site density visualization
   */
  static async getHeatmapData(): Promise<HeatmapDataPoint[]> {
    try {
      const { data: sites, error } = await supabase
        .from('sites_with_categories')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      return sites.map(site => ({
        lat: site.latitude!,
        lng: site.longitude!,
        intensity: this.calculateHeatmapIntensity(site),
        site
      }));
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      throw error;
    }
  }

  /**
   * Calculate heatmap intensity based on site significance
   */
  private static calculateHeatmapIntensity(site: SiteWithCategory): number {
    let intensity = 0.3; // Base intensity

    // Cultural significance score (0-10) contributes 40%
    if (site.cultural_significance_score) {
      intensity += (site.cultural_significance_score / 10) * 0.4;
    }

    // Tourism popularity score (0-10) contributes 30%
    if (site.tourism_popularity_score) {
      intensity += (site.tourism_popularity_score / 10) * 0.3;
    }

    // UNESCO sites get boost
    if (site.is_unesco_site) {
      intensity += 0.2;
    }

    // Preservation status affects intensity
    const statusMultiplier = this.getPreservationStatusMultiplier(site.preservation_status);
    intensity *= statusMultiplier;

    return Math.min(intensity, 1.0); // Cap at 1.0
  }

  /**
   * Get preservation status multiplier for heatmap intensity
   */
  private static getPreservationStatusMultiplier(status: string | null): number {
    switch (status) {
      case 'excellent': return 1.0;
      case 'good': return 0.9;
      case 'fair': return 0.8;
      case 'poor': return 0.7;
      case 'critical': return 0.6;
      case 'restored': return 1.1;
      case 'under_restoration': return 0.9;
      default: return 0.8;
    }
  }

  /**
   * Get time-series data for site additions over time
   */
  static async getSiteGrowthData(months: number = 12): Promise<TimeSeriesDataPoint[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: sites, error } = await supabase
        .from('cultural_sites')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group sites by month
      const monthlyData: { [key: string]: number } = {};
      let cumulative = 0;

      // Initialize all months with 0
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = 0;
      }

      // Count sites per month
      sites.forEach(site => {
        const date = new Date(site.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key] !== undefined) {
          monthlyData[key]++;
        }
      });

      // Convert to time series format
      const timeSeriesData: TimeSeriesDataPoint[] = [];
      Object.keys(monthlyData).sort().forEach(key => {
        cumulative += monthlyData[key];
        timeSeriesData.push({
          date: key,
          count: monthlyData[key],
          cumulative
        });
      });

      return timeSeriesData;
    } catch (error) {
      console.error('Error fetching site growth data:', error);
      throw error;
    }
  }

  /**
   * Get preservation status distribution for charts
   */
  static async getPreservationStatusDistribution(): Promise<PreservationStatusData[]> {
    try {
      const { data: sites, error } = await supabase
        .from('cultural_sites')
        .select('preservation_status')
        .eq('is_active', true);

      if (error) throw error;

      const statusCounts: { [key: string]: number } = {};
      const total = sites.length;

      // Count sites by preservation status
      sites.forEach(site => {
        const status = site.preservation_status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Convert to chart data format
      return Object.keys(statusCounts).map(status => ({
        status: this.formatPreservationStatus(status),
        count: statusCounts[status],
        percentage: Math.round((statusCounts[status] / total) * 100),
        color: this.getPreservationStatusColor(status)
      }));
    } catch (error) {
      console.error('Error fetching preservation status distribution:', error);
      throw error;
    }
  }

  /**
   * Format preservation status for display
   */
  private static formatPreservationStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
      'critical': 'Critical',
      'restored': 'Restored',
      'under_restoration': 'Under Restoration',
      'unknown': 'Unknown'
    };
    return statusMap[status] || status;
  }

  /**
   * Get color for preservation status
   */
  private static getPreservationStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'excellent': '#22c55e', // green
      'good': '#84cc16', // light green
      'fair': '#eab308', // yellow
      'poor': '#f97316', // orange
      'critical': '#ef4444', // red
      'restored': '#3b82f6', // blue
      'under_restoration': '#8b5cf6', // purple
      'unknown': '#6b7280' // gray
    };
    return colorMap[status] || '#6b7280';
  }

  /**
   * Get sites with highest preservation priority
   */
  static async getHighPrioritySites(limit: number = 10): Promise<SiteWithCategory[]> {
    try {
      const { data: sites, error } = await supabase
        .from('sites_with_categories')
        .select('*')
        .eq('is_active', true)
        .order('cultural_significance_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return sites;
    } catch (error) {
      console.error('Error fetching high priority sites:', error);
      throw error;
    }
  }
}