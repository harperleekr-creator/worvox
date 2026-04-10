// Manual cron endpoint for scheduled tasks
import { Hono } from 'hono';
import type { Bindings } from '../types';
import { sendTrialExpirationEmail } from './email-notifications';
import { sendReminder1Hour, sendReminder10Minutes } from './notification-helpers';

const cron = new Hono<{ Bindings: Bindings }>();

// Middleware: Verify CRON_SECRET
const verifyCronSecret = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const cronSecret = c.env.CRON_SECRET;
  
  // If CRON_SECRET is not set, allow all requests (for backward compatibility)
  if (!cronSecret) {
    console.warn('⚠️ CRON_SECRET not set - all requests allowed');
    return next();
  }
  
  // Check Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (token !== cronSecret) {
    console.error('❌ Invalid CRON_SECRET');
    return c.json({ error: 'Invalid CRON_SECRET' }, 403);
  }
  
  return next();
};

// Apply middleware to all cron routes
cron.use('/*', verifyCronSecret);

// Main cron endpoint - call this daily
cron.post('/run', async (c) => {
  console.log('🔔 Running manual cron job');
  
  const results: any = {
    timestamp: new Date().toISOString(),
    tasks: []
  };

  try {
    // Task 1: Trial reminders (3 days before expiration)
    const task1 = await sendTrialReminders(c.env);
    results.tasks.push({ name: 'trial_reminders', ...task1 });

    // Task 2: Auto-billing for expired trials
    const task2 = await processAutoBilling(c.env);
    results.tasks.push({ name: 'auto_billing', ...task2 });

    // Task 3: Trial expired reminders
    const task3 = await sendTrialExpiredReminders(c.env);
    results.tasks.push({ name: 'trial_expired_reminders', ...task3 });

    return c.json({ success: true, ...results });
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return c.json({ success: false, error: error.message, ...results }, 500);
  }
});

// Individual task endpoints for testing
cron.post('/trial-reminders', async (c) => {
  const result = await sendTrialReminders(c.env);
  return c.json(result);
});

cron.post('/auto-billing', async (c) => {
  const result = await processAutoBilling(c.env);
  return c.json(result);
});

cron.post('/trial-expired-reminders', async (c) => {
  const result = await sendTrialExpiredReminders(c.env);
  return c.json(result);
});

