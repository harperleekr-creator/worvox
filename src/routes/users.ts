import { Hono } from 'hono';
import type { Bindings } from '../types';

const users = new Hono<{ Bindings: Bindings }>();

// Create or get user
users.post('/auth', async (c) => {
  try {
    const { username, email, level } = await c.req.json();

    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUser) {
      return c.json({
        user: existingUser,
        success: true,
      });
    }

    // Create new user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (username, email, level) VALUES (?, ?, ?)'
    ).bind(username, email || null, level || 'beginner').run();

    const userId = result.meta.last_row_id;

    const newUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    return c.json({
      user: newUser,
      success: true,
      isNew: true,
    });

  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ 
      error: 'Failed to authenticate user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user profile
users.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user,
      success: true,
    });

  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ 
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update user level
users.patch('/:userId/level', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { level } = await c.req.json();

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return c.json({ error: 'Invalid level' }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE users SET level = ? WHERE id = ?'
    ).bind(level, userId).run();

    return c.json({
      success: true,
      message: 'Level updated successfully',
    });

  } catch (error) {
    console.error('Update level error:', error);
    return c.json({ 
      error: 'Failed to update level',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user statistics
users.get('/:userId/stats', async (c) => {
  try {
    const userId = c.req.param('userId');

    // Get total sessions
    const sessionsResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM sessions WHERE user_id = ?'
    ).bind(userId).first();

    // Get total messages
    const messagesResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM messages 
       WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)`
    ).bind(userId).first();

    // Get recent activity
    const recentSessions = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 10'
    ).bind(userId).all();

    return c.json({
      stats: {
        totalSessions: sessionsResult?.total || 0,
        totalMessages: messagesResult?.total || 0,
        recentSessions: recentSessions.results || [],
      },
      success: true,
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ 
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default users;
