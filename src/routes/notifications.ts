import { Hono } from 'hono';
import type { Bindings } from '../types';

const notifications = new Hono<{ Bindings: Bindings }>();

// Email templates
const emailTemplates = {
  // Student: Booking confirmed
  studentBookingConfirmed: (data: any) => ({
    subject: '✅ WorVox 전화영어 예약 완료',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { font-weight: 500; color: #111827; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 예약이 완료되었습니다!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">WorVox Live Speaking</p>
          </div>
          
          <div class="content">
            <p>안녕하세요, <strong>${data.studentName}</strong>님!</p>
            <p>전화영어 수업 예약이 성공적으로 완료되었습니다.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">📅 예약 정보</h3>
              <div class="info-row">
                <span class="info-label">수업 일시</span>
                <span class="info-value">${data.scheduledDate} ${data.scheduledTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">강사님</span>
                <span class="info-value">${data.teacherName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">수업 시간</span>
                <span class="info-value">${data.duration}분</span>
              </div>
              <div class="info-row" style="border-bottom: none;">
                <span class="info-label">학생 전화번호</span>
                <span class="info-value">${data.studentPhone}</span>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>📞 수업 진행 방식</strong>
              <p style="margin: 10px 0 0 0;">예약 시간 <strong>5분 전</strong>에 강사님께서 등록하신 전화번호로 먼저 연락드립니다. 전화를 받으실 준비를 해주세요!</p>
            </div>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>💡 수업 전 확인사항</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>조용하고 통화가 잘 되는 장소를 준비해주세요</li>
                <li>수업 주제나 학습하고 싶은 내용을 미리 생각해보세요</li>
                <li>필기도구를 준비하면 더욱 좋습니다</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="https://worvox.com/app" class="button">내 예약 확인하기</a>
            </div>
          </div>
          
          <div class="footer">
            <p>문의사항이 있으시면 언제든지 연락주세요.</p>
            <p>WorVox | AI English Learning Platform</p>
            <p style="font-size: 12px; color: #9ca3af;">이 이메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Teacher: New booking
  teacherNewBooking: (data: any) => ({
    subject: '📞 새로운 전화영어 예약',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { font-weight: 500; color: #111827; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📞 새로운 수업 예약</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">WorVox Live Speaking</p>
          </div>
          
          <div class="content">
            <p>안녕하세요, <strong>${data.teacherName}</strong> 강사님!</p>
            <p>새로운 전화영어 수업이 예약되었습니다.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #10b981;">📋 수업 정보</h3>
              <div class="info-row">
                <span class="info-label">수업 일시</span>
                <span class="info-value">${data.scheduledDate} ${data.scheduledTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">학생</span>
                <span class="info-value">${data.studentName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">수업 시간</span>
                <span class="info-value">${data.duration}분</span>
              </div>
              <div class="info-row" style="border-bottom: none;">
                <span class="info-label">학생 전화번호</span>
                <span class="info-value" style="font-size: 18px; font-weight: 600; color: #10b981;">${data.studentPhone}</span>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>⏰ 리마인더</strong>
              <p style="margin: 10px 0 0 0;">예약 시간 <strong>5분 전</strong>에 학생에게 먼저 전화해주세요. 수업 시작 1시간 전과 10분 전에 SMS 알림을 보내드립니다.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://worvox.com/hiing/teacher/dashboard" class="button">내 스케줄 확인하기</a>
            </div>
          </div>
          
          <div class="footer">
            <p>문의사항이 있으시면 언제든지 연락주세요.</p>
            <p>WorVox | AI English Learning Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Lesson completed
  lessonCompleted: (data: any) => ({
    subject: '🎉 오늘 수업 완료! 다음 예약하기',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats-box { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; background: white; padding: 20px; border-radius: 10px; flex: 1; margin: 0 10px; }
          .stat-value { font-size: 32px; font-weight: bold; color: #f59e0b; }
          .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 수업 완료!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Great job today!</p>
          </div>
          
          <div class="content">
            <p>안녕하세요, <strong>${data.studentName}</strong>님!</p>
            <p>${data.teacherName} 강사님과의 오늘 수업이 완료되었습니다.</p>
            
            <div class="stats-box">
              <div class="stat">
                <div class="stat-value">${data.duration}</div>
                <div class="stat-label">분 학습</div>
              </div>
              <div class="stat">
                <div class="stat-value">${data.remainingCredits}</div>
                <div class="stat-label">남은 수업권</div>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #f59e0b;">💪 꾸준한 학습이 실력 향상의 지름길!</h3>
              <p>정기적인 영어 연습이 스피킹 실력 향상에 가장 효과적입니다. 일주일에 2-3회 수업을 추천드립니다.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://worvox.com/app" class="button">다음 수업 예약하기</a>
            </div>
          </div>
          
          <div class="footer">
            <p>WorVox | AI English Learning Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Booking cancelled
  bookingCancelled: (data: any) => ({
    subject: '❌ WorVox 전화영어 예약 취소',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">예약이 취소되었습니다</h1>
          </div>
          
          <div class="content">
            <p>안녕하세요, <strong>${data.recipientName}</strong>님!</p>
            <p>아래 수업 예약이 취소되었습니다.</p>
            
            <div class="info-box">
              <p><strong>수업 일시:</strong> ${data.scheduledDate} ${data.scheduledTime}</p>
              <p><strong>강사님:</strong> ${data.teacherName}</p>
              <p><strong>수업 시간:</strong> ${data.duration}분</p>
            </div>
            
            <p>수업권은 다시 사용하실 수 있습니다. 다른 시간에 예약해주세요!</p>
            
            <div style="text-align: center;">
              <a href="https://worvox.com/app" class="button">새 수업 예약하기</a>
            </div>
          </div>
          
          <div class="footer">
            <p>WorVox | AI English Learning Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Kakao Alimtalk message templates (simplified versions for SMS fallback)
const kakaoTemplates = {
  studentBookingConfirmed: (data: any) => `[WorVox 전화영어 예약 완료]

✅ 예약이 완료되었습니다!

📅 수업 일시: ${data.scheduledDate} ${data.scheduledTime}
👨‍🏫 강사: ${data.teacherName}
⏱ 수업 시간: ${data.duration}분
📞 학생 전화번호: ${data.studentPhone}

💡 ${data.teacherName} 강사님께서 수업 시작 5분 전에 먼저 전화드립니다.

감사합니다!
WorVox`,

  teacherNewBooking: (data: any) => `[WorVox 새로운 수업 예약]

📞 새로운 수업이 예약되었습니다!

📅 수업 일시: ${data.scheduledDate} ${data.scheduledTime}
👤 학생: ${data.studentName}
📞 학생 전화번호: ${data.studentPhone}
⏱ 수업 시간: ${data.duration}분

⏰ 수업 시작 5분 전에 학생에게 먼저 전화해주세요.

감사합니다!
WorVox`,

  reminder1Hour: (data: any) => `[WorVox 수업 1시간 전 알림]

⏰ 1시간 후 전화영어 수업이 있습니다!

📅 ${data.scheduledTime}
${data.isTeacher ? `👤 학생: ${data.studentName}` : `👨‍🏫 강사: ${data.teacherName}`}
📞 ${data.contactPhone}

준비해주세요!`,

  reminder10Minutes: (data: any) => `[WorVox 수업 10분 전 알림]

🔔 10분 후 전화영어 시작!

${data.isTeacher ? `👤 학생: ${data.studentName}` : `👨‍🏫 강사: ${data.teacherName}`}
📞 ${data.contactPhone}

${data.isTeacher ? '곧 학생에게 전화해주세요!' : '곧 전화가 올 예정입니다!'}`,

  bookingCancelled: (data: any) => `[WorVox 예약 취소]

❌ 수업 예약이 취소되었습니다.

📅 ${data.scheduledDate} ${data.scheduledTime}
👨‍🏫 강사: ${data.teacherName}

다른 시간에 다시 예약해주세요.`
};

// Send email notification
notifications.post('/send-email', async (c) => {
  try {
    const { type, data, to } = await c.req.json();

    // Check if Resend API key is configured
    if (!c.env.RESEND_API_KEY) {
      console.warn('⚠️ Resend API key not configured');
      return c.json({ success: false, error: 'Email service not configured' }, 500);
    }

    // Get template
    const template = emailTemplates[type];
    if (!template) {
      return c.json({ success: false, error: 'Invalid template type' }, 400);
    }

    const { subject, html } = template(data);

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'WorVox <noreply@worvox.com>',
        to: [to],
        subject,
        html
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return c.json({ success: false, error: result.message }, response.status);
    }

    return c.json({
      success: true,
      messageId: result.id,
      data: result
    });

  } catch (error: any) {
    console.error('Send email error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Send Kakao Alimtalk / SMS
notifications.post('/send-kakao', async (c) => {
  try {
    const { type, data, to } = await c.req.json();

    // Check if Kakao API key is configured
    if (!c.env.KAKAO_API_KEY) {
      console.warn('⚠️ Kakao API key not configured');
      return c.json({ success: false, error: 'Kakao service not configured' }, 500);
    }

    // Get template
    const message = kakaoTemplates[type](data);
    if (!message) {
      return c.json({ success: false, error: 'Invalid template type' }, 400);
    }

    // TODO: Implement actual Kakao Alimtalk API call
    // For now, return success for testing
    console.log('📱 Kakao message to:', to);
    console.log('Message:', message);

    return c.json({
      success: true,
      messageId: 'test-' + Date.now(),
      message: 'Kakao integration pending - message logged'
    });

  } catch (error: any) {
    console.error('Send kakao error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Log notification
notifications.post('/log', async (c) => {
  try {
    const {
      sessionId,
      recipientType,
      recipientId,
      notificationType,
      channel,
      recipientEmail,
      recipientPhone,
      templateId,
      subject,
      message,
      status,
      providerMessageId,
      providerResponse
    } = await c.req.json();

    await c.env.DB.prepare(`
      INSERT INTO hiing_notification_logs (
        session_id, recipient_type, recipient_id, notification_type, channel,
        recipient_email, recipient_phone, template_id, subject, message,
        status, sent_at, provider_message_id, provider_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `).bind(
      sessionId, recipientType, recipientId, notificationType, channel,
      recipientEmail, recipientPhone, templateId, subject, message,
      status, providerMessageId, JSON.stringify(providerResponse)
    ).run();

    return c.json({ success: true });

  } catch (error: any) {
    console.error('Log notification error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get notification logs for a session
notifications.get('/logs/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    const logs = await c.env.DB.prepare(`
      SELECT * FROM hiing_notification_logs
      WHERE session_id = ?
      ORDER BY created_at DESC
    `).bind(sessionId).all();

    return c.json({ success: true, logs: logs.results });

  } catch (error: any) {
    console.error('Get logs error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default notifications;
export { emailTemplates, kakaoTemplates };
