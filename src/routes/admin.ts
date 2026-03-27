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
        u.is_trial,
        u.trial_start_date,
        u.trial_end_date,
        u.billing_period,
        u.subscription_start_date,
        u.subscription_end_date,
        u.last_login_at,
        u.created_at,
        u.is_admin,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT m.id) as total_messages,
        COALESCE(SUM(sd.duration_seconds), 0) as total_duration_seconds,
        COALESCE(SUM(sd.duration_seconds) / 60, 0) as total_study_minutes
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

    // Recent payments (last 10)
    const recentPayments = await c.env.DB.prepare(`
      SELECT 
        po.order_id,
        po.user_id,
        u.username,
        u.email,
        po.plan_name,
        po.amount,
        po.status,
        po.created_at
      FROM payment_orders po
      LEFT JOIN users u ON po.user_id = u.id
      ORDER BY po.created_at DESC
      LIMIT 10
    `).all()

    // Active trials (users with is_trial = 1)
    const activeTrials = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.plan,
        u.trial_start_date,
        u.trial_end_date,
        u.billing_period
      FROM users u
      WHERE u.is_trial = 1
      ORDER BY u.trial_end_date DESC
      LIMIT 20
    `).all()

    // Trial count
    const trialCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE is_trial = 1
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
        totalRevenue: totalRevenue?.total || 0,
        recentPayments: recentPayments.results || [],
        activeTrials: activeTrials.results || [],
        trialCount: trialCount?.count || 0
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

// Get individual user details with comprehensive information
admin.get('/users/:id', requireAuth, async (c) => {
  try {
    const userId = c.req.param('id')
    
    console.log(`📊 Fetching details for user ID: ${userId}`)
    
    // Get user basic info
    const user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }

    // Get sessions
    const sessions = await c.env.DB.prepare(`
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
      LIMIT 20
    `).bind(userId).all()

    // Get payments
    const payments = await c.env.DB.prepare(`
      SELECT * FROM payment_orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).bind(userId).all()

    // Get last payment
    const lastPayment = await c.env.DB.prepare(`
      SELECT * FROM payment_orders 
      WHERE user_id = ? AND status = 'completed'
      ORDER BY confirmed_at DESC 
      LIMIT 1
    `).bind(userId).first()

    // Get login sessions (activity logs)
    const loginSessions = await c.env.DB.prepare(`
      SELECT * FROM activity_logs 
      WHERE user_id = ? AND activity_type = 'login'
      ORDER BY created_at DESC 
      LIMIT 20
    `).bind(userId).all()

    // Get usage statistics by feature type
    const usageStats = await c.env.DB.prepare(`
      SELECT 
        feature_type,
        SUM(usage_count) as total_count
      FROM usage_tracking
      WHERE user_id = ?
      GROUP BY feature_type
    `).bind(userId).all()

    // Build usage summary object
    const usageSummary: Record<string, number> = {}
    if (usageStats.results) {
      for (const stat of usageStats.results) {
        usageSummary[stat.feature_type as string] = stat.total_count as number
      }
    }

    console.log(`✅ User details loaded: ${user.username}`)
    console.log(`  - Sessions: ${sessions.results?.length || 0}`)
    console.log(`  - Payments: ${payments.results?.length || 0}`)
    console.log(`  - Usage stats: ${JSON.stringify(usageSummary)}`)

    return c.json({
      success: true,
      user,
      sessions: sessions.results || [],
      payments: payments.results || [],
      lastPayment: lastPayment || null,
      loginSessions: loginSessions.results || [],
      usageSummary
    })
  } catch (error) {
    console.error('Admin get user detail error:', error)
    return c.json({ 
      error: '사용자 상세 정보 조회 실패',
      details: (error as Error).message 
    }, 500)
  }
})

