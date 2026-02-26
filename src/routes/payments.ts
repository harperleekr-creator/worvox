import { Hono } from 'hono';
import type { Bindings } from '../types';

const payments = new Hono<{ Bindings: Bindings }>();

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
              subscription_end_date = datetime('now', '+' || ? || ' months')
          WHERE id = ?
        `).bind(planType, billingPeriod, months, order.user_id).run();

        console.log('User subscription updated successfully');
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
    const { userId, plan } = await c.req.json();

    console.log(`📥 Received trial request - userId: ${userId} (type: ${typeof userId}), plan: ${plan}`);

    if (!userId || !plan) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['core', 'premium'].includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be "core" or "premium"' }, 400);
    }

    console.log(`🎁 Starting free trial for user ${userId}, plan: ${plan}`);

    // Check if user already has active trial or subscription
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, plan, is_trial, trial_end_date FROM users WHERE id = ?'
    ).bind(userId).first();

    console.log(`🔍 User lookup result:`, user ? `Found: ${user.username} (${user.email})` : 'Not found');

    if (!user) {
      return c.json({ 
        error: 'User not found', 
        details: `사용자 ID ${userId}를 찾을 수 없습니다.`
      }, 404);
    }

    // Check if user already has active paid plan
    if (user.plan && user.plan !== 'free' && !user.is_trial) {
      return c.json({ error: '이미 유료 플랜을 사용 중입니다' }, 400);
    }

    // Check if user already has active trial
    if (user.is_trial && user.trial_end_date) {
      const trialEndDate = new Date(user.trial_end_date);
      if (trialEndDate > new Date()) {
        return c.json({ error: '이미 무료 체험을 이용 중입니다' }, 400);
      }
    }

    // Generate unique customer key for Toss Payments
    const customerKey = `customer_${userId}_${Date.now()}`;

    // Store customer key in database
    await c.env.DB.prepare(
      'UPDATE users SET toss_customer_key = ? WHERE id = ?'
    ).bind(customerKey, userId).run();

    console.log(`✅ Customer key generated: ${customerKey}`);

    return c.json({
      success: true,
      customerKey,
      plan,
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
    const { userId, plan, billingKey, customerKey } = await c.req.json();

    if (!userId || !plan || !billingKey || !customerKey) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    console.log(`🎉 Activating trial for user ${userId}, billing key: ${billingKey}`);

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
        is_trial = 1,
        trial_start_date = datetime('now'),
        trial_end_date = datetime('now', '+14 days'),
        auto_billing_enabled = 1,
        subscription_start_date = datetime('now'),
        subscription_end_date = datetime('now', '+14 days')
      WHERE id = ?
    `).bind(billingKey, customerKey, plan, userId).run();

    // Log trial activation
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (user_id, activity_type, description, created_at)
      VALUES (?, 'trial_start', ?, datetime('now'))
    `).bind(
      userId,
      `Started ${plan} free trial (2 weeks)`
    ).run();

    console.log(`✅ Trial activated until ${trialEndDate.toISOString()}`);

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
      INSERT INTO activity_logs (user_id, activity_type, description, created_at)
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
      SELECT id, username, email, plan, billing_key, trial_end_date
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
        console.log(`💳 Charging user ${user.id} (${user.email})`);

        // Determine amount based on plan
        const amount = user.plan === 'core' ? 9900 : 19000;
        const orderName = `WorVox ${user.plan.toUpperCase()} 월간 구독`;

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
              subscription_end_date = datetime('now', '+1 month'),
              billing_period = 'monthly',
              last_billing_attempt = datetime('now'),
              billing_failure_count = 0
            WHERE id = ?
          `).bind(user.id).run();

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
            INSERT INTO activity_logs (user_id, activity_type, description, created_at)
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
            INSERT INTO activity_logs (user_id, activity_type, description, created_at)
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

export default payments;
