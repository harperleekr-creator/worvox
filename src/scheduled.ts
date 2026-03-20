// Cloudflare Cron Job for sending notifications
import type { Bindings } from './types';
import { sendTrialExpirationEmail } from './routes/email-notifications';
import { sendReminder1Hour, sendReminder10Minutes } from './routes/notification-helpers';

export default {
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log('🔔 Running scheduled job');
    
    try {
      // Task 1: Trial expiration reminders
      await sendTrialReminders(env);
      
      // Task 2: Live Speaking reminders (1 hour before)
      await sendLiveSpeaking1HourReminders(env);
      
      // Task 3: Live Speaking reminders (10 minutes before)
      await sendLiveSpeaking10MinReminders(env);

      return new Response(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error('❌ Scheduled job error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Task 1: Trial expiration reminders
async function sendTrialReminders(env: Bindings) {
  console.log('📧 Task 1: Trial expiration reminders');
  
  try {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const targetDate = threeDaysLater.toISOString().split('T')[0];

    const users = await env.DB.prepare(`
      SELECT id, email, username, subscription_end_date, plan
      FROM users
      WHERE is_trial = 1
        AND DATE(subscription_end_date) = ?
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
  } catch (error) {
    console.error('❌ Trial reminders failed:', error);
  }
}

// Task 2: Live Speaking 1-hour reminders
async function sendLiveSpeaking1HourReminders(env: Bindings) {
  console.log('📱 Task 2: Live Speaking 1-hour reminders');
  
  try {
    // Get sessions starting in 55-65 minutes (to account for cron timing)
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 55 * 60 * 1000);
    const oneHourPlus = new Date(now.getTime() + 65 * 60 * 1000);

    const sessions = await env.DB.prepare(`
      SELECT s.*, u.email as user_email, u.name as user_name, 
             t.name as teacher_name, t.phone_number as teacher_phone, t.email as teacher_email
      FROM hiing_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN hiing_teachers t ON s.teacher_id = t.id
      WHERE s.status = 'scheduled'
        AND s.reminder_1h_sent = 0
        AND s.scheduled_at BETWEEN ? AND ?
    `).bind(oneHourLater.toISOString(), oneHourPlus.toISOString()).all();

    console.log(`📱 Found ${sessions.results.length} sessions for 1h reminder`);

    let successCount = 0;
    for (const session of sessions.results) {
      try {
        const user = {
          id: session.user_id,
          email: session.user_email,
          name: session.user_name
        };
        
        const teacher = {
          id: session.teacher_id,
          name: session.teacher_name,
          phone_number: session.teacher_phone,
          email: session.teacher_email
        };

        await sendReminder1Hour(env, session, user, teacher);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send 1h reminder for session ${session.id}:`, error);
      }
    }

    console.log(`✅ 1-hour reminders: ${successCount}/${sessions.results.length} sent`);
  } catch (error) {
    console.error('❌ 1-hour reminders failed:', error);
  }
}

// Task 3: Live Speaking 10-minute reminders
async function sendLiveSpeaking10MinReminders(env: Bindings) {
  console.log('📱 Task 3: Live Speaking 10-minute reminders');
  
  try {
    // Get sessions starting in 8-12 minutes
    const now = new Date();
    const tenMinLater = new Date(now.getTime() + 8 * 60 * 1000);
    const tenMinPlus = new Date(now.getTime() + 12 * 60 * 1000);

    const sessions = await env.DB.prepare(`
      SELECT s.*, u.email as user_email, u.name as user_name,
             t.name as teacher_name, t.phone_number as teacher_phone, t.email as teacher_email
      FROM hiing_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN hiing_teachers t ON s.teacher_id = t.id
      WHERE s.status = 'scheduled'
        AND s.reminder_10m_sent = 0
        AND s.scheduled_at BETWEEN ? AND ?
    `).bind(tenMinLater.toISOString(), tenMinPlus.toISOString()).all();

    console.log(`📱 Found ${sessions.results.length} sessions for 10m reminder`);

    let successCount = 0;
    for (const session of sessions.results) {
      try {
        const user = {
          id: session.user_id,
          email: session.user_email,
          name: session.user_name
        };
        
        const teacher = {
          id: session.teacher_id,
          name: session.teacher_name,
          phone_number: session.teacher_phone,
          email: session.teacher_email
        };

        await sendReminder10Minutes(env, session, user, teacher);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send 10m reminder for session ${session.id}:`, error);
      }
    }

    console.log(`✅ 10-minute reminders: ${successCount}/${sessions.results.length} sent`);
  } catch (error) {
    console.error('❌ 10-minute reminders failed:', error);
  }
}
