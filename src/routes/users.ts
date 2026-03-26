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

// Google Sign-In with JWT credential
users.post('/google-login', async (c) => {
  try {
    console.log('🔐 Google login attempt...');
    const body = await c.req.json();
    console.log('📦 Request body keys:', Object.keys(body));
    
    const { credential } = body;

    if (!credential) {
      console.error('❌ No credential provided');
      return c.json({ error: 'Google credential is required' }, 400);
    }

    console.log('🔑 Credential received, length:', credential.length);

    // Decode JWT token (payload is base64 encoded)
    const parts = credential.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT format, parts:', parts.length);
      return c.json({ error: 'Invalid JWT token format' }, 400);
    }

    console.log('🔓 Decoding JWT payload...');
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
      console.log('✅ JWT decoded successfully with UTF-8');
      console.log('👤 User info:', { 
        email: payload.email, 
        name: payload.name,
        sub: payload.sub 
      });
    } catch (decodeError) {
      // Fallback to simple atob if UTF-8 conversion fails
      try {
        payload = JSON.parse(atob(parts[1]));
        console.log('✅ JWT decoded with fallback method');
      } catch (fallbackError) {
        console.error('❌ JWT decode error:', decodeError);
        return c.json({ error: 'Failed to decode JWT token' }, 400);
      }
    }
    
    const googleId = payload.sub;
    const email = payload.email;
    
    // Get name from payload (already UTF-8 decoded)
    const name = payload.name || email?.split('@')[0] || 'User';
    console.log('👤 Final username:', name);
    console.log('👤 Username char codes:', Array.from(name).map(c => c.charCodeAt(0)));
    
    const picture = payload.picture || null;

    if (!googleId || !email) {
      console.error('❌ Missing required fields:', { googleId, email });
      return c.json({ error: 'Invalid Google token data (missing email or ID)' }, 400);
    }

    console.log('🔍 Checking existing user with google_id:', googleId);

    // Check if user exists with this Google ID
    const existingUser = await c.env.DB.prepare(
      'SELECT id, username, email, google_id, google_email, google_picture, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE google_id = ?'
    ).bind(googleId).first();

    if (existingUser) {
      console.log('✅ Existing user found:', existingUser.id);
      console.log('📊 User plan:', existingUser.plan || 'free');
      
      // Update profile picture if changed
      if (picture && existingUser.google_picture !== picture) {
        console.log('🖼️ Updating profile picture...');
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

    console.log('🔍 Checking existing user with email:', email);

    // Check if user exists with this email
    const emailUser = await c.env.DB.prepare(
      'SELECT id, username, email, google_id, google_email, google_picture, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE email = ? OR google_email = ?'
    ).bind(email, email).first();

    if (emailUser) {
      console.log('✅ Email user found, linking Google account...');
      
      // Link Google account to existing user
      await c.env.DB.prepare(
        `UPDATE users SET google_id = ?, google_email = ?, google_picture = ?, auth_provider = 'google' 
         WHERE id = ?`
      ).bind(googleId, email, picture, emailUser.id).run();

      const updatedUser = await c.env.DB.prepare(
        'SELECT id, username, email, google_id, google_email, google_picture, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE id = ?'
      ).bind(emailUser.id).first();

      console.log('✅ Google account linked successfully');
      console.log('📊 User plan:', updatedUser.plan || 'free');

      return c.json({
        user: { ...updatedUser, plan: updatedUser.plan || 'free' },
        success: true,
        isNew: false,
        linked: true,
      });
    }

    console.log('🆕 Creating new user...');

    // Create new user with Google account (plan defaults to 'free' via DB schema)
    const username = name;
    
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, google_id, google_email, google_picture, auth_provider, level, plan) 
       VALUES (?, ?, ?, ?, ?, 'google', 'beginner', 'free')`
    ).bind(username, email, googleId, email, picture).run();

    const userId = result.meta.last_row_id;
    console.log('✅ New user created with ID:', userId);

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
      console.log('📧 Welcome email sent to:', email);
    } catch (emailError) {
      console.warn('⚠️ Failed to send welcome email (non-critical):', emailError);
    }

    console.log('🎉 Google login successful!');
    console.log('📊 New user plan:', newUser.plan || 'free');

    return c.json({
      user: { ...newUser, plan: newUser.plan || 'free' },
      success: true,
      isNew: true,
    });

  } catch (error) {
    console.error('❌ Google login error:', error);
    console.error('Error details:', {
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
    
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, google_id, google_email, google_picture, auth_provider, level) 
       VALUES (?, ?, ?, ?, ?, 'google', 'beginner')`
    ).bind(username, email, googleId, email, picture || null).run();

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
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, level, occupation) 
       VALUES (?, ?, ?, ?)`
    ).bind(
      username, 
      email || null, 
      level || 'beginner',
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

// Email/Password Signup
users.post('/signup', async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    console.log('📧 Signup attempt:', { name, email });

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
      console.log('❌ Email already exists:', email);
      return c.json({ error: 'Email already registered' }, 409);
    }

    // Hash password (simple encoding for demo - use proper hashing in production)
    const passwordHash = btoa(password); // Base64 encoding (NOT secure for production!)

    // Create new user
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, password_hash, auth_provider, level, plan) 
       VALUES (?, ?, ?, 'email', 'beginner', 'free')`
    ).bind(name, email, passwordHash).run();

    const userId = result.meta.last_row_id;
    console.log('✅ User created with ID:', userId);

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
      console.log('📧 Welcome email sent to:', email);
    } catch (emailError) {
      console.warn('⚠️ Failed to send welcome email (non-critical):', emailError);
      // Don't fail signup if email fails
    }

    return c.json({
      user: newUser,
      success: true,
      isNew: true,
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
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

    console.log('🔐 Login attempt:', { email });

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user by email
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, password_hash, level, auth_provider, plan, user_level, xp, total_xp, coins, current_streak, longest_streak, created_at FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      console.log('❌ User not found:', email);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const passwordHash = btoa(password); // Base64 encoding (match signup)
    if (user.password_hash !== passwordHash) {
      console.log('❌ Invalid password for:', email);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    console.log('✅ Login successful:', email);

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;

    return c.json({
      user: userWithoutPassword,
      success: true,
    });

  } catch (error) {
    console.error('❌ Login error:', error);
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
    console.error('Get user error:', error);
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

    console.log('📝 User update:', userId, updates);

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
    console.error('Update user error:', error);
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

// Change user password
users.patch('/:userId/password', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { currentPassword, newPassword } = await c.req.json();

    console.log('🔐 Password change attempt for user:', userId);

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

    // Verify current password
    const currentPasswordHash = btoa(currentPassword);
    if (user.password_hash !== currentPasswordHash) {
      console.log('❌ Invalid current password');
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    // Hash new password
    const newPasswordHash = btoa(newPassword);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newPasswordHash, userId).run();

    console.log('✅ Password changed successfully for user:', userId);

    return c.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Password change error:', error);
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
    console.log('🚫 Canceling subscription for user:', userId);

    // Get current user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      console.log('❌ User not found:', userId);
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if user has an active subscription
    if (!user.plan || user.plan === 'free') {
      console.log('❌ No active subscription for user:', userId);
      return c.json({ error: 'No active subscription found' }, 400);
    }

    console.log('✅ Current plan:', user.plan, 'Period:', user.billing_period);

    // Reset subscription fields
    await c.env.DB.prepare(`
      UPDATE users 
      SET plan = 'free',
          billing_period = NULL,
          subscription_start_date = NULL,
          subscription_end_date = NULL
      WHERE id = ?
    `).bind(userId).run();

    console.log('✅ Subscription canceled successfully for user:', userId);

    return c.json({
      success: true,
      message: 'Subscription canceled successfully'
    });

  } catch (error) {
    console.error('❌ Cancel subscription error:', error);
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

    console.log('🔄 User sync request:', { id, username, email, plan, level, use_ai_prompts });

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
      console.log('✅ User already exists in DB:', existingUser);
      
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
          console.log('✅ User settings updated (plan unchanged)');
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
    const result = await c.env.DB.prepare(
      `INSERT INTO users (username, email, plan, level, use_ai_prompts, auth_provider) 
       VALUES (?, ?, ?, ?, ?, 'local')`
    ).bind(
      username,
      email,
      plan || 'free',
      level || 'beginner',
      use_ai_prompts ? 1 : 0
    ).run();

    console.log('✅ New user inserted into DB:', result.meta);

    return c.json({ 
      success: true, 
      userId: result.meta.last_row_id,
      message: 'User created and synced successfully',
      created: true
    });

  } catch (error) {
    console.error('❌ User sync error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default users;
