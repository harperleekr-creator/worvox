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

    // Get topic details
    const topicResult = await c.env.DB.prepare(
      'SELECT * FROM topics WHERE id = ?'
    ).bind(topicId).first();

    if (!topicResult) {
      return c.json({ error: 'Topic not found' }, 404);
    }

    // Create new session with KST timezone (UTC+9)
    const result = await c.env.DB.prepare(
      'INSERT INTO sessions (user_id, topic, level, started_at) VALUES (?, ?, ?, datetime("now", "+9 hours"))'
    ).bind(userId, topicResult.name, level || topicResult.level).run();

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
      topic: topicResult,
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

export default sessions;
