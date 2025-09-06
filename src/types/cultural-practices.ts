import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types'

export type CulturalPractice = Tables<'cultural_practices'>
export type CulturalPracticeInsert = TablesInsert<'cultural_practices'>
export type CulturalPracticeUpdate = TablesUpdate<'cultural_practices'>