// Update user plan (admin action)
admin.post('/users/:id/plan', requireAuth, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'))
    const body = await c.req.json()
    const plan = body.plan
    const billingPeriod = body.billingPeriod || 'monthly' // Default to monthly

    console.log(`📝 Admin updating plan for user ${userId}: ${plan} (${billingPeriod})`)

    if (!['free', 'core', 'premium', 'business'].includes(plan)) {
      return c.json({ error: '유효하지 않은 플랜입니다' }, 400)
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return c.json({ error: '유효하지 않은 결제 주기입니다' }, 400)
    }

    // Calculate subscription period based on billing period
    const periodMonths = billingPeriod === 'monthly' ? 1 : 12

    // Get current date in Korea timezone
    const koreaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const startDate = koreaDate.toISOString()
    
    // Calculate end date
    const endDate = new Date(koreaDate)
    endDate.setMonth(endDate.getMonth() + periodMonths)
    const endDateISO = endDate.toISOString()

    console.log(`  📅 Subscription: ${startDate} → ${endDateISO}`)

    // Update user plan with Korea timezone dates
    await c.env.DB.prepare(`
      UPDATE users 
      SET plan = ?, 
          billing_period = ?,
          subscription_start_date = ?,
          subscription_end_date = ?
      WHERE id = ?
    `).bind(
      plan,
      billingPeriod,
      startDate,
      endDateISO,
      userId
    ).run()

    console.log(`✅ Plan updated successfully for user ${userId}`)

    return c.json({
      success: true,
      message: '플랜이 업데이트되었습니다',
      data: {
        plan,
        billingPeriod,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDateISO
      }
    })
  } catch (error) {
    console.error('Admin update plan error:', error)
    return c.json({ error: '플랜 업데이트 실패: ' + (error as Error).message }, 500)
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
    const deleteTasks = [
      { name: 'session_analysis', query: 'DELETE FROM session_analysis WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', params: [userId] },
      { name: 'session_reports', query: 'DELETE FROM session_reports WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', params: [userId] },
      { name: 'session_feedback', query: 'DELETE FROM session_feedback WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', params: [userId] },
      { name: 'mode_reports', query: 'DELETE FROM mode_reports WHERE user_id = ?', params: [userId] },
      { name: 'messages', query: 'DELETE FROM messages WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', params: [userId] },
      { name: 'sessions', query: 'DELETE FROM sessions WHERE user_id = ?', params: [userId] },
      { name: 'login_sessions', query: 'DELETE FROM login_sessions WHERE user_id = ?', params: [userId] },
      { name: 'session_durations', query: 'DELETE FROM session_durations WHERE user_id = ?', params: [userId] },
      { name: 'vocabulary_bookmarks', query: 'DELETE FROM vocabulary_bookmarks WHERE user_id = ?', params: [userId] },
      { name: 'user_vocabulary_progress', query: 'DELETE FROM user_vocabulary_progress WHERE user_id = ?', params: [userId] },
      { name: 'user_custom_wordbooks', query: 'DELETE FROM user_custom_wordbooks WHERE user_id = ?', params: [userId] },
      { name: 'user_stats', query: 'DELETE FROM user_stats WHERE user_id = ?', params: [userId] },
      { name: 'user_badges', query: 'DELETE FROM user_badges WHERE user_id = ?', params: [userId] },
      { name: 'gamification_stats', query: 'DELETE FROM gamification_stats WHERE user_id = ?', params: [userId] },
      { name: 'attendance', query: 'DELETE FROM attendance WHERE user_id = ?', params: [userId] },
      { name: 'payment_orders', query: 'DELETE FROM payment_orders WHERE user_id = ?', params: [userId] },
      { name: 'activity_logs', query: 'DELETE FROM activity_logs WHERE user_id = ?', params: [userId] },
      { name: 'user_activity_log', query: 'DELETE FROM user_activity_log WHERE user_id = ?', params: [userId] },
      { name: 'usage_tracking (by string)', query: 'DELETE FROM usage_tracking WHERE user_id = ?', params: [userId.toString()] },
      { name: 'usage_tracking (by int)', query: 'DELETE FROM usage_tracking WHERE CAST(user_id AS INTEGER) = ?', params: [userId] },
      // ✅ Daily goals & streak system tables (added recently)
      { name: 'streak_milestones', query: 'DELETE FROM streak_milestones WHERE user_id = ?', params: [userId] },
      { name: 'daily_goals', query: 'DELETE FROM daily_goals WHERE user_id = ?', params: [userId] },
      { name: 'user_streaks', query: 'DELETE FROM user_streaks WHERE user_id = ?', params: [userId] },
      // ✅ Daily missions & XP tracking
      { name: 'daily_missions', query: 'DELETE FROM daily_missions WHERE user_id = ?', params: [userId] },
      { name: 'daily_xp_tracking', query: 'DELETE FROM daily_xp_tracking WHERE user_id = ?', params: [userId] },
      { name: 'daily_xp_history', query: 'DELETE FROM daily_xp_history WHERE user_id = ?', params: [userId] },
      { name: 'user_attendance', query: 'DELETE FROM user_attendance WHERE user_id = ?', params: [userId] },
      // ✅ Prize & reward system
      { name: 'user_prize_wins', query: 'DELETE FROM user_prize_wins WHERE user_id = ?', params: [userId] },
      { name: 'speed_quiz_scores', query: 'DELETE FROM speed_quiz_scores WHERE user_id = ?', params: [userId] },
      // ✅ Live Speaking (Hiing) related tables
      { name: 'hiing_notification_logs', query: 'DELETE FROM hiing_notification_logs WHERE session_id IN (SELECT id FROM hiing_sessions WHERE student_id = ? OR teacher_id = ?)', params: [userId, userId] },
      { name: 'hiing_sessions', query: 'DELETE FROM hiing_sessions WHERE student_id = ? OR teacher_id = ?', params: [userId, userId] },
      { name: 'hiing_credits', query: 'DELETE FROM hiing_credits WHERE user_id = ?', params: [userId] },
      { name: 'hiing_teacher_availability', query: 'DELETE FROM hiing_teacher_availability WHERE teacher_id = ?', params: [userId] },
      { name: 'hiing_notification_preferences', query: 'DELETE FROM hiing_notification_preferences WHERE user_id = ?', params: [userId] },
      { name: 'hiing_teacher_notification_preferences', query: 'DELETE FROM hiing_teacher_notification_preferences WHERE teacher_id = ?', params: [userId] },
    ]

    for (const task of deleteTasks) {
      try {
        await c.env.DB.prepare(task.query).bind(...task.params).run()
        console.log(`  ✓ Deleted ${task.name}`)
      } catch (e) {
        console.log(`  - ${task.name}: ${(e as Error).message}`)
      }
    }
    
    // Finally delete the user (this must succeed)
    try {
      await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
      console.log('  ✓ Deleted user')
    } catch (e) {
      console.error('  ✗ Failed to delete user:', (e as Error).message)
      throw new Error('사용자 삭제 실패: ' + (e as Error).message)
    }

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

// Set user as admin (restricted to specific emails)
admin.post('/set-admin', async (c) => {
  try {
    const { email, secret } = await c.req.json()
    
    // Simple secret check (you can change this to a more secure method)
    if (secret !== 'worvox-admin-2024') {
      return c.json({ error: '권한이 없습니다' }, 403)
    }
    
    // Update user to admin
    const result = await c.env.DB.prepare(`
      UPDATE users 
      SET is_admin = 1 
      WHERE email = ?
    `).bind(email).run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }
    
    console.log(`✅ User ${email} set as admin`)
    
    return c.json({
      success: true,
      message: `${email}이(가) 관리자로 설정되었습니다`
    })
  } catch (error) {
    console.error('Set admin error:', error)
    return c.json({ error: '관리자 설정 실패' }, 500)
  }
})

export default admin
