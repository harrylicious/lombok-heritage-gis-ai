import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

export interface PreservationPriority {
  siteId: string;
  siteName: string;
  priorityScore: number;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
  recommendedActions: string[];
  scores: {
    preservationStatus: number;
    historicalSignificance: number;
    tourismPopularity: number;
    siteAge: number;
    unescoStatus: number;
  };
}

export interface RecommendationStats {
  totalSites: number;
  criticalPriority: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  averageScore: number;
}

export class RecommendationService {
  // Scoring weights based on importance ranking
  private static readonly WEIGHTS = {
    preservationStatus: 0.40,    // 40% - Most important
    historicalSignificance: 0.25, // 25% - Second most important
    tourismPopularity: 0.20,     // 20% - Third most important
    siteAge: 0.10,              // 10% - Fourth most important
    unescoStatus: 0.05          // 5% - Least important
  };

  /**
   * Calculate preservation priority for all sites
   */
  static async calculateAllPriorities(): Promise<PreservationPriority[]> {
    try {
      const { data: sites, error } = await supabase
        .from('sites_with_categories')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      return sites.map(site => this.calculateSitePriority(site));
    } catch (error) {
      console.error('Error calculating preservation priorities:', error);
      throw error;
    }
  }

  /**
   * Calculate preservation priority for a single site
   */
  static calculateSitePriority(site: SiteWithCategory): PreservationPriority {
    const scores = {
      preservationStatus: this.scorePreservationStatus(site.preservation_status),
      historicalSignificance: this.scoreHistoricalSignificance(site.cultural_significance_score),
      tourismPopularity: this.scoreTourismPopularity(site.tourism_popularity_score),
      siteAge: this.scoreSiteAge(site.established_year),
      unescoStatus: this.scoreUnescoStatus(site.is_unesco_site)
    };

    // Calculate weighted total score
    const priorityScore = Object.entries(scores).reduce(
      (total, [key, score]) => total + score * this.WEIGHTS[key as keyof typeof this.WEIGHTS],
      0
    );

    const priorityLevel = this.determinePriorityLevel(priorityScore);
    const reasons = this.generateReasons(scores, site);
    const recommendedActions = this.generateRecommendedActions(priorityLevel, site);

    return {
      siteId: site.id,
      siteName: site.name || 'Unknown Site',
      priorityScore,
      priorityLevel,
      reasons,
      recommendedActions,
      scores
    };
  }

  /**
   * Score preservation status (0-10 scale)
   */
  private static scorePreservationStatus(status: string | null): number {
    switch (status) {
      case 'critical': return 10;
      case 'poor': return 9;
      case 'fair': return 6;
      case 'good': return 3;
      case 'excellent': return 1;
      case 'restored': return 2;
      case 'under_restoration': return 4;
      default: return 5; // unknown
    }
  }

  /**
   * Score historical significance (0-10 scale, higher is more significant)
   */
  private static scoreHistoricalSignificance(score: number | null): number {
    if (!score) return 5; // neutral score for unknown
    // Invert the scale since higher significance should give higher priority
    return Math.max(0, 10 - score);
  }

  /**
   * Score tourism popularity (0-10 scale, higher popularity = higher priority)
   */
  private static scoreTourismPopularity(score: number | null): number {
    if (!score) return 5; // neutral score for unknown
    return score; // Higher popularity = higher priority score
  }

  /**
   * Score site age (0-10 scale, older sites = higher priority)
   */
  private static scoreSiteAge(establishedYear: number | null): number {
    if (!establishedYear) return 5; // neutral score for unknown

    const currentYear = new Date().getFullYear();
    const age = currentYear - establishedYear;

    // Score based on age ranges
    if (age >= 500) return 10; // Very old (500+ years)
    if (age >= 200) return 8;  // Old (200-499 years)
    if (age >= 100) return 6;  // Moderately old (100-199 years)
    if (age >= 50) return 4;   // Recent (50-99 years)
    return 2; // Very recent (< 50 years)
  }

  /**
   * Score UNESCO status (0-10 scale)
   */
  private static scoreUnescoStatus(isUnesco: boolean | null): number {
    return isUnesco ? 10 : 0;
  }

