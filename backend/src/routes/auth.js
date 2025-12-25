const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * API 1: Tenant Registration
 * Requirement: Atomic transaction for tenant and admin creation.
 */
router.post('/register-tenant', async (req, res) => {
  const client = await pool.connect();
  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    
    await client.query('BEGIN');
    
    // Create tenant with default free plan limits
    const tenantRes = await client.query(
      'INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [tenantName, subdomain, 'active', 'free', 5, 3]
    );
    
    const tenantId = tenantRes.rows[0].id;
    const hashedPassword = await bcryptjs.hash(adminPassword, 10);
    
    const userRes = await client.query(
      'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role',
      [tenantId, adminEmail, hashedPassword, adminFullName, 'tenant_admin']
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      message: 'Tenant registered successfully', 
      data: { tenantId, adminUser: userRes.rows[0] } 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Registration failed' });
  } finally {
    client.release();
  }
});

/**
 * API 2: User Login
 * Requirement: Multi-tenant validation and consistent response format.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantSubdomain } = req.body;
    const query = `
      SELECT u.*, t.status as tenant_status FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = $1 AND t.subdomain = $2
    `;
    const userRes = await pool.query(query, [email, tenantSubdomain]);
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = userRes.rows[0];
    if (user.tenant_status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account suspended/inactive' });
    }

    const valid = await bcryptjs.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, tenant_id: user.tenant_id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      data: { 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.full_name, 
          role: user.role, 
          tenantId: user.tenant_id 
        }, 
        token, 
        expiresIn: 86400 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

/**
 * API 3: Get Current User
 * Requirement: Join with tenants table for complete metadata.
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.email, u.full_name, u.role, t.name as tenant_name, 
             t.subscription_plan, t.max_users, t.max_projects 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.id = $1
    `;
    const userRes = await pool.query(query, [req.user.id]);
    res.json({ success: true, data: userRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user data' });
  }
});

module.exports = router;