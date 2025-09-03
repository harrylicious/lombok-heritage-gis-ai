import { Tables, TablesInsert, TablesUpdate, Enums } from '../integrations/supabase/types'

export type HeritageCategory = Tables<'heritage_categories'>
export type HeritageCategoryInsert = TablesInsert<'heritage_categories'>
export type HeritageCategoryUpdate = TablesUpdate<'heritage_categories'>
export type HeritageCategoryEnum = Enums<'heritage_category'>