-- Create a view for easy site data retrieval
CREATE OR REPLACE VIEW public.sites_with_categories AS
SELECT 
  cs.*,
  hc.name as category_name,
  hc.description as category_description,
  hc.color_hex as category_color,
  COALESCE((SELECT COUNT(*) FROM site_reviews sr WHERE sr.site_id = cs.id), 0) as review_count,
  COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM site_reviews sr WHERE sr.site_id = cs.id), 0) as average_rating,
  COALESCE((SELECT COUNT(*) FROM ai_analysis aa WHERE aa.site_id = cs.id AND aa.status = 'completed'), 0) as ai_analysis_count
FROM cultural_sites cs
LEFT JOIN heritage_categories hc ON cs.category_id = hc.id
WHERE cs.is_active = true;