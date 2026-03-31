// Email helper functions for admin notifications
import type { Bindings } from '../types';

/**
 * Send email via Resend API
 */
async function sendEmail(
  env: Bindings,
  params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }
): Promise<boolean> {
  const resendApiKey = env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || 'WorVox <no-reply@worvox.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
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

/**
 * Send admin notification for new user signup
 */
export async function sendAdminSignupNotification(
  env: Bindings,
  user: {
    id: number;
    email: string;
    username: string;
    plan: string;
    is_trial: number;
    subscription_end_date?: string;
    created_at: string;
  }
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>새로운 회원가입 알림</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #E5E7EB;">
        <h1 style="color: #10B981; font-size: 28px; margin: 0;">
          🎉 새로운 회원 가입
        </h1>
        <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">
          ${new Date(user.created_at).toLocaleString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      </div>
      
      <!-- User Info -->
      <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 18px; margin-top: 0; margin-bottom: 15px;">👤 회원 정보</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px; width: 120px;">
              <strong>사용자 ID:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              #${user.id}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">
              <strong>이름:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              ${user.username}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">
              <strong>이메일:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              <a href="mailto:${user.email}" style="color: #3B82F6; text-decoration: none;">
                ${user.email}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">
              <strong>플랜:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; ${
                user.plan === 'premium' ? 'background: #FEF3C7; color: #92400E;' :
                user.plan === 'core' ? 'background: #DBEAFE; color: #1E40AF;' :
                'background: #E5E7EB; color: #374151;'
              }">
                ${user.plan.toUpperCase()}
              </span>
              ${user.is_trial ? ' <span style="background: #FEE2E2; color: #991B1B; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 600;">무료체험</span>' : ''}
            </td>
          </tr>
          ${user.is_trial && user.subscription_end_date ? `
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">
              <strong>체험 종료일:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              ${new Date(user.subscription_end_date).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Quick Actions -->
      <div style="text-align: center; padding-top: 20px;">
        <a href="https://worvox.com/admin" 
           style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          관리자 대시보드에서 확인하기 →
        </a>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          이 메일은 WorVox 관리자에게만 발송됩니다.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(env, {
    to: 'support@worvox.com',
    subject: `[WorVox] 새로운 회원 가입: ${user.username} (${user.email})`,
    html,
  });
}

/**
 * Send admin notification for payment completion
 */
export async function sendAdminPaymentNotification(
  env: Bindings,
  payment: {
    order_id: string;
    user_id: number;
    user_email: string;
    user_name: string;
    plan_name: string;
    amount: number;
    billing_period?: string;
    payment_method?: string;
    status: string;
    created_at: string;
  }
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 완료 알림</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #E5E7EB;">
        <h1 style="color: #10B981; font-size: 28px; margin: 0;">
          💳 결제 완료
        </h1>
        <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">
          ${new Date(payment.created_at).toLocaleString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      </div>
      
      <!-- Payment Info -->
      <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #3B82F6;">
        <h3 style="color: #1E40AF; font-size: 18px; margin-top: 0; margin-bottom: 15px;">💰 결제 정보</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #1E40AF; font-size: 14px; width: 120px;">
              <strong>주문번호:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; font-family: monospace;">
              ${payment.order_id}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #1E40AF; font-size: 14px;">
              <strong>플랜:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              <span style="font-weight: 600;">${payment.plan_name}</span>
              ${payment.billing_period ? ` (${payment.billing_period === 'monthly' ? '월간' : '연간'})` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #1E40AF; font-size: 14px;">
              <strong>결제금액:</strong>
            </td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: bold;">
              <span style="color: #DC2626;">₩${payment.amount.toLocaleString()}</span>
            </td>
          </tr>
          ${payment.payment_method ? `
          <tr>
            <td style="padding: 8px 0; color: #1E40AF; font-size: 14px;">
              <strong>결제수단:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              ${payment.payment_method === 'card' ? '신용카드' : payment.payment_method}
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #1E40AF; font-size: 14px;">
              <strong>결제상태:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; ${
                payment.status === 'success' || payment.status === 'completed' 
                  ? 'background: #D1FAE5; color: #065F46;' 
                  : 'background: #FEE2E2; color: #991B1B;'
              }">
                ${payment.status === 'success' || payment.status === 'completed' ? '✅ 결제완료' : '❌ ' + payment.status}
              </span>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Customer Info -->
      <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 18px; margin-top: 0; margin-bottom: 15px;">👤 고객 정보</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px; width: 120px;">
              <strong>사용자 ID:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              #${payment.user_id}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">
              <strong>이름:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              ${payment.user_name}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">
              <strong>이메일:</strong>
            </td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px;">
              <a href="mailto:${payment.user_email}" style="color: #3B82F6; text-decoration: none;">
                ${payment.user_email}
              </a>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Quick Actions -->
      <div style="text-align: center; padding-top: 20px;">
        <a href="https://worvox.com/admin" 
           style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 10px;">
          관리자 대시보드 →
        </a>
        <a href="https://worvox.com/admin/users/${payment.user_id}" 
           style="display: inline-block; background: #6B7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          사용자 상세 보기
        </a>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          이 메일은 WorVox 관리자에게만 발송됩니다.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(env, {
    to: 'support@worvox.com',
    subject: `[WorVox] 결제 완료: ${payment.user_name} - ${payment.plan_name} (₩${payment.amount.toLocaleString()})`,
    html,
  });
}
