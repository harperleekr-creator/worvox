# 📊 WorVox 운영 가이드

## 🔑 1. 현재 연동된 API 및 비용

### 💰 **월간 예상 비용** (100명 Premium 기준)

| API 서비스 | 용도 | 월간 비용 | 비고 |
|-----------|------|----------|------|
| **OpenAI GPT-3.5-turbo** | AI 프롬프트 생성 | $24 (₩32,000) | 타이머/시나리오/시험 모드 |
| **ElevenLabs TTS** | 음성 생성 | $22 (₩29,000) | Creator 플랜 |
| **Toss Payments** | 결제 처리 | 3.63% | ₩19,000 → 수수료 ₩691 |
| **Cloudflare D1** | 데이터베이스 | $0 | Free tier 충분 |
| **Cloudflare Pages** | 웹 호스팅 | $0 | 무제한 무료 |
| **합계** | | **₩61,000 + 결제 수수료** | |

### 📈 **수익성 분석** (100명 Premium 기준)

```
월 매출: ₩19,000 × 100명 = ₩1,900,000
API 비용: ₩61,000
결제 수수료: ₩68,970
───────────────────────────
순이익: ₩1,770,030/월 (93% 마진)
```

---

## 📧 2. 무료체험 종료 알림 구현

### **필요한 서비스**
1. **이메일 발송 서비스** (선택 1개)
   - SendGrid (추천) - Free: 100 emails/day
   - Resend - Free: 100 emails/day
   - Mailgun - Free: 1,000 emails/month

### **구현 단계**

#### **1단계: SendGrid 설정**
```bash
# 1. https://sendgrid.com 가입
# 2. API Key 생성
# 3. Cloudflare에 추가
npx wrangler pages secret put SENDGRID_API_KEY --project-name worvox
```

#### **2단계: wrangler.jsonc 수정**
```jsonc
{
  "triggers": {
    "crons": ["0 0 * * *"]  // 매일 자정 실행
  }
}
```

