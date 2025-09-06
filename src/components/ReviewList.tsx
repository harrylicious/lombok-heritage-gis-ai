import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Calendar, Clock, ThumbsUp } from 'lucide-react';
import { SiteReview } from '@/types/site-reviews';

interface ReviewListProps {
  reviews: SiteReview[];
  loading?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada ulasan</h3>
          <p className="text-muted-foreground">
            Jadilah yang pertama memberikan ulasan untuk situs ini!
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>
                    {review.user_id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-medium">{review.rating}/5</span>
                    {review.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Terverifikasi
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold">{review.title}</h4>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(review.created_at)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {review.review_text}
            </p>

            {/* Additional details */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {review.visit_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Dikunjungi: {formatDate(review.visit_date)}</span>
                </div>
              )}

              {review.recommended_time_to_visit && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Waktu terbaik: {review.recommended_time_to_visit}</span>
                </div>
              )}

              {review.accessibility_rating && (
                <div className="flex items-center gap-1">
                  <span>Aksesibilitas:</span>
                  <StarRating rating={review.accessibility_rating} />
                </div>
              )}

              {review.cultural_authenticity_rating && (
                <div className="flex items-center gap-1">
                  <span>Autentisitas:</span>
                  <StarRating rating={review.cultural_authenticity_rating} />
                </div>
              )}

              {review.helpful_votes > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{review.helpful_votes} berguna</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReviewList;