import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types'

export type RouteSite = Tables<'route_sites'>
export type RouteSiteInsert = TablesInsert<'route_sites'>
export type RouteSiteUpdate = TablesUpdate<'route_sites'>