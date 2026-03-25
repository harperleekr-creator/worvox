import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// 🎁 Check for comeback bonus eligibility
app.post('/comeback-check', async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const db = c.env.DB;
    
    // Get user's last activity date
    const lastActivityQuery = `
      SELECT 
        MAX(created_at) as last_activity
      FROM hiing_usage
      WHERE user_id = ?
    `;
    
    const result = await db.prepare(lastActivityQuery).bind(userId).first();
    
    if (!result || !result.last_activity) {
      // No previous activity, not eligible
      return c.json({ 
        eligible: false,
        reason: 'No previous activity'
      });
    }
    
    const lastActivity = new Date(result.last_activity as string);
    const now = new Date();
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`📊 User ${userId} - Last activity: ${lastActivity}, Days away: ${daysSinceLastActivity}`);
    
    // Check if user was away for 3+ days
    if (daysSinceLastActivity >= 3) {
      // Check if comeback bonus was already given today
      const today = new Date().toISOString().split('T')[0];
      const bonusCheck = await db.prepare(`
        SELECT COUNT(*) as count
        FROM hiing_gamification_activity
        WHERE user_id = ?
          AND activity_type = 'comeback_bonus'
          AND DATE(created_at) = ?
      `).bind(userId, today).first();
      
      if (bonusCheck && (bonusCheck.count as number) > 0) {
        return c.json({
          eligible: false,
          reason: 'Bonus already claimed today'
        });
      }
      
      // Award comeback bonus
      const baseXP = 100;
      const randomBoxCount = 2;
      
      // Add comeback bonus activity
      await db.prepare(`
        INSERT INTO hiing_gamification_activity (user_id, activity_type, xp_earned, details, created_at)
        VALUES (?, 'comeback_bonus', ?, ?, CURRENT_TIMESTAMP)
      `).bind(userId, baseXP, `Comeback bonus after ${daysSinceLastActivity} days`).run();
      
      // Update user XP
      await db.prepare(`
        UPDATE hiing_users
        SET total_xp = total_xp + ?,
            coins = coins + 50
        WHERE id = ?
      `).bind(baseXP, userId).run();
      
      // Award Random Boxes
      for (let i = 0; i < randomBoxCount; i++) {
        // Determine random reward
        const random = Math.random();
        let reward = '';
        let rewardValue = 0;
        
        if (random < 0.4) {
          // 40% - XP (50-300)
          rewardValue = Math.floor(Math.random() * 251) + 50;
          reward = `XP ${rewardValue}`;
          await db.prepare(`
            UPDATE hiing_users SET total_xp = total_xp + ? WHERE id = ?
          `).bind(rewardValue, userId).run();
        } else if (random < 0.7) {
          // 30% - Coins (10-50)
          rewardValue = Math.floor(Math.random() * 41) + 10;
          reward = `Coins ${rewardValue}`;
          await db.prepare(`
            UPDATE hiing_users SET coins = coins + ? WHERE id = ?
          `).bind(rewardValue, userId).run();
        } else if (random < 0.95) {
          // 25% - Nothing (Encouragement)
          reward = 'Keep Going!';
        } else {
          // 5% - Jackpot (500 XP + 100 Coins)
          reward = 'Jackpot! 500 XP + 100 Coins';
          await db.prepare(`
            UPDATE hiing_users 
            SET total_xp = total_xp + 500, coins = coins + 100 
            WHERE id = ?
          `).bind(userId).run();
        }
        
        // Log spin
        await db.prepare(`
          INSERT INTO hiing_random_box_spins (user_id, reward, reward_value, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(userId, reward, rewardValue).run();
      }
      
      return c.json({
        eligible: true,
        daysAway: daysSinceLastActivity,
        xpAwarded: baseXP,
        randomBoxes: randomBoxCount,
        boostDuration: 10 // 10 minutes
      });
    }
    
    return c.json({
      eligible: false,
      reason: `Only ${daysSinceLastActivity} days since last activity (need 3+)`
    });
    
  } catch (error) {
    console.error('Comeback bonus check error:', error);
    return c.json({ 
      error: 'Failed to check comeback bonus',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default app;
