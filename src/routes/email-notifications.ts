// Email notification service for trial expiration
import { Hono } from 'hono';
import type { Bindings } from '../types';

const emailNotifications = new Hono<{ Bindings: Bindings }>();

// Debug endpoint to check environment variables
emailNotifications.get('/debug', async (c) => {
  return c.json({
    hasResendKey: !!c.env.RESEND_API_KEY,
    resendKeyLength: c.env.RESEND_API_KEY?.length || 0,
    resendKeyPrefix: c.env.RESEND_API_KEY?.substring(0, 8) || 'not found',
    allEnvKeys: Object.keys(c.env)
  });
});

// Send trial expiration email via Resend API
async function sendTrialExpirationEmail(
  env: Bindings,
  user: { email: string; username: string; subscription_end_date: string; plan: string }
) {
  const resendApiKey = env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not configured');
    return false;
  }

  const template = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>무료체험 종료 안내</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8B5CF6; font-size: 32px; margin: 0;">⏰ WorVox</h1>
        <p style="color: #6B7280; font-size: 16px; margin-top: 10px;">무료체험이 곧 종료됩니다</p>
      </div>
      
      <!-- Main Content -->
      <div style="margin-bottom: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          안녕하세요, <strong style="color: #8B5CF6;">${user.username}</strong>님!
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          WorVox 무료체험이 <strong style="color: #EF4444;">3일 후</strong> 종료됩니다.
        </p>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
          <strong>종료일:</strong> ${new Date(user.subscription_end_date).toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <!-- Benefits Box -->
      <div style="background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); border-radius: 10px; padding: 25px; margin-bottom: 30px;">
        <h3 style="color: #374151; font-size: 20px; margin-top: 0; margin-bottom: 15px;">
          ${user.plan === 'core' ? 'Core' : 'Premium'} 플랜으로 계속 이용하세요!
        </h3>
        <ul style="color: #4B5563; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0;">
          <li><strong>✨ AI 프롬프트 무제한 생성</strong> - 타이머, 시나리오, 시험 모드</li>
          <li><strong>💬 AI 대화 무제한</strong> - 실시간 AI와 영어 대화 연습</li>
          <li><strong>📊 상세 발음 분석</strong> - 정확도, 억양, 리듬 분석</li>
          <li><strong>🎯 개인 맞춤 학습</strong> - 약점 분석 및 맞춤형 콘텐츠</li>
          <li><strong>📈 학습 기록 무제한 저장</strong> - 진도 추적 및 복습</li>
        </ul>
        <p style="color: #EF4444; font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 0;">
          단돈 ${user.plan === 'core' ? '₩9,900' : '₩19,000'}/월
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="https://worvox.com" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
          지금 Premium 구독하기 →
        </a>
      </div>
      
      <!-- Info Box -->
      <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <p style="color: #1E40AF; font-size: 14px; margin: 0; line-height: 1.6;">
          💡 <strong>자동 결제 안내:</strong> 체험 종료 시 등록하신 카드로 자동 결제됩니다. 
          원하지 않으시면 내 정보 → 구독 관리에서 해지해주세요.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0;">
          이 메일을 받고 싶지 않으시다면 
          <a href="https://worvox.com/settings" style="color: #8B5CF6; text-decoration: none;">설정</a>에서 알림을 끌 수 있습니다.
        </p>
        <p style="color: #9CA3AF; font-size: 13px; margin-top: 10px;">
          © 2026 WorVox. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WorVox <no-reply@worvox.com>',
        to: user.email,
        subject: `⏰ ${user.username}님, WorVox 무료체험이 3일 후 종료됩니다`,
        html: template,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Email send failed:', result);
      return false;
    }

    console.log('✅ Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
}

// Manual trigger endpoint for testing
emailNotifications.post('/send-test-email', async (c) => {
  try {
    const { email, username } = await c.req.json();
    
    if (!email || !username) {
      return c.json({ success: false, error: 'Email and username required' }, 400);
    }

    // Create test user data
    const testUser = {
      email,
      username,
      subscription_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      plan: 'premium'
    };

    const sent = await sendTrialExpirationEmail(c.env, testUser);
    
    if (sent) {
      return c.json({ 
        success: true, 
        message: 'Test email sent successfully',
        to: email
      });
    } else {
      return c.json({ 
        success: false, 
        error: 'Failed to send email. Check RESEND_API_KEY configuration.'
      }, 500);
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Manual trigger for sending reminders (admin only)
emailNotifications.post('/send-reminders', async (c) => {
  try {
    // Calculate target date (3 days from now)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const targetDate = threeDaysLater.toISOString().split('T')[0];

    console.log(`📅 Checking for trials ending on: ${targetDate}`);

    // Get users whose trial ends in 3 days and haven't been notified
    const users = await c.env.DB.prepare(`
      SELECT id, email, username, subscription_end_date, plan
      FROM users
      WHERE is_trial = 1
        AND DATE(subscription_end_date) = ?
        AND trial_reminder_sent = 0
        AND email IS NOT NULL
    `).bind(targetDate).all();

    console.log(`📧 Found ${users.results.length} users to notify`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    // Send emails to each user
    for (const user of users.results) {
      try {
        const sent = await sendTrialExpirationEmail(c.env, user as any);
        
        if (sent) {
          // Mark as sent in database
          await c.env.DB.prepare(`
            UPDATE users
            SET trial_reminder_sent = 1
            WHERE id = ?
          `).bind(user.id).run();
          
          successCount++;
          results.push({ email: user.email, status: 'success' });
        } else {
          failCount++;
          results.push({ email: user.email, status: 'failed', error: 'Email send failed' });
        }
      } catch (error: any) {
        failCount++;
        results.push({ email: user.email, status: 'error', error: error.message });
      }
    }

    return c.json({
      success: true,
      targetDate,
      totalUsers: users.results.length,
      successCount,
      failCount,
      results
    });
  } catch (error: any) {
    console.error('Send reminders error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get users needing trial reminder
emailNotifications.get('/pending-reminders', async (c) => {
  try {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const targetDate = threeDaysLater.toISOString().split('T')[0];

    const users = await c.env.DB.prepare(`
      SELECT id, email, username, subscription_end_date, plan
      FROM users
      WHERE is_trial = 1
        AND DATE(subscription_end_date) = ?
        AND trial_reminder_sent = 0
    `).bind(targetDate).all();

    return c.json({
      success: true,
      count: users.results.length,
      targetDate,
      users: users.results
    });
  } catch (error: any) {
    console.error('Get pending reminders error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default emailNotifications;

// Export for use in scheduled jobs
export { sendTrialExpirationEmail };
