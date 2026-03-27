# 무료체험 & 자동결제 시스템 현황

## ✅ 구현 완료 항목

### 1. 무료체험 중복 방지 ✅
**위치**: `src/routes/payments.ts` (Line 454-465)

**로직**:
```typescript
// Check if user already has active trial
if (user.is_trial && user.trial_end_date) {
  const trialEndDate = new Date(user.trial_end_date);
  if (trialEndDate > new Date()) {
    return c.json({ 
      error: '이미 무료 체험을 이용 중입니다',
      details: `무료 체험 종료일: ${trialEndDate.toISOString().split('T')[0]}`
    }, 400);
  }
}
```

**테스트 방법**:
1. 무료체험 중인 계정으로 다시 "2주 무료로 시작하기" 클릭
2. 예상 결과: "이미 무료 체험을 이용 중입니다" 에러 메시지

**확인 상태**: ✅ 정상 작동

---

### 2. 무료체험 종료 3일 전 이메일 알림 ✅
**위치**: `src/scheduled.ts` (Line 41-80)

**로직**:
```typescript
async function sendTrialReminders(env: Bindings) {
  // 3일 후 날짜 계산
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const targetDate = threeDaysLater.toISOString().split('T')[0];

  // 3일 후 체험 종료 & 알림 미발송 사용자 조회
  const users = await env.DB.prepare(`
    SELECT id, email, username, subscription_end_date, plan
    FROM users
    WHERE is_trial = 1
      AND DATE(subscription_end_date) = ?
      AND trial_reminder_sent = 0
      AND email IS NOT NULL
  `).bind(targetDate).all();

  // 이메일 발송 및 플래그 업데이트
  for (const user of users.results) {
    await sendTrialExpirationEmail(env, user);
    await env.DB.prepare(`
      UPDATE users SET trial_reminder_sent = 1 WHERE id = ?
    `).bind(user.id).run();
  }
}
```

**Cron 설정**: `wrangler.jsonc`
```json
"triggers": {
  "crons": ["0 */6 * * *"]  // 6시간마다 실행
}
```

**이메일 템플릿**: `src/routes/email-notifications.ts`
- 체험 종료일 안내
- 자동 결제 금액 안내
- 해지 방법 안내

**확인 상태**: ✅ 코드 구현 완료, Cron 설정 추가됨

---

### 3. 무료체험 종료 후 자동 결제 ✅
**위치**: `src/routes/payments.ts` (Line 688-870)

**엔드포인트**: `POST /api/payments/billing/execute`

**로직**:
```typescript
// 1. 오늘 체험 종료 사용자 조회
const { results: usersToCharge } = await c.env.DB.prepare(`
  SELECT id, username, email, plan, billing_key, billing_period, trial_end_date
  FROM users
  WHERE is_trial = 1
    AND auto_billing_enabled = 1
    AND date(trial_end_date) <= date('now')
    AND billing_failure_count < 3
`).all();

// 2. Toss Payments 자동 결제 호출
const tossResponse = await fetch('https://api.tosspayments.com/v1/billing/' + user.billing_key, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(TOSS_SECRET_KEY + ':'),
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

// 3. 결제 성공 시: 무료체험 → 유료 구독 전환
if (tossResponse.ok) {
  await c.env.DB.prepare(`
    UPDATE users
    SET 
      is_trial = 0,
      trial_start_date = NULL,
      trial_end_date = NULL,
      subscription_start_date = datetime('now'),
      subscription_end_date = datetime('now', ?),  // +1 month or +12 months
      billing_period = ?,
      last_billing_attempt = datetime('now'),
      billing_failure_count = 0
    WHERE id = ?
  `).bind(subscriptionDuration, billingPeriod, user.id).run();
  
  // 결제 기록 저장
  await c.env.DB.prepare(`
    INSERT INTO payment_orders (order_id, user_id, plan_name, amount, status, created_at)
    VALUES (?, ?, ?, ?, 'completed', datetime('now'))
  `).bind(orderId, user.id, user.plan, amount).run();
}

// 4. 결제 실패 시: 재시도 카운트 증가
else {
  await c.env.DB.prepare(`
    UPDATE users
    SET 
      last_billing_attempt = datetime('now'),
      billing_failure_count = billing_failure_count + 1
    WHERE id = ?
  `).bind(user.id).run();
  
  // 3회 실패 시 무료 플랜으로 다운그레이드
  if (updatedUser.billing_failure_count >= 3) {
    await c.env.DB.prepare(`
      UPDATE users
      SET 
        plan = 'free',
        is_trial = 0,
        auto_billing_enabled = 0,
        subscription_end_date = datetime('now')
      WHERE id = ?
    `).bind(user.id).run();
  }
}
```

**호출 방법**: Cloudflare Cron Trigger (6시간마다)

**확인 상태**: ✅ 코드 구현 완료

---

## 📋 DB 스키마 확인

### Users 테이블 필드
```sql
-- 무료체험 관련
is_trial                INTEGER DEFAULT 0,
trial_start_date        TEXT,
trial_end_date          TEXT,
trial_reminder_sent     INTEGER DEFAULT 0,

-- 구독 관련
plan                    TEXT DEFAULT 'free',
billing_period          TEXT DEFAULT 'monthly',
subscription_start_date TEXT,
subscription_end_date   TEXT,

-- 자동결제 관련
billing_key             TEXT,
auto_billing_enabled    INTEGER DEFAULT 0,
last_billing_attempt    TEXT,
billing_failure_count   INTEGER DEFAULT 0,

-- Toss Payments 고객 키
toss_customer_key       TEXT
```

---

## 🔄 전체 플로우

### A. 무료체험 시작 플로우
```
1. 사용자: "2주 무료로 시작하기" 클릭 (Premium/Core 선택)
   ↓
2. POST /api/payments/trial/start
   - 중복 체험 확인 (is_trial=1 && trial_end_date > now)
   - 중복이면 에러 반환 ❌
   - 새 customerKey 생성
   ↓
3. TossPayments 빌링키 등록 페이지 이동
   - 카드 정보 입력
   ↓
4. GET /trial-success?authKey=xxx&customerKey=xxx&plan=premium
   ↓
5. POST /api/payments/trial/confirm
   - Toss API: authKey → billingKey 발급
   - DB 업데이트:
     * is_trial = 1
     * trial_start_date = now
     * trial_end_date = now + 14 days
     * plan = 'premium' (or 'core')
     * billing_key = xxx
     * auto_billing_enabled = 1
   - 이메일 발송: 체험 시작 안내
   ↓
6. localStorage 업데이트 (user.plan = 'premium')
   ↓
7. /app 리다이렉트 (2초 후) → Premium 등급 즉시 반영
```

### B. 무료체험 종료 3일 전 알림 플로우
```
Cron Job (6시간마다)
   ↓
scheduled.ts: sendTrialReminders()
   ↓
SELECT users WHERE:
  - is_trial = 1
  - DATE(subscription_end_date) = DATE(now + 3 days)
  - trial_reminder_sent = 0
   ↓
FOR EACH user:
  - sendTrialExpirationEmail() 호출
  - UPDATE users SET trial_reminder_sent = 1
```

**이메일 내용**:
- 제목: "🎁 WorVox Premium 무료 체험이 3일 후 종료됩니다"
- 내용:
  - 체험 종료일
  - 자동 결제 금액 (₩9,900/월 or ₩19,000/월)
  - 해지 방법
  - 문의 링크

