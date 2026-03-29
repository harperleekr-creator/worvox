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
      'SELECT id, username, email, plan, is_trial, trial_end_date, has_used_trial FROM users WHERE id = ?'
    ).bind(userId).first();

    console.log(`🔍 User lookup result:`, user ? `Found: ${user.username} (${user.email}), plan: ${user.plan}, is_trial: ${user.is_trial}, trial_end_date: ${user.trial_end_date}, has_used_trial: ${user.has_used_trial}` : 'Not found');

    if (!user) {
      return c.json({ 
        error: 'User not found', 
        details: `사용자 ID ${userId}를 찾을 수 없습니다.`
      }, 404);
    }

    // Check if user has already used trial before (CRITICAL: Prevent re-trial after cancellation)
    if (user.has_used_trial === 1) {
      console.log(`❌ User has already used trial before (has_used_trial=1)`);
      return c.json({ 
        error: '무료 체험은 1회만 이용 가능합니다',
        details: '이미 무료 체험을 이용하셨습니다. 유료 플랜으로 바로 구독하시거나 고객센터로 문의해주세요.'
      }, 400);
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

// Confirm billing key and activate subscription (immediate billing)
payments.post('/subscription/confirm', async (c) => {
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
    const normalizedPlan = plan.toLowerCase();

    console.log(`💳 Processing subscription for user ${userId}, plan: ${normalizedPlan}, billing key: ${billingKey}, period: ${period}`);

    // Determine billing amount and duration
    let amount;
    let durationDays;
    let displayAmount;
    
    if (normalizedPlan === 'core') {
      if (period === 'yearly') {
        amount = 97416;
        durationDays = 365;
        displayAmount = '₩97,416/년';
      } else {
        amount = 9900;
        durationDays = 30;
        displayAmount = '₩9,900/월';
      }
    } else if (normalizedPlan === 'premium') {
      if (period === 'yearly') {
        amount = 186960;
        durationDays = 365;
        displayAmount = '₩186,960/년';
      } else {
        amount = 19000;
        durationDays = 30;
        displayAmount = '₩19,000/월';
      }
    } else {
      return c.json({ error: 'Invalid plan' }, 400);
    }

    // Step 2: Charge immediately
    const orderId = `sub_${userId}_${Date.now()}`;
    const orderName = `${normalizedPlan === 'core' ? 'Core' : 'Premium'} 플랜 (${period === 'yearly' ? '연간' : '월간'})`;

    const user = await c.env.DB.prepare('SELECT username, email FROM users WHERE id = ?')
      .bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const paymentResponse = await fetch('https://api.tosspayments.com/v1/billing', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(tossSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingKey: billingKey,
        amount: amount,
        orderId: orderId,
        orderName: orderName,
        customerEmail: user.email,
        customerName: user.username || user.email
      })
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error('Payment error:', paymentResult);
      return c.json({ 
        error: 'Payment failed',
        details: paymentResult
      }, paymentResponse.status);
    }

    console.log(`✅ Payment successful: ${paymentResult.orderId}, amount: ${amount}`);

    // Calculate subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays);

    // Step 3: Update user with subscription
    await c.env.DB.prepare(`
      UPDATE users 
      SET 
        billing_key = ?,
        toss_customer_key = ?,
        plan = ?,
        billing_period = ?,
        is_trial = 0,
        trial_start_date = NULL,
        trial_end_date = NULL,
        auto_billing_enabled = 1,
        subscription_start_date = datetime('now'),
        subscription_end_date = datetime('now', '+${durationDays} days'),
        billing_failure_count = 0
      WHERE id = ?
    `).bind(billingKey, customerKey, normalizedPlan, period, userId).run();

    // Record payment
    await c.env.DB.prepare(`
      INSERT INTO payment_orders (
        user_id, order_id, order_name, amount, status, 
        billing_key, payment_method, created_at
      )
      VALUES (?, ?, ?, ?, 'success', ?, 'card', datetime('now'))
    `).bind(userId, orderId, orderName, amount, billingKey).run();

    // Log subscription activation
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, details, created_at)
      VALUES (?, 'subscription_start', ?, datetime('now'))
    `).bind(
      userId,
      `Started ${normalizedPlan} subscription - ${displayAmount}`
    ).run();

    console.log(`✅ Subscription activated until ${subscriptionEndDate.toISOString()}`);

    return c.json({
      success: true,
      plan: normalizedPlan,
      billingPeriod: period,
      amount: displayAmount,
      nextBillingDate: subscriptionEndDate.toISOString(),
      orderId: orderId
    });

  } catch (error) {
    console.error('Subscription confirm error:', error);
    return c.json({ 
      error: 'Failed to confirm subscription',
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
    // CRITICAL: Set has_used_trial=1 to prevent re-trial after cancellation
    await c.env.DB.prepare(`
      UPDATE users 
      SET 
        billing_key = ?,
        toss_customer_key = ?,
        plan = ?,
        billing_period = ?,
        is_trial = 1,
        has_used_trial = 1,
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
// Start subscription (immediate billing, no trial)
payments.post('/subscription/start', async (c) => {
  try {
    const { userId, plan, billingPeriod } = await c.req.json();

    console.log(`📥 Subscription start - userId: ${userId}, plan: ${plan}, billingPeriod: ${billingPeriod || 'monthly'}`);

    if (!userId || !plan) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['core', 'premium', 'Core', 'Premium'].includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be "core" or "premium"' }, 400);
    }

    // Normalize plan name to lowercase
    const normalizedPlan = plan.toLowerCase();

    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, plan FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Generate unique customer key for TossPayments
    const customerKey = `sub_${userId}_${Date.now()}`;

    // Update user with billing info
    await c.env.DB.prepare(`
      UPDATE users
      SET toss_customer_key = ?,
          billing_period = ?
      WHERE id = ?
    `).bind(
      customerKey,
      billingPeriod || 'monthly',
      userId
    ).run();

    console.log(`✅ Subscription prepared, customerKey: ${customerKey}`);

    return c.json({
      success: true,
      customerKey: customerKey
    });

  } catch (error) {
    console.error('Subscription start error:', error);
    return c.json({ 
      error: 'Failed to start subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

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

// Cancel paid subscription (user cancels active paid plan)
payments.post('/subscription/cancel', async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    console.log(`❌ Cancelling subscription for user ${userId}`);

    // Check if user has active subscription
    const user = await c.env.DB.prepare(
      'SELECT id, plan, is_trial, subscription_end_date, auto_billing_enabled FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (user.plan === 'free') {
      return c.json({ error: '활성화된 구독이 없습니다' }, 400);
    }

    // Disable auto billing - keep current plan until subscription_end_date
    await c.env.DB.prepare(`
      UPDATE users 
      SET auto_billing_enabled = 0
      WHERE id = ?
    `).bind(userId).run();

    // Log cancellation
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, details, created_at)
      VALUES (?, 'subscription_cancel', ?, datetime('now'))
    `).bind(
      userId,
      `Cancelled ${user.plan} subscription - will expire at ${user.subscription_end_date}`
    ).run();

    console.log(`✅ Subscription cancelled, will expire at ${user.subscription_end_date}`);

    return c.json({
      success: true,
      message: `자동 결제가 취소되었습니다. ${user.subscription_end_date}까지는 ${user.plan.toUpperCase()} 플랜을 계속 사용하실 수 있습니다.`,
      subscription_end_date: user.subscription_end_date
    });

  } catch (error) {
    console.error('Subscription cancel error:', error);
    return c.json({ 
      error: 'Failed to cancel subscription',
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
    console.log('📥 Subscription start request:', { userId, lessonCount, amount, packageType });

    if (!userId || !lessonCount || !amount) {
      console.error('❌ Missing required fields');
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const db = c.env.DB;
    if (!db) {
      console.error('❌ Database not initialized');
      return c.json({ error: 'Database not available' }, 500);
    }

    // Check if user exists
    console.log('🔍 Looking up user:', userId);
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      console.error('❌ User not found:', userId);
      return c.json({ error: 'User not found' }, 404);
    }
    console.log('✅ User found:', user.email);

    // Generate Toss customer key
    const customerKey = `hiing_customer_${userId}_${Date.now()}`;
    console.log('🔑 Generated customer key:', customerKey);

    // Store customer key in database
    try {
      const updateResult = await db.prepare(`
        UPDATE users 
        SET toss_customer_key = ?
        WHERE id = ?
      `).bind(customerKey, userId).run();
      console.log('✅ Updated user toss_customer_key, rows affected:', updateResult.meta?.changes || 0);
    } catch (dbError) {
      console.error('❌ Database UPDATE error:', dbError);
      // Check if column exists
      if (dbError instanceof Error && dbError.message.includes('no such column')) {
        return c.json({ 
          error: 'Database schema error - toss_customer_key column missing',
          details: 'Please run database migrations'
        }, 500);
      }
      throw dbError;
    }

    // Log activity
    try {
      await db.prepare(`
        INSERT INTO activity_logs (user_id, activity_type, details)
        VALUES (?, 'hiing_subscribe_start', ?)
      `).bind(userId, `Started Live Speaking ${lessonCount}회 subscription (${packageType})`).run();
      console.log('✅ Activity logged');
    } catch (logError) {
      console.warn('⚠️ Failed to log activity (non-critical):', logError);
      // Don't fail the request if activity logging fails
    }

    const response = {
      success: true,
      customerKey: customerKey,
      lessonCount: lessonCount,
      amount: amount,
      packageType: packageType
    };
    console.log('📤 Subscription start response:', response);
    return c.json(response);

  } catch (error) {
    console.error('❌ Hiing subscribe start error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      error: 'Failed to start subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Live Speaking 정기구독 확정 (빌링키 등록 완료 후 첫 결제)
payments.post('/hiing/subscribe/confirm', async (c) => {
  try {
    const { authKey, customerKey, userId, lessonCount, amount, packageType, plan } = await c.req.json();

    if (!authKey || !customerKey || !userId || amount === undefined) {
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
    const orderName = lessonCount > 0 
      ? `WorVox Live Speaking ${lessonCount}회 (${packageType === 'monthly' ? '월정기' : '일반'})`
      : `WorVox ${plan || 'Premium'} Plan (월정기)`;

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

    // Get current lesson count to accumulate
    const currentUser = await db.prepare('SELECT hiing_lesson_count FROM users WHERE id = ?').bind(userId).first();
    const currentLessonCount = (currentUser as any)?.hiing_lesson_count || 0;
    const newTotalLessonCount = currentLessonCount + (lessonCount || 0);

    console.log(`📊 Lesson count update: ${currentLessonCount} + ${lessonCount || 0} = ${newTotalLessonCount}`);

    // Determine if this is Core/Premium plan subscription (lessonCount = 0) or Live Speaking (lessonCount > 0)
    if (lessonCount > 0) {
      // Live Speaking subscription
      await db.prepare(`
        UPDATE users 
        SET 
          billing_key = ?,
          hiing_lesson_count = ?,
          hiing_subscription_active = 1,
          hiing_subscription_type = ?,
          hiing_next_billing_date = ?,
          hiing_billing_amount = ?,
          hiing_lesson_package_size = ?
        WHERE id = ?
      `).bind(
        billingKey,
        newTotalLessonCount,
        packageType,
        nextBillingDate.toISOString().split('T')[0],
        amount,
        lessonCount,
        userId
      ).run();
    } else {
      // Core/Premium plan subscription
      const subscriptionPlan = plan === 'core' ? 'core' : 'premium';
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial
      
      await db.prepare(`
        UPDATE users 
        SET 
          billing_key = ?,
          subscription_plan = ?,
          subscription_status = 'trial',
          trial_ends_at = ?,
          billing_cycle = 'monthly',
          next_billing_date = ?
        WHERE id = ?
      `).bind(
        billingKey,
        subscriptionPlan,
        trialEndsAt.toISOString(),
        nextBillingDate.toISOString().split('T')[0],
        userId
      ).run();
    }

    // Step 4: Create hiing_credits record for monthly subscriptions
    if (lessonCount > 0 && packageType === 'monthly') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Expires in 1 month
      
      await db.prepare(`
        INSERT INTO hiing_credits (
          user_id, 
          lesson_count, 
          remaining_credits, 
          amount, 
          package_type, 
          purchase_date, 
          expires_at
        )
        VALUES (?, ?, ?, ?, 'monthly', datetime('now'), ?)
      `).bind(
        userId,
        lessonCount,
        lessonCount,
        amount,
        expiresAt.toISOString()
      ).run();
      
      console.log(`✅ Created hiing_credits record: ${lessonCount} lessons, expires ${expiresAt.toISOString()}`);
    }

    // Step 5: Record payment in payment_orders
    const planName = lessonCount > 0 ? `Live Speaking ${lessonCount}회` : `${plan || 'Premium'} Plan`;
    await db.prepare(`
      INSERT INTO payment_orders (order_id, user_id, plan_name, amount, status, payment_key, confirmed_at, created_at)
      VALUES (?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))
    `).bind(orderId, userId, planName, amount, paymentResult.paymentKey).run();

    // Step 7: Log activity
    const activityDetails = lessonCount > 0
      ? `Confirmed Live Speaking ${lessonCount}회 subscription - First payment: ₩${amount.toLocaleString()}`
      : `Confirmed ${plan || 'Premium'} Plan subscription - First payment: ₩${amount.toLocaleString()}`;
    await db.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, details)
      VALUES (?, 'hiing_subscribe_confirm', ?)
    `).bind(userId, activityDetails).run();

    // Step 8: Send payment confirmation email
    if (user && (user as any).email) {
      try {
        const resendApiKey = c.env.RESEND_API_KEY;
        if (resendApiKey) {
          const packageTypeName = packageType === 'monthly' ? '월정기 구독' : '일반 구매';
          const formattedNextBillingDate = nextBillingDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          const emailHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 완료 - WorVox Live Speaking</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🎉 결제가 완료되었습니다!
              </h1>
              <p style="margin: 10px 0 0 0; color: #ddd6fe; font-size: 18px;">
                Live Speaking ${lessonCount}회 수업권
              </p>
            </td>
          </tr>
          
          <!-- 결제 정보 -->
          <tr>
            <td style="padding: 40px 30px 20px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                안녕하세요, <strong>${(user as any).username}</strong>님! 👋
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>Live Speaking ${lessonCount}회 수업권</strong> 구독이 완료되었습니다!
              </p>
            </td>
          </tr>
          
          <!-- 결제 상세 정보 박스 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 30px; border: 2px solid #3b82f6;">
                <h2 style="margin: 0 0 20px 0; color: #1e40af; font-size: 22px; font-weight: bold; text-align: center;">
                  ✅ 결제 상세 정보
                </h2>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #1e40af; font-weight: 600; font-size: 14px;">📦 패키지</td>
                    <td style="color: #1f2937; font-size: 14px; text-align: right;">Live Speaking ${lessonCount}회</td>
                  </tr>
                  <tr>
                    <td style="color: #1e40af; font-weight: 600; font-size: 14px;">💳 결제 방식</td>
                    <td style="color: #1f2937; font-size: 14px; text-align: right;">${packageTypeName}</td>
                  </tr>
                  <tr>
                    <td style="color: #1e40af; font-weight: 600; font-size: 14px;">💰 결제 금액</td>
                    <td style="color: #1f2937; font-size: 16px; font-weight: bold; text-align: right;">₩${amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="color: #1e40af; font-weight: 600; font-size: 14px;">📅 다음 결제일</td>
                    <td style="color: #1f2937; font-size: 14px; text-align: right;">${formattedNextBillingDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #1e40af; font-weight: 600; font-size: 14px;">🔄 자동 결제</td>
                    <td style="color: #10b981; font-size: 14px; font-weight: bold; text-align: right;">활성화됨</td>
                  </tr>
                </table>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #93c5fd;">
                  <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                    💡 <strong>알림:</strong> 다음 결제일 3일 전에 이메일로 알려드립니다.
                  </p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- 다음 단계 안내 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px; font-weight: bold;">
                  🚀 다음 단계
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.8;">
                  <li>WorVox 앱에 로그인하세요</li>
                  <li>1:1 Live Speaking 메뉴로 이동하세요</li>
                  <li>원하는 강사와 시간을 선택하세요</li>
                  <li>수업을 예약하고 영어 실력을 향상시키세요!</li>
                </ol>
              </div>
            </td>
          </tr>
          
          <!-- CTA 버튼 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="https://worvox.com/app" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                WorVox 시작하기 🚀
              </a>
            </td>
          </tr>
          
          <!-- 구독 관리 안내 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                  <strong>구독 관리:</strong> 언제든 내 정보 > 구독 관리에서 구독을 취소하거나 변경할 수 있습니다.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                궁금한 점이 있으시면 언제든 문의해주세요
              </p>
              <p style="margin: 0 0 20px 0;">
                <a href="mailto:support@worvox.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">support@worvox.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2026 WorVox. All rights reserved.
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

          const emailText = `
🎉 결제가 완료되었습니다!

안녕하세요, ${(user as any).username}님!

Live Speaking ${lessonCount}회 수업권 구독이 완료되었습니다.

✅ 결제 상세 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 패키지: Live Speaking ${lessonCount}회
💳 결제 방식: ${packageTypeName}
💰 결제 금액: ₩${amount.toLocaleString()}
📅 다음 결제일: ${formattedNextBillingDate}
🔄 자동 결제: 활성화됨
━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 알림: 다음 결제일 3일 전에 이메일로 알려드립니다.

🚀 다음 단계:
1. WorVox 앱에 로그인하세요
2. 1:1 Live Speaking 메뉴로 이동하세요
3. 원하는 강사와 시간을 선택하세요
4. 수업을 예약하고 영어 실력을 향상시키세요!

WorVox 시작하기: https://worvox.com/app

구독 관리: 언제든 내 정보 > 구독 관리에서 구독을 취소하거나 변경할 수 있습니다.

궁금한 점이 있으시면 언제든 문의해주세요
support@worvox.com

© 2026 WorVox. All rights reserved.
          `;

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'WorVox <noreply@worvox.com>',
              to: [(user as any).email],
              subject: `🎉 Live Speaking ${lessonCount}회 결제가 완료되었습니다!`,
              html: emailHtml,
              text: emailText
            })
          });

          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            console.log('✅ Live Speaking payment email sent:', { email: (user as any).email, emailId: emailData.id });
          } else {
            const errorData = await emailResponse.json();
            console.error('❌ Failed to send Live Speaking payment email:', errorData);
          }
        } else {
          console.log('⚠️ RESEND_API_KEY not configured, skipping payment email');
        }
      } catch (emailError) {
        console.error('❌ Error sending Live Speaking payment email:', emailError);
        // Don't fail the payment if email fails
      }
    }

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

