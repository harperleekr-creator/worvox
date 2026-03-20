# Live Speaking Notification System Setup Guide

## 📋 Overview
WorVox Live Speaking 전화영어 예약 시스템에 자동 알림 기능이 추가되었습니다.
- **이메일**: 예약 확인, 수업 완료 (Resend)
- **SMS/카카오 알림톡**: 예약 확인, 1시간 전, 10분 전 리마인더

---

## 🚀 Setup Steps

### Step 1: Resend API Key 설정 (이메일 발송)

1. **Resend 회원가입** https://resend.com
   - 무료: 월 3,000건
   - 유료: $20/월 (50,000건)

2. **API Key 발급**
   ```bash
   # Resend Dashboard → API Keys → Create API Key
   # 예시: re_123456789abcdefghijklmnop
   ```

3. **Cloudflare에 Secret 등록**
   ```bash
   npx wrangler pages secret put RESEND_API_KEY --project-name worvox
   # 발급받은 API Key 입력
   ```

4. **발신 이메일 도메인 인증**
   - Resend Dashboard → Domains → Add Domain
   - `worvox.com` 추가
   - DNS 레코드 추가:
     ```
     TXT _resend.worvox.com → [Resend 제공 값]
     CNAME resend._domainkey.worvox.com → [Resend 제공 값]
     ```

---

### Step 2: 카카오톡 알림톡 설정

#### Option A: 카카오톡 알림톡 (추천)

1. **카카오 비즈니스 계정 생성**
   - https://business.kakao.com
   - 사업자 인증 필요

2. **알림톡 채널 생성**
   - 카카오톡 채널 개설
   - 비즈니스 인증 완료

3. **알림톡 API 신청**
   - https://center-pf.kakao.com
   - API 사용 신청
   - 프로필 키 발급

4. **템플릿 등록**
   - 아래 템플릿들을 카카오에 등록 (심사 필요)
   
   **템플릿 1: 예약 완료 (학생)**
   ```
   [WorVox 전화영어 예약 완료]

   ✅ 예약이 완료되었습니다!

   📅 수업 일시: #{scheduledDate} #{scheduledTime}
   👨‍🏫 강사: #{teacherName}
   ⏱ 수업 시간: #{duration}분
   📞 학생 전화번호: #{studentPhone}

   💡 #{teacherName} 강사님께서 수업 시작 5분 전에 먼저 전화드립니다.

   감사합니다!
   WorVox
   ```

   **템플릿 2: 예약 완료 (강사)**
   ```
   [WorVox 새로운 수업 예약]

   📞 새로운 수업이 예약되었습니다!

   📅 수업 일시: #{scheduledDate} #{scheduledTime}
   👤 학생: #{studentName}
   📞 학생 전화번호: #{studentPhone}
   ⏱ 수업 시간: #{duration}분

   ⏰ 수업 시작 5분 전에 학생에게 먼저 전화해주세요.

   감사합니다!
   WorVox
   ```

   **템플릿 3: 1시간 전 리마인더**
   ```
   [WorVox 수업 1시간 전 알림]

   ⏰ 1시간 후 전화영어 수업이 있습니다!

   📅 #{scheduledTime}
   #{recipientInfo}
   📞 #{contactPhone}

   준비해주세요!
   ```

   **템플릿 4: 10분 전 리마인더**
   ```
   [WorVox 수업 10분 전 알림]

   🔔 10분 후 전화영어 시작!

   #{recipientInfo}
   📞 #{contactPhone}

   #{actionMessage}
   ```

5. **Cloudflare에 API Key 등록**
   ```bash
   npx wrangler pages secret put KAKAO_API_KEY --project-name worvox
   # 카카오 프로필 키 입력
   ```

#### Option B: 알리고 SMS (대안)

만약 카카오 알림톡 대신 일반 SMS를 사용하려면:

1. **알리고 회원가입** https://smartsms.aligo.in
   - 월 정액: 55,000원 (3,000건)
   - 건당: 10원/건

2. **API Key 발급**
   ```bash
   # 알리고 → API 키 발급
   # userid, key 확인
   ```

3. **Cloudflare Secret 등록**
   ```bash
   npx wrangler pages secret put ALIGO_USER_ID --project-name worvox
   npx wrangler pages secret put ALIGO_API_KEY --project-name worvox
   ```

4. **발신번호 등록**
   - 알리고 대시보드에서 발신번호 등록 (인증 필요)

---

### Step 3: Cloudflare Cron Job 설정

wrangler.jsonc에 Cron 스케줄 추가:

```jsonc
{
  "name": "worvox",
  "compatibility_date": "2026-02-10",
  "pages_build_output_dir": "./dist",
  
  // Cron triggers - runs every hour
  "triggers": {
    "crons": ["0 * * * *"]  // 매시간 0분에 실행
  },
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "worvox-production",
      "database_id": "your-database-id"
    }
  ]
}
```

---

## 📊 Notification Flow

### 예약 생성 시
```
Student → Booking → API
           ↓
    Send Email (학생 + 강사)
           ↓
    Send Kakao (학생 + 강사)
           ↓
    Log to Database
```

### 자동 리마인더
```
Cloudflare Cron (Every Hour)
           ↓
    Check sessions 55-65 min away → Send 1h reminder
           ↓
    Check sessions 8-12 min away → Send 10min reminder
           ↓
    Log to Database
```

### 수업 완료 시
```
Teacher → Complete → API
           ↓
    Deduct Credit
           ↓
    Send Email (학생만)
           ↓
    Log to Database
```

---

## 🧪 Testing

### Test Email (Resend 설정 후)
```bash
curl -X POST https://worvox.com/api/notifications/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "studentBookingConfirmed",
    "data": {
      "studentName": "홍길동",
      "scheduledDate": "2026-03-25 (수)",
      "scheduledTime": "15:00",
      "teacherName": "Sarah Kim",
      "duration": 30,
      "studentPhone": "010-1234-5678"
    },
    "to": "test@example.com"
  }'
```

### Test Kakao (카카오 설정 후)
```bash
curl -X POST https://worvox.com/api/notifications/send-kakao \
  -H "Content-Type: application/json" \
  -d '{
    "type": "studentBookingConfirmed",
    "data": {
      "scheduledDate": "2026-03-25 (수)",
      "scheduledTime": "15:00",
      "teacherName": "Sarah Kim",
      "duration": 30,
      "studentPhone": "010-1234-5678"
    },
    "to": "010-1234-5678"
  }'
```

### Check Notification Logs
```bash
# Get logs for a session
curl https://worvox.com/api/notifications/logs/123
```

---

## 💰 Cost Estimate

### Monthly Cost (학생 100명 기준)

| 항목 | 단가 | 월 사용량 | 월 비용 |
|------|------|----------|---------|
| Resend Email | 무료 | 500건 | 0원 |
| 카카오 알림톡 | 10원/건 | 500건 | 5,000원 |
| Cloudflare Cron | 무료 | 720회/월 | 0원 |
| **총계** | | | **5,000원** |

---

## 📱 Notification Types

| 알림 종류 | 시점 | 대상 | 채널 |
|----------|------|------|------|
| 예약 확인 | 즉시 | 학생 + 강사 | 이메일 + SMS |
| 1시간 전 | 1시간 전 | 학생 + 강사 | SMS만 |
| 10분 전 | 10분 전 | 학생 + 강사 | SMS만 |
| 수업 완료 | 완료 후 | 학생만 | 이메일만 |
| 예약 취소 | 즉시 | 학생 + 강사 | 이메일 + SMS |

---

## 🔧 Troubleshooting

### 이메일이 안 보내지는 경우
1. Resend API Key 확인
   ```bash
   npx wrangler pages secret list --project-name worvox
   ```
2. 도메인 인증 상태 확인 (Resend Dashboard)
3. 발신 이메일 주소 확인 (`noreply@worvox.com`)

### SMS/알림톡이 안 보내지는 경우
1. 카카오 API Key 확인
2. 템플릿 승인 상태 확인
3. 발신번호 등록 확인
4. 로그 확인: `/api/notifications/logs/:sessionId`

### Cron Job이 실행 안 되는 경우
1. wrangler.jsonc의 triggers.crons 확인
2. Cloudflare Dashboard → Workers & Pages → worvox → Settings → Triggers 확인
3. Scheduled 함수 export 확인

---

## 📝 Next Steps

1. ✅ Resend API Key 설정
2. ✅ 도메인 인증 완료
3. ⏳ 카카오 비즈니스 계정 생성
4. ⏳ 알림톡 템플릿 등록 및 심사
5. ⏳ 카카오 API Key 설정
6. ⏳ 실제 예약으로 테스트

---

## 🎉 Complete!

모든 설정이 완료되면 예약 시 자동으로:
- ✅ 예약 확인 이메일 발송
- ✅ 예약 확인 SMS 발송
- ✅ 1시간 전 SMS 리마인더
- ✅ 10분 전 SMS 리마인더
- ✅ 수업 완료 이메일 발송

Questions? Contact: dev@worvox.com
