import { Hono } from 'hono';
import type { Bindings } from '../types';

const attendance = new Hono<{ Bindings: Bindings }>();

// Get user's attendance data for a specific month
attendance.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const year = c.req.query('year') || new Date().getFullYear().toString();
    const month = c.req.query('month') || (new Date().getMonth() + 1).toString();

    // Get attendance dates for the specified month
    const result = await c.env.DB.prepare(`
      SELECT attendance_date
      FROM attendance
      WHERE user_id = ?
        AND strftime('%Y', attendance_date) = ?
        AND strftime('%m', attendance_date) = ?
      ORDER BY attendance_date ASC
    `).bind(userId, year, month.padStart(2, '0')).all();

    // Get total attendance count
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM attendance
      WHERE user_id = ?
    `).bind(userId).first();

    // Get current streak
    const streakResult = await c.env.DB.prepare(`
      WITH RECURSIVE dates AS (
        SELECT DATE('now', '+9 hours') as check_date
        UNION ALL
        SELECT DATE(check_date, '-1 day')
        FROM dates
        WHERE check_date > DATE('now', '+9 hours', '-365 days')
      )
      SELECT COUNT(*) as streak
      FROM dates d
      WHERE EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.user_id = ? AND a.attendance_date = d.check_date
      )
      AND d.check_date <= DATE('now', '+9 hours')
      AND NOT EXISTS (
        SELECT 1 FROM dates d2
        WHERE d2.check_date < d.check_date
        AND d2.check_date > (
          SELECT MIN(check_date) FROM dates
          WHERE check_date IN (
            SELECT attendance_date FROM attendance WHERE user_id = ?
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM attendance a2
          WHERE a2.user_id = ? AND a2.attendance_date = d2.check_date
        )
      )
    `).bind(userId, userId, userId).first();

    // Simple streak calculation fallback
    const simpleStreakResult = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN MAX(attendance_date) = DATE('now', '+9 hours') 
            OR MAX(attendance_date) = DATE('now', '+9 hours', '-1 day')
          THEN (
            SELECT COUNT(DISTINCT attendance_date)
            FROM attendance
            WHERE user_id = ?
              AND attendance_date >= DATE('now', '+9 hours', '-30 days')
          )
          ELSE 0
        END as streak
      FROM attendance
      WHERE user_id = ?
    `).bind(userId, userId).first();

    return c.json({
      success: true,
      dates: result.results?.map((r: any) => r.attendance_date) || [],
      total: (totalResult as any)?.total || 0,
      currentStreak: (simpleStreakResult as any)?.streak || 0,
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    return c.json({ 
      error: 'Failed to fetch attendance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Record today's attendance (called automatically when user uses any feature)
attendance.post('/record', async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    // Insert attendance record (will be ignored if already exists for today)
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO attendance (user_id, attendance_date)
      VALUES (?, DATE('now', '+9 hours'))
    `).bind(userId).run();

    return c.json({
      success: true,
      message: 'Attendance recorded',
    });

  } catch (error) {
    console.error('Record attendance error:', error);
    return c.json({ 
      error: 'Failed to record attendance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default attendance;
