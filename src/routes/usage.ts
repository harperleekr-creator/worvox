import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

// Get user's daily usage
app.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    // Get today's date in Korea timezone (UTC+9)
    const koreaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = koreaDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const result = await c.env.DB.prepare(`
      SELECT feature_type, usage_count, usage_date
      FROM usage_tracking
      WHERE user_id = ? AND usage_date = ?
    `).bind(userId, today).all();

    // Convert to frontend format
    const usage: any = {
      aiConversations: 0,
      pronunciationPractice: 0,
      wordSearch: 0,
      timerMode: 0,
      scenarioMode: 0,
      lastReset: new Date().toDateString()
    };

    if (result.results) {
      result.results.forEach((row: any) => {
        if (row.feature_type === 'ai_conversation') {
          usage.aiConversations = row.usage_count;
        } else if (row.feature_type === 'pronunciation') {
          usage.pronunciationPractice = row.usage_count;
        } else if (row.feature_type === 'word_search') {
          usage.wordSearch = row.usage_count;
        } else if (row.feature_type === 'timer_mode') {
          usage.timerMode = row.usage_count;
        } else if (row.feature_type === 'scenario_mode') {
          usage.scenarioMode = row.usage_count;
        }
      });
    }

    return c.json({ success: true, usage });
  } catch (error) {
    console.error('Error getting usage:', error);
    return c.json({ success: false, error: 'Failed to get usage' }, 500);
  }
});

// Update user's daily usage
app.post('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { featureType, increment = 1 } = await c.req.json();
    // Get today's date in Korea timezone (UTC+9)
    const koreaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = koreaDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Map frontend feature names to DB feature names
    const featureMap: { [key: string]: string } = {
      'aiConversations': 'ai_conversation',
      'pronunciationPractice': 'pronunciation',
      'wordSearch': 'word_search',
      'scenarioMode': 'scenario_mode',
      'timerMode': 'timer_mode'
    };

    const dbFeatureType = featureMap[featureType] || featureType;

    // Upsert usage count
    await c.env.DB.prepare(`
      INSERT INTO usage_tracking (user_id, feature_type, usage_date, usage_count)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, feature_type, usage_date)
      DO UPDATE SET usage_count = usage_count + ?, updated_at = CURRENT_TIMESTAMP
    `).bind(userId, dbFeatureType, today, increment, increment).run();

    // Get updated count
    const result = await c.env.DB.prepare(`
      SELECT usage_count
      FROM usage_tracking
      WHERE user_id = ? AND feature_type = ? AND usage_date = ?
    `).bind(userId, dbFeatureType, today).first();

    return c.json({ 
      success: true, 
      usage_count: result?.usage_count || increment 
    });
  } catch (error) {
    console.error('Error updating usage:', error);
    return c.json({ success: false, error: 'Failed to update usage' }, 500);
  }
});

// Get user's attendance dates (dates when they used any feature)
app.get('/users/:userId/attendance', async (c) => {
  try {
    const userId = c.req.param('userId');
    const year = c.req.query('year') || new Date().getFullYear().toString();
    const month = c.req.query('month') || (new Date().getMonth() + 1).toString();
    
    // Try to get from new attendance table first
    const attendanceResult = await c.env.DB.prepare(`
      SELECT attendance_date
      FROM attendance
      WHERE user_id = ?
      ORDER BY attendance_date DESC
    `).bind(userId).all();

    let attendanceDates = attendanceResult.results?.map((row: any) => row.attendance_date) || [];
    
    // Fallback to usage_tracking if attendance table is empty
    if (attendanceDates.length === 0) {
      const usageResult = await c.env.DB.prepare(`
        SELECT DISTINCT usage_date as attendance_date
        FROM usage_tracking
        WHERE user_id = ?
        ORDER BY usage_date DESC
      `).bind(userId).all();
      
      attendanceDates = usageResult.results?.map((row: any) => row.attendance_date) || [];
    }

    // Get total attendance count
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM attendance
      WHERE user_id = ?
    `).bind(userId).first();

    // Calculate current streak (simple version: days attended in last 30 days)
    const streakResult = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT attendance_date) as streak
      FROM attendance
      WHERE user_id = ?
        AND attendance_date >= DATE('now', '+9 hours', '-30 days')
        AND attendance_date <= DATE('now', '+9 hours')
    `).bind(userId).first();

    return c.json({ 
      success: true, 
      attendanceDates,
      total: (totalResult as any)?.total || 0,
      currentStreak: (streakResult as any)?.streak || 0,
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    return c.json({ success: false, error: 'Failed to get attendance', attendanceDates: [] }, 500);
  }
});

export default app;
