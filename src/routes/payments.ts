import { Hono } from 'hono';
import type { Bindings } from '../types';

const payments = new Hono<{ Bindings: Bindings }>();

// 무료 체험 시작 이메일 템플릿
const getTrialStartEmailHTML = (userName: string, planName: string, trialEndDate: string, billingAmount: string) => `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>무료 체험 시작 - WorVox</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🎉 무료 체험 시작!
              </h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 18px;">
                ${planName} 플랜을 2주간 무료로 경험하세요
              </p>
            </td>
          </tr>
          
          <!-- 체험 정보 -->
          <tr>
            <td style="padding: 40px 30px 20px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                안녕하세요, <strong>${userName}</strong>님! 👋
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${planName} 플랜</strong> 무료 체험이 성공적으로 시작되었습니다!
              </p>
            </td>
          </tr>
          
          <!-- 중요 정보 박스 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 30px; border: 2px solid #3b82f6;">
                <h2 style="margin: 0 0 20px 0; color: #1e40af; font-size: 22px; font-weight: bold; text-align: center;">
                  ✅ 카드 등록 완료
                </h2>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #93c5fd;">
                      <span style="color: #1e40af; font-size: 15px; font-weight: bold;">무료 체험 종료일:</span>
                    </td>
                    <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #93c5fd;">
                      <span style="color: #1e3a8a; font-size: 15px; font-weight: bold;">${trialEndDate}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #93c5fd;">
                      <span style="color: #1e40af; font-size: 15px; font-weight: bold;">체험 후 자동 결제:</span>
                    </td>
                    <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #93c5fd;">
                      <span style="color: #1e3a8a; font-size: 15px; font-weight: bold;">${billingAmount}</span>
                    </td>
                  </tr>
                </table>
                
                <p style="margin: 15px 0 0 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  💡 <strong>알림:</strong> 무료 체험 종료 3일 전에 이메일로 미리 알려드립니다.<br/>
                  언제든 내 정보 > 구독 관리에서 해지하실 수 있습니다.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Premium 혜택 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: bold;">
                🌟 ${planName} 플랜 혜택
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                    <span style="color: #374151; font-size: 15px;">AI 발음 & 억양 상세 피드백</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                    <span style="color: #374151; font-size: 15px;">무제한 대화 & 연습 세션</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                    <span style="color: #374151; font-size: 15px;">개선된 답변 예시 제공</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                    <span style="color: #374151; font-size: 15px;">학습 진도 상세 리포트</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- 시작하기 버튼 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: bold;">
                지금 바로 시작해보세요! 🚀
              </h2>
              <a href="https://worvox.com/app" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%); color: #ffffff !important; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <span style="color: #ffffff; font-weight: bold;">WorVox 시작하기</span>
              </a>
            </td>
          </tr>
          
          <!-- 도움말 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                💡 시작 팁
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                <li>먼저 <strong>AI 대화</strong>로 가볍게 시작해보세요</li>
                <li><strong>타이머 모드</strong>로 빠른 반응 능력을 키워보세요</li>
                <li><strong>시나리오 모드</strong>로 실전 상황을 대비하세요</li>
                <li>매일 10분씩 꾸준히 하면 놀라운 변화를 경험하실 거예요!</li>
              </ul>
            </td>
          </tr>
          
          <!-- 푸터 -->
          <tr>
            <td style="padding: 30px; background-color: #111827; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                궁금한 점이 있으신가요?
              </p>
              <p style="margin: 0 0 20px 0;">
                <a href="mailto:support@worvox.com" style="color: #60a5fa; text-decoration: none; font-size: 14px;">
                  support@worvox.com
                </a>
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2026 WorVox. All rights reserved.<br>
                대전광역시 서구 대덕대로241번길 20, 5층 548-2호
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getTrialStartEmailText = (userName: string, planName: string, trialEndDate: string, billingAmount: string) => `
안녕하세요, ${userName}님! 👋

${planName} 플랜 무료 체험이 성공적으로 시작되었습니다!

✅ 카드 등록 완료

무료 체험 종료일: ${trialEndDate}
체험 후 자동 결제: ${billingAmount}

💡 알림: 무료 체험 종료 3일 전에 이메일로 미리 알려드립니다.
언제든 내 정보 > 구독 관리에서 해지하실 수 있습니다.

🌟 ${planName} 플랜 혜택:

✓ AI 발음 & 억양 상세 피드백
✓ 무제한 대화 & 연습 세션
✓ 개선된 답변 예시 제공
✓ 학습 진도 상세 리포트

