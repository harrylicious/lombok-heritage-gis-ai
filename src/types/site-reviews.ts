import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types'

export type SiteReview = Tables<'site_reviews'>
export type SiteReviewInsert = TablesInsert<'site_reviews'>
export type SiteReviewUpdate = TablesUpdate<'site_reviews'>