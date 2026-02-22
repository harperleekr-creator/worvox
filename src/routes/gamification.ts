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

// Add XP to user and update level
gamification.post('/xp/add', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId, xp, activityType, details } = await c.req.json()
    
    if (!userId || !xp) {
      return c.json({ success: false, error: 'Missing userId or xp' }, 400)
    }

    // Get current user stats
    const user = await c.env.DB.prepare(`
      SELECT user_level, xp as current_xp, total_xp, coins 
      FROM users 
      WHERE id = ?
    `).bind(userId).first() as any

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
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
      SELECT user_level, xp, total_xp, coins, current_streak, longest_streak
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
        longestStreak: user.longest_streak || 0
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

export default gamification
