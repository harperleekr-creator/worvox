import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// 1. Get user's credits (수업권 조회)
app.get('/credits/:userId', async (c: Context) => {
  const userId = c.req.param('userId')
  const { DB } = c.env as Bindings

  try {
    // Get all active credits and sum remaining
    const result = await DB.prepare(`
      SELECT SUM(remaining_credits) as total_remaining
      FROM hiing_credits
      WHERE user_id = ? 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(userId).first() as any

    // Get recent purchase info
    const recentPurchase = await DB.prepare(`
      SELECT * FROM hiing_credits
      WHERE user_id = ?
      ORDER BY purchase_date DESC
      LIMIT 1
    `).bind(userId).first()

    return c.json({
      success: true,
      remaining_credits: result?.total_remaining || 0,
      recent_purchase: recentPurchase || null
    })
  } catch (error: any) {
    console.error('Get credits error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 2. Get all teachers (강사 목록)
app.get('/teachers', async (c: Context) => {
  const { DB } = c.env as Bindings

  try {
    const result = await DB.prepare(`
      SELECT id, teacher_code, name, photo_url, specialty, experience, rating, phone_number, bio, nationality, title
      FROM hiing_teachers
      WHERE is_active = 1
      ORDER BY rating DESC
    `).all()

    return c.json({
      success: true,
      teachers: result.results
    })
  } catch (error: any) {
    console.error('Get teachers error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 3. Create booking/schedule (예약 생성)
app.post('/schedule', async (c: Context) => {
  const { userId, teacherId, teacherName, scheduledAt, duration } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Check if user has credits
    const credits = await DB.prepare(`
      SELECT SUM(remaining_credits) as total
      FROM hiing_credits
      WHERE user_id = ? 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(userId).first() as any

    if (!credits || credits.total <= 0) {
      return c.json({ success: false, error: 'No credits available' }, 400)
    }

    // Get teacher info
    const teacher = await DB.prepare(`
      SELECT * FROM hiing_teachers WHERE id = ?
    `).bind(teacherId).first() as any

    if (!teacher) {
      return c.json({ success: false, error: 'Teacher not found' }, 404)
    }

    // Create session (NOT deducted yet!)
    const insertResult = await DB.prepare(`
      INSERT INTO hiing_sessions 
      (user_id, teacher_id, teacher_name, scheduled_at, duration, teacher_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `).bind(
      userId,
      teacherId,
      teacherName,
      scheduledAt,
      duration,
      teacher.phone_number
    ).run()

    // Get the created session
    const session = await DB.prepare(`
      SELECT * FROM hiing_sessions WHERE id = ?
    `).bind(insertResult.meta.last_row_id).first()

    // TODO: Send email/SMS to teacher
    // TODO: Send confirmation to student

    return c.json({
      success: true,
      session,
      teacher: {
        name: teacher.name,
        phone: teacher.phone_number
      },
      message: 'Booking confirmed! Teacher will call you at scheduled time.'
    })
  } catch (error: any) {
    console.error('Schedule error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 4. Get user's sessions (내 예약 내역)
app.get('/sessions/:userId', async (c: Context) => {
  const userId = c.req.param('userId')
  const { DB } = c.env as Bindings

  try {
    const sessions = await DB.prepare(`
      SELECT s.*, t.photo_url as teacher_photo, t.specialty as teacher_specialty
      FROM hiing_sessions s
      LEFT JOIN hiing_teachers t ON s.teacher_id = t.id
      WHERE s.user_id = ?
      ORDER BY s.scheduled_at DESC
      LIMIT 50
    `).bind(userId).all()

    return c.json({
      success: true,
      sessions: sessions.results
    })
  } catch (error: any) {
    console.error('Get sessions error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 5. Teacher: Complete session (강사가 수업 완료 확인 + PIN 인증)
app.post('/teacher/complete', async (c: Context) => {
  const { teacherCode, pinCode, sessionId } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Verify teacher code AND PIN
    const teacher = await DB.prepare(`
      SELECT * FROM hiing_teachers 
      WHERE teacher_code = ? AND pin_code = ? AND is_active = 1
    `).bind(teacherCode, pinCode).first() as any

    if (!teacher) {
      return c.json({ success: false, error: 'Invalid teacher code or PIN' }, 401)
    }

    // Get session
    const session: any = await DB.prepare(`
      SELECT * FROM hiing_sessions WHERE id = ? AND teacher_id = ?
    `).bind(sessionId, teacher.id).first()

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404)
    }

    if (session.credit_deducted === 1) {
      return c.json({ success: false, error: 'Session already completed and credit deducted' }, 400)
    }

    // Update session
    await DB.prepare(`
      UPDATE hiing_sessions
      SET status = 'completed', 
          confirmed_by = 'teacher', 
          confirmed_at = datetime('now'),
          credit_deducted = 1
      WHERE id = ?
    `).bind(sessionId).run()

    // Deduct credit (가장 오래된 것부터 차감)
    const oldestCredit = await DB.prepare(`
      SELECT * FROM hiing_credits
      WHERE user_id = ? AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY purchase_date ASC
      LIMIT 1
    `).bind(session.user_id).first() as any

    if (oldestCredit) {
      await DB.prepare(`
        UPDATE hiing_credits
        SET remaining_credits = remaining_credits - 1
        WHERE id = ?
      `).bind(oldestCredit.id).run()
    }

    // Get updated total credits
    const totalCredits = await DB.prepare(`
      SELECT SUM(remaining_credits) as total
      FROM hiing_credits
      WHERE user_id = ?
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(session.user_id).first() as any

    return c.json({
      success: true,
      message: 'Session completed and credit deducted',
      remaining_credits: totalCredits?.total || 0,
      teacher_name: teacher.name
    })
  } catch (error: any) {
    console.error('Complete session error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 6. Teacher: Get pending sessions (강사 전용 - 예약된 수업 목록)
app.post('/teacher/sessions', async (c: Context) => {
  const { teacherCode, pinCode } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Verify teacher AND PIN
    const teacher: any = await DB.prepare(`
      SELECT * FROM hiing_teachers 
      WHERE teacher_code = ? AND pin_code = ? AND is_active = 1
    `).bind(teacherCode, pinCode).first()

    if (!teacher) {
      return c.json({ success: false, error: 'Invalid teacher code or PIN' }, 401)
    }

    // Get teacher's upcoming and recent sessions
    const sessions = await DB.prepare(`
      SELECT s.*, u.username, u.email
      FROM hiing_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.teacher_id = ? 
      AND (s.status = 'scheduled' OR (s.status = 'completed' AND s.scheduled_at > datetime('now', '-7 days')))
      ORDER BY s.scheduled_at ASC
    `).bind(teacher.id).all()

    return c.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        specialty: teacher.specialty
      },
      sessions: sessions.results
    })
  } catch (error: any) {
    console.error('Get teacher sessions error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 7. Purchase lesson credits (수업권 구매 - Toss 결제 연동)
app.post('/purchase', async (c: Context) => {
  const { userId, lessonCount, amount, packageType, paymentKey, orderId } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // For free trial, check if user already used it
    if (packageType === 'free') {
      const existingFreeTrial = await DB.prepare(`
        SELECT id FROM hiing_credits
        WHERE user_id = ? AND package_type = 'free'
        LIMIT 1
      `).bind(userId).first()

      if (existingFreeTrial) {
        return c.json({
          success: false,
          error: 'You have already used your free trial. Please purchase a lesson package.'
        }, 400)
      }
    }

    // Calculate expiration date
    let expiresAt = null
    if (packageType === 'free') {
      // Free trial: 30 days
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } else if (packageType === 'monthly') {
      // Monthly package: 90 days
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }
    // one-time packages: no expiration

    // Insert credit record
    const insertResult = await DB.prepare(`
      INSERT INTO hiing_credits 
      (user_id, lesson_count, amount, package_type, remaining_credits, expires_at, payment_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      lessonCount,
      amount,
      packageType,
      lessonCount, // initially all credits are remaining
      expiresAt,
      paymentKey || null
    ).run()

    const credit = await DB.prepare(`
      SELECT * FROM hiing_credits WHERE id = ?
    `).bind(insertResult.meta.last_row_id).first()

    return c.json({
      success: true,
      credit,
      message: `Successfully purchased ${lessonCount} lesson credits`
    })
  } catch (error: any) {
    console.error('Purchase error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
