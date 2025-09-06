import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TourismRoute = Database['public']['Tables']['tourism_routes']['Row'];
type TourismRouteInsert = Database['public']['Tables']['tourism_routes']['Insert'];
type TourismRouteUpdate = Database['public']['Tables']['tourism_routes']['Update'];
type RouteSite = Database['public']['Tables']['route_sites']['Row'];

export interface RouteWithSites extends TourismRoute {
  route_sites: (RouteSite & {
    sites_with_categories: {
      id: string;
      name: string;
      local_name: string;
      latitude: number;
      longitude: number;
      category_name: string;
      category_color: string;
      cultural_significance_score: number;
    };
  })[];
}

export class TourismRoutesService {
  /**
   * Fetch all active tourism routes with their sites
   */
  static async fetchAllRoutes(): Promise<RouteWithSites[]> {
    const { data, error } = await supabase
      .from('tourism_routes')
      .select(`
        *,
        route_sites (
          *,
          sites_with_categories (
            id,
            name,
            local_name,
            latitude,
            longitude,
            category_name,
            category_color,
            cultural_significance_score
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single route by ID with its sites
   */
  static async fetchRouteById(routeId: string): Promise<RouteWithSites | null> {
    const { data, error } = await supabase
      .from('tourism_routes')
      .select(`
        *,
        route_sites (
          *,
          sites_with_categories (
            id,
            name,
            local_name,
            latitude,
            longitude,
            category_name,
            category_color,
            cultural_significance_score
          )
        )
      `)
      .eq('id', routeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  }

  /**
   * Create a new tourism route
   */
  static async createRoute(routeData: TourismRouteInsert): Promise<TourismRoute> {
    const { data, error } = await supabase
      .from('tourism_routes')
      .insert(routeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing tourism route
   */
  static async updateRoute(routeId: string, updates: TourismRouteUpdate): Promise<TourismRoute> {
    const { data, error } = await supabase
      .from('tourism_routes')
      .update(updates)
      .eq('id', routeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a tourism route
   */
  static async deleteRoute(routeId: string): Promise<void> {
    const { error } = await supabase
      .from('tourism_routes')
      .delete()
      .eq('id', routeId);

    if (error) throw error;
  }

  /**
   * Add a site to a route
   */
  static async addSiteToRoute(routeId: string, siteId: string, sequenceOrder: number, visitDurationMinutes: number = 60): Promise<void> {
    const { error } = await supabase
      .from('route_sites')
      .insert({
        route_id: routeId,
        site_id: siteId,
        sequence_order: sequenceOrder,
        visit_duration_minutes: visitDurationMinutes,
      });

    if (error) throw error;
  }

  /**
   * Remove a site from a route
   */
  static async removeSiteFromRoute(routeId: string, siteId: string): Promise<void> {
    const { error } = await supabase
      .from('route_sites')
      .delete()
      .eq('route_id', routeId)
      .eq('site_id', siteId);

    if (error) throw error;
  }

  /**
   * Update site sequence in route
   */
  static async updateSiteSequence(routeId: string, siteId: string, sequenceOrder: number): Promise<void> {
    const { error } = await supabase
      .from('route_sites')
      .update({ sequence_order: sequenceOrder })
      .eq('route_id', routeId)
      .eq('site_id', siteId);

    if (error) throw error;
  }

  /**
   * Calculate route statistics
   */
  static calculateRouteStats(route: RouteWithSites) {
    const sites = route.route_sites || [];
    const totalSites = sites.length;

    if (totalSites === 0) {
      return {
        totalSites: 0,
        totalDuration: 0,
        totalDistance: 0,
        averageRating: 0,
      };
    }

    // Calculate total duration from route_sites
    const totalDuration = sites.reduce((sum, rs) => sum + (rs.visit_duration_minutes || 60), 0);

    // Calculate average cultural significance
    const averageRating = sites.reduce((sum, rs) => sum + (rs.sites_with_categories?.cultural_significance_score || 0), 0) / totalSites;

    // Calculate approximate distance (simplified - just sum of distances between consecutive points)
    let totalDistance = 0;
    for (let i = 1; i < sites.length; i++) {
      const prev = sites[i - 1].sites_with_categories;
      const curr = sites[i].sites_with_categories;
      if (prev && curr) {
        const distance = this.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
        totalDistance += distance;
      }
    }

    return {
      totalSites,
      totalDuration,
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate route coordinates from sites (for routes without predefined coordinates)
   */
  static generateRouteCoordinates(route: RouteWithSites): { type: string; coordinates: number[][] } | null {
    const sites = route.route_sites || [];
    if (sites.length === 0) return null;

    // Sort sites by sequence order
    const sortedSites = sites.sort((a, b) => a.sequence_order - b.sequence_order);

    const coordinates = sortedSites.map(rs => [
      rs.sites_with_categories.longitude,
      rs.sites_with_categories.latitude
    ]);

    return {
      type: 'LineString',
      coordinates: coordinates
    };
  }
}