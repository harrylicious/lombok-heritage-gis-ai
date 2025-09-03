import { Tables, TablesInsert, TablesUpdate, Enums } from '../integrations/supabase/types'

export type CulturalSite = Tables<'cultural_sites'>
export type CulturalSiteInsert = TablesInsert<'cultural_sites'>
export type CulturalSiteUpdate = TablesUpdate<'cultural_sites'>
export type PreservationStatus = Enums<'preservation_status'>