지금 바로 시작하기: https://worvox.com/app

💡 시작 팁:
- 먼저 AI 대화로 가볍게 시작해보세요
- 타이머 모드로 빠른 반응 능력을 키워보세요
- 시나리오 모드로 실전 상황을 대비하세요
- 매일 10분씩 꾸준히 하면 놀라운 변화를 경험하실 거예요!

궁금한 점이 있으신가요?
📧 support@worvox.com

© 2026 WorVox. All rights reserved.
`;

// Toss Payments: 결제 준비 (Order ID 생성)
payments.post('/prepare', async (c) => {
  try {
    const { planName, price, period, userId } = await c.req.json();

    if (!planName || !price || !userId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${userId}`;
    const orderName = `WorVox ${planName} Plan${period === 'yearly' ? ' (연간)' : ''}`;

    // Store order info in database (optional, for tracking)
    try {
      const db = c.env.DB;
      await db.prepare(`
        INSERT INTO payment_orders (order_id, user_id, plan_name, amount, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', datetime('now'))
      `).bind(orderId, userId, planName, price).run();
    } catch (dbError) {
      console.log('DB insert failed (table may not exist):', dbError);
      // Continue even if DB insert fails
    }

    return c.json({
      success: true,
      orderId,
      orderName,
      amount: price,
    });

  } catch (error) {
    console.error('Payment prepare error:', error);
    return c.json({ 
      error: 'Failed to prepare payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Toss Payments: 결제 승인
payments.post('/confirm', async (c) => {
  try {
    const { paymentKey, orderId, amount } = await c.req.json();

    if (!paymentKey || !orderId || !amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const tossSecretKey = c.env.TOSS_SECRET_KEY;
    if (!tossSecretKey) {
      return c.json({ error: 'Toss Payments not configured' }, 500);
    }

    // Toss Payments API: 결제 승인 요청
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(tossSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Toss Payments confirm error:', result);
      return c.json({ 
        error: 'Payment confirmation failed',
        details: result
      }, response.status);
    }

    // Update order status in database
    try {
      const db = c.env.DB;
      
      // Get order details
      const order = await db.prepare(
        'SELECT * FROM payment_orders WHERE order_id = ?'
      ).bind(orderId).first();

      if (order) {
        // Update order status
        await db.prepare(`
          UPDATE payment_orders 
          SET status = 'completed', 
              payment_key = ?,
              confirmed_at = datetime('now')
          WHERE order_id = ?
        `).bind(paymentKey, orderId).run();

        // Update user subscription
        const planName = order.plan_name.toLowerCase();
        const billingPeriod = planName.includes('년') || planName.includes('연간') ? 'yearly' : 'monthly';
        const months = billingPeriod === 'yearly' ? 12 : 1;
        
        // Extract plan type (Core or Premium)
        let planType = 'free';
        if (planName.includes('core')) {
          planType = 'core';
        } else if (planName.includes('premium')) {
          planType = 'premium';
        }

        console.log('Updating user subscription:', {
          userId: order.user_id,
          planType,
          billingPeriod,
          months
        });

        await db.prepare(`
          UPDATE users 
          SET plan = ?,
              billing_period = ?,
              subscription_start_date = datetime('now'),
              subscription_end_date = datetime('now', '+' || ? || ' months'),
              use_ai_prompts = 1
          WHERE id = ?
        `).bind(planType, billingPeriod, months, order.user_id).run();

        console.log('User subscription updated successfully (AI prompts auto-enabled)');
      }
    } catch (dbError) {
      console.log('DB update failed:', dbError);
    }

    return c.json({
      success: true,
      payment: result,
    });

  } catch (error) {
    console.error('Payment confirm error:', error);
    return c.json({ 
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Toss Payments: 결제 실패 처리
payments.post('/fail', async (c) => {
  try {
    const { orderId, code, message } = await c.req.json();

    console.log('Payment failed:', { orderId, code, message });

    // Update order status
    try {
      const db = c.env.DB;
      await db.prepare(`
        UPDATE payment_orders 
        SET status = 'failed',
            fail_reason = ?
        WHERE order_id = ?
      `).bind(message, orderId).run();
    } catch (dbError) {
      console.log('DB update failed:', dbError);
    }

    return c.json({
      success: true,
      message: 'Payment failure recorded',
    });

  } catch (error) {
    console.error('Payment fail handler error:', error);
    return c.json({ 
      error: 'Failed to handle payment failure'
    }, 500);
  }
});

// Get payment history for user
payments.get('/history/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT * FROM payment_orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(userId).all();

    return c.json({
      success: true,
      payments: result.results || [],
    });

  } catch (error) {
    console.error('Payment history error:', error);
    return c.json({ 
      error: 'Failed to fetch payment history'
    }, 500);
  }
});

// ========================================
// Free Trial with Billing Key (2-week trial)
// ========================================

// Start free trial - generate customer key
payments.post('/trial/start', async (c) => {
  try {
    const { userId, plan, billingPeriod } = await c.req.json();

    console.log(`📥 Received trial request - userId: ${userId} (type: ${typeof userId}), plan: ${plan}, billingPeriod: ${billingPeriod || 'monthly'}`);

    if (!userId || !plan) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['core', 'premium'].includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be "core" or "premium"' }, 400);
    }

    console.log(`🎁 Starting free trial for user ${userId}, plan: ${plan}, billing: ${billingPeriod || 'monthly'}`);

    // Check if user already has active trial or subscription
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, plan, is_trial, trial_end_date FROM users WHERE id = ?'
    ).bind(userId).first();

    console.log(`🔍 User lookup result:`, user ? `Found: ${user.username} (${user.email}), plan: ${user.plan}, is_trial: ${user.is_trial}, trial_end_date: ${user.trial_end_date}` : 'Not found');

    if (!user) {
      return c.json({ 
        error: 'User not found', 
        details: `사용자 ID ${userId}를 찾을 수 없습니다.`
      }, 404);
    }

    // Check if user already has active paid plan
    if (user.plan && user.plan !== 'free' && !user.is_trial) {
      console.log(`❌ User already has paid plan: ${user.plan}`);
      return c.json({ 
        error: '이미 유료 플랜을 사용 중입니다',
        details: `현재 플랜: ${user.plan}`
      }, 400);
    }

    // Check if user already has active trial
    if (user.is_trial && user.trial_end_date) {
      const trialEndDate = new Date(user.trial_end_date);
      console.log(`🔍 Checking trial status - trial_end_date: ${user.trial_end_date}, current: ${new Date().toISOString()}, is active: ${trialEndDate > new Date()}`);
      if (trialEndDate > new Date()) {
        console.log(`❌ User already has active trial until ${trialEndDate.toISOString()}`);
        return c.json({ 
          error: '이미 무료 체험을 이용 중입니다',
          details: `무료 체험 종료일: ${trialEndDate.toISOString().split('T')[0]}`
        }, 400);
      }
    }

    // Generate unique customer key for Toss Payments
    const customerKey = `customer_${userId}_${Date.now()}`;

    // Store customer key and billing period in database
    await c.env.DB.prepare(
      'UPDATE users SET toss_customer_key = ?, billing_period = ? WHERE id = ?'
    ).bind(customerKey, billingPeriod || 'monthly', userId).run();

    console.log(`✅ Customer key generated: ${customerKey}`);

    return c.json({
      success: true,
      customerKey,
      plan,
      billingPeriod: billingPeriod || 'monthly',
      message: '무료 체험을 시작합니다'
    });

  } catch (error) {
    console.error('Trial start error:', error);
    return c.json({ 
      error: 'Failed to start trial',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Confirm billing key and activate trial
payments.post('/trial/confirm', async (c) => {
  try {
    const { userId, plan, authKey, customerKey, billingPeriod } = await c.req.json();

    if (!userId || !plan || !authKey || !customerKey) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const tossSecretKey = c.env.TOSS_SECRET_KEY;
    if (!tossSecretKey) {
      return c.json({ error: 'Toss Payments not configured' }, 500);
    }

    // Step 1: Get billing key from Toss
    const billingKeyResponse = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(tossSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        authKey: authKey,
        customerKey: customerKey 
      })
    });

    const billingKeyResult = await billingKeyResponse.json();

    if (!billingKeyResponse.ok) {
      console.error('Billing key error:', billingKeyResult);
      return c.json({ 
        error: 'Failed to get billing key',
        details: billingKeyResult
      }, billingKeyResponse.status);
    }

    const billingKey = billingKeyResult.billingKey;

    const period = billingPeriod || 'monthly';
    console.log(`🎉 Activating trial for user ${userId}, billing key: ${billingKey}, period: ${period}`);

    // Calculate trial dates (2 weeks from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 2 weeks

    // Update user with billing key and trial info
    await c.env.DB.prepare(`
      UPDATE users 
      SET 
        billing_key = ?,
        toss_customer_key = ?,
        plan = ?,
        billing_period = ?,
        is_trial = 1,
        trial_start_date = datetime('now'),
        trial_end_date = datetime('now', '+14 days'),
        auto_billing_enabled = 1,
        subscription_start_date = datetime('now'),
        subscription_end_date = datetime('now', '+14 days')
      WHERE id = ?
    `).bind(billingKey, customerKey, plan, period, userId).run();

    // Log trial activation
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, details, created_at)
      VALUES (?, 'trial_start', ?, datetime('now'))
    `).bind(
      userId,
      `Started ${plan} free trial (2 weeks)`
    ).run();

    console.log(`✅ Trial activated until ${trialEndDate.toISOString()}`);

    // Get user info for email
    const user = await c.env.DB.prepare(
      'SELECT username, email FROM users WHERE id = ?'
    ).bind(userId).first();

    // Send trial start email
    if (user && user.email) {
      try {
        const resendApiKey = c.env.RESEND_API_KEY;
        if (resendApiKey) {
          const planDisplayName = plan === 'core' ? 'Core' : 'Premium';
          const billingAmount = period === 'yearly' 
            ? (plan === 'core' ? '₩97,416/년' : '₩186,960/년')
            : (plan === 'core' ? '₩9,900/월' : '₩19,000/월');
          
          const formattedTrialEndDate = trialEndDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'WorVox <noreply@worvox.com>',
              to: [user.email],
              subject: `🎉 ${planDisplayName} 무료 체험이 시작되었습니다!`,
              html: getTrialStartEmailHTML(user.username, planDisplayName, formattedTrialEndDate, billingAmount),
              text: getTrialStartEmailText(user.username, planDisplayName, formattedTrialEndDate, billingAmount)
            })
          });

          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            console.log('✅ Trial start email sent:', { email: user.email, emailId: emailData.id });
          } else {
            const errorData = await emailResponse.json();
            console.error('❌ Failed to send trial start email:', errorData);
          }
        } else {
          console.log('⚠️ RESEND_API_KEY not configured, skipping trial start email');
        }
      } catch (emailError) {
        console.error('❌ Error sending trial start email:', emailError);
        // Don't fail the trial activation if email fails
      }
    }

    return c.json({
      success: true,
      plan,
      trialStartDate: trialStartDate.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      message: '무료 체험이 시작되었습니다!'
    });

  } catch (error) {
    console.error('Trial confirm error:', error);
    return c.json({ 
      error: 'Failed to confirm trial',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Cancel trial (user cancels before trial ends)
payments.post('/trial/cancel', async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    console.log(`❌ Cancelling trial for user ${userId}`);

    // Check if user has active trial
    const user = await c.env.DB.prepare(
      'SELECT id, is_trial, trial_end_date FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user || !user.is_trial) {
      return c.json({ error: '활성화된 무료 체험이 없습니다' }, 400);
    }

    // Disable auto billing but keep trial active until end date
    await c.env.DB.prepare(
      'UPDATE users SET auto_billing_enabled = 0 WHERE id = ?'
    ).bind(userId).run();

    // Log cancellation
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, details, created_at)
      VALUES (?, 'trial_cancel', ?, datetime('now'))
    `).bind(
      userId,
      'Cancelled free trial auto-billing'
    ).run();

    console.log(`✅ Trial cancelled, will expire at ${user.trial_end_date}`);

    return c.json({
      success: true,
      message: '자동 결제가 취소되었습니다. 체험 종료일까지는 계속 사용하실 수 있습니다.'
    });

  } catch (error) {
    console.error('Trial cancel error:', error);
    return c.json({ 
      error: 'Failed to cancel trial',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Execute billing for trial users (called by cron job)
payments.post('/billing/execute', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const cronSecret = c.env.CRON_SECRET || 'default-secret-change-me';

    // Simple auth check (in production, use proper auth)
    if (authHeader !== `Bearer ${cronSecret}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('🤖 Running billing cron job...');

    // Find users whose trial ends today and have auto billing enabled
    // Get today's date in Korea timezone (UTC+9)
    const koreaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = koreaDate.toISOString().split('T')[0];
    const { results: usersToCharge } = await c.env.DB.prepare(`
      SELECT id, username, email, plan, billing_key, billing_period, trial_end_date
      FROM users
      WHERE is_trial = 1
        AND auto_billing_enabled = 1
        AND date(trial_end_date) <= date('now')
        AND billing_failure_count < 3
    `).all();

    console.log(`📋 Found ${usersToCharge?.length || 0} users to charge`);

    const results = [];

    for (const user of (usersToCharge || [])) {
      try {
        const billingPeriod = user.billing_period || 'monthly';
        console.log(`💳 Charging user ${user.id} (${user.email}) - ${billingPeriod}`);

        // Determine amount based on plan and billing period
        let amount, orderName, subscriptionDuration;
        
        if (billingPeriod === 'yearly') {
          // Yearly prices (18% discount)
          amount = user.plan === 'core' ? 97416 : 186960;
          orderName = `WorVox ${user.plan.toUpperCase()} 연간 구독`;
          subscriptionDuration = '+12 months';
        } else {
          // Monthly prices
          amount = user.plan === 'core' ? 9900 : 19000;
          orderName = `WorVox ${user.plan.toUpperCase()} 월간 구독`;
          subscriptionDuration = '+1 month';
        }

        // Call Toss Payments Billing API
        const tossResponse = await fetch('https://api.tosspayments.com/v1/billing/' + user.billing_key, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(c.env.TOSS_SECRET_KEY + ':'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerKey: user.billing_key,
            amount,
            orderId: `auto_${user.id}_${Date.now()}`,
            orderName,
            customerEmail: user.email,
            customerName: user.username
          })
        });

        const tossData = await tossResponse.json();

        if (tossResponse.ok) {
          // Payment successful - convert trial to paid subscription
          await c.env.DB.prepare(`
            UPDATE users
            SET 
              is_trial = 0,
              trial_start_date = NULL,
              trial_end_date = NULL,
              subscription_start_date = datetime('now'),
              subscription_end_date = datetime('now', ?),
              billing_period = ?,
              last_billing_attempt = datetime('now'),
              billing_failure_count = 0
            WHERE id = ?
          `).bind(subscriptionDuration, billingPeriod, user.id).run();

          // Record payment
          await c.env.DB.prepare(`
            INSERT INTO payment_orders (order_id, user_id, plan_name, amount, status, created_at)
            VALUES (?, ?, ?, ?, 'completed', datetime('now'))
          `).bind(
            `auto_${user.id}_${Date.now()}`,
            user.id,
            user.plan,
            amount
          ).run();

          // Log success
          await c.env.DB.prepare(`
            INSERT INTO activity_logs (user_id, activity_type, details, created_at)
            VALUES (?, 'auto_billing_success', ?, datetime('now'))
          `).bind(
            user.id,
            `Auto-charged ${amount}원 for ${user.plan} plan`
          ).run();

          results.push({ userId: user.id, status: 'success', amount });
          console.log(`✅ User ${user.id} charged successfully`);

        } else {
          // Payment failed - increment failure count
          await c.env.DB.prepare(`
            UPDATE users
            SET 
              last_billing_attempt = datetime('now'),
              billing_failure_count = billing_failure_count + 1
            WHERE id = ?
          `).bind(user.id).run();

          // Log failure
          await c.env.DB.prepare(`
            INSERT INTO activity_logs (user_id, activity_type, details, created_at)
            VALUES (?, 'auto_billing_failed', ?, datetime('now'))
          `).bind(
            user.id,
            `Auto-billing failed: ${tossData.message || 'Unknown error'}`
          ).run();

          results.push({ userId: user.id, status: 'failed', error: tossData.message });
          console.log(`❌ User ${user.id} billing failed: ${tossData.message}`);

          // If 3rd failure, downgrade to free
          const updatedUser = await c.env.DB.prepare(
            'SELECT billing_failure_count FROM users WHERE id = ?'
          ).bind(user.id).first();

          if (updatedUser && updatedUser.billing_failure_count >= 3) {
            await c.env.DB.prepare(`
              UPDATE users
              SET 
                plan = 'free',
                is_trial = 0,
                trial_start_date = NULL,
                trial_end_date = NULL,
                auto_billing_enabled = 0,
                subscription_end_date = datetime('now')
              WHERE id = ?
            `).bind(user.id).run();

            console.log(`⬇️ User ${user.id} downgraded to free after 3 failures`);
          }
        }

      } catch (error) {
        console.error(`Error charging user ${user.id}:`, error);
        results.push({ userId: user.id, status: 'error', error: String(error) });
      }
    }

    return c.json({
      success: true,
      processedCount: results.length,
      results
    });

  } catch (error) {
    console.error('Billing execute error:', error);
    return c.json({ 
      error: 'Failed to execute billing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Live Speaking 정기구독 시작 (빌링키 등록 + 첫 결제)
payments.post('/hiing/subscribe/start', async (c) => {
  try {
    const { userId, lessonCount, amount, packageType } = await c.req.json();

    if (!userId || !lessonCount || !amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const db = c.env.DB;

    // Check if user exists
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Generate Toss customer key
    const customerKey = `hiing_customer_${userId}_${Date.now()}`;

    // Store customer key in database
    await db.prepare(`
      UPDATE users 
      SET toss_customer_key = ?
      WHERE id = ?
    `).bind(customerKey, userId).run();

    // Log activity
    await db.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, details)
      VALUES (?, 'hiing_subscribe_start', ?)
    `).bind(userId, `Started Live Speaking ${lessonCount}회 subscription (${packageType})`).run();

    return c.json({
      success: true,
      customerKey: customerKey,
      lessonCount: lessonCount,
      amount: amount,
      packageType: packageType
    });

  } catch (error) {
    console.error('Hiing subscribe start error:', error);
    return c.json({ 
      error: 'Failed to start subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Live Speaking 정기구독 확정 (빌링키 등록 완료 후 첫 결제)
payments.post('/hiing/subscribe/confirm', async (c) => {
  try {
    const { authKey, customerKey, userId, lessonCount, amount, packageType } = await c.req.json();

    if (!authKey || !customerKey || !userId || !lessonCount || !amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const tossSecretKey = c.env.TOSS_SECRET_KEY;
    if (!tossSecretKey) {
      return c.json({ error: 'Toss Payments not configured' }, 500);
    }

    const db = c.env.DB;

    // Step 1: Get billing key from Toss (올바른 API)
    const billingKeyResponse = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(tossSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        authKey: authKey,
        customerKey: customerKey 
      })
    });

    const billingKeyResult = await billingKeyResponse.json();

    if (!billingKeyResponse.ok) {
      console.error('Billing key error:', billingKeyResult);
      return c.json({ 
        error: 'Failed to get billing key',
        details: billingKeyResult
      }, billingKeyResponse.status);
    }

    const billingKey = billingKeyResult.billingKey;

    // Step 2: Get user info
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Step 3: Execute first payment immediately
    const orderId = `hiing_order_${Date.now()}_${userId}`;
    const orderName = `WorVox Live Speaking ${lessonCount}회 (${packageType === 'monthly' ? '월정기' : '일반'})`;

    const paymentResponse = await fetch('https://api.tosspayments.com/v1/billing/' + billingKey, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(tossSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey: customerKey,
        amount: amount,
        orderId: orderId,
        orderName: orderName,
        customerEmail: (user as any)?.email || '',
        customerName: (user as any)?.username || ''
      })
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error('First payment error:', paymentResult);
      return c.json({ 
        error: 'Failed to process first payment',
        details: paymentResult
      }, paymentResponse.status);
    }

    // Step 4: Update user subscription info
    
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    await db.prepare(`
      UPDATE users 
      SET 
        billing_key = ?,
        hiing_lesson_count = ?,
        hiing_subscription_active = 1,
        hiing_subscription_type = ?,
        hiing_next_billing_date = ?,
        hiing_billing_amount = ?
      WHERE id = ?
    `).bind(
      billingKey,
      lessonCount,
      packageType,
      nextBillingDate.toISOString().split('T')[0],
      amount,
      userId
    ).run();

    // Step 4: Record payment in payment_orders
    await db.prepare(`
      INSERT INTO payment_orders (order_id, user_id, plan_name, amount, status, payment_key, confirmed_at, created_at)
      VALUES (?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))
    `).bind(orderId, userId, `Live Speaking ${lessonCount}회`, amount, paymentResult.paymentKey).run();

    // Step 5: Log activity
    await db.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, details)
      VALUES (?, 'hiing_subscribe_confirm', ?)
    `).bind(userId, `Confirmed Live Speaking ${lessonCount}회 subscription - First payment: ₩${amount.toLocaleString()}`).run();

    return c.json({
      success: true,
      billingKey: billingKey,
      orderId: orderId,
      amount: amount,
      lessonCount: lessonCount,
      nextBillingDate: nextBillingDate.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Hiing subscribe confirm error:', error);
    return c.json({ 
      error: 'Failed to confirm subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default payments;
