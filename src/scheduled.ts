// Cloudflare Cron Job for sending trial expiration reminders
import type { Bindings } from './types';
import { sendTrialExpirationEmail } from './routes/email-notifications';

export default {
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log('🔔 Running scheduled job: Trial expiration reminders');
    
    try {
      // Calculate target date (3 days from now)
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const targetDate = threeDaysLater.toISOString().split('T')[0];

      console.log(`📅 Checking for trials ending on: ${targetDate}`);

      // Get users whose trial ends in 3 days and haven't been notified
      const users = await env.DB.prepare(`
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

      // Send emails to each user
      for (const user of users.results) {
        try {
          const sent = await sendTrialExpirationEmail(env, user as any);
          
          if (sent) {
            // Mark as sent in database
            await env.DB.prepare(`
              UPDATE users
              SET trial_reminder_sent = 1
              WHERE id = ?
            `).bind(user.id).run();
            
            successCount++;
            console.log(`✅ Email sent to ${user.email}`);
          } else {
            failCount++;
            console.log(`❌ Failed to send email to ${user.email}`);
          }
        } catch (error) {
          failCount++;
          console.error(`❌ Error sending email to ${user.email}:`, error);
        }
      }

      console.log(`📊 Summary: ${successCount} sent, ${failCount} failed`);

      return new Response(JSON.stringify({
        success: true,
        targetDate,
        totalUsers: users.results.length,
        successCount,
        failCount
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
