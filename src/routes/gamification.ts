import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

const gamification = new Hono<{ Bindings: Bindings }>()

// XP required for each level (exponential growth)
const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

// Calculate level from total XP
const calculateLevel = (totalXP: number): number => {
  let level = 1
  let xpNeeded = 0
  
  while (totalXP >= xpNeeded + getXPForLevel(level)) {
    xpNeeded += getXPForLevel(level)
    level++
  }
  
  return level
}

// Check daily XP limit for activity type
const checkDailyXPLimit = async (db: D1Database, userId: number, activityType: string, xpToAdd: number): Promise<{ allowed: boolean, currentXP: number, limit: number }> => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const dailyLimit = 100 // Daily XP limit per activity type
  
  // Get today's XP for this activity
  const tracking = await db.prepare(`
    SELECT xp_earned FROM daily_xp_tracking 
    WHERE user_id = ? AND activity_type = ? AND date = ?
  `).bind(userId, activityType, today).first() as any
  
  const currentXP = tracking?.xp_earned || 0
  const newTotal = currentXP + xpToAdd
  
  if (newTotal > dailyLimit) {
    return { allowed: false, currentXP, limit: dailyLimit }
  }
  
  // Update or insert tracking record
  await db.prepare(`
    INSERT INTO daily_xp_tracking (user_id, activity_type, xp_earned, date)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, activity_type, date) 
    DO UPDATE SET xp_earned = xp_earned + ?
  `).bind(userId, activityType, newTotal, today, xpToAdd).run()
  
  return { allowed: true, currentXP: newTotal, limit: dailyLimit }
}

// Add XP to user and update level
gamification.post('/xp/add', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId, xp, activityType, details } = await c.req.json()
    
    console.log('XP add request:', { userId, xp, activityType, details })
    
    if (!userId || !xp) {
      return c.json({ success: false, error: 'Missing userId or xp' }, 400)
    }
    
    // Check daily limit for specific activity types (not for random_box)
    if (activityType && activityType !== 'random_box' && activityType !== 'attendance') {
      const limitCheck = await checkDailyXPLimit(c.env.DB, userId, activityType, xp)
      
      if (!limitCheck.allowed) {
        return c.json({ 
          success: false, 
          error: 'Daily XP limit reached',
          currentXP: limitCheck.currentXP,
          limit: limitCheck.limit,
          message: `오늘 ${activityType} 활동으로 이미 ${limitCheck.limit} XP를 획득했습니다. 내일 다시 시도해주세요!`
        }, 429)
      }
    }

    // Get current user stats
    const user = await c.env.DB.prepare(`
      SELECT user_level, xp as current_xp, total_xp, coins 
      FROM users 
      WHERE id = ?
    `).bind(userId).first() as any

    console.log('User found:', user ? 'yes' : 'no', 'userId:', userId)

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found', 
        userId: userId,
        message: `User with id ${userId} not found in database` 
      }, 404)
    }

    const newTotalXP = (user.total_xp || 0) + xp
    const newLevel = calculateLevel(newTotalXP)
    const oldLevel = user.user_level || 1
    const leveledUp = newLevel > oldLevel
    
    // Calculate current level progress
    let xpForCurrentLevel = 0
    for (let i = 1; i < newLevel; i++) {
      xpForCurrentLevel += getXPForLevel(i)
    }
    const currentLevelXP = newTotalXP - xpForCurrentLevel
    const xpNeededForNextLevel = getXPForLevel(newLevel)

    // Calculate coin rewards (1 coin per 10 XP)
    const coinsEarned = Math.floor(xp / 10)
    const newCoins = (user.coins || 0) + coinsEarned

    // Update user stats
    await c.env.DB.prepare(`
      UPDATE users 
      SET user_level = ?, 
          xp = ?, 
          total_xp = ?, 
          coins = ?
      WHERE id = ?
    `).bind(newLevel, currentLevelXP, newTotalXP, newCoins, userId).run()

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO user_activity_log (user_id, activity_type, xp_gained, coins_gained, details)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, activityType || 'unknown', xp, coinsEarned, details || null).run()

    // Award level-up badge if leveled up
    if (leveledUp) {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO user_badges (user_id, badge_name, badge_description, badge_icon)
        VALUES (?, ?, ?, ?)
      `).bind(
        userId,
        `Level ${newLevel}`,
        `Reached level ${newLevel}!`,
        '🏆'
      ).run()
    }

    return c.json({
      success: true,
      leveledUp,
      oldLevel,
      newLevel,
      xpGained: xp,
      coinsEarned,
      currentLevelXP,
      xpNeededForNextLevel,
      totalXP: newTotalXP,
      totalCoins: newCoins
    })
  } catch (error) {
    console.error('Error adding XP:', error)
    return c.json({ success: false, error: 'Failed to add XP' }, 500)
  }
})

// Get user gamification stats
gamification.get('/stats/:userId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')

    const user = await c.env.DB.prepare(`
      SELECT user_level, xp, total_xp, coins, current_streak, longest_streak, total_words_practiced
      FROM users
      WHERE id = ?
    `).bind(userId).first() as any

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    const level = user.user_level || 1
    const xpForNextLevel = getXPForLevel(level)
    const progress = ((user.xp || 0) / xpForNextLevel) * 100

    // Get badges
    const { results: badges } = await c.env.DB.prepare(`
      SELECT badge_name, badge_description, badge_icon, earned_at
      FROM user_badges
      WHERE user_id = ?
      ORDER BY earned_at DESC
    `).bind(userId).all()

    // Get recent activity
    const { results: recentActivity } = await c.env.DB.prepare(`
      SELECT activity_type, xp_gained, coins_gained, details, created_at
      FROM user_activity_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(userId).all()

    return c.json({
      success: true,
      stats: {
        level: user.user_level || 1,
        xp: user.xp || 0,
        totalXP: user.total_xp || 0,
        xpForNextLevel,
        progress: Math.round(progress),
        coins: user.coins || 0,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
        wordsLearned: user.total_words_practiced || 0  // ✅ Add words tracking
      },
      badges: badges || [],
      recentActivity: recentActivity || []
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    return c.json({ success: false, error: 'Failed to get stats' }, 500)
  }
})