#### **3단계: src/scheduled.ts 생성**
```typescript
import type { Bindings } from './types';

async function sendEmail(env: Bindings, to: string, subject: string, html: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@worvox.com', name: 'WorVox' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  });
  return response.ok;
}

export default {
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log('🕐 Running trial expiry check...');

    // 3일 후 체험 종료 사용자 찾기
    const users = await env.DB.prepare(`
      SELECT id, email, username, subscription_end_date
      FROM users
      WHERE is_trial = 1
      AND date(subscription_end_date) = date('now', '+3 days')
    `).all();

    console.log(`📧 Found ${users.results.length} users with trial ending in 3 days`);

    for (const user of users.results) {
      const html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>안녕하세요 ${user.username}님,</h2>
          <p>WorVox 무료체험이 <strong>3일 후 종료</strong>됩니다.</p>
          <p>계속해서 AI 영어 학습 기능을 사용하시려면 Premium 플랜을 구독해주세요.</p>
          <div style="margin: 30px 0;">
            <a href="https://worvox.com/pricing" 
               style="background: #10b981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;">
              Premium 플랜 보기
            </a>
          </div>
          <p style="color: #666;">체험 종료일: ${user.subscription_end_date}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            WorVox | AI English Learning Platform<br>
            이 메일은 자동 발송되었습니다.
          </p>
        </body>
        </html>
      `;

      try {
        await sendEmail(env, user.email, 'WorVox 무료체험 종료 안내 (3일 남음)', html);
        console.log(`✅ Email sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error);
      }
    }
  }
}
```

#### **4단계: 배포**
```bash
npm run build
npx wrangler pages deploy dist --project-name worvox
```

---

## 📊 3. Google Analytics 완성

### **✅ 이미 완료된 작업**
- SEO 메타 태그 추가
- Google Analytics 코드 삽입
- Open Graph 태그 추가
- Twitter Card 추가
- robots.txt 생성
- sitemap.xml 생성

### **⚠️ 남은 작업**

#### **1단계: Google Analytics 측정 ID 발급**
1. https://analytics.google.com 접속
2. "측정 시작" 클릭
3. 계정 생성:
   - 계정 이름: **WorVox**
   - 속성 이름: **WorVox App**
   - 국가: **대한민국**
   - 통화: **KRW (₩)**
4. **측정 ID 받기**: `G-XXXXXXXXXX` (예: G-ABC123DEF4)

#### **2단계: 코드에 측정 ID 삽입**
```bash
# src/index.tsx 파일에서 G-XXXXXXXXXX를 실제 ID로 교체
# Line 370, 376에 있음
```

#### **3단계: 주요 이벤트 추가**

`public/static/app.js`에 이벤트 트래킹 추가:

```javascript
// 회원가입 완료
gtag('event', 'sign_up', {
  method: 'Google'
});

// Premium 구매
gtag('event', 'purchase', {
  transaction_id: orderId,
  value: 19000,
  currency: 'KRW',
  items: [{
    item_id: 'premium_plan',
    item_name: 'Premium Monthly',
    price: 19000
  }]
});

// AI 대화 시작
gtag('event', 'start_conversation', {
  topic: 'AI English Conversation'
});

// 타이머 모드 시작
gtag('event', 'timer_mode_start', {
  time_limit: 5
});

// 시나리오 모드 시작
gtag('event', 'scenario_mode_start', {
  scenario: scenario.title
});
```

---

## 🔍 4. Google SEO 완성

### **✅ 이미 완료된 작업**
1. ✅ Meta description
2. ✅ Keywords
3. ✅ Open Graph tags
4. ✅ Twitter Card
5. ✅ Canonical URL
6. ✅ robots.txt
7. ✅ sitemap.xml

### **⚠️ 추가 작업 필요**

#### **1단계: Google Search Console 등록**
1. https://search.google.com/search-console 접속
2. "속성 추가" 클릭
3. "URL 접두어" 선택: `https://worvox.com`
4. 소유권 확인:
   - **방법 1**: HTML 파일 업로드
   - **방법 2**: Google Analytics 사용
   - **방법 3**: DNS 레코드 추가 (권장)

#### **2단계: Sitemap 제출**
```
Google Search Console → Sitemaps → https://worvox.com/sitemap.xml 추가
```

#### **3단계: Naver 검색등록**
1. https://searchadvisor.naver.com 접속
2. 사이트 등록: `https://worvox.com`
3. 소유권 확인 (HTML 파일 또는 메타 태그)
4. 사이트맵 제출

#### **4단계: 구조화된 데이터 추가**

`src/index.tsx`에 JSON-LD 추가:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "WorVox",
  "url": "https://worvox.com",
  "logo": "https://worvox.com/logo.png",
  "description": "AI 기반 영어 학습 플랫폼",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "KR"
  },
  "offers": {
    "@type": "Offer",
    "name": "Premium Plan",
    "price": "19000",
    "priceCurrency": "KRW"
  }
}
</script>
```

#### **5단계: 페이지 속도 최적화**
- Google PageSpeed Insights 테스트
- 이미지 최적화 (WebP 포맷)
- JavaScript 번들 크기 축소
- Lazy loading 구현

#### **6단계: 백링크 구축**
- 블로그 포스팅
- 소셜 미디어 공유
- 커뮤니티 참여 (Reddit, Quora)

---

## ✅ 체크리스트

### **즉시 해야 할 일**
- [ ] Google Analytics 측정 ID 발급 및 교체
- [ ] SendGrid API 키 발급
- [ ] Google Search Console 등록
- [ ] Naver 검색등록

### **1주일 내**
- [ ] 무료체험 알림 이메일 시스템 구축
- [ ] 구조화된 데이터 추가
- [ ] 주요 이벤트 트래킹 추가

### **1개월 내**
- [ ] 페이지 속도 최적화
- [ ] 백링크 구축 시작
- [ ] 블로그 콘텐츠 제작

---

## 📞 문의

문제가 발생하거나 추가 기능이 필요하면 언제든 연락주세요!

**배포 링크**:
- Production: https://worvox.com
- Preview: https://d26dcafb.worvox.pages.dev
- GitHub: https://github.com/harperleekr-creator/worvox
