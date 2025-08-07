-- Remove the problematic review insert since we don't have actual user profiles yet
-- The sample data will be inserted without reviews initially

-- Insert AI analysis sample data (without user dependencies)
INSERT INTO public.ai_analysis (
  site_id, analysis_type, model_version, confidence_score, results, 
  processing_time_ms, status
) VALUES
((SELECT id FROM cultural_sites WHERE name = 'Desa Sade Traditional Village' LIMIT 1),
 'architectural_pattern', 'CNN-v1.2', 0.8945,
 '{"patterns": ["traditional_roof", "bamboo_walls", "raised_foundation"], "style_confidence": {"sasak_traditional": 0.89, "modern_influence": 0.11}, "preservation_score": 8.2}',
 2340, 'completed'),

((SELECT id FROM cultural_sites WHERE name = 'Masjid Kuno Bayan Beleq' LIMIT 1),
 'degradation_detection', 'CNN-v1.2', 0.9234,
 '{"degradation_areas": [{"type": "roof_damage", "severity": "low", "coordinates": [0.2, 0.3, 0.15, 0.12]}, {"type": "wall_weathering", "severity": "medium", "coordinates": [0.6, 0.7, 0.25, 0.18]}], "overall_condition": "good", "recommended_actions": ["roof_maintenance", "wall_protection"]}',
 3120, 'completed'),

((SELECT id FROM cultural_sites WHERE name = 'Pura Meru Cakranegara' LIMIT 1),
 'style_classification', 'CNN-v1.2', 0.9567,
 '{"primary_style": "balinese_hindu", "confidence": 0.96, "secondary_influences": ["javanese": 0.15, "local_sasak": 0.12], "architectural_elements": ["multi_tiered_roof", "carved_stone", "temple_gates"]}',
 1890, 'completed');

-- Insert conservation projects
INSERT INTO public.conservation_projects (
  site_id, project_name, description, project_type, start_date, end_date,
  budget, funding_source, lead_organization, status, progress_percentage
) VALUES
((SELECT id FROM cultural_sites WHERE name = 'Desa Sade Traditional Village' LIMIT 1),
 'Sade Village Heritage Preservation Project',
 'Comprehensive preservation project to maintain traditional architecture and cultural practices',
 'restoration', '2024-01-01', '2024-12-31',
 500000000, 'Ministry of Culture and Tourism Indonesia',
 'Lombok Cultural Heritage Foundation', 'active', 35),

((SELECT id FROM cultural_sites WHERE name = 'Masjid Kuno Bayan Beleq' LIMIT 1),
 'Ancient Mosque Documentation and Restoration',
 'Digital documentation and structural restoration of the historic mosque',
 'documentation', '2023-06-01', '2024-08-31',
 750000000, 'UNESCO World Heritage Fund',
 'Indonesian Institute for Islamic Architecture', 'active', 70);

-- Create a view for easy site data retrieval with category information
CREATE OR REPLACE VIEW public.sites_with_categories AS
SELECT 
  cs.*,
  hc.name as category_name,
  hc.description as category_description,
  hc.color_hex as category_color,
  (SELECT COUNT(*) FROM site_reviews sr WHERE sr.site_id = cs.id) as review_count,
  (SELECT AVG(rating)::DECIMAL(3,2) FROM site_reviews sr WHERE sr.site_id = cs.id) as average_rating,
  (SELECT COUNT(*) FROM ai_analysis aa WHERE aa.site_id = cs.id AND aa.status = 'completed') as ai_analysis_count
FROM cultural_sites cs
LEFT JOIN heritage_categories hc ON cs.category_id = hc.id
WHERE cs.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.sites_with_categories TO authenticated, anon;