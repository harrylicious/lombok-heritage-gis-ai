import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { CulturalSitesService } from "./cultural-sites.service";
import { CategoriesService } from "./categories.service";
import { SiteReviewsService } from "./site-reviews.service";
import { TourismRoutesService } from "./tourism-routes.service";

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];
type SiteReview = Database['public']['Tables']['site_reviews']['Row'];
type TourismRoute = Database['public']['Tables']['tourism_routes']['Row'];

export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  inactiveSites: number;
  verifiedSites: number;
  totalCategories: number;
  categoriesInUse: number;
  unusedCategories: number;
  totalReviews: number;
  verifiedReviews: number;
  totalRoutes: number;
  activeRoutes: number;
  averageRating: number;
}

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get site statistics
      const siteStats = await CulturalSitesService.getSiteStatistics();

      // Get category statistics
      const categoryStats = await CategoriesService.getCategoryUsageStats();

      // Get review statistics
      const totalReviews = await this.getTotalReviewsCount();
      const verifiedReviews = await this.getVerifiedReviewsCount();

      // Get route statistics
      const routes = await TourismRoutesService.fetchAllRoutes();
      const activeRoutes = routes.filter(route => route.is_active).length;

      // Calculate average rating across all sites
      const averageRating = await this.getAverageRating();

      return {
        totalSites: siteStats.total,
        activeSites: siteStats.active,
        inactiveSites: siteStats.inactive,
        verifiedSites: siteStats.verified,
        totalCategories: categoryStats.total_categories,
        categoriesInUse: categoryStats.categories_in_use,
        unusedCategories: categoryStats.unused_categories,
        totalReviews,
        verifiedReviews,
        totalRoutes: routes.length,
        activeRoutes,
        averageRating,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get total number of reviews
   */
  private static async getTotalReviewsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('site_reviews')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get number of verified reviews
   */
  private static async getVerifiedReviewsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('site_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get average rating across all verified reviews
   */
  private static async getAverageRating(): Promise<number> {
    const { data, error } = await supabase
      .from('site_reviews')
      .select('rating')
      .eq('is_verified', true);

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / data.length) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get recent activities (latest sites, reviews, routes)
   */
  static async getRecentActivities(limit: number = 10): Promise<{
    recentSites: SiteWithCategory[];
    recentReviews: (SiteReview & { sites_with_categories: { name: string; local_name: string } })[];
    recentRoutes: TourismRoute[];
  }> {
    try {
      // Get recent sites
      const { data: recentSites, error: sitesError } = await supabase
        .from('sites_with_categories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sitesError) throw sitesError;

      // Get recent reviews
      const { data: recentReviews, error: reviewsError } = await supabase
        .from('site_reviews')
        .select(`
          *,
          sites_with_categories (
            name,
            local_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reviewsError) throw reviewsError;

      // Get recent routes
      const { data: recentRoutes, error: routesError } = await supabase
        .from('tourism_routes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (routesError) throw routesError;

      return {
        recentSites: recentSites || [],
        recentReviews: recentReviews || [],
        recentRoutes: recentRoutes || [],
      };
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  /**
   * Get category distribution for charts
   */
  static async getCategoryDistribution(): Promise<{
    name: string;
    count: number;
    color: string;
  }[]> {
    try {
      const categoriesWithCount = await CategoriesService.getCategoriesWithSiteCount();

      return categoriesWithCount.map(cat => ({
        name: cat.name,
        count: cat.site_count,
        color: cat.color_hex || '#8884d8',
      }));
    } catch (error) {
      console.error('Error fetching category distribution:', error);
      throw error;
    }
  }
}