// Task functions
async function sendTrialReminders(env: Bindings) {
  console.log('📧 Task: Trial expiration reminders (3 days before)');
  
  try {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const targetDate = threeDaysLater.toISOString().split('T')[0];

    const users = await env.DB.prepare(`
      SELECT id, email, username, trial_end_date, plan
      FROM users
      WHERE is_trial = 1
        AND DATE(trial_end_date) = ?
        AND trial_reminder_sent = 0
        AND email IS NOT NULL
    `).bind(targetDate).all();

    console.log(`📧 Found ${users.results.length} trial users to notify`);

    let successCount = 0;
    for (const user of users.results) {
      try {
        const sent = await sendTrialExpirationEmail(env, user as any);
        
        if (sent) {
          await env.DB.prepare(`
            UPDATE users SET trial_reminder_sent = 1 WHERE id = ?
          `).bind(user.id).run();
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to send trial reminder to ${user.email}:`, error);
      }
    }

    console.log(`✅ Trial reminders: ${successCount}/${users.results.length} sent`);
    return { success: true, total: users.results.length, sent: successCount };
  } catch (error: any) {
    console.error('❌ Trial reminders failed:', error);
    return { success: false, error: error.message };
  }
}

async function processAutoBilling(env: Bindings) {
  console.log('💳 Task: Auto-billing for expired trials');
  
  try {
    const today = new Date().toISOString().split('T')[0];

    const usersToCharge = await env.DB.prepare(`
      SELECT id, username, email, plan, billing_key, billing_period, trial_end_date
      FROM users
      WHERE is_trial = 1
        AND auto_billing_enabled = 1
        AND DATE(trial_end_date) <= ?
        AND billing_failure_count < 3
    `).bind(today).all();

    console.log(`💳 Found ${usersToCharge.results.length} users to charge`);

    let successCount = 0;
    let failCount = 0;
    for (const user of usersToCharge.results) {
      try {
        const billingPeriod = user.billing_period || 'monthly';
        const amount = billingPeriod === 'yearly'
          ? (user.plan === 'core' ? 97416 : 186960)
          : (user.plan === 'core' ? 9900 : 19000);

        const response = await fetch('https://api.tosspayments.com/v1/billing/' + user.billing_key, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(env.TOSS_SECRET_KEY + ':'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerKey: user.billing_key,
            amount,
            orderId: `auto_${user.id}_${Date.now()}`,
            orderName: `WorVox ${user.plan.toUpperCase()} ${billingPeriod === 'yearly' ? '연간' : '월간'} 구독`,
            customerEmail: user.email,
            customerName: user.username
          })
        });

        if (response.ok) {
          const subscriptionDuration = billingPeriod === 'yearly' ? '+12 months' : '+1 month';
          
          await env.DB.prepare(`
            UPDATE users
            SET 
              is_trial = 0,
              trial_start_date = NULL,
              trial_end_date = NULL,
              subscription_start_date = datetime('now'),
              subscription_end_date = datetime('now', ?),
              last_billing_attempt = datetime('now'),
              billing_failure_count = 0
            WHERE id = ?
          `).bind(subscriptionDuration, user.id).run();

          successCount++;
          console.log(`✅ User ${user.email} charged successfully (${amount}원)`);
        } else {
          await env.DB.prepare(`
            UPDATE users
            SET 
              last_billing_attempt = datetime('now'),
              billing_failure_count = billing_failure_count + 1
            WHERE id = ?
          `).bind(user.id).run();
          
          failCount++;
          console.log(`❌ User ${user.email} billing failed`);
        }
      } catch (error) {
        console.error(`❌ Failed to charge ${user.email}:`, error);
        failCount++;
      }
    }

    console.log(`✅ Auto-billing: ${successCount}/${usersToCharge.results.length} successful`);
    return { success: true, total: usersToCharge.results.length, charged: successCount, failed: failCount };
  } catch (error: any) {
    console.error('❌ Auto-billing failed:', error);
    return { success: false, error: error.message };
  }
}

async function sendTrialExpiredReminders(env: Bindings) {
  console.log('📧 Task: Trial expired payment reminders');
  
  try {
    const today = new Date().toISOString().split('T')[0];

    const users = await env.DB.prepare(`
      SELECT id, email, username, trial_end_date, plan, billing_key
      FROM users
      WHERE is_trial = 1
        AND DATE(trial_end_date) = ?
        AND auto_billing_enabled = 1
        AND email IS NOT NULL
    `).bind(today).all();

    console.log(`📧 Found ${users.results.length} expired trial users to notify`);

    let successCount = 0;
    for (const user of users.results) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'WorVox <noreply@worvox.com>',
            to: user.email,
            subject: '🎉 무료 체험 종료 - 자동 결제 안내',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">안녕하세요, ${user.username || '회원'}님!</h2>
                <p>WorVox ${user.plan.toUpperCase()} 플랜 무료 체험이 종료되었습니다.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">✅ 자동 결제가 진행됩니다</h3>
                  <p>등록하신 결제 수단으로 자동 결제가 곧 진행됩니다.</p>
                  <p><strong>플랜:</strong> ${user.plan.toUpperCase()}</p>
                  <p><strong>결제 금액:</strong> ${user.plan === 'core' ? '9,900원' : '19,000원'}/월</p>
                </div>
                <p>계속해서 WorVox의 모든 기능을 제한 없이 사용하실 수 있습니다!</p>
                <p>결제를 원하지 않으시면 <a href="https://worvox.com" style="color: #7c3aed;">프로필 → 구독 관리</a>에서 자동 결제를 해지하실 수 있습니다.</p>
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  감사합니다,<br>
                  WorVox 팀
                </p>
              </div>
            `
          })
        });

        if (response.ok) {
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to send expired reminder to ${user.email}:`, error);
      }
    }

    console.log(`✅ Trial expired reminders: ${successCount}/${users.results.length} sent`);
    return { success: true, total: users.results.length, sent: successCount };
  } catch (error: any) {
    console.error('❌ Trial expired reminders failed:', error);
    return { success: false, error: error.message };
  }
}

export default cron;