// 월 정기 결제 자동 실행 (Cloudflare Cron 또는 외부 스케줄러에서 호출)
payments.post('/hiing/monthly-billing', async (c) => {
  try {
    // Security: Check for authorization token
    const authHeader = c.req.header('Authorization');
    const expectedToken = c.env.CRON_SECRET_TOKEN || 'default-cron-secret';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = c.env.DB;
    const tossSecretKey = c.env.TOSS_SECRET_KEY;

    if (!tossSecretKey) {
      return c.json({ error: 'Toss Payments not configured' }, 500);
    }

    // Get all active subscriptions where next_billing_date is today or earlier
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`🔄 Running monthly billing for date: ${today}`);

    const subscriptions = await db.prepare(`
      SELECT id, username, email, billing_key, hiing_lesson_package_size, hiing_billing_amount, toss_customer_key
      FROM users
      WHERE hiing_subscription_active = 1
        AND hiing_next_billing_date <= ?
        AND billing_key IS NOT NULL
    `).bind(today).all();

    console.log(`📊 Found ${subscriptions.results.length} subscriptions to bill`);

    const results = [];

    for (const user of subscriptions.results) {
      try {
        const userId = (user as any).id;
        const billingKey = (user as any).billing_key;
        const lessonCount = (user as any).hiing_lesson_package_size || 10;
        const amount = (user as any).hiing_billing_amount || 100000;
        const customerKey = (user as any).toss_customer_key;

        console.log(`💳 Processing billing for user ${userId} (${(user as any).email})`);

        // Execute monthly payment
        const orderId = `hiing_monthly_${Date.now()}_${userId}`;
        const orderName = `WorVox Live Speaking ${lessonCount}회 (월정기)`;

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
            customerEmail: (user as any).email || '',
            customerName: (user as any).username || ''
          })
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok) {
          console.error(`❌ Payment failed for user ${userId}:`, paymentResult);
          
          // If payment fails, deactivate subscription
          await db.prepare(`
            UPDATE users 
            SET hiing_subscription_active = 0
            WHERE id = ?
          `).bind(userId).run();

          // Log failure
          await db.prepare(`
            INSERT INTO activity_logs (user_id, activity_type, details)
            VALUES (?, 'hiing_monthly_billing_failed', ?)
          `).bind(userId, `Monthly billing failed: ${paymentResult.message || 'Unknown error'}`).run();

          results.push({
            userId: userId,
            email: (user as any).email,
            status: 'failed',
            error: paymentResult.message || 'Payment failed'
          });

          continue;
        }

        console.log(`✅ Payment successful for user ${userId}`);

        // Update user: add lessons + set next billing date
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // Get current lesson count and add new lessons
        const currentUser = await db.prepare('SELECT hiing_lesson_count FROM users WHERE id = ?').bind(userId).first();
        const currentLessonCount = (currentUser as any)?.hiing_lesson_count || 0;
        const newTotalLessonCount = currentLessonCount + lessonCount;

        console.log(`📊 User ${userId}: ${currentLessonCount} + ${lessonCount} = ${newTotalLessonCount} lessons`);

        await db.prepare(`
          UPDATE users 
          SET 
            hiing_lesson_count = ?,
            hiing_next_billing_date = ?
          WHERE id = ?
        `).bind(
          newTotalLessonCount,
          nextBillingDate.toISOString().split('T')[0],
          userId
        ).run();

        // Record payment
        await db.prepare(`
          INSERT INTO payment_orders (order_id, user_id, plan_name, amount, status, payment_key, confirmed_at, created_at)
          VALUES (?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))
        `).bind(orderId, userId, `Live Speaking ${lessonCount}회 (월정기)`, amount, paymentResult.paymentKey).run();

        // Log success
        await db.prepare(`
          INSERT INTO activity_logs (user_id, activity_type, details)
          VALUES (?, 'hiing_monthly_billing_success', ?)
        `).bind(userId, `Monthly billing successful: ₩${amount.toLocaleString()} - Added ${lessonCount} lessons`).run();

        results.push({
          userId: userId,
          email: (user as any).email,
          status: 'success',
          amount: amount,
          lessonCount: lessonCount,
          newTotalLessons: newTotalLessonCount,
          nextBillingDate: nextBillingDate.toISOString().split('T')[0]
        });

        console.log(`✅ User ${userId} billing complete`);

      } catch (userError) {
        console.error(`❌ Error processing user ${(user as any).id}:`, userError);
        results.push({
          userId: (user as any).id,
          email: (user as any).email,
          status: 'error',
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Monthly billing complete: ${results.filter(r => r.status === 'success').length}/${results.length} successful`);

    return c.json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results: results
    });

  } catch (error) {
    console.error('❌ Monthly billing error:', error);
    return c.json({ 
      error: 'Monthly billing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default payments;
