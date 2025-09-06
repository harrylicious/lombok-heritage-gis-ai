import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types'

export type HistoricalRecord = Tables<'historical_records'>
export type HistoricalRecordInsert = TablesInsert<'historical_records'>
export type HistoricalRecordUpdate = TablesUpdate<'historical_records'>