import { Hono } from 'hono';
import type { Bindings } from '../types';

const users = new Hono<{ Bindings: Bindings }>();

// Check if username exists (for real-time validation)
users.post('/check-username', async (c) => {
  try {
    const { username } = await c.req.json();

    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }

    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    return c.json({
      exists: !!existingUser,
      available: !existingUser,
      success: true
    });

  } catch (error) {
    console.error('Username check error:', error);
    return c.json({ 
      error: 'Failed to check username',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Google OAuth login
users.post('/auth/google', async (c) => {
  try {
    const { credential, profileObj } = await c.req.json();

    if (!credential && !profileObj) {
      return c.json({ error: 'Google credential or profile is required' }, 400);
    }

    // Extract user info from Google profile
    const googleId = profileObj?.googleId || profileObj?.sub;
    const email = profileObj?.email;
    const name = profileObj?.name || profileObj?.given_name || email?.split('@')[0];
    const picture = profileObj?.picture || profileObj?.imageUrl;

    if (!googleId || !email) {
      return c.json({ error: 'Invalid Google profile data' }, 400);
    }

    // Check if user exists with this Google ID
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(googleId).first();

    if (existingUser) {
      // Update profile picture if changed
      if (picture && existingUser.google_picture !== picture) {
        await c.env.DB.prepare(
          'UPDATE users SET google_picture = ? WHERE id = ?'
        ).bind(picture, existingUser.id).run();
      }

      return c.json({
        user: { ...existingUser, google_picture: picture },
        success: true,
        isNew: false,
      });
    }

    // Check if user exists with this email (migration case)
    const emailUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? OR google_email = ?'
    ).bind(email, email).first();

    if (emailUser) {
      // Link Google account to existing user
      await c.env.DB.prepare(
        `UPDATE users SET google_id = ?, google_email = ?, google_picture = ?, auth_provider = 'google' 
         WHERE id = ?`
      ).bind(googleId, email, picture, emailUser.id).run();

      const updatedUser = await c.env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(emailUser.id).first();

      return c.json({
        user: updatedUser,
        success: true,
        isNew: false,
        linked: true,
      });
    }

    // Create new user with Google account
    const username = name || email.split('@')[0];
    
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, google_id, google_email, google_picture, auth_provider, level) 
       VALUES (?, ?, ?, ?, ?, 'google', 'beginner')`
    ).bind(username, email, googleId, email, picture).run();

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
    console.error('Google auth error:', error);
    return c.json({ 
      error: 'Failed to authenticate with Google',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create or get user (legacy local auth)
users.post('/auth', async (c) => {
  try {
    const { username, email, level, referralSource, ageGroup, gender, occupation } = await c.req.json();

    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUser) {
      // Username already exists (shouldn't happen as frontend checks first)
      return c.json({
        user: existingUser,
        success: true,
        existing: true
      });
    }

    // Create new user with all profile fields
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, level, referral_source, age_group, gender, occupation) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      username, 
      email || null, 
      level || 'beginner',
      referralSource || null,
      ageGroup || null,
      gender || null,
      occupation || null
    ).run();

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
