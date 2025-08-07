import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Brain, 
  Camera,
  Search,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import heroImage from '@/assets/lombok-heritage-hero.jpg';

interface HeroBannerProps {
  onExploreClick?: () => void;
  onSearchFocus?: () => void;
  totalSites?: number;
  aiAnalyzedSites?: number;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ 
  onExploreClick, 
  onSearchFocus,
  totalSites = 0,
  aiAnalyzedSites = 0
}) => {
  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-2xl shadow-heritage">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative h-full flex items-center justify-start px-8 md:px-12 lg:px-16">
        <div className="max-w-2xl text-white">
          {/* Badge */}
          <Badge className="mb-6 bg-heritage/20 text-heritage-foreground border-heritage/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by AI & CNN Technology
          </Badge>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white to-heritage-foreground bg-clip-text">
              Warisan Budaya
            </span>
            <br />
            <span className="bg-gradient-to-r from-heritage to-accent bg-clip-text text-transparent">
              Sasak Lombok
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
            Jelajahi kekayaan warisan budaya Sasak dengan teknologi 
            <span className="text-accent font-semibold"> Kecerdasan Buatan</span> dan 
            <span className="text-heritage font-semibold"> Convolutional Neural Network</span> 
            untuk pemetaan dan pengelolaan yang optimal.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="w-5 h-5 text-heritage" />
              <span className="font-semibold">{totalSites}</span>
              <span className="text-white/80">Situs Budaya</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Brain className="w-5 h-5 text-accent" />
              <span className="font-semibold">{aiAnalyzedSites}</span>
              <span className="text-white/80">Analisis AI</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Camera className="w-5 h-5 text-primary-glow" />
              <span className="font-semibold">CNN</span>
              <span className="text-white/80">Technology</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              onClick={onExploreClick}
              className="bg-gradient-to-r from-heritage to-heritage/80 hover:from-heritage/90 hover:to-heritage text-heritage-foreground shadow-heritage hover:shadow-xl transition-all duration-300 group"
            >
              <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Jelajahi Sekarang
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={onSearchFocus}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Lihat di Peta
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Info Cards */}
      <div className="absolute bottom-6 right-6 flex gap-4">
        <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold text-heritage">AI</div>
            <div className="text-xs text-white/80">Powered</div>
          </div>
        </Card>
        <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">GIS</div>
            <div className="text-xs text-white/80">Mapping</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HeroBanner;