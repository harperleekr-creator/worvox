import { Hono } from 'hono';
import type { Bindings } from '../types';

const sessions = new Hono<{ Bindings: Bindings }>();

// Create a new conversation session
sessions.post('/create', async (c) => {
  try {
    const { userId, topicId, level } = await c.req.json();

    if (!userId || !topicId) {
      return c.json({ error: 'userId and topicId are required' }, 400);
    }

    let topicName = 'Conversation';
    let topicLevel = level || 'intermediate';
    let topicResult: any = null;

    // Special topic IDs don't need topics table lookup
    // 997 = Exam Mode, 998 = Scenario Mode, 999 = Timer Mode
    if (topicId === 997) {
      topicName = 'Exam Mode';
    } else if (topicId === 998) {
      topicName = 'Scenario Mode';
    } else if (topicId === 999) {
      topicName = 'Timer Mode';
    } else {
      // Get topic details from topics table for regular topics
      topicResult = await c.env.DB.prepare(
        'SELECT * FROM topics WHERE id = ?'
      ).bind(topicId).first();

      if (!topicResult) {
        return c.json({ error: 'Topic not found' }, 404);
      }

      topicName = topicResult.name;
      topicLevel = level || topicResult.level;
    }

    // Create new session with KST timezone (UTC+9) and topic_id
    const result = await c.env.DB.prepare(
      'INSERT INTO sessions (user_id, topic_id, topic, level, started_at) VALUES (?, ?, ?, ?, datetime("now", "+9 hours"))'
    ).bind(userId, topicId, topicName, topicLevel).run();

    const sessionId = result.meta.last_row_id;

    // Record attendance for today (auto-ignore if already recorded)
    try {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO attendance (user_id, attendance_date)
        VALUES (?, DATE('now', '+9 hours'))
      `).bind(userId).run();
    } catch (err) {
      // Don't fail session creation if attendance recording fails
      console.error('Failed to record attendance:', err);
    }

    return c.json({
      sessionId,
      topic: topicResult || { id: topicId, name: topicName, level: topicLevel },
      success: true,
    });

  } catch (error) {
    console.error('Create session error:', error);
    return c.json({ 
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// End a conversation session
sessions.post('/end/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    await c.env.DB.prepare(
      'UPDATE sessions SET ended_at = datetime("now", "+9 hours") WHERE id = ?'
    ).bind(sessionId).run();

    return c.json({
      success: true,
      message: 'Session ended successfully',
    });

  } catch (error) {
    console.error('End session error:', error);
    return c.json({ 
      error: 'Failed to end session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get session details
sessions.get('/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE id = ?'
    ).bind(sessionId).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({
      session,
      success: true,
    });

  } catch (error) {
    console.error('Get session error:', error);
    return c.json({ 
      error: 'Failed to fetch session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user's sessions
sessions.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    const result = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 50'
    ).bind(userId).all();

    return c.json({
      sessions: result.results || [],
      success: true,
    });

  } catch (error) {
    console.error('Get user sessions error:', error);
    return c.json({ 
      error: 'Failed to fetch user sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ⏱️ Get today's total session time for a user
sessions.get('/today-time/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }
    
    const db = c.env.DB;
    const today = new Date().toISOString().split('T')[0];
    
    // Get total session time for today from hiing_session_time table
    const result = await db.prepare(`
      SELECT COALESCE(SUM(duration_seconds), 0) as totalSeconds
      FROM hiing_session_time
      WHERE user_id = ?
        AND DATE(created_at) = ?
    `).bind(userId, today).first();
    
    return c.json({
      success: true,
      totalSeconds: result?.totalSeconds || 0,
      date: today
    });
    
  } catch (error) {
    console.error('Get today session time error:', error);
    return c.json({
      success: false,
      totalSeconds: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 200); // Return 200 to not block app
  }
});

// ⏱️ Save session time
sessions.post('/save-time', async (c) => {
  try {
    const { userId, seconds } = await c.req.json();
    
    if (!userId || !seconds) {
      return c.json({ error: 'userId and seconds are required' }, 400);
    }
    
    const db = c.env.DB;
    
    // Create table if not exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS hiing_session_time (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Insert session time record
    await db.prepare(`
      INSERT INTO hiing_session_time (user_id, duration_seconds, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, seconds).run();
    
    console.log(`⏱️ Saved ${seconds}s for user ${userId}`);
    
    return c.json({
      success: true,
      secondsSaved: seconds
    });
    
  } catch (error) {
    console.error('Save session time error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default sessions;
