# ⚠️ Cloudflare Pages 환경변수 설정 긴급 가이드

## 🔴 문제 확인됨!

콘솔 로그:
```
Generating AI prompt for level: beginner
Failed to load resource: 500 error
AI prompt generation failed
```

→ **OPENAI_API_KEY가 Worker에 바인딩되지 않았습니다!**

---

## ✅ 해결 방법: Cloudflare Dashboard에서 설정

### 1단계: Cloudflare Dashboard 접속

```
https://dash.cloudflare.com/a7d1ec9446dbf6873cb50fee7e313c19/pages/view/worvox
```

또는:
```
https://dash.cloudflare.com/
→ Workers & Pages
→ worvox 클릭
```

---

### 2단계: Settings → Environment variables

왼쪽 메뉴에서:
```
Settings → Environment variables
```

---

### 3단계: Production 환경변수 추가

#### **변수 1: OPENAI_API_KEY**

1. **"Add variable"** 버튼 클릭
2. 입력:
   - **Variable name**: `OPENAI_API_KEY`
   - **Value**: `[여기에 OpenAI API 키]`
   - **Environment**: 
     - ✅ **Production** (체크)
     - ⬜ Preview (선택사항)
3. **"Save"** 클릭

#### **변수 2: OPENAI_API_BASE**

1. **"Add variable"** 버튼 클릭
2. 입력:
   - **Variable name**: `OPENAI_API_BASE`
   - **Value**: `https://api.openai.com/v1`
   - **Environment**: 
     - ✅ **Production** (체크)
     - ⬜ Preview (선택사항)
3. **"Save"** 클릭

---

### 4단계: Redeploy (중요!)

환경변수를 추가한 후 **반드시 재배포**해야 합니다:

#### **방법 A: Cloudflare Dashboard에서**
```
Deployments 탭 → 최신 배포 → "⋮" 메뉴 → "Retry deployment"
```

#### **방법 B: 로컬에서**
```bash
cd /home/user/webapp
npm run deploy:prod
```

---

## 🔑 OpenAI API 키 발급 (필요시)

### 1. OpenAI 가입
https://platform.openai.com/signup

### 2. API 키 생성
https://platform.openai.com/api-keys
- "Create new secret key" 클릭
- 이름: `worvox-production`
- **키 복사** (⚠️ 한 번만 표시됨!)

### 3. 결제 설정
https://platform.openai.com/account/billing
- 신용카드 등록
- 최소 $5 충전

---

## ⚠️ 주의사항

### **Secrets vs Environment Variables**

| 방법 | 작동 여부 | 설명 |
|------|---------|------|
| `wrangler pages secret put` | ❌ 작동 안 함 | Pages Functions에서 접근 불가 |
| Dashboard → Environment variables | ✅ 작동함 | Worker에 바인딩됨 |

→ **반드시 Dashboard에서 Environment variables로 추가하세요!**

---

## 🧪 테스트

환경변수 설정 및 재배포 후:

1. **worvox.com 접속**
2. **새로고침 (Ctrl+Shift+R)**
3. **타이머 모드 실행**
4. **브라우저 콘솔(F12) 확인**

### 성공 로그:
```
🤖 Generating AI prompt for level: beginner
🔍 Environment check: {
  hasApiKey: true,  ✅
  apiKeyLength: 51,
  ...
}
🔧 Initializing OpenAI client: {
  hasApiKey: true,  ✅
  apiKeyPrefix: "sk-proj-...",
  baseURL: "https://api.openai.com/v1"
}
🤖 AI Response: {success: true, ...}
✅ Using AI-generated prompt: "I like coffee."
```

---

## 📞 여전히 안 되면?

1. **스크린샷 공유**: Dashboard의 Environment variables 설정 화면
2. **콘솔 로그 공유**: 전체 에러 메시지
3. **확인**: 
   - Environment variables에 **Production** 체크 되어 있는지
   - 재배포 했는지
   - 새로고침 (캐시 클리어) 했는지

---

**🚨 지금 바로 Cloudflare Dashboard에서 Environment variables를 설정하세요!**

링크: https://dash.cloudflare.com/a7d1ec9446dbf6873cb50fee7e313c19/pages/view/worvox/settings/environment-variables
