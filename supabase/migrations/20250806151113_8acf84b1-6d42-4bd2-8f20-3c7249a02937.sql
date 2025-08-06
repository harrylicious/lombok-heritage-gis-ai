-- Create enum types for better data consistency
CREATE TYPE heritage_category AS ENUM (
  'architecture', 'traditional_house', 'mosque', 'temple', 'craft_center', 
  'ceremony_site', 'historical_site', 'cultural_landscape', 'traditional_market'
);

CREATE TYPE preservation_status AS ENUM (
  'excellent', 'good', 'fair', 'poor', 'critical', 'restored', 'under_restoration'
);

CREATE TYPE user_role AS ENUM (
  'admin', 'researcher', 'guide', 'tourist', 'local_authority', 'cultural_expert'
);

CREATE TYPE analysis_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'requires_review'
);

-- Users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'tourist',
  organization TEXT,
  expertise TEXT[],
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Heritage categories table
CREATE TABLE public.heritage_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  color_hex TEXT DEFAULT '#8B4513',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cultural heritage sites table
CREATE TABLE public.cultural_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  local_name TEXT,
  description TEXT,
  historical_significance TEXT,
  category_id UUID REFERENCES heritage_categories(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  altitude DECIMAL(8, 2),
  address TEXT,
  village TEXT,
  district TEXT,
  regency TEXT DEFAULT 'Lombok',
  province TEXT DEFAULT 'Nusa Tenggara Barat',
  postal_code TEXT,
  preservation_status preservation_status DEFAULT 'good',
  accessibility_info TEXT,
  visiting_hours TEXT,
  entrance_fee DECIMAL(10, 2) DEFAULT 0,
  contact_info TEXT,
  website_url TEXT,
  established_year INTEGER,
  cultural_significance_score DECIMAL(3, 2) DEFAULT 5.0,
  tourism_popularity_score DECIMAL(3, 2) DEFAULT 5.0,
  is_unesco_site BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(user_id),
  verified_by UUID REFERENCES profiles(user_id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Media files for cultural sites
CREATE TABLE public.site_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES cultural_sites(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  photographer TEXT,
  capture_date TIMESTAMP WITH TIME ZONE,
  is_primary BOOLEAN DEFAULT false,
  metadata JSONB,
  uploaded_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI analysis results from CNN processing
CREATE TABLE public.ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES cultural_sites(id) ON DELETE CASCADE,
  image_id UUID REFERENCES site_media(id),
  analysis_type TEXT NOT NULL, -- 'architectural_pattern', 'degradation_detection', 'style_classification'
  model_version TEXT NOT NULL,
  confidence_score DECIMAL(5, 4),
  results JSONB NOT NULL,
  processing_time_ms INTEGER,
  status analysis_status DEFAULT 'pending',
  error_message TEXT,
  processed_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Historical timeline records
CREATE TABLE public.historical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES cultural_sites(id) ON DELETE CASCADE,
  event_date DATE,
  event_title TEXT NOT NULL,
  event_description TEXT,
  historical_period TEXT,
  sources TEXT[],
  significance_level INTEGER CHECK (significance_level >= 1 AND significance_level <= 5) DEFAULT 3,
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Traditional crafts and cultural practices
CREATE TABLE public.cultural_practices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  local_name TEXT,
  description TEXT,
  practice_type TEXT, -- 'craft', 'ceremony', 'dance', 'music', 'cooking'
  materials_used TEXT[],
  tools_required TEXT[],
  seasonal_timing TEXT,
  practitioners_count INTEGER,
  transmission_method TEXT,
  threat_level TEXT, -- 'safe', 'vulnerable', 'endangered', 'critical'
  related_sites UUID[] DEFAULT '{}',
  documentation_level TEXT DEFAULT 'basic',
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Site reviews and ratings
CREATE TABLE public.site_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES cultural_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  review_text TEXT,
  visit_date DATE,
  recommended_time_to_visit TEXT,
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  cultural_authenticity_rating INTEGER CHECK (cultural_authenticity_rating >= 1 AND cultural_authenticity_rating <= 5),
  is_verified BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, user_id)
);

-- Tourism routes and trails
CREATE TABLE public.tourism_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_hours DECIMAL(4, 2),
  difficulty_level TEXT DEFAULT 'easy', -- 'easy', 'moderate', 'difficult'
  route_type TEXT DEFAULT 'cultural', -- 'cultural', 'historical', 'spiritual', 'craft'
  starting_point_lat DECIMAL(10, 8),
  starting_point_lng DECIMAL(11, 8),
  ending_point_lat DECIMAL(10, 8),
  ending_point_lng DECIMAL(11, 8),
  route_coordinates JSONB, -- GeoJSON LineString
  estimated_cost DECIMAL(10, 2),
  max_group_size INTEGER DEFAULT 20,
  recommended_season TEXT,
  guide_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sites included in tourism routes
CREATE TABLE public.route_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES tourism_routes(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES cultural_sites(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  visit_duration_minutes INTEGER DEFAULT 60,
  special_notes TEXT,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(route_id, site_id)
);

-- Conservation activities and projects
CREATE TABLE public.conservation_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES cultural_sites(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  project_type TEXT, -- 'restoration', 'documentation', 'research', 'maintenance'
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15, 2),
  funding_source TEXT,
  lead_organization TEXT,
  contact_person TEXT,
  status TEXT DEFAULT 'planned', -- 'planned', 'active', 'completed', 'suspended'
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  outcomes TEXT,
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heritage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conservation_projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Heritage categories policies (public read)
CREATE POLICY "Heritage categories are viewable by everyone" ON public.heritage_categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON public.heritage_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Cultural sites policies
CREATE POLICY "Cultural sites are viewable by everyone" ON public.cultural_sites FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create sites" ON public.cultural_sites FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Site creators and admins can update sites" ON public.cultural_sites FOR UPDATE USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'cultural_expert'))
);

-- Site media policies
CREATE POLICY "Site media is viewable by everyone" ON public.site_media FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload media" ON public.site_media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Media uploaders can update their media" ON public.site_media FOR UPDATE USING (auth.uid() = uploaded_by);

-- AI analysis policies
CREATE POLICY "AI analysis is viewable by everyone" ON public.ai_analysis FOR SELECT USING (true);
CREATE POLICY "Researchers and admins can create AI analysis" ON public.ai_analysis FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'researcher', 'cultural_expert'))
);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.site_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.site_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.site_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.site_reviews FOR DELETE USING (auth.uid() = user_id);

-- Tourism routes policies
CREATE POLICY "Tourism routes are viewable by everyone" ON public.tourism_routes FOR SELECT USING (true);
CREATE POLICY "Guides and admins can create routes" ON public.tourism_routes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'guide', 'cultural_expert'))
);

-- Other tables follow similar patterns
CREATE POLICY "Historical records are viewable by everyone" ON public.historical_records FOR SELECT USING (true);
CREATE POLICY "Cultural practices are viewable by everyone" ON public.cultural_practices FOR SELECT USING (true);
CREATE POLICY "Route sites are viewable by everyone" ON public.route_sites FOR SELECT USING (true);
CREATE POLICY "Conservation projects are viewable by everyone" ON public.conservation_projects FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_cultural_sites_location ON cultural_sites(latitude, longitude);
CREATE INDEX idx_cultural_sites_category ON cultural_sites(category_id);
CREATE INDEX idx_cultural_sites_status ON cultural_sites(preservation_status);
CREATE INDEX idx_site_media_site ON site_media(site_id);
CREATE INDEX idx_ai_analysis_site ON ai_analysis(site_id);
CREATE INDEX idx_site_reviews_site ON site_reviews(site_id);
CREATE INDEX idx_site_reviews_rating ON site_reviews(rating);
CREATE INDEX idx_tourism_routes_active ON tourism_routes(is_active);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cultural_sites_updated_at BEFORE UPDATE ON public.cultural_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cultural_practices_updated_at BEFORE UPDATE ON public.cultural_practices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_reviews_updated_at BEFORE UPDATE ON public.site_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tourism_routes_updated_at BEFORE UPDATE ON public.tourism_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conservation_projects_updated_at BEFORE UPDATE ON public.conservation_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();