  /**
   * Determine priority level based on total score
   */
  private static determinePriorityLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Generate reasons for the priority score
   */
  private static generateReasons(
    scores: PreservationPriority['scores'],
    site: SiteWithCategory
  ): string[] {
    const reasons: string[] = [];

    if (scores.preservationStatus >= 8) {
      reasons.push('Critical or poor preservation status requires immediate attention');
    }

    if (scores.historicalSignificance >= 7) {
      reasons.push('High historical significance demands preservation priority');
    }

    if (scores.tourismPopularity >= 7) {
      reasons.push('High tourism popularity increases urgency for preservation');
    }

    if (scores.siteAge >= 7) {
      reasons.push('Ancient site requires special preservation measures');
    }

    if (scores.unescoStatus >= 5) {
      reasons.push('UNESCO World Heritage status requires international standards');
    }

    if (reasons.length === 0) {
      reasons.push('Standard preservation monitoring recommended');
    }

    return reasons;
  }

  /**
   * Generate recommended actions based on priority level
   */
  private static generateRecommendedActions(
    priorityLevel: string,
    site: SiteWithCategory
  ): string[] {
    const actions: string[] = [];

    switch (priorityLevel) {
      case 'critical':
        actions.push('Immediate conservation assessment required');
        actions.push('Emergency stabilization measures needed');
        actions.push('UNESCO expert consultation recommended');
        actions.push('Public access restrictions may be necessary');
        break;

      case 'high':
        actions.push('Detailed condition survey within 3 months');
        actions.push('Conservation planning and budgeting');
        actions.push('Community engagement for preservation efforts');
        actions.push('Regular monitoring schedule implementation');
        break;

      case 'medium':
        actions.push('Annual condition assessment');
        actions.push('Preventive maintenance planning');
        actions.push('Documentation and monitoring improvements');
        actions.push('Community awareness programs');
        break;

      case 'low':
        actions.push('Regular monitoring and documentation');
        actions.push('Preventive maintenance as needed');
        actions.push('Educational programs for local community');
        break;
    }

    return actions;
  }

  /**
   * Get sites by priority level
   */
  static async getSitesByPriority(
    priorityLevel: 'critical' | 'high' | 'medium' | 'low',
    limit: number = 20
  ): Promise<PreservationPriority[]> {
    const allPriorities = await this.calculateAllPriorities();

    return allPriorities
      .filter(priority => priority.priorityLevel === priorityLevel)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit);
  }

  /**
   * Get recommendation statistics
   */
  static async getRecommendationStats(): Promise<RecommendationStats> {
    const allPriorities = await this.calculateAllPriorities();

    const stats = {
      totalSites: allPriorities.length,
      criticalPriority: allPriorities.filter(p => p.priorityLevel === 'critical').length,
      highPriority: allPriorities.filter(p => p.priorityLevel === 'high').length,
      mediumPriority: allPriorities.filter(p => p.priorityLevel === 'medium').length,
      lowPriority: allPriorities.filter(p => p.priorityLevel === 'low').length,
      averageScore: allPriorities.reduce((sum, p) => sum + p.priorityScore, 0) / allPriorities.length
    };

    return stats;
  }

  /**
   * Get top priority sites for immediate action
   */
  static async getTopPrioritySites(limit: number = 10): Promise<PreservationPriority[]> {
    const allPriorities = await this.calculateAllPriorities();

    return allPriorities
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit);
  }

  /**
   * Export recommendations as CSV
   */
  static exportRecommendationsAsCSV(priorities: PreservationPriority[]): string {
    const headers = [
      'Site Name',
      'Priority Level',
      'Priority Score',
      'Preservation Status Score',
      'Historical Significance Score',
      'Tourism Popularity Score',
      'Site Age Score',
      'UNESCO Status Score',
      'Reasons',
      'Recommended Actions'
    ];

    const rows = priorities.map(priority => [
      priority.siteName,
      priority.priorityLevel,
      priority.priorityScore.toFixed(2),
      priority.scores.preservationStatus,
      priority.scores.historicalSignificance,
      priority.scores.tourismPopularity,
      priority.scores.siteAge,
      priority.scores.unescoStatus,
      priority.reasons.join('; '),
      priority.recommendedActions.join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}