import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { DashboardService, DashboardStats } from "@/services/dashboard.service";
import { EnhancedDashboardService } from "@/services/enhanced-dashboard.service";
import SummaryCards from "./SummaryCards";
import CategoryChart from "./CategoryChart";
import RecentActivities from "./RecentActivities";
import HeatmapView from "./HeatmapView";
import TimeSeriesChart from "./TimeSeriesChart";
import RecommendationPanel from "./RecommendationPanel";

interface CategoryData {
  name: string;
  count: number;
  color: string;
}

interface RecentSite {
  id: string;
  name: string;
  local_name: string;
  created_at: string;
}

interface RecentReview {
  id: string;
  rating: number;
  created_at: string;
  sites_with_categories: {
    name: string;
    local_name: string;
  };
}

interface RecentRoute {
  id: string;
  name: string;
  created_at: string;
}

interface RecentActivitiesData {
  recentSites: RecentSite[];
  recentReviews: RecentReview[];
  recentRoutes: RecentRoute[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivitiesData>({
    recentSites: [],
    recentReviews: [],
    recentRoutes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);

      // Load all dashboard data in parallel
      const [statsData, categoryData, activitiesData] = await Promise.all([
        DashboardService.getDashboardStats(),
        DashboardService.getCategoryDistribution(),
        DashboardService.getRecentActivities(8)
      ]);

      setStats(statsData);
      setCategoryData(categoryData);
      setRecentActivities(activitiesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    loadDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Ringkasan dan analitik sistem warisan budaya Sasak
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards stats={stats} isLoading={isLoading} />

      {/* Charts and Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <CategoryChart data={categoryData} isLoading={isLoading} />

        {/* Recent Activities */}
        <RecentActivities
          recentSites={recentActivities.recentSites}
          recentReviews={recentActivities.recentReviews}
          recentRoutes={recentActivities.recentRoutes}
          isLoading={isLoading}
        />
      </div>

      {/* New Analytics Components */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Heatmap View */}
        <HeatmapView />

        {/* Time Series Chart */}
        <TimeSeriesChart />
      </div>

      {/* Recommendation Panel */}
      <RecommendationPanel />

      {/* Additional Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tingkat Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeSites > 0
                  ? Math.round((stats.activeSites / stats.totalSites) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Situs aktif dari total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cakupan Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.categoriesInUse > 0
                  ? Math.round((stats.categoriesInUse / stats.totalCategories) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Kategori yang digunakan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tingkat Verifikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReviews > 0
                  ? Math.round((stats.verifiedReviews / stats.totalReviews) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Ulasan terverifikasi
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;