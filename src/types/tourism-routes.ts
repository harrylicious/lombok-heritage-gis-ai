import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types'

export type TourismRoute = Tables<'tourism_routes'>
export type TourismRouteInsert = TablesInsert<'tourism_routes'>
export type TourismRouteUpdate = TablesUpdate<'tourism_routes'>