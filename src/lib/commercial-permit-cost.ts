import { supabase } from '@/integrations/supabase/client';
export { commercialPermitCost } from '../../supabase/functions/_shared/solar-permit-cohorts';
export type { SolarPermitCohort } from '../../supabase/functions/_shared/solar-permit-cohorts';
import type { SolarPermitCohort } from '../../supabase/functions/_shared/solar-permit-cohorts';
export async function loadSolarPermitCohorts(): Promise<{ cohorts: SolarPermitCohort[]; undatedCount: number; asOf: string }> {
  const { data, error } = await supabase.functions.invoke('fiscal-year-stats', { body: { solarProgramCohorts: true } });
  if (error || !Array.isArray(data?.cohorts)) throw new Error('Solar permit breakdown unavailable.');
  return data;
}