import { Hono } from 'hono';
import type { Bindings } from '../types';

const dailyGoals = new Hono<{ Bindings: Bindings }>();

// Goal level presets
const GOAL_PRESETS = {
  casual: {
    conversations: 2,
    timer_sessions: 3,
    words: 5,
    xp: 50,
    xp_reward: 30,
    random_boxes: 1
  },
  balanced: {
    conversations: 3,
    timer_sessions: 5,
    words: 10,
    xp: 100,
    xp_reward: 50,
    random_boxes: 1
  },
  intensive: {
    conversations: 5,
    timer_sessions: 10,
    words: 20,
    xp: 200,
    xp_reward: 100,
    random_boxes: 2
  }
};

// Milestone rewards
const MILESTONE_REWARDS = {
  7: { xp: 100, boxes: 2, badge: '🔥 7일 연속' },
  14: { xp: 200, boxes: 3, badge: '🔥🔥 14일 연속' },
  30: { xp: 500, boxes: 5, badge: '🔥🔥🔥 30일 연속' },
  100: { xp: 2000, boxes: 10, badge: '🏆 100일 레전드' }
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Initialize or get today's goal
dailyGoals.post('/init', async (c) => {
  try {
    const { userId, goalLevel = 'balanced' } = await c.req.json();

    if (!userId) {
      return c.json({ success: false, error: 'User ID required' }, 400);
    }

    const today = getTodayDate();
    const preset = GOAL_PRESETS[goalLevel] || GOAL_PRESETS.balanced;

    // Check if today's goal already exists
    const existing = await c.env.DB.prepare(`
      SELECT * FROM daily_goals 
      WHERE user_id = ? AND goal_date = ?
    `).bind(userId, today).first();

    if (existing) {
      return c.json({ success: true, goal: existing, isNew: false });
    }

    // Create today's goal
    const result = await c.env.DB.prepare(`
      INSERT INTO daily_goals (
        user_id, goal_date, goal_level,
        target_conversations, target_timer_sessions, target_words, target_xp,
        xp_reward, random_boxes_earned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, today, goalLevel,
      preset.conversations, preset.timer_sessions, preset.words, preset.xp,
      preset.xp_reward, preset.random_boxes
    ).run();

    // Get the created goal
    const newGoal = await c.env.DB.prepare(`
      SELECT * FROM daily_goals WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    // Initialize streak if not exists
    const streakExists = await c.env.DB.prepare(`
      SELECT id FROM user_streaks WHERE user_id = ?
    `).bind(userId).first();

    if (!streakExists) {
      await c.env.DB.prepare(`
        INSERT INTO user_streaks (user_id) VALUES (?)
      `).bind(userId).run();
    }

    return c.json({ success: true, goal: newGoal, isNew: true });
  } catch (error) {
    console.error('Error initializing daily goal:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get current goal and streak info
dailyGoals.get('/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    const today = getTodayDate();

    // Get today's goal
    const goal = await c.env.DB.prepare(`
      SELECT * FROM daily_goals 
      WHERE user_id = ? AND goal_date = ?
    `).bind(userId, today).first();

    // Get streak info
    const streak = await c.env.DB.prepare(`
      SELECT * FROM user_streaks WHERE user_id = ?
    `).bind(userId).first();

    // Calculate progress percentages
    let progress = null;
    if (goal) {
      progress = {
        conversations: Math.round((goal.current_conversations / goal.target_conversations) * 100),
        timer_sessions: Math.round((goal.current_timer_sessions / goal.target_timer_sessions) * 100),
        words: Math.round((goal.current_words / goal.target_words) * 100),
        xp: Math.round((goal.current_xp / goal.target_xp) * 100),
        overall: Math.round((
          (goal.current_conversations / goal.target_conversations) +
          (goal.current_timer_sessions / goal.target_timer_sessions) +
          (goal.current_words / goal.target_words) +
          (goal.current_xp / goal.target_xp)
        ) / 4 * 100)
      };
    }

    return c.json({
      success: true,
      goal,
      streak: streak || { current_streak: 0, longest_streak: 0 },
      progress,
      today
    });
  } catch (error) {
    console.error('Error getting daily goal:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update progress (called after each activity)
dailyGoals.post('/update-progress', async (c) => {
  try {
    const { userId, activity, amount = 1 } = await c.req.json();
    
    if (!userId || !activity) {
      return c.json({ success: false, error: 'User ID and activity required' }, 400);
    }

    const today = getTodayDate();

    // Get today's goal
    let goal = await c.env.DB.prepare(`
      SELECT * FROM daily_goals 
      WHERE user_id = ? AND goal_date = ?
    `).bind(userId, today).first();

    // If no goal exists, create one with balanced preset
    if (!goal) {
      const preset = GOAL_PRESETS.balanced;
      await c.env.DB.prepare(`
        INSERT INTO daily_goals (
          user_id, goal_date, goal_level,
          target_conversations, target_timer_sessions, target_words, target_xp,
          xp_reward, random_boxes_earned
        ) VALUES (?, ?, 'balanced', ?, ?, ?, ?, ?, ?)
      `).bind(
        userId, today,
        preset.conversations, preset.timer_sessions, preset.words, preset.xp,
        preset.xp_reward, preset.random_boxes
      ).run();

      goal = await c.env.DB.prepare(`
        SELECT * FROM daily_goals 
        WHERE user_id = ? AND goal_date = ?
      `).bind(userId, today).first();
    }

    // Update the specific activity
    let updateField = '';
    switch (activity) {
      case 'conversation':
        updateField = 'current_conversations';
        break;
      case 'timer':
        updateField = 'current_timer_sessions';
        break;
      case 'word':
        updateField = 'current_words';
        break;
      case 'xp':
        updateField = 'current_xp';
        break;
      default:
        return c.json({ success: false, error: 'Invalid activity type' }, 400);
    }

    // Update progress
    await c.env.DB.prepare(`
      UPDATE daily_goals 
      SET ${updateField} = ${updateField} + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND goal_date = ?
    `).bind(amount, userId, today).run();

    // Get updated goal
    goal = await c.env.DB.prepare(`
      SELECT * FROM daily_goals 
      WHERE user_id = ? AND goal_date = ?
    `).bind(userId, today).first();

    // Check if goal is now completed
    const isCompleted = 
      goal.current_conversations >= goal.target_conversations &&
      goal.current_timer_sessions >= goal.target_timer_sessions &&
      goal.current_words >= goal.target_words &&
      goal.current_xp >= goal.target_xp;

    let completionReward = null;
    
    if (isCompleted && !goal.is_completed) {
      // Mark goal as completed
      await c.env.DB.prepare(`
        UPDATE daily_goals 
        SET is_completed = 1, 
            completed_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND goal_date = ?
      `).bind(userId, today).run();

      // Add XP reward to user
      await c.env.DB.prepare(`
        UPDATE users 
        SET total_xp = total_xp + ?
        WHERE id = ?
      `).bind(goal.xp_reward, userId).run();

      // Add random boxes to user's spin count
      await c.env.DB.prepare(`
        UPDATE users 
        SET spin_count = spin_count + ?
        WHERE id = ?
      `).bind(goal.random_boxes_earned, userId).run();

      // Update streak
      const streakResult = await updateStreak(c.env.DB, userId, today);

      completionReward = {
        xp: goal.xp_reward,
        randomBoxes: goal.random_boxes_earned,
        streakUpdated: streakResult.streakIncreased,
        newStreak: streakResult.currentStreak,
        milestone: streakResult.milestoneAchieved
      };
    }

    // Get updated goal and streak
    const updatedGoal = await c.env.DB.prepare(`
      SELECT * FROM daily_goals 
      WHERE user_id = ? AND goal_date = ?
    `).bind(userId, today).first();

    const streak = await c.env.DB.prepare(`
      SELECT * FROM user_streaks WHERE user_id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      goal: updatedGoal,
      streak,
      justCompleted: isCompleted && !goal.is_completed,
      completionReward
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Helper function to update streak
async function updateStreak(db: any, userId: number, today: string) {
  // Get current streak data
  let streak = await db.prepare(`
    SELECT * FROM user_streaks WHERE user_id = ?
  `).bind(userId).first();

  if (!streak) {
    // Initialize streak if not exists
    await db.prepare(`
      INSERT INTO user_streaks (user_id, current_streak, last_goal_completed_date)
      VALUES (?, 1, ?)
    `).bind(userId, today).run();

    return { currentStreak: 1, streakIncreased: true, milestoneAchieved: null };
  }

  const lastCompletedDate = streak.last_goal_completed_date;
  
  // Check if this is consecutive day
  if (lastCompletedDate) {
    const lastDate = new Date(lastCompletedDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day - increase streak
      const newStreak = streak.current_streak + 1;
      const newLongest = Math.max(newStreak, streak.longest_streak);

      await db.prepare(`
        UPDATE user_streaks 
        SET current_streak = ?,
            longest_streak = ?,
            last_goal_completed_date = ?,
            total_goals_completed = total_goals_completed + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(newStreak, newLongest, today, userId).run();

      // Check for milestone achievements
      let milestoneAchieved = null;
      if (MILESTONE_REWARDS[newStreak]) {
        const milestone = MILESTONE_REWARDS[newStreak];
        
        // Record milestone
        await db.prepare(`
          INSERT INTO streak_milestones 
          (user_id, milestone_days, xp_reward, random_boxes_reward, badge_name)
          VALUES (?, ?, ?, ?, ?)
        `).bind(userId, newStreak, milestone.xp, milestone.boxes, milestone.badge).run();

        // Update milestone flags
        await db.prepare(`
          UPDATE user_streaks 
          SET milestone_${newStreak}_days = 1,
              total_random_boxes_earned = total_random_boxes_earned + ?
          WHERE user_id = ?
        `).bind(milestone.boxes, userId).run();

        // Add milestone rewards
        await db.prepare(`
          UPDATE users 
          SET total_xp = total_xp + ?,
              spin_count = spin_count + ?
          WHERE id = ?
        `).bind(milestone.xp, milestone.boxes, userId).run();

        milestoneAchieved = {
          days: newStreak,
          ...milestone
        };
      }

      return { 
        currentStreak: newStreak, 
        streakIncreased: true,
        milestoneAchieved
      };
    } else if (diffDays > 1) {
      // Streak broken - reset to 1
      await db.prepare(`
        UPDATE user_streaks 
        SET current_streak = 1,
            last_goal_completed_date = ?,
            total_goals_completed = total_goals_completed + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(today, userId).run();

      return { currentStreak: 1, streakIncreased: false, milestoneAchieved: null };
    }
  } else {
    // First goal completion
    await db.prepare(`
      UPDATE user_streaks 
      SET current_streak = 1,
          last_goal_completed_date = ?,
          total_goals_completed = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(today, userId).run();

    return { currentStreak: 1, streakIncreased: true, milestoneAchieved: null };
  }

  return { currentStreak: streak.current_streak, streakIncreased: false, milestoneAchieved: null };
}

// Change goal level
dailyGoals.post('/change-level', async (c) => {
  try {
    const { userId, newLevel } = await c.req.json();

    if (!userId || !newLevel) {
      return c.json({ success: false, error: 'User ID and level required' }, 400);
    }

    if (!GOAL_PRESETS[newLevel]) {
      return c.json({ success: false, error: 'Invalid goal level' }, 400);
    }

    const today = getTodayDate();
    const preset = GOAL_PRESETS[newLevel];

    // Update today's goal targets
    await c.env.DB.prepare(`
      UPDATE daily_goals 
      SET goal_level = ?,
          target_conversations = ?,
          target_timer_sessions = ?,
          target_words = ?,
          target_xp = ?,
          xp_reward = ?,
          random_boxes_earned = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND goal_date = ?
    `).bind(
      newLevel,
      preset.conversations,
      preset.timer_sessions,
      preset.words,
      preset.xp,
      preset.xp_reward,
      preset.random_boxes,
      userId,
      today
    ).run();

    // Get updated goal
    const goal = await c.env.DB.prepare(`
      SELECT * FROM daily_goals 
      WHERE user_id = ? AND goal_date = ?
    `).bind(userId, today).first();

    return c.json({ success: true, goal });
  } catch (error) {
    console.error('Error changing goal level:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get streak history (last 30 days)
dailyGoals.get('/history/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));

    // Get last 30 days of goals
    const goals = await c.env.DB.prepare(`
      SELECT goal_date, is_completed, current_conversations, current_timer_sessions, 
             current_words, current_xp, target_conversations, target_timer_sessions,
             target_words, target_xp
      FROM daily_goals 
      WHERE user_id = ?
      ORDER BY goal_date DESC
      LIMIT 30
    `).bind(userId).all();

    return c.json({ success: true, history: goals.results });
  } catch (error) {
    console.error('Error getting goal history:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default dailyGoals;
