// Send announcement email to failed users
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const RESEND_API_KEY = 're_UJHC8Q1B_GqHwQTp8hmtSd84szNoggQ4h';

const emailHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WorVox 업데이트 안내</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">WorVox</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px;">AI 기반 영어 학습 플랫폼</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #333333; font-size: 24px; margin-top: 0;">안녕하세요, WorVox 회원님! 👋</h2>
            
            <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                항상 WorVox를 이용해 주셔서 감사합니다.
            </p>
            
            <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                더 나은 학습 경험을 위해 <strong>AI 기능 업데이트</strong>와 <strong>UI 개선 작업</strong>을 완료했습니다! 🎉
            </p>

            <!-- Update Box -->
            <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                <h3 style="color: #667eea; margin-top: 0; font-size: 20px;">🎯 주요 업데이트 내용</h3>
                
                <h4 style="color: #333333; font-size: 16px; margin-top: 20px;">1️⃣ AI 기능 강화</h4>
                <ul style="color: #666666; line-height: 1.8; font-size: 15px; padding-left: 20px;">
                    <li>✨ <strong>AI 프롬프트 자동 생성</strong> - Premium 회원님께 제공</li>
                    <li>🎯 <strong>개인화된 학습 문장</strong> - 난이도별 맞춤 문장 생성</li>
                    <li>💬 <strong>실시간 피드백 개선</strong> - 더 정확하고 자세한 발음 분석</li>
                </ul>

                <h4 style="color: #333333; font-size: 16px; margin-top: 20px;">2️⃣ UI/UX 개선</h4>
                <ul style="color: #666666; line-height: 1.8; font-size: 15px; padding-left: 20px;">
                    <li>🎨 <strong>다크모드 색상 최적화</strong> - 눈이 편안한 색상으로 개선</li>
                    <li>🎨 <strong>모드별 색상 테두리 추가</strong> - 각 학습 모드 구분이 더 쉬워졌어요</li>
                    <li>🎯 <strong>로고 UI 정리</strong> - 깔끔한 디자인으로 개선</li>
                </ul>

                <h4 style="color: #333333; font-size: 16px; margin-top: 20px;">3️⃣ 안정성 개선</h4>
                <ul style="color: #666666; line-height: 1.8; font-size: 15px; padding-left: 20px;">
                    <li>🔧 <strong>자동결제 시스템 개선</strong> - 무료체험 종료 시 안정적인 결제 처리</li>
                    <li>📧 <strong>알림 메일 자동화</strong> - 무료체험 만료 3일 전 알림 발송</li>
                    <li>💾 <strong>학습 기록 저장</strong> - 모든 연습 내용이 자동 저장됩니다</li>
                </ul>
            </div>

            <!-- Free Trial Box -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
                <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 22px;">🎁 2주 무료체험 진행 중!</h3>
                <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 15px;">아직 Premium 플랜을 경험하지 못하셨나요?</p>
                <ul style="color: #ffffff; text-align: left; display: inline-block; margin: 15px 0; font-size: 15px;">
                    <li>✅ 2주 동안 모든 기능 무료 이용</li>
                    <li>✅ 신용카드 등록만으로 간편 시작</li>
                    <li>✅ 언제든 취소 가능 (위약금 없음)</li>
                </ul>
                <div style="margin-top: 20px;">
                    <a href="https://worvox.com/pricing" style="display: inline-block; background-color: #ffffff; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">지금 무료체험 시작하기 →</a>
                </div>
            </div>

            <!-- Social Media -->
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 20px;">📱 소셜 미디어 채널 오픈!</h3>
                <p style="color: #666666; margin: 0 0 20px 0; font-size: 15px;">WorVox의 최신 소식과 영어 학습 팁을 만나보세요!</p>
                <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <a href="https://www.instagram.com/worvox_official/" style="display: inline-block; background-color: #E4405F; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-size: 14px;">📸 Instagram</a>
                    <a href="https://www.youtube.com/@WorVoxOfficial" style="display: inline-block; background-color: #FF0000; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-size: 14px;">🎥 YouTube</a>
                    <a href="https://www.tiktok.com/@worvox.official" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-size: 14px;">🎵 TikTok</a>
                </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://worvox.com/app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">지금 바로 체험해보세요! →</a>
            </div>

            <p style="color: #666666; line-height: 1.6; font-size: 15px; margin-top: 30px;">
                궁금하신 점이 있으시면 언제든지 <a href="mailto:support@worvox.com" style="color: #667eea; text-decoration: none;">support@worvox.com</a>으로 문의해 주세요.
            </p>

            <p style="color: #666666; line-height: 1.6; font-size: 15px;">
                감사합니다! 😊
            </p>

            <p style="color: #333333; font-weight: bold; font-size: 15px; margin-top: 20px;">
                WorVox 팀 드림
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999999; font-size: 13px; margin: 5px 0;">📞 문의: 070-8064-0485</p>
            <p style="color: #999999; font-size: 13px; margin: 5px 0;">📧 이메일: support@worvox.com</p>
            <p style="color: #999999; font-size: 13px; margin: 5px 0;">🌐 웹사이트: <a href="https://worvox.com" style="color: #667eea; text-decoration: none;">worvox.com</a></p>
            <p style="color: #cccccc; font-size: 12px; margin-top: 20px;">
                © 2026 WorVox. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;

const failedEmails = [
  'ikdhappy@gmail.com',
  'test1774510682@test.com'
];

async function sendToFailedUsers() {
  console.log('📧 Sending to failed users...\n');

  let successCount = 0;
  let failCount = 0;

  for (const emailAddress of failedEmails) {
    try {
      const email = {
        from: 'WorVox <support@worvox.com>',
        to: emailAddress,
        subject: '[WorVox] AI 기능 업데이트 및 UI 개선 완료 🎉',
        html: emailHTML
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(email)
      });

      const responseData = await response.json();
      
      if (response.ok) {
        console.log(`✅ Sent to: ${emailAddress} (ID: ${responseData.id})`);
        successCount++;
      } else {
        console.error(`❌ Failed to send to ${emailAddress}:`, responseData);
        failCount++;
      }
      
      // Rate limiting: wait 500ms between emails
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error sending to ${emailAddress}:`, error.message);
      failCount++;
    }
  }

  console.log('\n📊 Final Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📧 Total: ${failedEmails.length}`);
}

sendToFailedUsers();