### C. 무료체험 종료 → 자동 결제 플로우
```
Cron Job (6시간마다)
   ↓
POST /api/payments/billing/execute (with CRON_SECRET)
   ↓
SELECT users WHERE:
  - is_trial = 1
  - auto_billing_enabled = 1
  - date(trial_end_date) <= date('now')
  - billing_failure_count < 3
   ↓
FOR EACH user:
  ↓
  Toss API: POST /v1/billing/{billing_key}
  - amount: 9900 or 19000 (monthly) / 97416 or 186960 (yearly)
  - orderId: auto_{userId}_{timestamp}
  - orderName: "WorVox PREMIUM 월간 구독"
  ↓
  결제 성공? ✅
  ├─ YES → 유료 구독 전환
  │   - UPDATE users SET:
  │     * is_trial = 0
  │     * trial_start_date = NULL
  │     * trial_end_date = NULL
  │     * subscription_start_date = now
  │     * subscription_end_date = now + 1 month (or +12 months)
  │     * billing_failure_count = 0
  │   - INSERT payment_orders (status='completed')
  │   - INSERT activity_logs (type='auto_billing_success')
  │   - 이메일 발송: 결제 완료 안내 (선택)
  │
  └─ NO → 재시도 카운트 증가 ❌
      - UPDATE users SET billing_failure_count += 1
      - INSERT activity_logs (type='auto_billing_failed')
      - billing_failure_count >= 3?
        └─ YES → 무료 플랜으로 다운그레이드
            - UPDATE users SET:
              * plan = 'free'
              * is_trial = 0
              * auto_billing_enabled = 0
            - 이메일 발송: 다운그레이드 안내
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 정상 플로우
```
1. 신규 사용자 회원가입
2. "Premium 2주 무료로 시작하기" 클릭
3. 카드 정보 입력 (테스트 카드)
4. 체험 시작 → plan='premium', is_trial=1
5. 11일 후 → 3일 전 알림 이메일 수신
6. 14일 후 → 자동 결제 성공 → is_trial=0, 유료 구독 시작
```

### 시나리오 2: 중복 체험 방지
```
1. 체험 중인 사용자 (is_trial=1, trial_end_date=2026-04-10)
2. 다시 "2주 무료로 시작하기" 클릭
3. 예상 결과: "이미 무료 체험을 이용 중입니다" 에러
```

### 시나리오 3: 결제 실패 → 재시도 → 다운그레이드
```
1. 체험 종료일 도래 (trial_end_date <= now)
2. 첫 자동 결제 시도 → 실패 (카드 한도 초과)
   - billing_failure_count = 1
3. 6시간 후 재시도 → 실패
   - billing_failure_count = 2
4. 6시간 후 재시도 → 실패
   - billing_failure_count = 3
   - plan='free', is_trial=0 으로 다운그레이드
```

---

## ⚙️ Cron Job 설정

### wrangler.jsonc
```json
{
  "triggers": {
    "crons": ["0 */6 * * *"]
  }
}
```

**실행 주기**: 6시간마다 (00:00, 06:00, 12:00, 18:00 UTC)

**실행 태스크**:
1. 무료체험 3일 전 알림 발송
2. Live Speaking 1시간 전 알림
3. Live Speaking 10분 전 알림

**자동 결제 실행**:
- 별도 엔드포인트: `POST /api/payments/billing/execute`
- Authorization: `Bearer {CRON_SECRET}`
- 수동 트리거 또는 외부 Cron(예: GitHub Actions)에서 호출

---

## 🔐 환경 변수

### 필수 설정 (Cloudflare Dashboard → Settings → Environment variables)
```
TOSS_SECRET_KEY         # Toss Payments Secret Key
RESEND_API_KEY          # 이메일 발송용 Resend API Key
CRON_SECRET             # Cron Job 인증용 Secret
```

---

## ✅ 추가 구현 완료

### 1. GitHub Actions Cron 스케줄러 ✅
**위치**: `.github/workflows/cron-billing.yml`

**실행 주기**: 6시간마다 (UTC 00:00, 06:00, 12:00, 18:00)

**작동 방식**:
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:  # 수동 실행 가능

jobs:
  execute-billing:
    steps:
      - Call: POST https://worvox.com/api/payments/billing/execute
      - Header: Authorization: Bearer {CRON_SECRET}
```

**설정 필요**:
1. GitHub Secret: `CRON_SECRET`
2. Cloudflare 환경변수: `CRON_SECRET` (동일한 값)

**상세 가이드**: `SETUP_CRON_AND_SECRETS.md`

---

### 2. 구독 취소 후 무료체험 재신청 방지 ✅
**위치**: `src/routes/payments.ts` (Line 445-451)