// Get leaderboard
gamification.get('/leaderboard', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        users.id,
        users.username,
        users.google_picture,
        users.user_level,
        users.total_xp,
        users.current_streak
      FROM users
      WHERE users.total_xp > 0
      ORDER BY users.total_xp DESC
      LIMIT 50
    `).all()

    return c.json({
      success: true,
      leaderboard: results || []
    })
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return c.json({ success: false, error: 'Failed to get leaderboard' }, 500)
  }
})

// Get user's spin count
gamification.get('/spin-count/:userId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')
    
    const user = await c.env.DB.prepare(`
      SELECT spin_count FROM users WHERE id = ?
    `).bind(userId).first() as any

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    return c.json({
      success: true,
      spin_count: user.spin_count || 0
    })
  } catch (error) {
    console.error('Error getting spin count:', error)
    return c.json({ success: false, error: 'Failed to get spin count' }, 500)
  }
})

// Update user's spin count
gamification.post('/spin-count/update', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId, spin_count } = await c.req.json()
    
    if (!userId || spin_count === undefined) {
      return c.json({ success: false, error: 'Missing userId or spin_count' }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE users SET spin_count = ? WHERE id = ?
    `).bind(spin_count, userId).run()

    return c.json({
      success: true,
      spin_count
    })
  } catch (error) {
    console.error('Error updating spin count:', error)
    return c.json({ success: false, error: 'Failed to update spin count' }, 500)
  }
})

// Use spin (decrement by 1)
gamification.post('/spin/use', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId } = await c.req.json()
    
    if (!userId) {
      return c.json({ success: false, error: 'Missing userId' }, 400)
    }

    const user = await c.env.DB.prepare(`
      SELECT spin_count FROM users WHERE id = ?
    `).bind(userId).first() as any

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    if ((user.spin_count || 0) <= 0) {
      return c.json({ success: false, error: 'No spins available' }, 400)
    }

    const newSpinCount = (user.spin_count || 0) - 1

    await c.env.DB.prepare(`
      UPDATE users SET spin_count = ? WHERE id = ?
    `).bind(newSpinCount, userId).run()

    return c.json({
      success: true,
      spin_count: newSpinCount
    })
  } catch (error) {
    console.error('Error using spin:', error)
    return c.json({ success: false, error: 'Failed to use spin' }, 500)
  }
})

