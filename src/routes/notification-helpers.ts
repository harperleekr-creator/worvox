// Helper functions for sending Live Speaking notifications
import { emailTemplates, kakaoTemplates } from './notifications';

// Format date for display
function formatScheduledDate(scheduledAt: string) {
  const date = new Date(scheduledAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

function formatScheduledTime(scheduledAt: string) {
  // Convert to Korea timezone (UTC+9)
  const date = new Date(scheduledAt);
  const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  const hours = String(koreaTime.getUTCHours()).padStart(2, '0');
  const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

// Send booking confirmation notifications
export async function sendBookingConfirmation(env: any, session: any, user: any, teacher: any) {
  const scheduledDate = formatScheduledDate(session.scheduled_at);
  const scheduledTime = formatScheduledTime(session.scheduled_at);

  try {
    // Send email to student
    if (user.email) {
      const emailData = {
        studentName: user.name || user.email,
        scheduledDate,
        scheduledTime,
        teacherName: teacher.name,
        duration: session.duration,
        studentPhone: session.student_phone
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'studentBookingConfirmed',
          data: emailData,
          to: user.email
        })
      });

      // Log notification
      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_email, status
        ) VALUES (?, 'student', ?, 'booking_confirmed', 'email', ?, 'sent')
      `).bind(session.id, user.id, user.email).run();
    }

    // Send email to teacher
    if (teacher.email) {
      const teacherEmailData = {
        teacherName: teacher.name,
        scheduledDate,
        scheduledTime,
        studentName: user.name || user.email,
        duration: session.duration,
        studentPhone: session.student_phone
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'teacherNewBooking',
          data: teacherEmailData,
          to: teacher.email
        })
      });

      // Log notification
      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_email, status
        ) VALUES (?, 'teacher', ?, 'booking_confirmed', 'email', ?, 'sent')
      `).bind(session.id, teacher.id, teacher.email).run();
    }

    // Send Kakao/SMS to student
    if (session.student_phone) {
      const kakaoData = {
        scheduledDate,
        scheduledTime,
        teacherName: teacher.name,
        duration: session.duration,
        studentPhone: session.student_phone
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'studentBookingConfirmed',
          data: kakaoData,
          to: session.student_phone
        })
      });

      // Log notification
      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_phone, status
        ) VALUES (?, 'student', ?, 'booking_confirmed', 'kakao', ?, 'sent')
      `).bind(session.id, user.id, session.student_phone).run();
    }

    // Send Kakao/SMS to teacher
    if (teacher.phone_number) {
      const teacherKakaoData = {
        scheduledDate,
        scheduledTime,
        studentName: user.name || '학생',
        duration: session.duration,
        studentPhone: session.student_phone
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'teacherNewBooking',
          data: teacherKakaoData,
          to: teacher.phone_number
        })
      });

      // Log notification
      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_phone, status
        ) VALUES (?, 'teacher', ?, 'booking_confirmed', 'kakao', ?, 'sent')
      `).bind(session.id, teacher.id, teacher.phone_number).run();
    }

    // Mark notifications as sent
    await env.DB.prepare(`
      UPDATE hiing_sessions
      SET booking_notification_sent = 1
      WHERE id = ?
    `).bind(session.id).run();

    console.log('✅ Booking confirmation notifications sent for session:', session.id);

  } catch (error) {
    console.error('❌ Failed to send booking notifications:', error);
    // Don't throw error - booking should succeed even if notifications fail
  }
}

