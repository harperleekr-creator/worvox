# GitHub Actions Cron & Secrets 설정 가이드

## 📋 개요

이 가이드는 WorVox의 자동 결제 및 알림 시스템을 위한 GitHub Actions Cron과 필요한 Secrets 설정 방법을 안내합니다.

---

## 🔐 Step 1: GitHub Secrets 설정

### 1.1 Repository Settings 이동
1. GitHub 저장소 페이지 열기
2. **Settings** 탭 클릭
3. 왼쪽 사이드바에서 **Secrets and variables** → **Actions** 클릭

### 1.2 CRON_SECRET 추가
1. **New repository secret** 클릭
2. 다음 정보 입력:
   - **Name**: `CRON_SECRET`
   - **Value**: `worvox-cron-2024-secure-key` (복잡한 값 권장)
3. **Add secret** 클릭

**⚠️ 중요**: 이 값은 Cloudflare 환경 변수의 `CRON_SECRET`과 **동일**해야 합니다!

---

## ⚙️ Step 2: Cloudflare 환경 변수 설정

### 2.1 Cloudflare Dashboard 이동
1. https://dash.cloudflare.com 접속
2. **Workers & Pages** 클릭
3. **worvox** 프로젝트 선택

### 2.2 환경 변수 추가
1. **Settings** 탭 클릭
2. **Environment variables** 섹션 찾기
3. **Add variable** 클릭 (또는 Edit variables)

### 2.3 CRON_SECRET 설정
Production 환경에 추가:
```
Variable name: CRON_SECRET
Value: worvox-cron-2024-secure-key
Environment: Production
```

**다시 한번 강조**: GitHub Secret과 **정확히 동일한 값**을 입력!

### 2.4 기타 필수 환경 변수 확인
다음 변수들이 이미 설정되어 있는지 확인:
```
TOSS_SECRET_KEY      # Toss Payments Secret Key
RESEND_API_KEY       # 이메일 발송용 Resend API Key
TOSS_CLIENT_KEY      # Toss Payments Client Key (public)
```

---

## 🗄️ Step 3: 프로덕션 DB 마이그레이션 적용

### 3.1 마이그레이션 파일 확인
새로 추가된 마이그레이션:
```
migrations/0048_add_trial_history_tracking.sql
```

**내용**:
- `has_used_trial` 필드 추가 (INTEGER DEFAULT 0)
- 기존 체험 사용자 플래그 업데이트
- 인덱스 생성

### 3.2 프로덕션 적용
```bash
# 로컬에서 실행 (권장)
cd /home/user/webapp
npx wrangler d1 migrations apply worvox-production --remote

# 또는 수동 SQL 실행
npx wrangler d1 execute worvox-production --remote --file=migrations/0048_add_trial_history_tracking.sql
```

**⚠️ 주의**: 프로덕션 DB 변경이므로 신중하게 진행!

### 3.3 적용 확인
```bash
npx wrangler d1 execute worvox-production --remote --command="SELECT id, email, has_used_trial FROM users WHERE is_trial=1 LIMIT 5"
```

예상 결과:
```
┌────┬──────────────────────┬────────────────┐
│ id │ email                │ has_used_trial │
├────┼──────────────────────┼────────────────┤
│ 26 │ support@worvox.com   │ 1              │
└────┴──────────────────────┴────────────────┘
```

---

## 🤖 Step 4: GitHub Actions Workflow 확인

### 4.1 Workflow 파일 위치
```
.github/workflows/cron-billing.yml
```

### 4.2 실행 스케줄
```yaml
schedule:
  - cron: '0 */6 * * *'  # 6시간마다 (UTC)
```

**UTC → KST 변환**:
- 00:00 UTC = 09:00 KST
- 06:00 UTC = 15:00 KST
- 12:00 UTC = 21:00 KST
- 18:00 UTC = 03:00 KST (다음날)

### 4.3 수동 실행 (테스트용)
1. GitHub 저장소 → **Actions** 탭
2. 왼쪽에서 **Scheduled Billing & Notifications** 선택
3. 오른쪽 **Run workflow** → **Run workflow** 클릭

### 4.4 실행 로그 확인
1. **Actions** 탭에서 최근 실행 클릭
2. **execute-billing** 잡 클릭
3. 로그 확인:
   ```
   🔔 Executing scheduled billing job...
   HTTP Status: 200
   Response: {"success":true,...}
   ✅ Billing job completed successfully
   ```

---

## 🧪 Step 5: 테스트

### 5.1 로컬 테스트 (개발 환경)
```bash
# 로컬 서버 실행
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs

# Cron 엔드포인트 직접 호출 (로컬)
curl -X POST "http://localhost:3000/api/payments/billing/execute" \
  -H "Authorization: Bearer worvox-cron-2024-secure-key" \
  -H "Content-Type: application/json"
```

### 5.2 프로덕션 테스트
```bash
# CRON_SECRET 값 확인 후 실행
curl -X POST "https://worvox.com/api/payments/billing/execute" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json"
```

**예상 응답**:
```json
{
  "success": true,
  "chargedUsers": 0,
  "results": []
}
```

### 5.3 GitHub Actions 수동 실행 테스트
1. GitHub → Actions → Scheduled Billing & Notifications
2. Run workflow
3. 로그 확인 → HTTP Status: 200

---

## 🎯 무료체험 재신청 방지 테스트

### 시나리오 1: 무료체험 완료 → 유료 전환 → 취소 → 재신청 시도
```
1. 사용자 A: 무료체험 시작 (has_used_trial=1)
   ↓
2. 14일 후: 자동 결제 성공 (is_trial=0, plan=premium)
   ↓
3. 사용자 A: 구독 취소 (auto_billing_enabled=0)
   ↓
4. 구독 종료일 도래: plan=free로 변경
   ↓
5. 사용자 A: 다시 "2주 무료로 시작하기" 클릭
   ↓
6. ❌ 예상 결과: "무료 체험은 1회만 이용 가능합니다" 에러
```

**DB 확인**:
```sql
SELECT id, email, plan, is_trial, has_used_trial, trial_end_date
FROM users 
WHERE email = 'test@example.com';
```

예상:
```
plan=free, is_trial=0, has_used_trial=1, trial_end_date=NULL
```

### 시나리오 2: 무료체험 중 취소 → 재신청 시도
```
1. 사용자 B: 무료체험 시작 (has_used_trial=1, trial_end_date=2026-04-10)
   ↓
2. 5일 후: 사용자가 체험 취소 (auto_billing_enabled=0)
   ↓
3. 체험 종료일 도래: plan=free로 변경
   ↓
4. 사용자 B: 다시 "2주 무료로 시작하기" 클릭
   ↓
5. ❌ 예상 결과: "무료 체험은 1회만 이용 가능합니다" 에러
```

---

## 📊 모니터링

### Activity Logs 확인
```sql
SELECT user_id, activity_type, details, created_at
FROM activity_logs
WHERE activity_type IN ('trial_start', 'trial_cancel', 'subscription_cancel', 'auto_billing_success', 'auto_billing_failed')
ORDER BY created_at DESC
LIMIT 20;
```

### 자동 결제 실행 결과 확인
```sql
-- 오늘 자동 결제된 사용자
SELECT u.id, u.email, u.plan, po.amount, po.created_at
FROM users u
JOIN payment_orders po ON u.id = po.user_id
WHERE po.status = 'completed'
  AND DATE(po.created_at) = DATE('now')
ORDER BY po.created_at DESC;
```

### 무료체험 사용 이력 확인
```sql
-- has_used_trial=1인 모든 사용자
SELECT id, email, plan, is_trial, has_used_trial, trial_start_date, trial_end_date
FROM users
WHERE has_used_trial = 1
ORDER BY trial_start_date DESC;
```

---

## 🚨 트러블슈팅

### 문제 1: GitHub Actions 실행 안 됨
**증상**: Cron이 정해진 시간에 실행되지 않음

**해결**:
1. GitHub → Actions 탭 → Enable workflows
2. Repository → Settings → Actions → General → Allow all actions

### 문제 2: HTTP 401 Unauthorized
**증상**: 
```
HTTP Status: 401
Response: {"error":"Unauthorized"}
```

**해결**:
1. GitHub Secret `CRON_SECRET` 값 확인
2. Cloudflare 환경 변수 `CRON_SECRET` 값 확인
3. 두 값이 **정확히 동일**한지 확인
4. Cloudflare에서 환경 변수 저장 후 **재배포 필요**

### 문제 3: has_used_trial 필드 없음
**증상**:
```
Error: no such column: has_used_trial
```

**해결**:
```bash
# 마이그레이션 재적용
npx wrangler d1 migrations apply worvox-production --remote
```

### 문제 4: 무료체험 중복 방지 안 됨
**증상**: 이미 체험한 사용자가 다시 체험 가능

**원인**: 기존 사용자의 `has_used_trial` 필드가 0으로 남아있음

**해결**:
```sql
-- 기존 체험 사용자 수동 업데이트
UPDATE users 
SET has_used_trial = 1 
WHERE is_trial = 1 OR trial_start_date IS NOT NULL;
```

---

## ✅ 체크리스트

배포 전 확인:
- [ ] GitHub Secret `CRON_SECRET` 설정 완료
- [ ] Cloudflare 환경 변수 `CRON_SECRET` 설정 완료 (동일한 값)
- [ ] Cloudflare 환경 변수 `TOSS_SECRET_KEY` 설정 확인
- [ ] Cloudflare 환경 변수 `RESEND_API_KEY` 설정 확인
- [ ] 프로덕션 DB 마이그레이션 적용 완료 (`0048_add_trial_history_tracking.sql`)
- [ ] GitHub에 코드 push 완료
- [ ] GitHub Actions workflow 활성화 확인
- [ ] 수동 실행으로 Cron 엔드포인트 테스트 완료
- [ ] Activity logs에서 실행 결과 확인 완료

---

## 📝 다음 단계

1. **프로덕션 배포**:
   ```bash
   git push origin main
   ```

2. **마이그레이션 적용**:
   ```bash
   npx wrangler d1 migrations apply worvox-production --remote
   ```

3. **GitHub Actions 수동 실행 테스트**

4. **첫 자동 실행 대기** (다음 6시간 주기)

5. **모니터링**:
   - Activity logs 확인
   - Payment orders 확인
   - GitHub Actions 실행 로그 확인

---

**작성일**: 2026-03-27  
**최종 수정**: 2026-03-27
