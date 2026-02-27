import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Bindings } from '../types'

const admin = new Hono<{ Bindings: Bindings }>()

// Simple authentication middleware (just check if logged in)
const requireAuth = async (c: Context<{ Bindings: Bindings }>, next: () => Promise<void>) => {
  try {
    const userId = c.req.header('X-User-Id')
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401)
    }

    await next()
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: '인증 실패' }, 401)
  }
}

// Get all users with their stats
admin.get('/users', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = (page - 1) * limit
    const search = c.req.query('search') || ''

    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.level,
        u.plan,
        u.billing_period,
        u.subscription_start_date,
        u.subscription_end_date,
        u.last_login_at,
        u.created_at,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT m.id) as total_messages,
        COALESCE(SUM(sd.duration_seconds), 0) as total_duration_seconds
      FROM users u
      LEFT JOIN sessions s ON u.id = s.user_id
      LEFT JOIN messages m ON s.id = m.session_id
      LEFT JOIN session_durations sd ON u.id = sd.user_id
      ${search ? 'WHERE u.username LIKE ? OR u.email LIKE ?' : ''}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `

    const params = search 
      ? [`%${search}%`, `%${search}%`, limit, offset]
      : [limit, offset]

    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    // Get total count
    const countQuery = search
      ? 'SELECT COUNT(*) as count FROM users WHERE username LIKE ? OR email LIKE ?'
      : 'SELECT COUNT(*) as count FROM users'
    
    const countParams = search ? [`%${search}%`, `%${search}%`] : []
    const totalCount = await c.env.DB.prepare(countQuery).bind(...countParams).first()

    return c.json({
      success: true,
      data: {
        users: results,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit)
        }
      }
    })
  } catch (error) {
    console.error('Admin get users error:', error)
    return c.json({ error: '사용자 목록 조회 실패' }, 500)
  }
})

// Get overall statistics
admin.get('/stats', requireAuth, async (c) => {
  try {
    // Total users
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    
    // Active users (logged in within last 30 days)
    const activeUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE last_login_at >= datetime('now', '-30 days')
    `).first()

    // Plan distribution
    const planStats = await c.env.DB.prepare(`
      SELECT plan, COUNT(*) as count 
      FROM users 
      GROUP BY plan
    `).all()

    // Total sessions
    const totalSessions = await c.env.DB.prepare('SELECT COUNT(*) as count FROM sessions').first()

    // Total messages
    const totalMessages = await c.env.DB.prepare('SELECT COUNT(*) as count FROM messages').first()

    // Total revenue (from payment_orders)
    const totalRevenue = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payment_orders 
      WHERE status = 'completed'
    `).first()

    // Recent signups (last 7 days)
    const recentSignups = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= datetime('now', '-7 days')
    `).first()

    // Daily active users (last 24 hours)
    const dailyActiveUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE last_login_at >= datetime('now', '-1 day')
    `).first()

    return c.json({
      success: true,
      data: {
        totalUsers: totalUsers?.count || 0,
        activeUsers: activeUsers?.count || 0,
        dailyActiveUsers: dailyActiveUsers?.count || 0,
        recentSignups: recentSignups?.count || 0,
        planDistribution: planStats.results || [],
        totalSessions: totalSessions?.count || 0,
        totalMessages: totalMessages?.count || 0,
        totalRevenue: totalRevenue?.total || 0
      }
    })
  } catch (error) {
    console.error('Admin get stats error:', error)
    return c.json({ error: '통계 조회 실패' }, 500)
  }
})

// Get all sessions with details
admin.get('/sessions', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = (page - 1) * limit
    const userId = c.req.query('userId')

    let query = `
      SELECT 
        s.id,
        s.user_id,
        u.username,
        u.email,
        s.topic,
        s.level,
        s.start_time,
        s.end_time,
        s.total_messages,
        COUNT(m.id) as message_count
      FROM sessions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN messages m ON s.id = m.session_id
      ${userId ? 'WHERE s.user_id = ?' : ''}
      GROUP BY s.id
      ORDER BY s.start_time DESC
      LIMIT ? OFFSET ?
    `

    const params = userId ? [parseInt(userId), limit, offset] : [limit, offset]
    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    // Get total count
    const countQuery = userId
      ? 'SELECT COUNT(*) as count FROM sessions WHERE user_id = ?'
      : 'SELECT COUNT(*) as count FROM sessions'
    
    const countParams = userId ? [parseInt(userId)] : []
    const totalCount = await c.env.DB.prepare(countQuery).bind(...countParams).first()

    return c.json({
      success: true,
      data: {
        sessions: results,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit)
        }
      }
    })
  } catch (error) {
    console.error('Admin get sessions error:', error)
    return c.json({ error: '세션 목록 조회 실패' }, 500)
  }
})

// Get payment history
admin.get('/payments', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = (page - 1) * limit
    const userId = c.req.query('userId')
    const status = c.req.query('status')

    let conditions = []
    let params = []

    if (userId) {
      conditions.push('p.user_id = ?')
      params.push(parseInt(userId))
    }

    if (status) {
      conditions.push('p.status = ?')
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const query = `
      SELECT 
        p.*,
        u.username,
        u.email
      FROM payment_orders p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)
    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM payment_orders p ${whereClause}`
    const countParams = conditions.length > 0 
      ? params.slice(0, conditions.length)
      : []
    const totalCount = await c.env.DB.prepare(countQuery).bind(...countParams).first()

    return c.json({
      success: true,
      data: {
        payments: results,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit)
        }
      }
    })
  } catch (error) {
    console.error('Admin get payments error:', error)
    return c.json({ error: '결제 내역 조회 실패' }, 500)
  }
})

// Get activity logs
admin.get('/activities', requireAuth, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = (page - 1) * limit
    const userId = c.req.query('userId')
    const activityType = c.req.query('type')

    let conditions = []
    let params = []

    if (userId) {
      conditions.push('a.user_id = ?')
      params.push(parseInt(userId))
    }

    if (activityType) {
      conditions.push('a.activity_type = ?')
      params.push(activityType)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const query = `
      SELECT 
        a.*,
        u.username,
        u.email
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)
    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM activity_logs a ${whereClause}`
    const countParams = conditions.length > 0 
      ? params.slice(0, conditions.length)
      : []
    const totalCount = await c.env.DB.prepare(countQuery).bind(...countParams).first()

    return c.json({
      success: true,
      data: {
        activities: results,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit)
        }
      }
    })
  } catch (error) {
    console.error('Admin get activities error:', error)
    return c.json({ error: '활동 로그 조회 실패' }, 500)
  }
})

// Update user plan (admin action)
admin.post('/users/:id/plan', requireAuth, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'))
    const { plan, billingPeriod } = await c.req.json()

    if (!['free', 'core', 'premium', 'business'].includes(plan)) {
      return c.json({ error: '유효하지 않은 플랜입니다' }, 400)
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return c.json({ error: '유효하지 않은 결제 주기입니다' }, 400)
    }

    // Update user plan
    await c.env.DB.prepare(`
      UPDATE users 
      SET plan = ?, 
          billing_period = ?,
          subscription_start_date = datetime('now'),
          subscription_end_date = datetime('now', '+' || ? || ' ' || ?)
      WHERE id = ?
    `).bind(
      plan,
      billingPeriod,
      billingPeriod === 'monthly' ? 1 : 12,
      billingPeriod === 'monthly' ? 'month' : 'months',
      userId
    ).run()

    return c.json({
      success: true,
      message: '플랜이 업데이트되었습니다'
    })
  } catch (error) {
    console.error('Admin update plan error:', error)
    return c.json({ error: '플랜 업데이트 실패' }, 500)
  }
})

// Toggle admin status
admin.post('/users/:id/admin', requireAuth, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'))
    const { isAdmin } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE users SET is_admin = ? WHERE id = ?'
    ).bind(isAdmin ? 1 : 0, userId).run()

    return c.json({
      success: true,
      message: '관리자 권한이 업데이트되었습니다'
    })
  } catch (error) {
    console.error('Admin toggle admin error:', error)
    return c.json({ error: '관리자 권한 업데이트 실패' }, 500)
  }
})

// Delete user (admin action)
admin.delete('/users/:id', requireAuth, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'))
    const adminUserId = parseInt(c.req.header('X-User-Id') || '0')

    console.log(`🗑️ Admin ${adminUserId} attempting to delete user ${userId}`)

    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id, username, email FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }

    console.log(`📝 Deleting user: ${user.username} (${user.email})`)

    // Delete related data in correct order (respect foreign key constraints)
    // Use try-catch for each deletion to handle tables that may not exist
    
    try {
      // 1. Delete session_reports (may reference sessions)
      await c.env.DB.prepare('DELETE FROM session_reports WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)').bind(userId).run()
      console.log('  ✓ Deleted session_reports')
    } catch (e) { console.log('  - session_reports not found or error:', (e as Error).message) }
    
    try {
      // 2. Delete session_feedback (may reference sessions)
      await c.env.DB.prepare('DELETE FROM session_feedback WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)').bind(userId).run()
      console.log('  ✓ Deleted session_feedback')
    } catch (e) { console.log('  - session_feedback not found or error:', (e as Error).message) }
    
    try {
      // 3. Delete messages (depends on sessions)
      await c.env.DB.prepare('DELETE FROM messages WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)').bind(userId).run()
      console.log('  ✓ Deleted messages')
    } catch (e) { console.log('  - messages not found or error:', (e as Error).message) }
    
    try {
      // 4. Delete sessions
      await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted sessions')
    } catch (e) { console.log('  - sessions not found or error:', (e as Error).message) }
    
    try {
      // 5. Delete session_durations
      await c.env.DB.prepare('DELETE FROM session_durations WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted session_durations')
    } catch (e) { console.log('  - session_durations not found or error:', (e as Error).message) }
    
    try {
      // 6. Delete user_vocabulary_progress (correct table name)
      await c.env.DB.prepare('DELETE FROM user_vocabulary_progress WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted user_vocabulary_progress')
    } catch (e) { console.log('  - user_vocabulary_progress not found or error:', (e as Error).message) }
    
    try {
      // 7. Delete user_stats
      await c.env.DB.prepare('DELETE FROM user_stats WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted user_stats')
    } catch (e) { console.log('  - user_stats not found or error:', (e as Error).message) }
    
    try {
      // 8. Delete user_badges
      await c.env.DB.prepare('DELETE FROM user_badges WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted user_badges')
    } catch (e) { console.log('  - user_badges not found or error:', (e as Error).message) }
    
    try {
      // 9. Delete payment_orders
      await c.env.DB.prepare('DELETE FROM payment_orders WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted payment_orders')
    } catch (e) { console.log('  - payment_orders not found or error:', (e as Error).message) }
    
    try {
      // 10. Delete activity_logs
      await c.env.DB.prepare('DELETE FROM activity_logs WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted activity_logs')
    } catch (e) { console.log('  - activity_logs not found or error:', (e as Error).message) }
    
    try {
      // 11. Delete user_activity_log (alternative table)
      await c.env.DB.prepare('DELETE FROM user_activity_log WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted user_activity_log')
    } catch (e) { console.log('  - user_activity_log not found or error:', (e as Error).message) }
    
    try {
      // 12. Delete usage_tracking
      await c.env.DB.prepare('DELETE FROM usage_tracking WHERE user_id = ?').bind(userId).run()
      console.log('  ✓ Deleted usage_tracking')
    } catch (e) { console.log('  - usage_tracking not found or error:', (e as Error).message) }
    
    // 13. Finally delete the user (this must succeed)
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
    console.log('  ✓ Deleted user')

    console.log(`✅ User ${userId} deleted successfully`)

    return c.json({
      success: true,
      message: '사용자가 삭제되었습니다'
    })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return c.json({ error: '사용자 삭제 실패: ' + (error as Error).message }, 500)
  }
})

export default admin
