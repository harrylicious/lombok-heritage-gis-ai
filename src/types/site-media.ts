import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types'

export type SiteMedia = Tables<'site_media'>
export type SiteMediaInsert = TablesInsert<'site_media'>
export type SiteMediaUpdate = TablesUpdate<'site_media'>