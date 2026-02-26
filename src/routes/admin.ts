import { Hono } from 'hono';
import type { Bindings } from '../types';

const admin = new Hono<{ Bindings: Bindings }>();

// Middleware: Check if user is admin
const requireAdmin = async (c: any, next: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT is_admin FROM users WHERE id = ?
    `).bind(userId).first();

    if (!result || !result.is_admin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    await next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
};

// Apply admin middleware to all routes
admin.use('/*', requireAdmin);

// Get all users with their stats
admin.get('/users', async (c) => {
  try {
    const db = c.env.DB;
    
    const users = await db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.level,
        u.plan,
        u.is_admin,
        u.created_at,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT m.id) as total_messages,
        SUM(CAST((julianday(s.ended_at) - julianday(s.started_at)) * 24 * 60 AS INTEGER)) as total_study_minutes
      FROM users u
      LEFT JOIN sessions s ON u.id = s.user_id
      LEFT JOIN messages m ON s.id = m.session_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    return c.json({
      success: true,
      users: users.results || [],
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user details by ID
admin.get('/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const db = c.env.DB;

    // Get user info
    const user = await db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get user sessions
    const sessions = await db.prepare(`
      SELECT 
        s.*,
        t.name as topic_name,
        COUNT(m.id) as message_count
      FROM sessions s
      LEFT JOIN topics t ON s.topic_id = t.id
      LEFT JOIN messages m ON s.id = m.session_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT 50
    `).bind(userId).all();

    // Get user payments
    const payments = await db.prepare(`
      SELECT * FROM payment_orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(userId).all();

    // Get user login sessions
    const loginSessions = await db.prepare(`
      SELECT * FROM user_sessions 
      WHERE user_id = ?
      ORDER BY login_time DESC
      LIMIT 30
    `).bind(userId).all();

    return c.json({
      success: true,
      user,
      sessions: sessions.results || [],
      payments: payments.results || [],
      loginSessions: loginSessions.results || [],
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return c.json({ 
      error: 'Failed to fetch user details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get dashboard statistics
admin.get('/stats', async (c) => {
  try {
    const db = c.env.DB;

    // Total users count
    const totalUsersResult = await db.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();

    // Users by plan
    const planDistribution = await db.prepare(`
      SELECT 
        COALESCE(plan, 'free') as plan,
        COUNT(*) as count
      FROM users
      GROUP BY plan
    `).all();

    // Total sessions
    const totalSessionsResult = await db.prepare(`
      SELECT COUNT(*) as count FROM sessions
    `).first();

    // Total study time (in minutes)
    const totalStudyTimeResult = await db.prepare(`
      SELECT 
        SUM(CAST((julianday(ended_at) - julianday(started_at)) * 24 * 60 AS INTEGER)) as total_minutes
      FROM sessions
      WHERE ended_at IS NOT NULL
    `).first();

    // New users this month
    const newUsersThisMonth = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM users
      WHERE created_at >= date('now', 'start of month')
    `).first();

    // Active users (logged in within last 7 days)
    const activeUsers = await db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_sessions
      WHERE login_time >= datetime('now', '-7 days')
    `).first();

    // Recent payments
    const recentPayments = await db.prepare(`
      SELECT 
        po.*,
        u.username,
        u.email
      FROM payment_orders po
      JOIN users u ON po.user_id = u.id
      WHERE po.status = 'completed'
      ORDER BY po.confirmed_at DESC
      LIMIT 10
    `).all();

    // Total revenue
    const totalRevenueResult = await db.prepare(`
      SELECT SUM(amount) as total
      FROM payment_orders
      WHERE status = 'completed'
    `).first();

    return c.json({
      success: true,
      stats: {
        totalUsers: totalUsersResult?.count || 0,
        planDistribution: planDistribution.results || [],
        totalSessions: totalSessionsResult?.count || 0,
        totalStudyMinutes: totalStudyTimeResult?.total_minutes || 0,
        newUsersThisMonth: newUsersThisMonth?.count || 0,
        activeUsers: activeUsers?.count || 0,
        totalRevenue: totalRevenueResult?.total || 0,
      },
      recentPayments: recentPayments.results || [],
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ 
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update user plan
admin.post('/users/:userId/plan', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { plan } = await c.req.json();

    if (!['free', 'core', 'premium', 'business'].includes(plan)) {
      return c.json({ error: 'Invalid plan' }, 400);
    }

    const db = c.env.DB;
    await db.prepare(`
      UPDATE users SET plan = ? WHERE id = ?
    `).bind(plan, userId).run();

    return c.json({
      success: true,
      message: 'User plan updated',
    });
  } catch (error) {
    console.error('Update user plan error:', error);
    return c.json({ 
      error: 'Failed to update user plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all payment orders
admin.get('/payments', async (c) => {
  try {
    const db = c.env.DB;
    
    const payments = await db.prepare(`
      SELECT 
        po.*,
        u.username,
        u.email
      FROM payment_orders po
      JOIN users u ON po.user_id = u.id
      ORDER BY po.created_at DESC
      LIMIT 100
    `).all();

    return c.json({
      success: true,
      payments: payments.results || [],
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return c.json({ 
      error: 'Failed to fetch payments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default admin;
