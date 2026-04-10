import { supabase } from './supabase';

// BOWS
export async function getBows(userId: string) {
  const { data, error } = await supabase
    .from('bows')
    .select('*')
    .eq('user_id', userId)
    .order('last_used', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveBow(userId: string, bow: any) {
  const { data, error } = await supabase
    .from('bows')
    .upsert({
      id: bow.id,
      user_id: userId,
      name: bow.name,
      arrow_speed: bow.arrowSpeed,
      arrow_weight: bow.arrowWeight,
      peep_to_pin: bow.peepToPin,
      peep_to_arrow: bow.peepToArrow,
      sight_type_label: bow.sightTypeLabel,
      sight_resolution: bow.sightResolution,
      arrow_diameter: bow.arrowDiameter,
      calib_dist1: bow.calibDist1,
      calib_mark1: parseFloat(bow.calibMark1) || 0,
      calib_dist2: bow.calibDist2,
      calib_mark2: parseFloat(bow.calibMark2) || 0,
      marks: bow.marks,
      last_used: bow.lastUsed,
      bow_type: bow.bowType || 'target',
      mark_overrides: bow.markOverrides || {},
    }, { onConflict: 'id' });
  if (error) throw error;
  return data;
}

export async function deleteBow(id: string) {
  const { error } = await supabase
    .from('bows')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// SESSIONS
export async function getSessions(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveSession(userId: string, session: any) {
  const { data, error } = await supabase
    .from('sessions')
    .upsert({
      id: session.id,
      user_id: userId,
      bow_id: session.bowId || null,
      bow_name: session.bowName,
      type: session.type,
      date: session.date,
      total_score: session.totalScore,
      total_targets: session.totalTargets,
      misses: session.misses,
      targets: session.targets,
      completed: session.completed,
      yardage_type: session.yardageType || 'known',
      weather_conditions: session.weather || null,
    }, { onConflict: 'id' });
  if (error) throw error;
  return data;
}

export async function deleteSession(id: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
