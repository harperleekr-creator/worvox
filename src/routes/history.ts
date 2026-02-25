import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

const history = new Hono<{ Bindings: Bindings }>()

// Get user's session history
history.get('/sessions/:userId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT 
        s.id,
        s.user_id,
        s.topic_id,
        s.level,
        s.started_at,
        s.ended_at,
        t.name as topic_name,
        t.icon as topic_icon,
        t.description as topic_description,
        COUNT(m.id) as message_count,
        CASE WHEN sr.id IS NOT NULL THEN 1 ELSE 0 END as has_report
      FROM sessions s
      LEFT JOIN topics t ON s.topic_id = t.id
      LEFT JOIN messages m ON s.id = m.session_id
      LEFT JOIN session_reports sr ON s.id = sr.session_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT 50
    `).bind(userId).all()

    return c.json({
      success: true,
      sessions: results || []
    })
  } catch (error: any) {
    console.error('Error fetching session history:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch session history',
      details: error.message
    }, 500)
  }
})

// Get detailed conversation for a specific session
history.get('/conversation/:sessionId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const sessionId = parseInt(c.req.param('sessionId'))
    
    if (!sessionId) {
      return c.json({ success: false, error: 'Session ID is required' }, 400)
    }

    // Get session info
    const { results: sessionResults } = await c.env.DB.prepare(`
      SELECT 
        s.*,
        t.name as topic_name,
        t.icon as topic_icon,
        t.description as topic_description,
        u.username
      FROM sessions s
      LEFT JOIN topics t ON s.topic_id = t.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).bind(sessionId).all()

    if (!sessionResults || sessionResults.length === 0) {
      return c.json({ success: false, error: 'Session not found' }, 404)
    }

    const session = sessionResults[0]

    // Get all messages for this session
    const { results: messages } = await c.env.DB.prepare(`
      SELECT 
        id,
        session_id,
        role,
        content,
        created_at
      FROM messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).bind(sessionId).all()

    return c.json({
      success: true,
      session: session,
      messages: messages || []
    })
  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch conversation',
      details: error.message
    }, 500)
  }
})

// Get user statistics
history.get('/stats/:userId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400)
    }

    // Total sessions
    const { results: sessionCount } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM sessions
      WHERE user_id = ?
    `).bind(userId).all()

    // Total messages
    const { results: messageCount } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN sessions s ON m.session_id = s.id
      WHERE s.user_id = ?
    `).bind(userId).all()

    // Messages by topic
    const { results: topicStats } = await c.env.DB.prepare(`
      SELECT 
        t.name as topic_name,
        t.icon as topic_icon,
        COUNT(m.id) as message_count,
        COUNT(DISTINCT s.id) as session_count
      FROM sessions s
      JOIN topics t ON s.topic_id = t.id
      LEFT JOIN messages m ON s.id = m.session_id
      WHERE s.user_id = ?
      GROUP BY t.id
      ORDER BY message_count DESC
    `).bind(userId).all()

    // Recent activity (last 30 days for better graph)
    const { results: recentActivity } = await c.env.DB.prepare(`
      SELECT 
        DATE(s.started_at) as date,
        COUNT(DISTINCT s.id) as sessions,
        COUNT(m.id) as messages
      FROM sessions s
      LEFT JOIN messages m ON s.id = m.session_id
      WHERE s.user_id = ?
        AND s.started_at >= datetime('now', '-30 days')
      GROUP BY DATE(s.started_at)
      ORDER BY date ASC
    `).bind(userId).all()

    // Weekly activity (last 12 weeks)
    const { results: weeklyActivity } = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-W%W', s.started_at) as week,
        COUNT(DISTINCT s.id) as sessions,
        COUNT(m.id) as messages,
        MIN(DATE(s.started_at)) as week_start
      FROM sessions s
      LEFT JOIN messages m ON s.id = m.session_id
      WHERE s.user_id = ?
        AND s.started_at >= datetime('now', '-84 days')
      GROUP BY strftime('%Y-W%W', s.started_at)
      ORDER BY week ASC
    `).bind(userId).all()

    // Level progression
    const { results: levelStats } = await c.env.DB.prepare(`
      SELECT 
        level,
        COUNT(DISTINCT s.id) as session_count,
        COUNT(m.id) as message_count
      FROM sessions s
      LEFT JOIN messages m ON s.id = m.session_id
      WHERE s.user_id = ?
      GROUP BY level
      ORDER BY 
        CASE level
          WHEN 'beginner' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
          ELSE 4
        END
    `).bind(userId).all()

    // Time of day analysis
    const { results: timeOfDay } = await c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', s.started_at) as INTEGER) as hour,
        COUNT(DISTINCT s.id) as session_count
      FROM sessions s
      WHERE s.user_id = ?
      GROUP BY hour
      ORDER BY hour
    `).bind(userId).all()

    // Learning streak
    const { results: streakData } = await c.env.DB.prepare(`
      SELECT DISTINCT DATE(started_at) as date
      FROM sessions
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT 30
    `).bind(userId).all()

    // Calculate current streak
    let currentStreak = 0
    if (streakData && streakData.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < streakData.length; i++) {
        const sessionDate = new Date(streakData[i].date as string)
        sessionDate.setHours(0, 0, 0, 0)
        
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === i) {
          currentStreak++
        } else {
          break
        }
      }
    }

    return c.json({
      success: true,
      stats: {
        totalSessions: sessionCount?.[0]?.count || 0,
        totalMessages: messageCount?.[0]?.count || 0,
        totalWords: Math.floor((messageCount?.[0]?.count || 0) / 2) * 10,
        currentStreak: currentStreak,
        topicStats: topicStats || [],
        recentActivity: recentActivity || [],
        weeklyActivity: weeklyActivity || [],
        levelStats: levelStats || [],
        timeOfDay: timeOfDay || []
      }
    })
  } catch (error: any) {
    console.error('Error fetching user stats:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch user statistics',
      details: error.message
    }, 500)
  }
})

export default history
