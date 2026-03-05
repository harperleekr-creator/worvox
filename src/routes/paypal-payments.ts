import { Hono } from 'hono';
import type { Bindings } from '../types';

const paypalPayments = new Hono<{ Bindings: Bindings }>();

// PayPal API base URL (sandbox vs production)
const getPayPalBaseURL = (env: any) => {
  const isProduction = env.PAYPAL_MODE === 'production';
  return isProduction 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

// Get PayPal access token
async function getPayPalAccessToken(env: any): Promise<string> {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const baseURL = getPayPalBaseURL(env);
  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create PayPal order
paypalPayments.post('/create-order', async (c) => {
  try {
    const { planName, price, period, userId } = await c.req.json();

    if (!planName || !price || !userId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(c.env);
    const baseURL = getPayPalBaseURL(c.env);

    // Generate unique order ID
    const orderId = `paypal_order_${Date.now()}_${userId}`;
    const orderName = `WorVox ${planName} Plan${period === 'yearly' ? ' (Annual)' : ' (Monthly)'}`;

    // Convert KRW to USD (approximate exchange rate: 1300 KRW = 1 USD)
    const priceUSD = (price / 1300).toFixed(2);

    // Create PayPal order
    const response = await fetch(`${baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            description: orderName,
            amount: {
              currency_code: 'USD',
              value: priceUSD,
            },
          },
        ],
        application_context: {
          brand_name: 'WorVox',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `https://worvox.com/payment/paypal/success?orderId=${orderId}`,
          cancel_url: `https://worvox.com/payment/paypal/cancel?orderId=${orderId}`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal order creation failed:', error);
      return c.json({ error: 'Failed to create PayPal order', details: error }, response.status);
    }

    const paypalOrder = await response.json();

    // Store order in database
    try {
      const db = c.env.DB;
      await db.prepare(`
        INSERT INTO payment_orders (order_id, user_id, plan_name, amount, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, 'paypal', 'pending', datetime('now'))
      `).bind(orderId, userId, planName, price).run();
    } catch (dbError) {
      console.log('DB insert failed:', dbError);
    }

    return c.json({
      success: true,
      orderId: paypalOrder.id,
      internalOrderId: orderId,
      approvalUrl: paypalOrder.links.find((link: any) => link.rel === 'approve')?.href,
    });

  } catch (error) {
    console.error('PayPal create order error:', error);
    return c.json({ 
      error: 'Failed to create PayPal order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Capture PayPal order (after user approves)
paypalPayments.post('/capture-order', async (c) => {
  try {
    const { paypalOrderId, internalOrderId } = await c.req.json();

    if (!paypalOrderId || !internalOrderId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(c.env);
    const baseURL = getPayPalBaseURL(c.env);

    // Capture the payment
    const response = await fetch(`${baseURL}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal capture failed:', error);
      return c.json({ error: 'Failed to capture payment', details: error }, response.status);
    }

    const captureData = await response.json();

    // Update order in database
    try {
      const db = c.env.DB;

      // Get order details
      const order = await db.prepare(
        'SELECT * FROM payment_orders WHERE order_id = ?'
      ).bind(internalOrderId).first();

      if (order) {
        // Update order status
        await db.prepare(`
          UPDATE payment_orders 
          SET status = 'completed',
              payment_key = ?,
              confirmed_at = datetime('now')
          WHERE order_id = ?
        `).bind(paypalOrderId, internalOrderId).run();

        // Update user subscription
        const planName = String(order.plan_name).toLowerCase();
        const billingPeriod = planName.includes('년') || planName.includes('연간') || planName.includes('annual') ? 'yearly' : 'monthly';
        const months = billingPeriod === 'yearly' ? 12 : 1;
        
        // Extract plan type
        let planType = 'free';
        if (planName.includes('core')) {
          planType = 'core';
        } else if (planName.includes('premium')) {
          planType = 'premium';
        }

        console.log('Updating user subscription (PayPal):', {
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

        console.log('User subscription updated successfully via PayPal');
      }
    } catch (dbError) {
      console.log('DB update failed:', dbError);
    }

    return c.json({
      success: true,
      capture: captureData,
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    return c.json({ 
      error: 'Failed to capture PayPal payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Activate PayPal subscription after user approval
paypalPayments.post('/activate-subscription', async (c) => {
  try {
    const { subscriptionId, userId, plan } = await c.req.json();

    if (!subscriptionId || !userId || !plan) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    console.log(`🎉 Activating PayPal subscription: ${subscriptionId} for user ${userId}`);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(c.env);
    const baseURL = getPayPalBaseURL(c.env);

    // Get subscription details from PayPal
    const response = await fetch(`${baseURL}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal subscription fetch failed:', error);
      return c.json({ error: 'Failed to fetch subscription details', details: error }, response.status);
    }

    const subscription = await response.json();
    console.log('PayPal subscription details:', subscription);

    // Extract plan info
    const planType = plan.toLowerCase();
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();

    try {
      const db = c.env.DB;

      // Update user subscription (2 weeks free trial, then monthly billing)
      await db.prepare(`
        UPDATE users 
        SET plan = ?,
            billing_period = 'monthly',
            subscription_start_date = datetime('now'),
            subscription_end_date = datetime('now', '+14 days'),
            is_trial = 1,
            trial_start_date = datetime('now'),
            trial_end_date = datetime('now', '+14 days'),
            paypal_subscription_id = ?,
            use_ai_prompts = 1,
            auto_billing_enabled = 1
        WHERE id = ?
      `).bind(planType, subscriptionId, userId).run();

      // Log subscription start
      await db.prepare(`
        INSERT INTO activity_logs (user_id, activity_type, description, created_at)
        VALUES (?, 'paypal_subscription_start', ?, datetime('now'))
      `).bind(
        userId,
        `Started ${planName} subscription via PayPal (2 weeks free trial)`
      ).run();

      console.log(`✅ User ${userId} subscription activated via PayPal`);

    } catch (dbError) {
      console.error('DB update failed:', dbError);
    }

    return c.json({
      success: true,
      subscription: {
        id: subscriptionId,
        status: subscription.status,
        plan: planType,
      },
      message: '구독이 활성화되었습니다!'
    });

  } catch (error) {
    console.error('PayPal subscription activation error:', error);
    return c.json({ 
      error: 'Failed to activate subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Handle PayPal webhook events (optional, for production)
paypalPayments.post('/webhook', async (c) => {
  try {
    const event = await c.req.json();
    
    console.log('PayPal webhook received:', event.event_type);

    // Handle different event types
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment captured successfully
        console.log('Payment captured:', event.resource);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        // Payment denied
        console.log('Payment denied:', event.resource);
        break;
      
      default:
        console.log('Unhandled event type:', event.event_type);
    }

    return c.json({ success: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

export default paypalPayments;
