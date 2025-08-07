import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Eye, 
  Brain,
  Camera,
  Calendar
} from 'lucide-react';

interface CulturalSite {
  id: string;
  name: string;
  local_name: string;
  description: string;
  latitude: number;
  longitude: number;
  category_name: string;
  category_color: string;
  preservation_status: string;
  cultural_significance_score: number;
  tourism_popularity_score: number;
  visiting_hours: string;
  entrance_fee: number;
  village: string;
  district: string;
  established_year?: number;
  ai_analysis_count?: number;
  review_count?: number;
  average_rating?: number;
}

interface SiteCardProps {
  site: CulturalSite;
  onViewDetails?: (site: CulturalSite) => void;
  onViewOnMap?: (site: CulturalSite) => void;
  className?: string;
}

const getPreservationColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'text-green-600 bg-green-50';
    case 'good': return 'text-blue-600 bg-blue-50';
    case 'fair': return 'text-yellow-600 bg-yellow-50';
    case 'poor': return 'text-orange-600 bg-orange-50';
    case 'critical': return 'text-red-600 bg-red-50';
    case 'restored': return 'text-purple-600 bg-purple-50';
    case 'under_restoration': return 'text-indigo-600 bg-indigo-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const SiteCard: React.FC<SiteCardProps> = ({ 
  site, 
  onViewDetails, 
  onViewOnMap,
  className = '' 
}) => {
  return (
    <Card className={`group hover:shadow-heritage transition-all duration-300 hover:scale-[1.02] ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-heritage transition-colors">
              {site.name}
            </h3>
            <p className="text-sm text-muted-foreground italic mt-1">
              {site.local_name}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className="ml-4"
            style={{ 
              backgroundColor: `${site.category_color}20`, 
              color: site.category_color,
              borderColor: `${site.category_color}40`
            }}
          >
            {site.category_name}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {site.description}
        </p>

        {/* Status and Scores */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={`text-xs ${getPreservationColor(site.preservation_status)}`}>
            {site.preservation_status.replace('_', ' ')}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-heritage fill-current" />
            <span>{site.cultural_significance_score}/10</span>
          </div>

          {site.ai_analysis_count && site.ai_analysis_count > 0 && (
            <div className="flex items-center gap-1 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
              <Brain className="w-3 h-3" />
              <span>AI Analyzed</span>
            </div>
          )}
        </div>

        {/* Location and Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{site.village}, {site.district}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{site.visiting_hours}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>
                {site.entrance_fee === 0 ? 'Gratis' : `Rp ${site.entrance_fee.toLocaleString()}`}
              </span>
            </div>
          </div>

          {site.established_year && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Didirikan {site.established_year}</span>
            </div>
          )}
        </div>

        {/* Reviews and Ratings */}
        {(site.review_count !== undefined && site.review_count > 0) && (
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium">{site.average_rating?.toFixed(1)}</span>
              <span className="text-muted-foreground">({site.review_count} ulasan)</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onViewDetails?.(site)}
            className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:shadow-cultural transition-all"
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Detail
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewOnMap?.(site)}
            className="hover:bg-heritage hover:text-heritage-foreground transition-colors"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Peta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteCard;