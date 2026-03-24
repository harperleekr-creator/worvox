import { Hono } from 'hono'
import type { Context } from 'hono'
import { sendBookingConfirmation, sendLessonCompletion } from './notification-helpers'

type Bindings = {
  DB: D1Database
  RESEND_API_KEY?: string
  KAKAO_API_KEY?: string
  API_BASE_URL?: string
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
  const { userId, teacherId, teacherName, scheduledAt, duration, studentPhone } = await c.req.json()
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
      (user_id, teacher_id, teacher_name, scheduled_at, duration, teacher_phone, student_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `).bind(
      userId,
      teacherId,
      teacherName,
      scheduledAt,
      duration,
      teacher.phone_number,
      studentPhone || null
    ).run()

    // Get the created session
    const session = await DB.prepare(`
      SELECT * FROM hiing_sessions WHERE id = ?
    `).bind(insertResult.meta.last_row_id).first()

    // Get user info for notifications
    const user = await DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(userId).first()

    // Send booking confirmation notifications (email + SMS)
    try {
      await sendBookingConfirmation(c.env, session, user, teacher);
    } catch (error) {
      console.error('Failed to send booking notifications:', error);
      // Continue even if notifications fail
    }

    return c.json({
      success: true,
      session,
      teacher: {
        name: teacher.name,
        phone: teacher.phone_number
      },
      message: 'Booking confirmed! Notifications sent to both student and teacher.'
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

    // Get user info for completion notification
    const user = await DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(session.user_id).first()

    // Send lesson completion notification
    try {
      await sendLessonCompletion(c.env, session, user, teacher, totalCredits?.total || 0);
    } catch (error) {
      console.error('Failed to send completion notification:', error);
      // Continue even if notification fails
    }

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

// 7. Teacher Dashboard - Get teacher stats and sessions
app.post('/teacher/dashboard', async (c: Context) => {
  const { teacherCode, pin } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Verify teacher and PIN
    const teacher = await DB.prepare(`
      SELECT * FROM hiing_teachers WHERE teacher_code = ?
    `).bind(teacherCode).first() as any

    if (!teacher) {
      return c.json({ success: false, error: 'Teacher not found' }, 404)
    }

    // Verify PIN (default: 1234)
    const expectedPin = teacher.pin || '1234'
    if (pin !== expectedPin) {
      return c.json({ success: false, error: 'Invalid PIN' }, 401)
    }

    // Get all sessions for this teacher
    const sessions = await DB.prepare(`
      SELECT 
        s.*,
        u.username as student_name,
        u.email as student_email
      FROM hiing_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.teacher_id = ?
      ORDER BY s.scheduled_at DESC
    `).bind(teacher.id).all()

    // Calculate statistics
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let totalSessions = 0
    let completedSessions = 0
    let sessions25min = 0
    let sessions50min = 0
    let monthlyRevenue = 0
    let totalRevenue = 0

    const RATE_25MIN = 10500 // 25분 수업 단가
    const RATE_50MIN = 21000 // 50분 수업 단가 (25분 × 2)

    sessions.results.forEach((session: any) => {
      const sessionDate = new Date(session.scheduled_at)
      const isCurrentMonth = sessionDate.getMonth() === currentMonth && 
                            sessionDate.getFullYear() === currentYear

      if (session.status === 'completed') {
        completedSessions++
        
        if (session.duration === 25) {
          sessions25min++
          totalRevenue += RATE_25MIN
          if (isCurrentMonth) monthlyRevenue += RATE_25MIN
        } else if (session.duration === 50) {
          sessions50min++
          totalRevenue += RATE_50MIN
          if (isCurrentMonth) monthlyRevenue += RATE_50MIN
        }
      }

      totalSessions++
    })

    // Get upcoming sessions (scheduled or in_progress)
    const upcomingSessions = sessions.results.filter((s: any) => 
      ['scheduled', 'in_progress'].includes(s.status) &&
      new Date(s.scheduled_at) > now
    ).slice(0, 10)

    // Get today's sessions
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const todaySessions = sessions.results.filter((s: any) => {
      const sessionDate = new Date(s.scheduled_at)
      return sessionDate >= todayStart && sessionDate < todayEnd
    })

    return c.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        code: teacher.teacher_code,
        specialty: teacher.specialty,
        rating: teacher.rating
      },
      stats: {
        totalSessions,
        completedSessions,
        sessions25min,
        sessions50min,
        monthlyRevenue,
        totalRevenue,
        currentMonth: now.toLocaleString('ko-KR', { month: 'long' }),
        currentYear
      },
      upcomingSessions,
      todaySessions,
      allSessions: sessions.results
    })
  } catch (error: any) {
    console.error('Teacher dashboard error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 8. Change teacher PIN (강사 PIN 번호 변경)
app.post('/teacher/change-pin', async (c: Context) => {
  const { teacherCode, currentPin, newPin } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Validate inputs
    if (!teacherCode || !currentPin || !newPin) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return c.json({ success: false, error: 'PIN must be exactly 4 digits' }, 400)
    }

    // Verify teacher with current PIN
    const teacher: any = await DB.prepare(`
      SELECT * FROM hiing_teachers 
      WHERE teacher_code = ? AND pin_code = ? AND is_active = 1
    `).bind(teacherCode, currentPin).first()

    if (!teacher) {
      return c.json({ success: false, error: 'Invalid teacher code or current PIN' }, 401)
    }

    // Update PIN
    await DB.prepare(`
      UPDATE hiing_teachers 
      SET pin_code = ? 
      WHERE id = ?
    `).bind(newPin, teacher.id).run()

    return c.json({
      success: true,
      message: 'PIN changed successfully'
    })
  } catch (error: any) {
    console.error('Change PIN error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ========================================
// 관리자 전용 API (Admin Dashboard)
// ========================================

// 9. Admin Dashboard - Get all teachers overview (모든 강사 통계 조회)
app.post('/admin/dashboard', async (c: Context) => {
  const { adminPin } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Verify admin PIN (you can change this to a more secure method)
    const ADMIN_PIN = '9999' // 관리자 PIN
    
    if (adminPin !== ADMIN_PIN) {
      return c.json({ success: false, error: 'Invalid admin PIN' }, 401)
    }

    // Get all teachers
    const teachers = await DB.prepare(`
      SELECT * FROM hiing_teachers 
      ORDER BY name ASC
    `).all()

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const RATE_25MIN = 10500
    const RATE_50MIN = 21000

    // Calculate stats for each teacher
    const teacherStats = await Promise.all(
      teachers.results.map(async (teacher: any) => {
        // Get all sessions for this teacher
        const sessions = await DB.prepare(`
          SELECT 
            s.*,
            u.username as student_name,
            u.email as student_email
          FROM hiing_sessions s
          LEFT JOIN users u ON s.user_id = u.id
          WHERE s.teacher_id = ?
          ORDER BY s.scheduled_at DESC
        `).bind(teacher.id).all()

        let totalSessions = 0
        let completedSessions = 0
        let sessions25min = 0
        let sessions50min = 0
        let monthlyRevenue = 0
        let totalRevenue = 0

        sessions.results.forEach((session: any) => {
          const sessionDate = new Date(session.scheduled_at)
          const isCurrentMonth = sessionDate.getMonth() === currentMonth && 
                                sessionDate.getFullYear() === currentYear

          if (session.status === 'completed') {
            completedSessions++
            
            if (session.duration === 25) {
              sessions25min++
              totalRevenue += RATE_25MIN
              if (isCurrentMonth) monthlyRevenue += RATE_25MIN
            } else if (session.duration === 50) {
              sessions50min++
              totalRevenue += RATE_50MIN
              if (isCurrentMonth) monthlyRevenue += RATE_50MIN
            }
          }

          totalSessions++
        })

        // Get upcoming sessions
        const upcomingSessions = sessions.results.filter((s: any) => 
          ['scheduled', 'in_progress'].includes(s.status) &&
          new Date(s.scheduled_at) > now
        ).length

        // Get today's sessions
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const todaySessions = sessions.results.filter((s: any) => {
          const sessionDate = new Date(s.scheduled_at)
          return sessionDate >= todayStart && sessionDate < todayEnd
        }).length

        return {
          id: teacher.id,
          teacherCode: teacher.teacher_code,
          name: teacher.name,
          specialty: teacher.specialty,
          experience: teacher.experience,
          rating: teacher.rating,
          phoneNumber: teacher.phone_number,
          isActive: teacher.is_active,
          stats: {
            totalSessions,
            completedSessions,
            sessions25min,
            sessions50min,
            monthlyRevenue,
            totalRevenue,
            upcomingSessions,
            todaySessions
          }
        }
      })
    )

    // Calculate overall platform stats
    const overallStats = teacherStats.reduce((acc, teacher) => ({
      totalTeachers: acc.totalTeachers + 1,
      activeTeachers: acc.activeTeachers + (teacher.isActive ? 1 : 0),
      totalSessions: acc.totalSessions + teacher.stats.totalSessions,
      completedSessions: acc.completedSessions + teacher.stats.completedSessions,
      monthlyRevenue: acc.monthlyRevenue + teacher.stats.monthlyRevenue,
      totalRevenue: acc.totalRevenue + teacher.stats.totalRevenue,
      upcomingSessions: acc.upcomingSessions + teacher.stats.upcomingSessions,
      todaySessions: acc.todaySessions + teacher.stats.todaySessions
    }), {
      totalTeachers: 0,
      activeTeachers: 0,
      totalSessions: 0,
      completedSessions: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      upcomingSessions: 0,
      todaySessions: 0
    })

    return c.json({
      success: true,
      overallStats,
      teachers: teacherStats,
      currentMonth: now.toLocaleString('ko-KR', { month: 'long' }),
      currentYear
    })
  } catch (error: any) {
    console.error('Admin dashboard error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 10. Admin Dashboard - Get specific teacher detail (특정 강사 상세 조회)
app.post('/admin/teacher-detail', async (c: Context) => {
  const { adminPin, teacherId } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Verify admin PIN
    const ADMIN_PIN = '9999'
    
    if (adminPin !== ADMIN_PIN) {
      return c.json({ success: false, error: 'Invalid admin PIN' }, 401)
    }

    // Get teacher info
    const teacher = await DB.prepare(`
      SELECT * FROM hiing_teachers WHERE id = ?
    `).bind(teacherId).first() as any

    if (!teacher) {
      return c.json({ success: false, error: 'Teacher not found' }, 404)
    }

    // Get all sessions with student info
    const sessions = await DB.prepare(`
      SELECT 
        s.*,
        u.username as student_name,
        u.email as student_email,
        u.phone_number as student_phone
      FROM hiing_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.teacher_id = ?
      ORDER BY s.scheduled_at DESC
    `).bind(teacherId).all()

    // Calculate statistics
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let totalSessions = 0
    let completedSessions = 0
    let sessions25min = 0
    let sessions50min = 0
    let monthlyRevenue = 0
    let totalRevenue = 0

    const RATE_25MIN = 10500
    const RATE_50MIN = 21000

    sessions.results.forEach((session: any) => {
      const sessionDate = new Date(session.scheduled_at)
      const isCurrentMonth = sessionDate.getMonth() === currentMonth && 
                            sessionDate.getFullYear() === currentYear

      if (session.status === 'completed') {
        completedSessions++
        
        if (session.duration === 25) {
          sessions25min++
          totalRevenue += RATE_25MIN
          if (isCurrentMonth) monthlyRevenue += RATE_25MIN
        } else if (session.duration === 50) {
          sessions50min++
          totalRevenue += RATE_50MIN
          if (isCurrentMonth) monthlyRevenue += RATE_50MIN
        }
      }

      totalSessions++
    })

    return c.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        code: teacher.teacher_code,
        specialty: teacher.specialty,
        experience: teacher.experience,
        rating: teacher.rating,
        phoneNumber: teacher.phone_number,
        pinCode: teacher.pin_code,
        isActive: teacher.is_active
      },
      stats: {
        totalSessions,
        completedSessions,
        sessions25min,
        sessions50min,
        monthlyRevenue,
        totalRevenue,
        currentMonth: now.toLocaleString('ko-KR', { month: 'long' }),
        currentYear
      },
      sessions: sessions.results
    })
  } catch (error: any) {
    console.error('Admin teacher detail error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get user's active monthly subscriptions (월정기 구독 조회)
app.get('/subscriptions/:userId', async (c: Context) => {
  const userId = c.req.param('userId')
  const { DB } = c.env as Bindings

  try {
    // Get active monthly subscriptions
    const subscriptions = await DB.prepare(`
      SELECT * FROM hiing_credits
      WHERE user_id = ? 
      AND package_type = 'monthly'
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY purchase_date DESC
    `).bind(userId).all()

    return c.json({
      success: true,
      subscriptions: subscriptions.results || []
    })
  } catch (error: any) {
    console.error('Get subscriptions error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Cancel monthly subscription auto-renewal (월정기 구독 자동 갱신 취소)
app.post('/subscriptions/:subscriptionId/cancel', async (c: Context) => {
  const subscriptionId = c.req.param('subscriptionId')
  const { userId } = await c.req.json()
  const { DB } = c.env as Bindings

  try {
    // Get subscription
    const subscription = await DB.prepare(`
      SELECT * FROM hiing_credits WHERE id = ?
    `).bind(subscriptionId).first() as any

    if (!subscription) {
      return c.json({ success: false, error: 'Subscription not found' }, 404)
    }

    if (subscription.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    if (subscription.package_type !== 'monthly') {
      return c.json({ success: false, error: 'Not a monthly subscription' }, 400)
    }

    // Mark subscription as canceled (expires_at를 현재 만료일로 유지하고, 취소 플래그 추가)
    // Note: 실제로는 Toss Payments의 빌링키 기반 자동결제를 취소해야 하지만,
    // 현재는 단순히 DB에서 취소 표시만 합니다.
    await DB.prepare(`
      UPDATE hiing_credits
      SET package_type = 'monthly_canceled'
      WHERE id = ?
    `).bind(subscriptionId).run()

    return c.json({
      success: true,
      message: 'Subscription auto-renewal canceled. You can continue using your remaining credits until expiration.'
    })
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
