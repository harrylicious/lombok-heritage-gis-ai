import { Tables, TablesInsert, TablesUpdate, Enums } from '../integrations/supabase/types'

export type AiAnalysis = Tables<'ai_analysis'>
export type AiAnalysisInsert = TablesInsert<'ai_analysis'>
export type AiAnalysisUpdate = TablesUpdate<'ai_analysis'>
export type AnalysisStatus = Enums<'analysis_status'>