// Send reminder notifications (1 hour before)
export async function sendReminder1Hour(env: any, session: any, user: any, teacher: any) {
  const scheduledTime = formatScheduledTime(session.scheduled_at);

  try {
    // Send SMS to student
    if (session.student_phone) {
      const studentData = {
        scheduledTime,
        teacherName: teacher.name,
        contactPhone: teacher.phone_number,
        isTeacher: false
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reminder1Hour',
          data: studentData,
          to: session.student_phone
        })
      });

      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_phone, status
        ) VALUES (?, 'student', ?, 'reminder_1h', 'kakao', ?, 'sent')
      `).bind(session.id, user.id, session.student_phone).run();
    }

    // Send SMS to teacher
    if (teacher.phone_number) {
      const teacherData = {
        scheduledTime,
        studentName: user.name || '학생',
        contactPhone: session.student_phone,
        isTeacher: true
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reminder1Hour',
          data: teacherData,
          to: teacher.phone_number
        })
      });

      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_phone, status
        ) VALUES (?, 'teacher', ?, 'reminder_1h', 'kakao', ?, 'sent')
      `).bind(session.id, teacher.id, teacher.phone_number).run();
    }

    // Mark as sent
    await env.DB.prepare(`
      UPDATE hiing_sessions
      SET reminder_1h_sent = 1
      WHERE id = ?
    `).bind(session.id).run();

    console.log('✅ 1-hour reminder sent for session:', session.id);

  } catch (error) {
    console.error('❌ Failed to send 1-hour reminder:', error);
  }
}

// Send reminder notifications (10 minutes before)
export async function sendReminder10Minutes(env: any, session: any, user: any, teacher: any) {
  const scheduledTime = formatScheduledTime(session.scheduled_at);

  try {
    // Send SMS to student
    if (session.student_phone) {
      const studentData = {
        scheduledTime,
        teacherName: teacher.name,
        contactPhone: teacher.phone_number,
        isTeacher: false
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reminder10Minutes',
          data: studentData,
          to: session.student_phone
        })
      });

      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_phone, status
        ) VALUES (?, 'student', ?, 'reminder_10m', 'kakao', ?, 'sent')
      `).bind(session.id, user.id, session.student_phone).run();
    }

    // Send SMS to teacher
    if (teacher.phone_number) {
      const teacherData = {
        scheduledTime,
        studentName: user.name || '학생',
        contactPhone: session.student_phone,
        isTeacher: true
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reminder10Minutes',
          data: teacherData,
          to: teacher.phone_number
        })
      });

      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_phone, status
        ) VALUES (?, 'teacher', ?, 'reminder_10m', 'kakao', ?, 'sent')
      `).bind(session.id, teacher.id, teacher.phone_number).run();
    }

    // Mark as sent
    await env.DB.prepare(`
      UPDATE hiing_sessions
      SET reminder_10m_sent = 1
      WHERE id = ?
    `).bind(session.id).run();

    console.log('✅ 10-minute reminder sent for session:', session.id);

  } catch (error) {
    console.error('❌ Failed to send 10-minute reminder:', error);
  }
}

// Send lesson completion notification
export async function sendLessonCompletion(env: any, session: any, user: any, teacher: any, remainingCredits: number) {
  const scheduledDate = formatScheduledDate(session.scheduled_at);
  const scheduledTime = formatScheduledTime(session.scheduled_at);

  try {
    // Send email to student only
    if (user.email) {
      const emailData = {
        studentName: user.name || user.email,
        teacherName: teacher.name,
        duration: session.duration,
        remainingCredits
      };

      await fetch(`${env.API_BASE_URL || 'https://worvox.com'}/api/notifications/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lessonCompleted',
          data: emailData,
          to: user.email
        })
      });

      await env.DB.prepare(`
        INSERT INTO hiing_notification_logs (
          session_id, recipient_type, recipient_id, notification_type, channel,
          recipient_email, status
        ) VALUES (?, 'student', ?, 'completed', 'email', ?, 'sent')
      `).bind(session.id, user.id, user.email).run();
    }

    // Mark as sent
    await env.DB.prepare(`
      UPDATE hiing_sessions
      SET completion_notification_sent = 1
      WHERE id = ?
    `).bind(session.id).run();

    console.log('✅ Completion notification sent for session:', session.id);

  } catch (error) {
    console.error('❌ Failed to send completion notification:', error);
  }
}
