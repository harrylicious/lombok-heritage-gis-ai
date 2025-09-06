import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types'

export type ConservationProject = Tables<'conservation_projects'>
export type ConservationProjectInsert = TablesInsert<'conservation_projects'>
export type ConservationProjectUpdate = TablesUpdate<'conservation_projects'>