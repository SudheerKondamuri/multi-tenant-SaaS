const pool = require('../config/db');

/**
 * Logs important actions to the audit_logs table.
 */
const logAction = async (tenantId, userId, action, entityType, entityId) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, userId, action, entityType, entityId]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
    // Do not throw error to avoid breaking main business logic
  }
};

module.exports = { logAction };