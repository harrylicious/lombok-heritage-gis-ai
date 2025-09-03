import { Tables, TablesInsert, TablesUpdate, Enums } from '../integrations/supabase/types'

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type UserRole = Enums<'user_role'>