const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { logAction } = require('../utils/logger'); // Utility for audit logs

const router = express.Router();

/**
 * API 16: Create Task
 * Requirement: Verify project and assigned user belong to the same tenant.
 */
router.post('/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const tenantId = req.user.tenant_id;

    // Verify project belongs to user's tenant
    const projectCheck = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1 AND tenant_id = $2',
      [projectId, tenantId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Project access denied" });
    }

    // If assigned, verify user belongs to same tenant
    if (assignedTo) {
      const userCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, tenantId]
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: "Assigned user must belong to your tenant" });
      }
    }

    const newTask = await pool.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, assigned_to, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [projectId, tenantId, title, description, assignedTo, priority || 'medium', dueDate]
    );

    await logAction(tenantId, req.user.id, 'CREATE_TASK', 'task', newTask.rows[0].id);

    res.status(201).json({ success: true, data: newTask.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
});

/**
 * API 17: List Project Tasks
 */
router.get('/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await pool.query(
      `SELECT t.*, u.full_name as assigned_user_name 
       FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1 AND t.tenant_id = $2`,
      [projectId, req.user.tenant_id]
    );
    res.json({ success: true, data: { tasks: tasks.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * API 18: Update Task Status
 */
router.patch('/:taskId/status', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [status, taskId, req.user.tenant_id]
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Task not found" });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

/**
 * API 19: Update Task (Full)
 */
router.put('/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, assignedTo, dueDate, status } = req.body;
    
    const result = await pool.query(
      `UPDATE tasks SET 
        title = COALESCE($1, title), description = COALESCE($2, description),
        priority = COALESCE($3, priority), assigned_to = COALESCE($4, assigned_to),
        due_date = COALESCE($5, due_date), status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND tenant_id = $8 RETURNING *`,
      [title, description, priority, assignedTo, dueDate, status, taskId, req.user.tenant_id]
    );

    await logAction(req.user.tenant_id, req.user.id, 'UPDATE_TASK', 'task', taskId);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

module.exports = router;