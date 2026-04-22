import { Hono } from 'hono';
import type { Bindings } from '../types';
import { sendAdminSignupNotification } from '../utils/email-helpers';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { getKSTNowForDB } from '../utils/timezone';

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
    logger.error('Username check error:', error);
    return c.json({ 
      error: 'Failed to check username',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Google Sign-In with JWT credential
users.post('/google-login', async (c) => {
  try {
    logger.info('🔐 Google login attempt...');
    const body = await c.req.json();
    logger.info('📦 Request body keys:', Object.keys(body));
    
    const { credential } = body;

    if (!credential) {
      logger.error('❌ No credential provided');
      return c.json({ error: 'Google credential is required' }, 400);
    }

    logger.info('🔑 Credential received, length:', credential.length);

    // Decode JWT token (payload is base64 encoded)
    const parts = credential.split('.');
    if (parts.length !== 3) {
      logger.error('❌ Invalid JWT format, parts:', parts.length);
      return c.json({ error: 'Invalid JWT token format' }, 400);
    }

    logger.info('🔓 Decoding JWT payload...');
    let payload;
    try {
      // Decode base64 and parse JSON with proper UTF-8 handling
      const base64Payload = parts[1];
      const decodedPayload = atob(base64Payload);
      
      // Convert to UTF-8 properly
      const utf8Payload = decodeURIComponent(
        Array.from(decodedPayload)
          .map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      payload = JSON.parse(utf8Payload);
      logger.info('✅ JWT decoded successfully with UTF-8');
      logger.info('👤 User info:', { 
        email: payload.email, 
        name: payload.name,
        sub: payload.sub 
      });
    } catch (decodeError) {
      // Fallback to simple atob if UTF-8 conversion fails
      try {
        payload = JSON.parse(atob(parts[1]));
        logger.info('✅ JWT decoded with fallback method');
      } catch (fallbackError) {
        logger.error('❌ JWT decode error:', decodeError);
        return c.json({ error: 'Failed to decode JWT token' }, 400);
      }
    }
    
    const googleId = payload.sub;
    const email = payload.email;
    
    // Get name from payload (already UTF-8 decoded)
    const name = payload.name || email?.split('@')[0] || 'User';
    logger.info('👤 Final username:', name);
    logger.info('👤 Username char codes:', Array.from(name).map(c => c.charCodeAt(0)));
    
    const picture = payload.picture || null;

    if (!googleId || !email) {
      logger.error('❌ Missing required fields:', { googleId, email });
      return c.json({ error: 'Invalid Google token data (missing email or ID)' }, 400);
    }

    logger.info('🔍 Checking existing user with google_id:', googleId);

    // Check if user exists with this Google ID (exclude soft-deleted users)
    const existingUser = await c.env.DB.prepare(
      'SELECT id, username, email, google_id, google_email, google_picture, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at, is_deleted FROM users WHERE google_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)'
    ).bind(googleId).first();

    if (existingUser) {
      logger.info('✅ Existing user found:', existingUser.id);
      logger.info('📊 User plan:', existingUser.plan || 'free');
      
      // Update profile picture if changed
      if (picture && existingUser.google_picture !== picture) {
        logger.info('🖼️ Updating profile picture...');
        await c.env.DB.prepare(
          'UPDATE users SET google_picture = ? WHERE id = ?'
        ).bind(picture, existingUser.id).run();
      }

      return c.json({
        user: { ...existingUser, google_picture: picture, plan: existingUser.plan || 'free' },
        success: true,
        isNew: false,
      });
    }

    logger.info('🔍 Checking existing user with email:', email);

    // Check if user exists with this email
    const emailUser = await c.env.DB.prepare(
      'SELECT id, username, email, google_id, google_email, google_picture, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE email = ? OR google_email = ?'
    ).bind(email, email).first();

    if (emailUser) {
      logger.info('✅ Email user found, linking Google account...');
      
      // Link Google account to existing user
      await c.env.DB.prepare(
        `UPDATE users SET google_id = ?, google_email = ?, google_picture = ?, auth_provider = 'google' 
         WHERE id = ?`
      ).bind(googleId, email, picture, emailUser.id).run();

      const updatedUser = await c.env.DB.prepare(
        'SELECT id, username, email, google_id, google_email, google_picture, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE id = ?'
      ).bind(emailUser.id).first();

      logger.info('✅ Google account linked successfully');
      logger.info('📊 User plan:', updatedUser.plan || 'free');

      return c.json({
        user: { ...updatedUser, plan: updatedUser.plan || 'free' },
        success: true,
        isNew: false,
        linked: true,
      });
    }

    logger.info('🆕 Creating new user...');

    // Create new user with Google account (plan defaults to 'free' via DB schema)
    const username = name;
    const kstNow = getKSTNowForDB();
    
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, google_id, google_email, google_picture, auth_provider, level, plan, created_at) 
       VALUES (?, ?, ?, ?, ?, 'google', 'beginner', 'free', ?)`
    ).bind(username, email, googleId, email, picture, kstNow).run();

    const userId = result.meta.last_row_id;
    logger.info('✅ New user created with ID:', userId);

    const newUser = await c.env.DB.prepare(
      'SELECT id, username, email, google_id, google_email, google_picture, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE id = ?'
    ).bind(userId).first();

    // Send welcome email for new Google users (async, non-blocking)
    try {
      await fetch(`${new URL(c.req.url).origin}/api/emails/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: username
        })
      });
      logger.info('📧 Welcome email sent to:', email);
    } catch (emailError) {
      logger.warn('⚠️ Failed to send welcome email (non-critical):', emailError);
    }

    // Send admin notification for new Google signup (async, non-blocking)
    try {
      await sendAdminSignupNotification(c.env, {
        id: Number(userId),
        email: email,
        username: username,
        plan: 'free',
        is_trial: 0,
        created_at: new Date().toISOString()
      });
      logger.info('📧 Admin signup notification sent for:', email);
    } catch (adminEmailError) {
      logger.warn('⚠️ Failed to send admin notification (non-critical):', adminEmailError);
    }

    logger.info('🎉 Google login successful!');
    logger.info('📊 New user plan:', newUser.plan || 'free');

    return c.json({
      user: { ...newUser, plan: newUser.plan || 'free' },
      success: true,
      isNew: true,
    });

  } catch (error) {
    logger.error('❌ Google login error:', error);
    logger.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return c.json({ 
      error: 'Failed to login with Google',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Google OAuth login (legacy)
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
    const picture = profileObj?.picture || profileObj?.imageUrl || null;

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
        ).bind(picture || null, existingUser.id).run();
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
      ).bind(googleId, email, picture || null, emailUser.id).run();

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
    const kstNow = getKSTNowForDB();
    
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, google_id, google_email, google_picture, auth_provider, level, created_at) 
       VALUES (?, ?, ?, ?, ?, 'google', 'beginner', ?)`
    ).bind(username, email, googleId, email, picture || null, kstNow).run();

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
    logger.error('Google auth error:', error);
    return c.json({ 
      error: 'Failed to authenticate with Google',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create or get user (legacy local auth)
users.post('/auth', async (c) => {
  try {
    const { username, email, level, occupation } = await c.req.json();

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
    const kstNow = getKSTNowForDB();
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, level, occupation, created_at) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      username, 
      email || null, 
      level || 'beginner',
      occupation || null,
      kstNow
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
    logger.error('Auth error:', error);
    return c.json({ 
      error: 'Failed to authenticate user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Email/Password Signup
users.post('/signup', async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    logger.info('📧 Signup attempt:', { name, email });

    // Validation
    if (!name || !email || !password) {
      return c.json({ error: 'Name, email, and password are required' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      logger.info('❌ Email already exists:', email);
      return c.json({ error: 'Email already registered' }, 409);
    }

    // Hash password with bcrypt (secure)
    const passwordHash = await bcrypt.hash(password, 10);
    const kstNow = getKSTNowForDB();

    // Create new user
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, password_hash, auth_provider, level, plan, created_at) 
       VALUES (?, ?, ?, 'email', 'beginner', 'free', ?)`
    ).bind(name, email, passwordHash, kstNow).run();

    const userId = result.meta.last_row_id;
    logger.info('✅ User created with ID:', userId);

    // Get created user
    const newUser = await c.env.DB.prepare(
      'SELECT id, username, email, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE id = ?'
    ).bind(userId).first();

    // Send welcome email (async, non-blocking)
    try {
      await fetch(`${new URL(c.req.url).origin}/api/emails/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name
        })
      });
      logger.info('📧 Welcome email sent to:', email);
    } catch (emailError) {
      logger.warn('⚠️ Failed to send welcome email (non-critical):', emailError);
      // Don't fail signup if email fails
    }

    // Send admin notification (async, non-blocking)
    try {
      await sendAdminSignupNotification(c.env, {
        id: Number(userId),
        email: email,
        username: name,
        plan: 'free',
        is_trial: 0,
        created_at: new Date().toISOString()
      });
      logger.info('📧 Admin signup notification sent for:', email);
    } catch (adminEmailError) {
      logger.warn('⚠️ Failed to send admin notification (non-critical):', adminEmailError);
      // Don't fail signup if admin email fails
    }

    return c.json({
      user: newUser,
      success: true,
      isNew: true,
    });

  } catch (error) {
    logger.error('❌ Signup error:', error);
    return c.json({ 
      error: 'Failed to create account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Email/Password Login
users.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    logger.info('🔐 Login attempt:', { email });

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user by email
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, password_hash, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      logger.info('❌ User not found:', email);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash as string);
    if (!isPasswordValid) {
      logger.info('❌ Invalid password for:', email);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    logger.info('✅ Login successful:', email);

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;

    return c.json({
      user: userWithoutPassword,
      success: true,
    });

  } catch (error) {
    logger.error('❌ Login error:', error);
    return c.json({ 
      error: 'Failed to login',
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
    logger.error('Get user error:', error);
    return c.json({ 
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update user settings (general)
users.patch('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const updates = await c.req.json();

    logger.info('📝 User update:', userId, updates);

    // Build dynamic UPDATE query
    const allowedFields = ['use_ai_prompts', 'username', 'level'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    values.push(userId); // Add userId for WHERE clause

    await c.env.DB.prepare(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return c.json({
      success: true,
      message: 'User settings updated successfully',
    });

  } catch (error) {
    logger.error('Update user error:', error);
    return c.json({ 
      error: 'Failed to update user settings',
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
    logger.error('Update level error:', error);
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
    logger.error('Get stats error:', error);
    return c.json({ 
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Change user password
users.patch('/:userId/password', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { currentPassword, newPassword } = await c.req.json();

    logger.info('🔐 Password change attempt for user:', userId);

    // Validation
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current password and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'New password must be at least 8 characters' }, 400);
    }

    // Get user with password_hash
    const user = await c.env.DB.prepare(
      'SELECT id, password_hash, auth_provider FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if user is using email authentication
    if (user.auth_provider !== 'email') {
      return c.json({ error: 'Password change is only available for email accounts' }, 400);
    }

    // Verify current password with bcrypt
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash as string);
    if (!isCurrentPasswordValid) {
      logger.info('❌ Invalid current password');
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    // Hash new password with bcrypt
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newPasswordHash, userId).run();

    logger.info('✅ Password changed successfully for user:', userId);

    return c.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('❌ Password change error:', error);
    return c.json({ 
      error: 'Failed to change password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Cancel subscription
users.post('/:id/cancel-subscription', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    logger.info('🚫 Canceling subscription for user:', userId);

    // Get current user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      logger.info('❌ User not found:', userId);
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if user has an active subscription
    if (!user.plan || user.plan === 'free') {
      logger.info('❌ No active subscription for user:', userId);
      return c.json({ error: 'No active subscription found' }, 400);
    }

    logger.info('✅ Current plan:', user.plan, 'Period:', user.billing_period);

    // Reset subscription fields
    await c.env.DB.prepare(`
      UPDATE users 
      SET plan = 'free',
          billing_period = NULL,
          subscription_start_date = NULL,
          subscription_end_date = NULL
      WHERE id = ?
    `).bind(userId).run();

    logger.info('✅ Subscription canceled successfully for user:', userId);

    return c.json({
      success: true,
      message: 'Subscription canceled successfully'
    });

  } catch (error) {
    logger.error('❌ Cancel subscription error:', error);
    return c.json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// 🔄 Sync user from localStorage to DB (for premium users)
users.post('/sync', async (c) => {
  try {
    const { id, username, email, plan, level, use_ai_prompts } = await c.req.json();

    logger.info('🔄 User sync request:', { id, username, email, plan, level, use_ai_prompts });

    // Validate required fields
    if (!username || !email) {
      return c.json({ 
        success: false, 
        error: 'Username and email are required' 
      }, 400);
    }

    // Check if user already exists in DB
    const existingUser = await c.env.DB.prepare(
      'SELECT id, plan, use_ai_prompts FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      logger.info('✅ User already exists in DB:', existingUser);
      
      // IMPORTANT: Don't overwrite paid plans (premium, core, etc.) with 'free'
      // Only update plan if:
      // 1. The new plan is NOT 'free' (explicit upgrade)
      // 2. OR the existing plan is already 'free' (safe to update)
      const shouldUpdatePlan = plan && plan !== 'free' && existingUser.plan !== plan;
      const shouldUpdateSettings = existingUser.use_ai_prompts !== use_ai_prompts;
      
      if (shouldUpdatePlan || shouldUpdateSettings) {
        if (shouldUpdatePlan) {
          await c.env.DB.prepare(
            'UPDATE users SET plan = ?, use_ai_prompts = ?, level = ? WHERE email = ?'
          ).bind(plan, use_ai_prompts ? 1 : 0, level || 'beginner', email).run();
          console.log(`✅ User plan updated: ${existingUser.plan} → ${plan}`);
        } else {
          await c.env.DB.prepare(
            'UPDATE users SET use_ai_prompts = ?, level = ? WHERE email = ?'
          ).bind(use_ai_prompts ? 1 : 0, level || 'beginner', email).run();
          logger.info('✅ User settings updated (plan unchanged)');
        }
      }
      
      return c.json({ 
        success: true, 
        userId: existingUser.id,
        message: 'User synced successfully',
        updated: existingUser.plan !== plan || existingUser.use_ai_prompts !== use_ai_prompts
      });
    }

    // Insert new user
    const kstNow = getKSTNowForDB();
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, plan, level, use_ai_prompts, auth_provider, created_at) 
       VALUES (?, ?, ?, ?, ?, 'local', ?)`
    ).bind(
      username,
      email,
      plan || 'free',
      level || 'beginner',
      use_ai_prompts ? 1 : 0,
      kstNow
    ).run();

    logger.info('✅ New user inserted into DB:', result.meta);

    return c.json({ 
      success: true, 
      userId: result.meta.last_row_id,
      message: 'User created and synced successfully',
      created: true
    });

  } catch (error) {
    logger.error('❌ User sync error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ==========================================
// Password Reset Flow
// ==========================================

/**
 * Request password reset - Send reset email with token
 * POST /api/users/password-reset/request
 */
users.post('/password-reset/request', async (c) => {
  try {
    const { email } = await c.req.json();

    logger.info('🔐 Password reset requested for:', email);

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Find user by email
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, auth_provider FROM users WHERE email = ?'
    ).bind(email).first();

    // Security: Don't reveal if user exists
    if (!user) {
      logger.info('⚠️ Password reset requested for non-existent email:', email);
      // Still return success to prevent email enumeration
      return c.json({
        success: true,
        message: '비밀번호 재설정 링크가 이메일로 발송되었습니다'
      });
    }

    // Check if user uses email authentication
    if (user.auth_provider !== 'email') {
      logger.info(`⚠️ Password reset requested for ${user.auth_provider} user:`, email);
      return c.json({
        error: `${user.auth_provider === 'google' ? 'Google' : 'Social'} 계정으로 로그인하세요`,
        provider: user.auth_provider
      }, 400);
    }

    // Generate reset token (32 random bytes)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Save token to database
    await c.env.DB.prepare(
      'INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(user.id, email, token, expiresAt).run();

    logger.info('✅ Password reset token generated for:', email);

    // Send reset email
    const resetUrl = `${new URL(c.req.url).origin}/app?reset_token=${token}`;
    
    try {
      const resendApiKey = c.env.RESEND_API_KEY;
      if (!resendApiKey) {
        logger.error('⚠️ RESEND_API_KEY not configured');
        throw new Error('Email service not configured');
      }

      const emailHtml = getPasswordResetEmailHTML(user.username as string, resetUrl);

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'WorVox <noreply@worvox.com>',
          to: email,
          subject: '🔐 WorVox 비밀번호 재설정',
          html: emailHtml,
          text: `비밀번호 재설정 링크: ${resetUrl}\n\n이 링크는 1시간 동안 유효합니다.`
        })
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        logger.error('❌ Failed to send reset email:', errorText);
        throw new Error('Failed to send email');
      }

      const emailResult = await emailResponse.json();
      logger.info('📧 Password reset email sent:', emailResult);

    } catch (emailError) {
      logger.error('❌ Email sending error:', emailError);
      return c.json({
        error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요'
      }, 500);
    }

    return c.json({
      success: true,
      message: '비밀번호 재설정 링크가 이메일로 발송되었습니다'
    });

  } catch (error) {
    logger.error('❌ Password reset request error:', error);
    return c.json({
      error: 'Failed to process password reset request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Verify reset token
 * POST /api/users/password-reset/verify
 */
users.post('/password-reset/verify', async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    // Find token in database
    const resetToken = await c.env.DB.prepare(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0'
    ).bind(token).first();

    if (!resetToken) {
      return c.json({ error: '유효하지 않은 토큰입니다', valid: false }, 400);
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at as string);

    if (now > expiresAt) {
      return c.json({ error: '만료된 토큰입니다', valid: false, expired: true }, 400);
    }

    return c.json({
      valid: true,
      email: resetToken.email
    });

  } catch (error) {
    logger.error('❌ Token verification error:', error);
    return c.json({
      error: 'Failed to verify token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Reset password with token
 * POST /api/users/password-reset/confirm
 */
users.post('/password-reset/confirm', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();

    logger.info('🔐 Password reset confirmation attempt');

    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: '비밀번호는 최소 8자 이상이어야 합니다' }, 400);
    }

    // Find and verify token
    const resetToken = await c.env.DB.prepare(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0'
    ).bind(token).first();

    if (!resetToken) {
      return c.json({ error: '유효하지 않은 토큰입니다' }, 400);
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at as string);

    if (now > expiresAt) {
      return c.json({ error: '만료된 토큰입니다. 다시 요청해주세요' }, 400);
    }

    // Hash new password with bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(passwordHash, resetToken.user_id).run();

    // Mark token as used
    await c.env.DB.prepare(
      'UPDATE password_reset_tokens SET used = 1 WHERE id = ?'
    ).bind(resetToken.id).run();

    logger.info('✅ Password reset successful for user:', resetToken.user_id);

    return c.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    });

  } catch (error) {
    logger.error('❌ Password reset confirmation error:', error);
    return c.json({
      error: 'Failed to reset password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Email template for password reset
 */
function getPasswordResetEmailHTML(userName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 재설정 - WorVox</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🔐 비밀번호 재설정
              </h1>
              <p style="margin: 10px 0 0 0; color: #e9d5ff; font-size: 18px;">
                보안 강화를 위한 비밀번호 변경
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                안녕하세요, <strong>${userName}</strong>님! 👋
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                WorVox 보안 강화를 위해 <strong>bcrypt 암호화 방식</strong>으로 업그레이드하였습니다.<br/>
                더 안전한 서비스 이용을 위해 비밀번호를 재설정해주세요.
              </p>
              
              <!-- Info Box -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 20px; margin: 30px 0; border: 2px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  <strong>💡 왜 재설정이 필요한가요?</strong><br/>
                  기존의 비밀번호 암호화 방식에서 업계 표준인 bcrypt로 업그레이드했습니다.<br/>
                  한 번만 재설정하시면 더욱 안전하게 계정을 보호할 수 있습니다.
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);">
                      비밀번호 재설정하기
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br/>
                <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
              </p>

              <!-- Warning -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  ⚠️ <strong>보안 안내</strong><br/>
                  • 이 링크는 <strong>1시간 동안만</strong> 유효합니다<br/>
                  • 요청하지 않았다면 이 이메일을 무시하세요<br/>
                  • 링크를 다른 사람과 공유하지 마세요
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                문의사항이 있으시면 <a href="mailto:support@worvox.com" style="color: #8b5cf6; text-decoration: none;">support@worvox.com</a>으로 연락주세요
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2026 WorVox. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export default users;
