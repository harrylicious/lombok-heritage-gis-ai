import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SiteReview = Database['public']['Tables']['site_reviews']['Row'];
type SiteReviewInsert = Database['public']['Tables']['site_reviews']['Insert'];
type SiteReviewUpdate = Database['public']['Tables']['site_reviews']['Update'];

export class SiteReviewsService {
  /**
   * Fetch all reviews for a specific site
   */
  static async fetchSiteReviews(siteId: string): Promise<SiteReview[]> {
    const { data, error } = await supabase
      .from('site_reviews')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch all reviews (for admin moderation)
   */
  static async fetchAllReviews(): Promise<SiteReview[]> {
    const { data, error } = await supabase
      .from('site_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new review
   */
  static async createReview(reviewData: SiteReviewInsert): Promise<SiteReview> {
    const { data, error } = await supabase
      .from('site_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update review verification status
   */
  static async updateReviewStatus(reviewId: string, isVerified: boolean): Promise<void> {
    const { error } = await supabase
      .from('site_reviews')
      .update({ is_verified: isVerified })
      .eq('id', reviewId);

    if (error) throw error;
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('site_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  }

  /**
   * Get review statistics for a site
   */
  static async getSiteReviewStats(siteId: string): Promise<{
    total: number;
    averageRating: number;
    verified: number;
  }> {
    const { data, error } = await supabase
      .from('site_reviews')
      .select('rating, is_verified')
      .eq('site_id', siteId);

    if (error) throw error;

    const verifiedReviews = data.filter(review => review.is_verified);
    const total = verifiedReviews.length;
    const averageRating = total > 0
      ? verifiedReviews.reduce((sum, review) => sum + review.rating, 0) / total
      : 0;

    return {
      total,
      averageRating,
      verified: verifiedReviews.length,
    };
  }
}