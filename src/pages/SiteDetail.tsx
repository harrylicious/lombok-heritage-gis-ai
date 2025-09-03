import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Share2, Facebook, Twitter, Instagram, MapPin, Star, Clock, DollarSign, Image as ImageIcon, MessageSquare, Map } from 'lucide-react';
import { CulturalSitesService } from '@/services/cultural-sites.service';
import { SiteMediaService } from '@/services/site-media.service';
import { SiteReviewsService } from '@/services/site-reviews.service';
import { useToast } from '@/hooks/use-toast';
import { SitesWithCategories } from '@/types/sites-with-categories';
import { SiteMedia } from '@/types/site-media';
import { SiteReview } from '@/types/site-reviews';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import MapView from '@/components/MapView';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

const SiteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<SitesWithCategories | null>(null);
  const [images, setImages] = useState<SiteMedia[]>([]);
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchSiteData();
      fetchReviews();
    }
  }, [id]);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      const [siteData, imagesData] = await Promise.all([
        CulturalSitesService.fetchSiteById(id!),
        SiteMediaService.fetchSiteImages(id!)
      ]);

      if (!siteData) {
        toast({
          title: "Site not found",
          description: "The requested cultural site could not be found.",
          variant: "destructive",
        });
        return;
      }

      setSite(siteData);
      setImages(imagesData);
    } catch (error) {
      console.error('Error fetching site data:', error);
      toast({
        title: "Error",
        description: "Failed to load site details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const reviewsData = await SiteReviewsService.fetchSiteReviews(id!);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = site ? `${site.name} - Warisan Budaya Sasak` : 'Warisan Budaya Sasak';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Site link has been copied to clipboard",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(site ? `${site.name} - Warisan Budaya Sasak` : 'Warisan Budaya Sasak');

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing, so we'll copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Copy this link to share on Instagram",
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-cultural">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-heritage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat detail situs...</p>
        </Card>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-cultural">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Situs Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">Situs budaya yang Anda cari tidak tersedia.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <div className="min-h-screen bg-gradient-cultural">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('facebook')}>
              <Facebook className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('twitter')}>
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('instagram')}>
              <Instagram className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hero Section with Map */}
        <Card className="overflow-hidden">
          <div className="relative">
            {/* Map Container */}
            <div className="h-64 md:h-96">
              <MapView
                sites={[site]}
                selectedSite={site}
                onSiteSelect={() => {}} // Read-only, no selection needed
              />
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{site.name}</h1>
                  <p className="text-white/90 text-lg italic mb-2">{site.local_name}</p>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{site.village}, {site.district}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{site.cultural_significance_score}/10</span>
                    </div>
                  </div>
                </div>

                {/* Primary Image Thumbnail */}
                {primaryImage && (
                  <div className="hidden md:block ml-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white/30">
                      <img
                        src={primaryImage.file_url}
                        alt={site.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-heritage rounded-full"></div>
                <span className="font-medium">{site.category_name}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Site Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                  <TabsTrigger value="gallery">Galeri</TabsTrigger>
                  <TabsTrigger value="reviews">Ulasan ({reviews.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Description */}
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Tentang Situs</h2>
                    <p className="text-muted-foreground leading-relaxed">{site.description}</p>
                  </div>

                  {/* Historical Significance */}
                  {site.historical_significance && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Arti Sejarah</h3>
                      <p className="text-muted-foreground leading-relaxed">{site.historical_significance}</p>
                    </div>
                  )}

                  {/* Site Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-heritage">{site.cultural_significance_score}/10</div>
                      <div className="text-sm text-muted-foreground">Nilai Budaya</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{site.tourism_popularity_score}/10</div>
                      <div className="text-sm text-muted-foreground">Popularitas Wisata</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{images.length}</div>
                      <div className="text-sm text-muted-foreground">Foto</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{reviews.length}</div>
                      <div className="text-sm text-muted-foreground">Ulasan</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gallery" className="mt-6">
                  {images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.file_url}
                            alt={image.title || site.name}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          {image.is_primary && (
                            <Badge className="absolute top-2 left-2 bg-heritage">
                              Utama
                            </Badge>
                          )}
                          {image.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
                              <p className="text-white text-sm font-medium">{image.title}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Tidak ada gambar tersedia</h3>
                      <p className="text-muted-foreground">Galeri foto akan segera ditambahkan untuk situs ini.</p>
                    </div>
                  )}
                </TabsContent>


                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-6">
                    {/* Reviews Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" />
                        Ulasan Pengunjung
                      </h2>
                      {user && (
                        <Button
                          onClick={() => setActiveTab('reviews')}
                          size="sm"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Tulis Ulasan
                        </Button>
                      )}
                    </div>

                    {/* Reviews List */}
                    <ReviewList reviews={reviews} loading={reviewsLoading} />

                    {/* Write Review Form */}
                    {user ? (
                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">Tulis Ulasan Baru</h3>
                        <ReviewForm
                          siteId={id!}
                          onReviewSubmitted={() => {
                            fetchReviews();
                            toast({
                              title: "Review submitted",
                              description: "Your review has been submitted for moderation.",
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <Card className="p-6 text-center border-dashed">
                        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Login untuk Memberikan Ulasan</h3>
                        <p className="text-muted-foreground mb-4">
                          Anda perlu login untuk memberikan ulasan pada situs ini.
                        </p>
                        <Link to="/auth">
                          <Button>Login</Button>
                        </Link>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Site Info */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Informasi Situs</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-heritage" />
                  <div>
                    <p className="font-medium">{site.village}, {site.district}</p>
                    <p className="text-sm text-muted-foreground">Lombok, Indonesia</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Badge variant="secondary" style={{ backgroundColor: `${site.category_color}20`, color: site.category_color }}>
                    {site.category_name}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-heritage fill-current" />
                  <span className="font-medium">{site.cultural_significance_score}/10</span>
                  <span className="text-sm text-muted-foreground">Nilai Budaya</span>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>{site.visiting_hours}</span>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {site.entrance_fee === 0 ? 'Gratis' : `Rp ${site.entrance_fee.toLocaleString()}`}
                  </span>
                </div>

                {site.established_year && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Tahun Berdiri</p>
                      <p className="font-medium">{site.established_year}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Aksi Cepat</h3>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setActiveTab('overview')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Lihat Ringkasan
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setActiveTab('gallery')}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Lihat Galeri
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setActiveTab('reviews')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Lihat Ulasan
                </Button>
                {user && (
                  <Button
                    className="w-full"
                    onClick={() => setActiveTab('reviews')}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Tulis Ulasan
                  </Button>
                )}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{site.village}, {site.district}</span>
                    </div>
                    <div className="font-mono text-xs">
                      {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDetail;