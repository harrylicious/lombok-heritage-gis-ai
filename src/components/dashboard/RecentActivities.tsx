import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  MessageSquare,
  Route,
  Clock,
  Star,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

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

interface RecentActivitiesProps {
  recentSites: RecentSite[];
  recentReviews: RecentReview[];
  recentRoutes: RecentRoute[];
  isLoading?: boolean;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
  recentSites,
  recentReviews,
  recentRoutes,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine and sort all activities by date
  const allActivities = [
    ...recentSites.map(site => ({
      type: 'site' as const,
      id: site.id,
      title: `Situs baru: ${site.name}`,
      subtitle: site.local_name,
      timestamp: site.created_at,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    })),
    ...recentReviews.map(review => ({
      type: 'review' as const,
      id: review.id,
      title: `Ulasan baru untuk ${review.sites_with_categories.name}`,
      subtitle: `${review.rating} ⭐`,
      timestamp: review.created_at,
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    })),
    ...recentRoutes.map(route => ({
      type: 'route' as const,
      id: route.id,
      title: `Rute baru: ${route.name}`,
      subtitle: '',
      timestamp: route.created_at,
      icon: Route,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Aktivitas Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {allActivities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Belum ada aktivitas terbaru
              </div>
            ) : (
              allActivities.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${activity.bgColor} ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {activity.subtitle}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: id
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;