// Check daily attendance and award XP + streak bonus
gamification.post('/attendance/check', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId } = await c.req.json()
    
    if (!userId) {
      return c.json({ success: false, error: 'Missing userId' }, 400)
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Check if already logged in today
    const todayAttendance = await c.env.DB.prepare(`
      SELECT id FROM user_attendance 
      WHERE user_id = ? AND login_date = ?
    `).bind(userId, today).first()
    
    if (todayAttendance) {
      return c.json({ 
        success: true, 
        alreadyChecked: true,
        message: '오늘은 이미 출석 체크를 완료했습니다!'
      })
    }
    
    // Get yesterday's attendance to calculate streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const yesterdayAttendance = await c.env.DB.prepare(`
      SELECT streak_days FROM user_attendance 
      WHERE user_id = ? AND login_date = ?
    `).bind(userId, yesterdayStr).first() as any
    
    let streakDays = 1
    let bonusXP = 0
    let bonusMessage = ''
    
    if (yesterdayAttendance) {
      streakDays = (yesterdayAttendance.streak_days || 0) + 1
      
      // Calculate streak bonus
      if (streakDays === 3) {
        bonusXP = 10
        bonusMessage = '🎉 3일 연속 출석 보너스!'
      } else if (streakDays === 7) {
        bonusXP = 30
        bonusMessage = '🔥 7일 연속 출석 보너스!'
      } else if (streakDays === 30) {
        bonusXP = 100
        bonusMessage = '💎 30일 연속 출석 보너스!'
      } else if (streakDays % 7 === 0) {
        bonusXP = 30
        bonusMessage = `🌟 ${streakDays}일 연속 출석 보너스!`
      }
    }
    
    const baseXP = 20 // Base daily login XP
    const totalXP = baseXP + bonusXP
    
    // Record attendance
    await c.env.DB.prepare(`
      INSERT INTO user_attendance (user_id, login_date, xp_awarded, streak_days)
      VALUES (?, ?, ?, ?)
    `).bind(userId, today, totalXP, streakDays).run()
    
    // Award XP through gamification API
    const xpResult = await fetch(c.req.url.replace('/attendance/check', '/xp/add'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        xp: totalXP,
        activityType: 'attendance',
        details: `Daily login (${streakDays} day streak)`
      })
    }).then(r => r.json())
    
    return c.json({
      success: true,
      alreadyChecked: false,
      xpAwarded: totalXP,
      baseXP,
      bonusXP,
      streakDays,
      bonusMessage,
      xpResult
    })
  } catch (error) {
    console.error('Error checking attendance:', error)
    return c.json({ success: false, error: 'Failed to check attendance' }, 500)
  }
})

// Get user's current streak
gamification.get('/attendance/streak/:userId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')
    
    // Get most recent attendance
    const attendance = await c.env.DB.prepare(`
      SELECT streak_days, login_date 
      FROM user_attendance 
      WHERE user_id = ? 
      ORDER BY login_date DESC 
      LIMIT 1
    `).bind(userId).first() as any
    
    if (!attendance) {
      return c.json({ success: true, streakDays: 0 })
    }
    
    // Check if streak is still active (logged in today or yesterday)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const isActive = attendance.login_date === today || attendance.login_date === yesterdayStr
    
    return c.json({
      success: true,
      streakDays: isActive ? (attendance.streak_days || 0) : 0
    })
  } catch (error) {
    console.error('Error getting streak:', error)
    return c.json({ success: false, error: 'Failed to get streak' }, 500)
  }
})

// Update words practiced count
gamification.post('/words/add', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId, words, activityType } = await c.req.json()

    if (!userId || typeof words !== 'number' || words <= 0) {
      return c.json({ success: false, error: 'Valid userId and words count required' }, 400)
    }

    console.log(`📝 Adding ${words} words for user ${userId} (${activityType})`)

    // Update user's total words
    await c.env.DB.prepare(`
      UPDATE users 
      SET total_words_practiced = total_words_practiced + ?
      WHERE id = ?
    `).bind(words, userId).run()

    // Get updated count
    const user = await c.env.DB.prepare(`
      SELECT total_words_practiced FROM users WHERE id = ?
    `).bind(userId).first() as any

    console.log(`✅ Words updated: ${user?.total_words_practiced || 0}`)

    return c.json({
      success: true,
      totalWords: user?.total_words_practiced || 0,
      wordsAdded: words
    })

  } catch (error) {
    console.error('Error adding words:', error)
    return c.json({ success: false, error: 'Failed to add words' }, 500)
  }
})

export default gamification
