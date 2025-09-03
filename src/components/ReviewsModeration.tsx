import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Check, X, Eye, MessageSquare } from 'lucide-react';
import { SiteReviewsService } from '@/services/site-reviews.service';
import { useToast } from '@/hooks/use-toast';
import { SiteReview } from '@/types/site-reviews';

const ReviewsModeration: React.FC = () => {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const reviewsData = await SiteReviewsService.fetchAllReviews();
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await SiteReviewsService.updateReviewStatus(reviewId, true);
      toast({
        title: "Review approved",
        description: "The review has been approved and is now public.",
      });
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await SiteReviewsService.updateReviewStatus(reviewId, false);
      toast({
        title: "Review rejected",
        description: "The review has been rejected.",
      });
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: "Error",
        description: "Failed to reject review",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await SiteReviewsService.deleteReview(reviewId);
      toast({
        title: "Review deleted",
        description: "The review has been permanently deleted.",
      });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingReviews = reviews.filter(review => !review.is_verified);
  const approvedReviews = reviews.filter(review => review.is_verified);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{pendingReviews.length}</div>
                <div className="text-sm text-muted-foreground">Pending Moderation</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{approvedReviews.length}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Pending Moderation ({pendingReviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
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
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                      <h4 className="font-semibold">{review.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Submitted {formatDate(review.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-3 leading-relaxed">
                  {review.review_text}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(review.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(review.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(review.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approved Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            Approved Reviews ({approvedReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedReviews.length > 0 ? (
            <div className="space-y-4">
              {approvedReviews.slice(0, 10).map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {review.user_id.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.rating} />
                        <span className="text-sm font-medium">{review.rating}/5</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Approved
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{review.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDate(review.created_at)}
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {review.review_text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No approved reviews yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsModeration;