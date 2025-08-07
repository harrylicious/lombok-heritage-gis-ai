-- Fix security issue: Update function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Insert dummy data for heritage categories
INSERT INTO public.heritage_categories (name, description, color_hex) VALUES
('architecture', 'Traditional Sasak architectural structures including buildings and monuments', '#8B4513'),
('traditional_house', 'Traditional Sasak houses and residential structures', '#CD853F'),
('mosque', 'Historic mosques and Islamic architectural sites', '#228B22'),
('temple', 'Hindu temples and religious structures', '#FF6347'),
('craft_center', 'Traditional craft workshops and artisan centers', '#4169E1'),
('ceremony_site', 'Sacred sites for traditional ceremonies and rituals', '#DAA520'),
('historical_site', 'Sites of historical significance and heritage value', '#8B0000'),
('cultural_landscape', 'Traditional cultural landscapes and terraces', '#556B2F'),
('traditional_market', 'Traditional markets and trading centers', '#FF8C00');

-- Insert dummy cultural sites
INSERT INTO public.cultural_sites (
  name, local_name, description, historical_significance, category_id,
  latitude, longitude, address, village, district, preservation_status,
  accessibility_info, visiting_hours, entrance_fee, established_year,
  cultural_significance_score, tourism_popularity_score, is_unesco_site
) VALUES
-- Traditional Houses
('Desa Sade Traditional Village', 'Desa Adat Sade', 
 'A well-preserved traditional Sasak village showcasing authentic traditional houses and cultural practices',
 'One of the most authentic traditional Sasak villages, maintained for centuries with original architectural styles',
 (SELECT id FROM heritage_categories WHERE name = 'traditional_house' LIMIT 1),
 -8.8942, 116.2734, 'Sade Village, Central Lombok', 'Sade', 'Pujut', 'good',
 'Accessible by car and motorcycle, paved road access', '08:00-17:00', 10000, 1650,
 9.2, 8.8, false),

('Desa Ende Traditional Village', 'Desa Adat Ende',
 'Traditional Sasak village known for its unique weaving traditions and architecture',
 'Historic village maintaining traditional Sasak building techniques and social structures',
 (SELECT id FROM heritage_categories WHERE name = 'traditional_house' LIMIT 1),
 -8.8756, 116.3123, 'Ende Village, Central Lombok', 'Ende', 'Pujut', 'good',
 'Accessible by local transport, dirt road for last 2km', '08:00-16:00', 5000, 1580,
 8.5, 7.2, false),

-- Mosques
('Masjid Kuno Bayan Beleq', 'Mesjid Kuno Bayan Beleq',
 'Ancient mosque representing early Islamic architecture in Lombok with unique Sasak Islamic style',
 'Built in 1634, one of the oldest mosques in Lombok showcasing Sasak Islamic architectural fusion',
 (SELECT id FROM heritage_categories WHERE name = 'mosque' LIMIT 1),
 -8.3567, 116.4023, 'Bayan Beleq Village, North Lombok', 'Bayan Beleq', 'Bayan', 'excellent',
 'Easy access via main road, parking available', '05:00-19:00 (prayer times)', 0, 1634,
 9.8, 8.5, false),

-- Temples  
('Pura Meru Cakranegara', 'Pura Meru Cakranegara',
 'Largest Hindu temple complex in Lombok built by Balinese royal family',
 'Built in 1720 by Prince Anak Agung Made Karang from Cakranegara kingdom',
 (SELECT id FROM heritage_categories WHERE name = 'temple' LIMIT 1),
 -8.5833, 116.1167, 'Cakranegara, Mataram City', 'Cakranegara', 'Cakranegara', 'excellent',
 'Accessible by public transport, large parking area', '06:00-18:00', 5000, 1720,
 9.5, 9.1, false),

-- Craft Centers
('Sukarara Weaving Village', 'Desa Tenun Sukarara',
 'Famous village for traditional Sasak songket weaving with intricate patterns',
 'Center for traditional songket weaving passed down through generations for over 200 years',
 (SELECT id FROM heritage_categories WHERE name = 'craft_center' LIMIT 1),
 -8.7891, 116.2456, 'Sukarara Village, Central Lombok', 'Sukarara', 'Jonggat', 'good',
 'Accessible by car and motorcycle, guided tours available', '08:00-17:00', 15000, 1800,
 8.9, 9.3, false),

('Loyok Bamboo Craft Village', 'Desa Kerajinan Bambu Loyok',
 'Traditional village specializing in bamboo handicrafts and furniture',
 'Known for bamboo craftsmanship traditions spanning over 150 years',
 (SELECT id FROM heritage_categories WHERE name = 'craft_center' LIMIT 1),
 -8.4567, 116.5234, 'Loyok Village, East Lombok', 'Loyok', 'Sikur', 'good',
 'Accessible by local transport, workshop visits available', '08:00-16:00', 10000, 1870,
 8.2, 7.8, false),

-- Historical Sites
('Mayura Water Palace', 'Taman Mayura',
 'Historic water palace complex built by Balinese kingdom with beautiful gardens',
 'Built in 1744 as part of Cakranegara kingdom palace complex, symbol of Balinese rule in Lombok',
 (SELECT id FROM heritage_categories WHERE name = 'historical_site' LIMIT 1),
 -8.5845, 116.1123, 'Cakranegara, Mataram City', 'Cakranegara', 'Cakranegara', 'good',
 'Easy access, wheelchair accessible paths available', '07:00-18:00', 7500, 1744,
 9.3, 8.9, false),

