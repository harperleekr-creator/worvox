# 🤖 AI 프롬프트 생성 설정 가이드

AI 프롬프트 생성 기능을 사용하려면 OpenAI API 키를 Cloudflare Pages에 설정해야 합니다.

## 📋 필요한 것

1. **OpenAI API 키** (또는 호환 가능한 API)
2. **Cloudflare Pages 접근 권한**

---

## 🔧 설정 방법

### **방법 1: Cloudflare Dashboard에서 설정 (추천)**

#### 1. Cloudflare Pages 대시보드 접속
```
https://dash.cloudflare.com/
→ Workers & Pages
→ worvox 프로젝트 선택
```

#### 2. Settings → Environment variables 이동

#### 3. Production 환경변수 추가

**변수 1: OPENAI_API_KEY**
- Name: `OPENAI_API_KEY`
- Value: `sk-...` (OpenAI API 키)
- Environment: `Production` ✅

**변수 2: OPENAI_API_BASE (선택사항)**
- Name: `OPENAI_API_BASE`
- Value: `https://api.openai.com/v1` (기본값)
- Environment: `Production` ✅

#### 4. Save 클릭

#### 5. 프로젝트 재배포
```bash
cd /home/user/webapp
npm run deploy:prod
```

---

### **방법 2: Wrangler CLI로 설정**

```bash
# Production 환경변수 설정
cd /home/user/webapp

# OPENAI_API_KEY 설정
npx wrangler pages secret put OPENAI_API_KEY --project-name worvox
# 프롬프트에서 API 키 입력

# OPENAI_API_BASE 설정 (선택사항)
npx wrangler pages secret put OPENAI_API_BASE --project-name worvox
# 프롬프트에서 URL 입력: https://api.openai.com/v1
```

---

## 🔑 OpenAI API 키 발급 방법

### **1. OpenAI 계정 생성**
https://platform.openai.com/signup

### **2. API 키 생성**
https://platform.openai.com/api-keys
→ "Create new secret key" 클릭
→ 이름 입력 (예: "worvox-production")
→ 생성된 키 복사 (한 번만 표시됨!)

### **3. 결제 정보 등록**
https://platform.openai.com/account/billing
→ 신용카드 등록
→ 최소 $5 충전 (사용량에 따라 과금)

---

## 💰 예상 비용

### **GPT-3.5-Turbo (추천)**
- 입력: $0.50 / 1M tokens
- 출력: $1.50 / 1M tokens
- **타이머 모드 1회**: 약 $0.0002 (₩0.27)
- **월 10,000회**: 약 $2 (₩2,700)

### **GPT-5-mini (현재 사용 중)**
- 입력: $0.075 / 1M tokens
- 출력: $0.30 / 1M tokens
- **타이머 모드 1회**: 약 $0.00003 (₩0.04)
- **월 10,000회**: 약 $0.30 (₩400)

---

## 🧪 테스트 방법

### **1. 로컬 테스트**
```bash
cd /home/user/webapp

# .dev.vars 파일 수정
cat > .dev.vars << EOF
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
EOF

# 재시작
npm run build
pm2 restart webapp

# 테스트
curl -X POST http://localhost:3000/api/ai-prompts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "timer",
    "level": "beginner",
    "userId": 1
  }'
```

### **2. 프로덕션 테스트**
1. worvox.com 접속
2. Premium 계정으로 로그인
3. 프로필 → AI 프롬프트 생성 ON
4. 타이머 모드 실행
5. "5초 챌린지" 클릭
6. 확인: "🤖 AI 프롬프트 생성 중..." → 새로운 문장 표시

---

## 🔍 문제 해결

### **에러: "OPENAI_API_KEY not configured"**
**원인**: 환경변수가 설정되지 않음

**해결**:
1. Cloudflare Dashboard에서 환경변수 확인
2. 변수 이름 정확히 확인: `OPENAI_API_KEY` (대소문자 구분)
3. Production 환경에 체크되어 있는지 확인
4. 재배포: `npm run deploy:prod`

---

### **에러: "401 Incorrect API key"**
**원인**: API 키가 잘못되었거나 만료됨

**해결**:
1. OpenAI Dashboard에서 새 API 키 생성
2. Cloudflare에서 환경변수 업데이트
3. 재배포

---

### **에러: "429 Rate limit exceeded"**
**원인**: OpenAI API 호출 제한 초과

**해결**:
1. OpenAI 계정 업그레이드 (Tier 1+)
2. 사용량 제한 확인
3. 결제 정보 확인

---

### **에러: "AI 프롬프트 생성에 실패했습니다"**
**원인**: 네트워크 오류 또는 API 문제

**해결**:
1. 브라우저 콘솔 확인 (F12)
2. 에러 로그 확인
3. 기본 문장 풀로 자동 폴백됨 (정상 동작)

---

## 📊 현재 상태

| 항목 | 로컬 | 프로덕션 |
|------|------|---------|
| AI 프롬프트 API | ⚠️ 키 필요 | ⚠️ 키 필요 |
| 타이머 모드 | ✅ 준비 완료 | ⚠️ 환경변수 설정 필요 |
| 시나리오 모드 | 🔄 개발 중 | 🔄 개발 중 |
| 시험 모드 | 🔄 개발 중 | 🔄 개발 중 |

---

## 📞 지원

문제가 계속되면:
1. GitHub Issues: https://github.com/harperleekr-creator/worvox/issues
2. 이메일: support@worvox.com

---

**마지막 업데이트**: 2026-03-01
