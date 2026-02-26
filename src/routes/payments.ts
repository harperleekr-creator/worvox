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

export default payments;
