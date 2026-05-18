import { supabase } from '../lib/supabase'

/**
 * Writes a single row to the audit_logs table.
 * Called by every service function that mutates data.
 *
 * @param {Object} params
 * @param {string} params.tableName       - Name of the table being changed
 * @param {string} params.operation       - CREATE | UPDATE | DELETE | STATUS_CHANGE
 * @param {string|number} params.recordId - ID of the affected record
 * @param {string} params.userId          - UUID of the acting user
 * @param {string} params.userName        - Full name of the acting user
 * @param {string} params.description     - Human-readable description of the change
 * @param {string} [params.previousValue] - Optional: old value (for updates/status changes)
 * @param {string} [params.newValue]      - Optional: new value (for updates/status changes)
 */
export async function logAudit({
  tableName,
  operation,
  recordId,
  userId,
  userName,
  description,
  previousValue = null,
  newValue = null,
}) {
  const { error } = await supabase.from('audit_logs').insert({
    table_name: tableName,
    operation,
    record_id: String(recordId),
    user_id: userId,
    user_name: userName,
    description,
    previous_value: previousValue,
    new_value: newValue,
  })

  if (error) {
    // Log to console but do NOT throw — a failed audit log should not
    // block the primary operation from completing.
    console.error('Audit log write failed:', error)
  }
}
