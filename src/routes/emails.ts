import { Hono } from 'hono';
import type { Bindings } from '../types';

const emails = new Hono<{ Bindings: Bindings }>();

// HTML 환영 이메일 템플릿
const getWelcomeEmailHTML = (userName: string) => `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WorVox에 오신 것을 환영합니다!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🎉 환영합니다!
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 18px;">
                WorVox와 함께 영어 실력을 레벨업하세요
              </p>
            </td>
          </tr>
          
          <!-- 인사 -->
          <tr>
            <td style="padding: 40px 30px 20px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                안녕하세요, <strong>${userName}</strong>님! 👋
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                WorVox에 가입해주셔서 진심으로 감사드립니다. 이제 AI와 함께 효과적이고 재미있게 영어를 배울 준비가 되었습니다!
              </p>
            </td>
          </tr>
          
          <!-- WorVox로 얻을 수 있는 것 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: bold;">
                🚀 WorVox로 얻을 수 있는 것
              </h2>
              
              <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                  💬 1. 실시간 AI 대화 연습
                </h3>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  자유롭게 영어로 대화하고 즉각적인 피드백을 받아보세요. 부담 없이 말할 수 있는 환경에서 자신감을 키워보세요.
                </p>
              </div>
              
              <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); border-radius: 12px; border-left: 4px solid #a855f7;">
                <h3 style="margin: 0 0 10px 0; color: #5b21b6; font-size: 18px; font-weight: bold;">
                  🎯 2. 발음 & 억양 교정
                </h3>
                <p style="margin: 0; color: #6b21a8; font-size: 14px; line-height: 1.5;">
                  AI가 당신의 발음을 분석하고 원어민처럼 말하는 방법을 알려드립니다. 정확한 발음으로 자신 있게 말해보세요.
                </p>
              </div>
              
              <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 18px; font-weight: bold;">
                  🎬 3. 실전 시나리오 연습
                </h3>
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                  공항, 레스토랑, 면접 등 30가지 실제 상황에서 사용하는 영어를 배우세요. 여행이나 업무에서 바로 써먹을 수 있습니다.
                </p>
              </div>
              
              <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); border-radius: 12px; border-left: 4px solid #ea580c;">
                <h3 style="margin: 0 0 10px 0; color: #7c2d12; font-size: 18px; font-weight: bold;">
                  📝 4. OPIC 스타일 모의고사
                </h3>
                <p style="margin: 0; color: #9a3412; font-size: 14px; line-height: 1.5;">
                  실전 같은 환경에서 말하기 시험을 연습하고, AI가 당신의 실력을 평가해드립니다. 시험 준비에 최적화되어 있습니다.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Premium 소개 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; border: 2px solid #f59e0b;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 48px;">👑</span>
                </div>
                <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 24px; font-weight: bold; text-align: center;">
                  Premium으로 더 빠르게 성장하세요
                </h2>
                <p style="margin: 0 0 20px 0; color: #78350f; font-size: 16px; line-height: 1.6; text-align: center;">
                  지금 업그레이드하고 <strong>AI 발음 코칭</strong>, <strong>무제한 연습</strong>, <strong>상세 분석 리포트</strong>를 만나보세요!
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #15803d; font-size: 20px; margin-right: 10px;">✓</span>
                      <span style="color: #78350f; font-size: 15px;">AI 발음 & 억양 상세 피드백</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #15803d; font-size: 20px; margin-right: 10px;">✓</span>
                      <span style="color: #78350f; font-size: 15px;">무제한 대화 & 연습 세션</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #15803d; font-size: 20px; margin-right: 10px;">✓</span>
                      <span style="color: #78350f; font-size: 15px;">개선된 답변 예시 제공</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #15803d; font-size: 20px; margin-right: 10px;">✓</span>
                      <span style="color: #78350f; font-size: 15px;">학습 진도 상세 리포트</span>
                    </td>
                  </tr>
                </table>
                
                <div style="text-align: center;">
                  <a href="https://worvox.com/pricing" style="display: inline-block; background-color: #a855f7; background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 2px solid #a855f7;">
                    <span style="color: #ffffff; font-weight: bold;">Premium 자세히 보기</span>
                  </a>
                </div>
                
                <p style="margin: 15px 0 0 0; color: #92400e; font-size: 14px; text-align: center;">
                  <strong>월 ₩19,000</strong> | 연간 결제 시 <strong>18% 할인</strong>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- 시작하기 버튼 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: bold;">
                지금 바로 시작해보세요! 🎯
              </h2>
              <a href="https://worvox.com/app" style="display: inline-block; background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 2px solid #10b981;">
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

// 텍스트 버전 (HTML 미지원 이메일 클라이언트용)
const getWelcomeEmailText = (userName: string) => `
안녕하세요, ${userName}님! 👋

WorVox에 가입해주셔서 진심으로 감사드립니다.
이제 AI와 함께 효과적이고 재미있게 영어를 배울 준비가 되었습니다!

🚀 WorVox로 얻을 수 있는 것:

💬 1. 실시간 AI 대화 연습
자유롭게 영어로 대화하고 즉각적인 피드백을 받아보세요.

🎯 2. 발음 & 억양 교정
AI가 당신의 발음을 분석하고 원어민처럼 말하는 방법을 알려드립니다.

🎬 3. 실전 시나리오 연습
공항, 레스토랑, 면접 등 30가지 실제 상황에서 사용하는 영어를 배우세요.

📝 4. OPIC 스타일 모의고사
실전 같은 환경에서 말하기 시험을 연습하고, AI가 당신의 실력을 평가해드립니다.

👑 Premium으로 더 빠르게 성장하세요

Premium을 구독하시면:
✓ AI 발음 & 억양 상세 피드백
✓ 무제한 대화 & 연습 세션
✓ 개선된 답변 예시 제공
✓ 학습 진도 상세 리포트

월 ₩19,000 | 연간 결제 시 18% 할인
👉 https://worvox.com/pricing

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

// 환영 이메일 발송
emails.post('/send-welcome', async (c) => {
  try {
    const { email, name } = await c.req.json();

    if (!email || !name) {
      return c.json({ 
        success: false, 
        error: 'Email and name are required' 
      }, 400);
    }

    // Resend API 키 체크
    const resendApiKey = c.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return c.json({ 
        success: true, 
        message: 'Email sending disabled (no API key)'
      });
    }

    // Resend API 호출
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'WorVox <noreply@worvox.com>',
        to: [email],
        subject: `🎉 ${name}님, WorVox에 오신 것을 환영합니다!`,
        html: getWelcomeEmailHTML(name),
        text: getWelcomeEmailText(name)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    console.log('✅ Welcome email sent:', { email, name, emailId: data.id });

    return c.json({ 
      success: true,
      emailId: data.id,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email'
    }, 500);
  }
});

export default emails;
