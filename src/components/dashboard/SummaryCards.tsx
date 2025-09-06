import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Tag,
  MessageSquare,
  Route,
  CheckCircle,
  XCircle,
  Star
} from "lucide-react";
import { DashboardStats } from "@/services/dashboard.service";

interface SummaryCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Situs Budaya",
      value: stats.totalSites,
      icon: MapPin,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      details: [
        { label: "Aktif", value: stats.activeSites, color: "text-green-600" },
        { label: "Tidak Aktif", value: stats.inactiveSites, color: "text-red-600" },
        { label: "Terverifikasi", value: stats.verifiedSites, color: "text-purple-600" }
      ]
    },
    {
      title: "Kategori Warisan",
      value: stats.totalCategories,
      icon: Tag,
      color: "text-green-600",
      bgColor: "bg-green-50",
      details: [
        { label: "Digunakan", value: stats.categoriesInUse, color: "text-green-600" },
        { label: "Tidak Digunakan", value: stats.unusedCategories, color: "text-gray-600" }
      ]
    },
    {
      title: "Ulasan",
      value: stats.totalReviews,
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      details: [
        { label: "Terverifikasi", value: stats.verifiedReviews, color: "text-green-600" },
        { label: "Rating Rata-rata", value: stats.averageRating.toFixed(1), color: "text-yellow-600", icon: Star }
      ]
    },
    {
      title: "Rute Wisata",
      value: stats.totalRoutes,
      icon: Route,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      details: [
        { label: "Aktif", value: stats.activeRoutes, color: "text-green-600" }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{card.value}</div>
            <div className="space-y-1">
              {card.details.map((detail, detailIndex) => (
                <div key={detailIndex} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{detail.label}</span>
                  <div className="flex items-center gap-1">
                    {detail.icon && <detail.icon className="h-3 w-3" />}
                    <span className={detail.color}>{detail.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;