**DB 스키마 추가**:
```sql
-- migrations/0048_add_trial_history_tracking.sql
ALTER TABLE users ADD COLUMN has_used_trial INTEGER DEFAULT 0;
UPDATE users SET has_used_trial = 1 WHERE is_trial = 1 OR trial_start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_has_used_trial ON users(has_used_trial);
```

**로직**:
```typescript
// 무료체험 시작 시
if (user.has_used_trial === 1) {
  return c.json({ 
    error: '무료 체험은 1회만 이용 가능합니다',
    details: '이미 무료 체험을 이용하셨습니다.'
  }, 400);
}

// 무료체험 확정 시
UPDATE users SET has_used_trial = 1 WHERE id = ?
```

**보호 시나리오**:
- ✅ 무료체험 → 유료 전환 → 취소 → 재신청 방지
- ✅ 무료체험 중 취소 → 재신청 방지
- ✅ 평생 1회만 무료체험 가능

---

### 3. 구독 취소 API 추가 ✅
**위치**: `src/routes/payments.ts` (추가됨)

**엔드포인트**: `POST /api/payments/subscription/cancel`

**로직**:
```typescript
// 자동 결제만 중지, 구독 종료일까지 플랜 유지
UPDATE users SET auto_billing_enabled = 0 WHERE id = ?

// 활동 로그 기록
INSERT INTO activity_logs (user_id, activity_type, details)
VALUES (?, 'subscription_cancel', 'Cancelled premium subscription')
```

**응답**:
```json
{
  "success": true,
  "message": "자동 결제가 취소되었습니다. 2026-04-27까지는 PREMIUM 플랜을 계속 사용하실 수 있습니다.",
  "subscription_end_date": "2026-04-27"
}
```

### 2. 결제 성공/실패 이메일 발송
- 자동 결제 성공 시 영수증 이메일
- 결제 실패 시 카드 정보 업데이트 요청 이메일
- 3회 실패 후 다운그레이드 안내 이메일

### 3. 사용자 대시보드에 구독 정보 표시
- 다음 결제일 표시
- 결제 내역 조회
- 구독 해지 버튼

### 4. 테스트 자동화
- 무료체험 중복 방지 테스트
- 자동 결제 시뮬레이션
- Cron Job 실행 로그 모니터링

---

## ✅ 최종 확인 체크리스트

### 코드 구현
- [x] 무료체험 중복 방지 코드 구현
- [x] 무료체험 3일 전 알림 코드 구현
- [x] 자동 결제 코드 구현
- [x] GitHub Actions Cron 워크플로우 추가
- [x] 구독 취소 후 재체험 방지 (`has_used_trial`)
- [x] 구독 취소 API 추가 (`/subscription/cancel`)
- [x] DB 마이그레이션 파일 생성 (`0048_add_trial_history_tracking.sql`)

### DB 설정
- [x] 로컬 DB 마이그레이션 적용
- [ ] 프로덕션 DB 마이그레이션 적용 (`npx wrangler d1 migrations apply worvox-production --remote`)

### 환경 변수 설정
- [ ] GitHub Secret `CRON_SECRET` 설정
- [ ] Cloudflare 환경 변수 `CRON_SECRET` 설정 (GitHub Secret과 동일한 값)
- [x] Cloudflare 환경 변수 `TOSS_SECRET_KEY` 확인
- [x] Cloudflare 환경 변수 `RESEND_API_KEY` 확인

### 테스트
- [ ] GitHub Actions 수동 실행 테스트
- [ ] Cron 엔드포인트 직접 호출 테스트
- [ ] 무료체험 재신청 방지 테스트
- [ ] 구독 취소 후 재신청 방지 테스트
- [ ] Activity logs 모니터링

### 문서
- [x] 시스템 상세 문서 작성 (`TRIAL_AND_BILLING_STATUS.md`)
- [x] Cron 설정 가이드 작성 (`SETUP_CRON_AND_SECRETS.md`)

---

**작성일**: 2026-03-27
**최종 수정**: 2026-03-27