-- Cultural Landscapes
('Jatiluwih Rice Terraces', 'Subak Jatiluwih Lombok',
 'Traditional Sasak rice terraces showcasing ancient irrigation systems',
 'Ancient terraced rice fields using traditional Sasak subak irrigation system',
 (SELECT id FROM heritage_categories WHERE name = 'cultural_landscape' LIMIT 1),
 -8.3234, 116.2891, 'Sembalun Valley, East Lombok', 'Sembalun Lawang', 'Sembalun', 'excellent',
 'Accessible by 4WD vehicle, trekking required for best views', '06:00-18:00', 20000, 1200,
 9.0, 8.7, false);

-- Insert cultural practices data
INSERT INTO public.cultural_practices (
  name, local_name, description, practice_type, materials_used, tools_required,
  seasonal_timing, practitioners_count, transmission_method, threat_level,
  documentation_level
) VALUES
('Songket Weaving', 'Tenun Songket Sasak',
 'Traditional Sasak weaving technique creating intricate golden thread patterns',
 'craft', ARRAY['cotton thread', 'gold thread', 'natural dyes'], 
 ARRAY['traditional loom', 'shuttle', 'beater'], 
 'Year-round, peak during dry season', 500, 'Mother to daughter tradition', 'vulnerable', 'comprehensive'),

('Presean (Stick Fighting)', 'Peresean',
 'Traditional Sasak martial art performed during festivals and ceremonies',
 'ceremony', ARRAY['rattan sticks', 'buffalo hide shield', 'traditional costume'],
 ARRAY['Ende (rattan stick)', 'Peken (shield)'],
 'During harvest festivals and important ceremonies', 200, 'Master to student apprenticeship', 'endangered', 'basic'),

('Gendang Beleq Music', 'Gendang Beleq',
 'Traditional Sasak musical ensemble featuring large drums and gongs',
 'music', ARRAY['buffalo hide', 'wood', 'metal gongs'],
 ARRAY['large drums', 'gongs', 'traditional instruments'],
 'Ceremonies and festivals throughout the year', 150, 'Oral tradition and practice', 'vulnerable', 'moderate'),

('Traditional Pottery', 'Gerabah Tradisional',
 'Ancient pottery making techniques using local clay and traditional firing methods',
 'craft', ARRAY['local clay', 'sand', 'organic materials'],
 ARRAY['pottery wheel', 'traditional kiln', 'shaping tools'],
 'Dry season for better firing conditions', 80, 'Family trade secrets', 'endangered', 'basic');

-- Insert historical records
INSERT INTO public.historical_records (
  site_id, event_date, event_title, event_description, historical_period, sources,
  significance_level
) VALUES
((SELECT id FROM cultural_sites WHERE name = 'Masjid Kuno Bayan Beleq' LIMIT 1),
 '1634-01-01', 'Construction of Bayan Beleq Mosque',
 'Construction completed of the first major mosque in North Lombok, establishing Islamic architecture style',
 'Early Islamic Period', ARRAY['Local chronicles', 'Architectural analysis'], 5),

((SELECT id FROM cultural_sites WHERE name = 'Pura Meru Cakranegara' LIMIT 1),
 '1720-01-01', 'Establishment of Pura Meru',
 'Prince Anak Agung Made Karang established the largest Hindu temple complex in Lombok',
 'Cakranegara Kingdom', ARRAY['Royal records', 'Temple inscriptions'], 5),

((SELECT id FROM cultural_sites WHERE name = 'Mayura Water Palace' LIMIT 1),
 '1744-01-01', 'Construction of Mayura Palace',
 'Royal water palace built as part of the Cakranegara kingdom administrative center',
 'Cakranegara Kingdom', ARRAY['Palace records', 'Historical documents'], 4);

-- Insert tourism routes
INSERT INTO public.tourism_routes (
  name, description, duration_hours, difficulty_level, route_type,
  starting_point_lat, starting_point_lng, ending_point_lat, ending_point_lng,
  estimated_cost, max_group_size, recommended_season, guide_required
) VALUES
('Central Lombok Cultural Heritage Trail', 
 'Comprehensive tour covering traditional villages, craft centers, and historical sites in Central Lombok',
 8.0, 'easy', 'cultural',
 -8.5833, 116.1167, -8.8942, 116.2734,
 250000, 15, 'April to October (dry season)', true),

('Traditional Craft Discovery Route',
 'Specialized route focusing on traditional Sasak crafts including weaving and pottery',
 6.0, 'easy', 'craft',
 -8.7891, 116.2456, -8.4567, 116.5234,
 200000, 12, 'Year-round', true),

('Sacred Sites and Temples Tour',
 'Spiritual journey visiting important mosques and temples across Lombok',
 10.0, 'moderate', 'spiritual',
 -8.3567, 116.4023, -8.5833, 116.1167,
 300000, 20, 'Year-round', true);

-- Insert route sites connections
INSERT INTO public.route_sites (route_id, site_id, sequence_order, visit_duration_minutes, special_notes)
SELECT 
  r.id as route_id,
  s.id as site_id,
  ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY s.name) as sequence_order,
  90 as visit_duration_minutes,
  'Traditional guide explanation included' as special_notes
FROM tourism_routes r
CROSS JOIN cultural_sites s
WHERE r.name = 'Central Lombok Cultural Heritage Trail'
AND s.name IN ('Pura Meru Cakranegara', 'Mayura Water Palace', 'Sukarara Weaving Village', 'Desa Sade Traditional Village');

-- Insert sample reviews
INSERT INTO public.site_reviews (
  site_id, user_id, rating, title, review_text, visit_date,
  accessibility_rating, cultural_authenticity_rating
) 
SELECT 
  s.id,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Dummy user ID
  5, 
  'Amazing Cultural Experience',
  'Incredible preservation of traditional Sasak culture. The guides were knowledgeable and the demonstrations were authentic.',
  '2024-01-15',
  4, 5
FROM cultural_sites s
WHERE s.name = 'Desa Sade Traditional Village'
LIMIT 1;