import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send } from 'lucide-react';
import { SiteReviewsService } from '@/services/site-reviews.service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReviewFormProps {
  siteId: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ siteId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [recommendedTime, setRecommendedTime] = useState('');
  const [accessibilityRating, setAccessibilityRating] = useState(0);
  const [authenticityRating, setAuthenticityRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a star rating",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !reviewText.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill in title and review text",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to submit a review",
          variant: "destructive",
        });
        return;
      }

      await SiteReviewsService.createReview({
        site_id: siteId,
        user_id: user.id,
        rating,
        title: title.trim(),
        review_text: reviewText.trim(),
        visit_date: visitDate || null,
        recommended_time_to_visit: recommendedTime || null,
        accessibility_rating: accessibilityRating || null,
        cultural_authenticity_rating: authenticityRating || null,
      });

      toast({
        title: "Review submitted",
        description: "Thank you for your review! It will be published after moderation.",
      });

      // Reset form
      setRating(0);
      setTitle('');
      setReviewText('');
      setVisitDate('');
      setRecommendedTime('');
      setAccessibilityRating(0);
      setAuthenticityRating(0);

      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    hoverValue,
    onHover
  }: {
    value: number;
    onChange: (rating: number) => void;
    hoverValue?: number;
    onHover?: (rating: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover?.(star)}
          onMouseLeave={() => onHover?.(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 ${
              star <= (hoverValue || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Tulis Ulasan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="text-base font-medium">Rating *</Label>
            <div className="mt-2">
              <StarRating
                value={rating}
                onChange={setRating}
                hoverValue={hoverRating}
                onHover={setHoverRating}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Judul Ulasan *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Berikan judul untuk ulasan Anda"
              maxLength={100}
              required
            />
          </div>

          {/* Review Text */}
          <div>
            <Label htmlFor="reviewText">Ulasan *</Label>
            <Textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Bagikan pengalaman Anda mengunjungi situs ini..."
              rows={4}
              maxLength={1000}
              required
            />
          </div>

          {/* Visit Date */}
          <div>
            <Label htmlFor="visitDate">Tanggal Kunjungan</Label>
            <Input
              id="visitDate"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          {/* Recommended Time */}
          <div>
            <Label htmlFor="recommendedTime">Waktu Terbaik untuk Berkunjung</Label>
            <Input
              id="recommendedTime"
              value={recommendedTime}
              onChange={(e) => setRecommendedTime(e.target.value)}
              placeholder="Contoh: Pagi hari, Siang hari, dll."
            />
          </div>

          {/* Accessibility Rating */}
          <div>
            <Label>Aksesibilitas</Label>
            <div className="mt-2">
              <StarRating
                value={accessibilityRating}
                onChange={setAccessibilityRating}
              />
            </div>
          </div>

          {/* Authenticity Rating */}
          <div>
            <Label>Autentisitas Budaya</Label>
            <div className="mt-2">
              <StarRating
                value={authenticityRating}
                onChange={setAuthenticityRating}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Kirim Ulasan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;