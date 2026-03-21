import { createClient } from './supabase'

export async function logActivity(action, entityType, entityName, details) {
  const supabase = createClient()
  await supabase.from('activity_log').insert([{
    action,
    entity_type: entityType,
    entity_name: entityName,
    details,
  }])
}