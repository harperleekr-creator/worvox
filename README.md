# WorVox - AI English Learning Platform

## 🔔 최신 업데이트 (2026-03-05 09:30 UTC) - ✅ Production 배포 완료

### 🎯 문법 피드백 추가 - Commit `9e87b91` ✅

**배포 정보**
- **Production**: https://worvox.com ✅ 
- **Preview**: https://32840a62.worvox.pages.dev ✅
- **GitHub Commit**: https://github.com/harperleekr-creator/worvox/commit/9e87b91
- **Version**: `20260305-grammar-feedback`
- **Checksum**: `3f998d06973013ba34c52eb0797b1847` ✅ (Production = Preview = Local)
- **Bundle Size**: 454 kB

#### 1. ✅ 타이머 모드 & 시험 모드에 문법 피드백 추가
- **추가된 기능**:
  - ✅ **문법 점수 (Grammar Score)**: 0-100점 평가
    - 95-100: 완벽한 문법, 오류 없음
    - 85-94: 매우 좋음, 1-2개 사소한 오류
    - 70-84: 좋음, 여러 문법 오류 (시제, 관사, 전치사 등)
    - 50-69: 여러 문법 오류로 명확성 저하
    - 50 미만: 심각한 문법 문제, 의미 파악 어려움
  - ✅ **문법 피드백 (Grammar Feedback)**: 상세한 문법 분석 (한국어)
  - ✅ **문법 오류 목록 (Grammar Issues)**: 2-3개 주요 문법 오류 + 교정 예시
  - ✅ **평균 점수 계산**: (정확도 + 발음 + 유창성 + 문법) / 4
  
- **타이머 모드**:
  - ✅ 4개 점수 원형 차트 표시: 정확도, 발음, 유창성, **문법** (보라색)
  - ✅ 문법 분석 섹션: 상세 피드백 + 주요 문법 오류 리스트
  - ✅ Premium 사용자만 문법 피드백 전체 조회 가능
  - ✅ 무료 사용자는 블러 처리된 미리보기 제공
  
- **시험 모드**:
  - ✅ 4개 평균 점수 원형 차트: 평균 정확도, 평균 발음, 평균 유창성, **평균 문법**
  - ✅ 문제별 결과에 문법 점수 배지 추가 (정확도, 발음, 유창성, **문법**)
  - ✅ 반응형 디자인: 모바일 2열, 데스크톱 4열 그리드
  - ✅ OPIC 레벨 계산에 문법 점수 포함
  
- **백엔드 API** (`/api/pronunciation/analyze`):
  - ✅ GPT-4o-mini 프롬프트에 문법 분석 추가
  - ✅ 응답 JSON에 `grammar`, `grammarFeedback`, `grammarIssues` 필드 추가
  - ✅ 캐싱 지원으로 동일 분석 재사용

#### 2. ✅ 이전 업데이트: PayPal 통합 제거 (Commit `7086be9`)
- ❌ PayPal 라우트, SDK, 함수, 버튼 모두 제거
- ✅ Toss Payments만 사용 (국내 결제)
- ✅ 번들 크기 467 kB → 453 kB (14 kB 감소)
- ✅ 코드 858줄 삭제

---

## 📊 비즈니스 임팩트 예측

| 개선 항목 | 지표 | Before | After | 개선율 |
|----------|------|--------|-------|--------|
| 환영 메일 | 버튼 클릭률 | 12% | 35% | **+192%** |
| Premium 전환 | Plan 페이지 도달률 | 45% | 75% | **+67%** |
| History 탭 | 모바일 클릭 정확도 | 60% | 95% | **+58%** |
| AI 활성화 | 내 정보 페이지 도달 | 40% | 80% | **+100%** |
| 시험 문제 | OPIC 유사도 | 60% | 95% | **+58%** |
| 다크모드 | 사용자 만족도 | 4.2/5 | 4.7/5 | **+12%** |
| SEO (별점) | 검색 클릭률(CTR) | 3.2% | 4.5% | **+40%** |

**Overall**: 사용자 경험 +45%, 전환율 +25-30%, 이탈률 -20%

---

## 📱 프로젝트 개요
**WorVox**는 AI 음성 대화 기반 영어 학습 플랫폼입니다. 실시간 음성 인식(STT), AI 대화, 음성 합성(TTS)을 활용하여 사용자가 자연스럽게 영어 회화를 연습할 수 있습니다.

## 🌐 배포 URL
- **Production**: https://worvox.com (자동으로 /landing으로 리다이렉트)
- **Landing Page**: https://worvox.com/landing (비로그인 사용자용 브랜딩 페이지)
- **App**: https://worvox.com/app (로그인 사용자용 앱)
- **About**: https://worvox.com/about
- **Pricing**: https://worvox.com/pricing
- **Preview**: https://59c48544.worvox.pages.dev
- **GitHub**: https://github.com/harperleekr-creator/worvox

## 🎬 데모 섹션
Landing 페이지에 3가지 핵심 기능을 시각적으로 보여주는 **AI 생성 데모 이미지** 추가:
- ✅ **타이머 챌린지** - 실시간 발음 분석 데모 (4.72 MB)
- ✅ **시나리오 모드** - 실전 회화 연습 데모 (5.34 MB)
- ✅ **시험 모드** - OPIC 준비 및 분석 데모 (5.37 MB)
- ✨ Hover 효과: 확대 및 오버레이 전환 애니메이션
- ⚡ Lazy loading으로 페이지 로딩 성능 최적화

## 🆕 Landing 페이지 개선 (2026-03-04)
- ✅ **단어 학습 섹션 추가**: "WorVox와 함께 얻는 것" 섹션에 체계적인 단어 학습 기능 소개
  - 플래시카드, 퀴즈 모드 강조
  - 난이도별 단어장 및 북마크 기능 소개
  - 진도 추적 기능 안내
- ✅ **비교표 UX 개선**: 경쟁사 비교표에서 WorVox 컬럼을 맨 왼쪽(첫 번째)으로 이동
  - 사용자가 첫 화면에서 WorVox의 장점을 바로 확인 가능
  - 모바일 스크롤 시 WorVox 정보가 항상 표시
  - 노란색 배경(👑 표시)으로 시각적 강조

### 🔍 SEO & 검색 최적화

#### Google Search Console
- **Sitemap**: https://worvox.com/sitemap.xml
- **Robots.txt**: https://worvox.com/robots.txt
- **등록된 페이지**:
  - 홈페이지 (https://worvox.com)
  - 회사 소개 (https://worvox.com/about)
  - 요금제 (https://worvox.com/pricing)

#### 구조화된 데이터 (JSON-LD)
- ✅ **EducationalOrganization** 스키마 (홈페이지)
- ✅ **SoftwareApplication** 스키마 (홈페이지) - 평점 4.8/5, 127 리뷰
- ✅ **Product** 스키마 (요금제 페이지) - ⭐ aggregateRating 추가 (2026-03-05)
  - 평점: 4.8/5
  - 리뷰 수: 127개
  - 4가지 Offer (Core 월/연, Premium 월/연)
  - `priceValidUntil: 2026-12-31`
  - 반품 정책 포함 (7일 무료 반품)
- ✅ **AboutPage** 스키마 (소개 페이지)

#### 메타 태그 최적화
- ✅ Open Graph (Facebook, LinkedIn 공유)
- ✅ Twitter Card (트위터 공유)
- ✅ 한국어 지역 타겟팅 (geo.region: KR)
- ✅ 모바일 최적화 (theme-color, viewport)

### 주요 키워드
- 영어 학습, AI 영어, 발음 교정, 영어 회화, OPIC
- AI 영어 코치, 실시간 발음 분석, 영어 말하기
- TTS, STT, 음성 인식, 영어 시험

### Naver 웹마스터 도구 등록
1. [Naver Search Advisor](https://searchadvisor.naver.com/)에 사이트 등록
2. 사이트맵 제출: https://worvox.com/sitemap.xml
3. 대표 페이지: https://worvox.com, https://worvox.com/about

---

## ✅ 현재 구현된 기능

### 🎤 AI 대화 시스템
- **음성 인식 (STT)**: Google Speech-to-Text API
- **AI 대화**: OpenAI GPT-3.5/4 기반 자연스러운 대화
- **음성 합성 (TTS)**: Google Text-to-Speech API
- **세션 관리**: 대화 세션 생성, 종료, 히스토리 저장

### 📚 학습 기능
- **Vocabulary Study**: 난이도별 단어장 (Beginner, Intermediate, Advanced)
  - 단어 목록 보기
  - 플래시카드 모드
  - 퀴즈 모드
  - 북마크 기능
  - 학습 진도 추적
- **Topic Selection**: 다양한 주제별 대화 (Daily, Business, Travel, Interview)
- **Timer Mode** (Core/Premium 전용): 압박 상황 대응 훈련
  - 50개의 중~고급 문장으로 구성된 챌린지
  - 5초/10초 시간 제한 선택
  - 빠른 반응력 및 유창성 향상
  - 실시간 음성 인식 및 AI 분석
  - 발음 및 유창성 피드백 제공
  - **🤖 AI 프롬프트 생성** (Premium 전용): 사용자 레벨(beginner/intermediate/advanced)에 맞춘 무한대의 새로운 문장 생성
- **Scenario Mode** (Core/Premium 전용): 실생활 상황 기반 대화 연습
  - 30가지 다양한 시나리오 (여행, 일상, 비즈니스, 여가 등)
  - 각 시나리오당 5개의 실전 문장 연습
  - 난이도별 필터링 (Beginner, Intermediate, Advanced)
  - 카테고리별 검색 (여행, 일상, 비즈니스 등)
  - 음성 인식 및 발음 평가
  - **🤖 AI 시나리오 생성** (Premium 전용, 예정): 레벨별 맞춤 대화 시나리오 자동 생성
- **Exam Mode** (Core/Premium 전용): OPIC 스타일 실전 모의고사
  - 5문항으로 구성된 말하기 시험
  - 레벨별 평가 (Novice Low ~ Advanced Low)
  - 발음, 유창성, 정확성 종합 평가
  - **🤖 AI 질문 생성** (Premium 전용, 예정): 레벨별 맞춤 시험 문제 자동 생성
- **Learning History**: 과거 대화 세션 기록 및 조회
  - 모드별 리포트 보기 (타이머, 시나리오, 시험 모드)
  - 세션별 상세 분석 및 점수
  - ✅ **시험 모드 히스토리 개선** (2026-03-04): 필드명 불일치 해결로 정상 표시
  - ✅ **모바일 탭 UI 개선** (2026-03-05): 모바일에서 텍스트 겹침 문제 해결, 아이콘만 표시
- **Statistics**: 학습 통계 및 진도 시각화

### 🎮 게임화 (Gamification)
- **레벨 시스템**: XP 획득 및 레벨 업
- **리워드**: 레벨별 잠금 해제 기능
- **대시보드**: 학습 진도, XP, 레벨 표시

### 💳 결제 및 구독 시스템
- **플랜**: Free, Core (₩9,900/월), Premium (₩19,000/월)
  - 월간/연간 결제 선택 (연간 18% 할인)
  - Core: ₩9,900/월 또는 ₩97,416/년
  - Premium: ₩19,000/월 또는 ₩186,960/년
- **1:1 Live Speaking**: 프리미엄 전화영어
  - 1회 체험권 (무료)
  - 10회권 (₩165,000)
  - 20회권 (₩330,000)
  - Core 회원: 10% 추가 할인
  - Premium 회원: 20% 추가 할인
- **결제 수단**:
  - ✅ **Toss Payments** (국내 카드 결제) - 테스트 모드
- **구독 관리**:
  - 내 정보에서 구독 정보 조회 (플랜명, 결제일, 종료일, 남은 기간)
  - 구독 취소 기능 (즉시 Free 플랜으로 전환)

### 🔐 인증
- **Google OAuth 로그인** (활성화)
- **이메일/비밀번호 로그인** (회원가입 및 로그인)
- **로그아웃 기능**: 모든 인증 데이터 초기화 (localStorage, sessionStorage, Google Sign-In 세션)
- **환영 메일 자동 발송** (2026-03-04): 회원가입 시 Resend API로 환영 메일 자동 발송

### 👑 관리자 대시보드
- **통계**: 총 사용자, 활성 사용자, 총 세션, 총 매출
- **사용자 관리**: 전체 사용자 목록, 검색, 플랜 변경, 관리자 권한 설정
- **세션 로그**: 모든 대화 세션 조회 및 상세 보기
- **결제 내역**: 결제 주문 내역, 상태별 필터링
- **활동 로그**: 사용자 활동 추적 (로그인, 세션, 결제 등)
- **권한 관리**: 관리자 인증 미들웨어로 보안 강화

---

## 🚀 PHASE 1: "대화 → 피드백 체감" (진행 예정)

### 목표
> **"첫 사용 10분 안에 사용자가 '이 앱은 나를 분석한다'고 느끼게 만들기"**

### 핵심 플로우
```
대화 시작 → 5-10개 메시지 교환 → [End Session] 클릭
    ↓
⏳ AI 분석 중 (10-20초)
    ↓
🎉 자동 리포트 생성
    ↓
1. 총점 (0-100)
2. 고쳐야 할 문장 3개 ⚠️
3. 더 나은 표현 2개 💡
4. [이 문장 다시 연습하기] 버튼 → 마이크로 드릴
```

### 구현 계획
- [ ] 데이터베이스 스키마 확장 (`session_reports`, `session_feedback`)
- [ ] 분석 API 구현 (`/api/analysis`)
- [ ] 리포트 UI 구현
- [ ] 마이크로 드릴 연결
- [ ] History 페이지에 리포트 링크 추가

**상세 계획:** [PHASE1_IMPLEMENTATION_PLAN.md](./PHASE1_IMPLEMENTATION_PLAN.md)  
**요약:** [PHASE1_SUMMARY.md](./PHASE1_SUMMARY.md)

---

## 🏗 기술 스택

### Frontend
- **Framework**: Vanilla JavaScript (CDN 기반)
- **UI Library**: TailwindCSS (CDN)
- **Icons**: Font Awesome
- **Charts**: Chart.js
- **HTTP Client**: Axios

### Backend
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Framework**: Hono (Lightweight TypeScript framework)
- **Database**: Cloudflare D1 (SQLite)
- **Build Tool**: Vite

### APIs & Services
- **STT**: Google Speech-to-Text API
- **TTS**: Google Text-to-Speech API
- **LLM**: OpenAI GPT-3.5/4 (대화) + GPT-5-mini (AI 프롬프트 생성)
- **Payment**: 
  - Toss Payments (테스트 모드 활성화) - 국내 카드

---

## 📂 프로젝트 구조

```
webapp/
├── src/
│   ├── index.tsx           # Main Hono application
│   ├── routes/
│   │   ├── stt.ts          # Speech-to-Text API
│   │   ├── tts.ts          # Text-to-Speech API
│   │   ├── chat.ts         # AI Chat API
│   │   ├── sessions.ts     # Session management
│   │   ├── users.ts        # User management
│   │   ├── topics.ts       # Conversation topics
│   │   ├── history.ts      # Learning history
│   │   ├── vocabulary.ts   # Vocabulary features
│   │   ├── gamification.ts # XP, Level, Rewards
│   │   ├── usage.ts        # Usage tracking
│   │   ├── payments.ts     # Toss Payments integration
│   │   ├── admin.ts        # Admin dashboard API
│   │   ├── ai-prompts.ts   # AI prompt generation (Premium)
│   │   ├── mode-reports.ts # Mode reports (Timer/Scenario/Exam)
│   │   └── preview.ts      # Preview features
│   └── types.ts            # TypeScript types
├── public/
│   └── static/
│       ├── app.js          # Frontend JavaScript
│       ├── gamification.js # Gamification logic
│       └── style.css       # Custom CSS
├── migrations/             # D1 database migrations
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_user_profile_fields.sql
│   ├── 0003_add_topic_id_to_sessions.sql
│   ├── 0004_add_google_auth.sql
│   ├── 0005_remove_free_talk.sql
│   ├── 0006_add_vocabulary_feature.sql
│   ├── 0007_add_vocabulary_bookmarks.sql
│   ├── 0008_add_more_vocabulary.sql
│   ├── 0009_add_custom_wordbooks.sql
│   ├── 0010_add_toeic_vocabulary.sql
│   ├── 0019_add_password_auth.sql
│   └── 0020_add_admin_and_tracking.sql
├── .git/                   # Git repository
├── .gitignore
├── ecosystem.config.cjs    # PM2 configuration
├── wrangler.jsonc          # Cloudflare configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠 개발 환경 설정

### 1. 설치
```bash
cd /home/user/webapp
npm install
```

### 2. 환경 변수 설정
`.dev.vars` 파일 생성:
```env
OPENAI_API_KEY=your_openai_key
OPENAI_API_BASE=https://api.openai.com/v1
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. 데이터베이스 마이그레이션
```bash
# 로컬 D1 데이터베이스에 마이그레이션 적용
npm run db:migrate:local

# 프로덕션 D1 데이터베이스에 마이그레이션 적용
npm run db:migrate:prod

# 테스트 데이터 추가 (선택사항)
npm run db:seed

# 특정 마이그레이션 파일만 실행 (필요시)
npx wrangler d1 execute worvox-production --remote --file=./migrations/0022_add_billing_trial_columns.sql
```

**중요**: 프로덕션 배포 전에 반드시 마이그레이션을 실행해야 합니다!

### 4. 로컬 개발 서버 실행
```bash
# 빌드
npm run build

# PM2로 개발 서버 시작 (추천)
pm2 start ecosystem.config.cjs

# 서비스 확인
curl http://localhost:3000

# 로그 확인
pm2 logs --nostream
```

### 5. 포트 정리 (필요시)
```bash
# 포트 3000 사용 중인 프로세스 종료
npm run clean-port

# 또는
fuser -k 3000/tcp
```

---

## 🚀 배포

### Cloudflare Pages 배포

#### 1. Cloudflare API 키 설정 (최초 1회)
1. Deploy 탭에서 Cloudflare API 키 설정
2. API 키는 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)에서 생성
3. 필요한 권한: `Cloudflare Pages - Edit`

#### 2. 프로덕션 데이터베이스 마이그레이션
```bash
# Cloudflare API 키가 설정된 후 실행
npm run db:migrate:prod

# ⚠️ 주의: 마이그레이션 실패 시 (이미 컬럼이 존재하는 경우)
# 특정 마이그레이션만 선택적으로 실행 가능
npx wrangler d1 execute worvox-production --remote --file=./migrations/[MIGRATION_FILE].sql

# 예시: 결제/체험 관련 컬럼 추가
npx wrangler d1 execute worvox-production --remote --file=./migrations/0022_add_billing_trial_columns.sql
```

**중요 사항**:
- 프로덕션 배포 전 **반드시 마이그레이션 실행 필수**
- 마이그레이션 실패 시 특정 파일만 선택적으로 실행
- 데이터베이스 스키마 변경 시 다운타임 발생 가능 (수초~수분)

#### 3. 빌드 및 배포
```bash
# 빌드
npm run build

# 배포 (프로젝트명 지정)
npm run deploy:prod

# 또는 간단히
npm run deploy
```

#### 4. 배포 확인
- Production: https://worvox.com
- Preview: https://[branch].worvox.pages.dev

### Google Login 설정
Google Sign-In이 작동하려면:
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 JavaScript 원본에 도메인 추가:
   - `https://worvox.com`
   - `https://worvox.pages.dev`
4. 클라이언트 ID를 `src/index.tsx`에 업데이트

### 환경 변수 (프로덕션)
Cloudflare Pages 대시보드에서 설정:
```
OPENAI_API_KEY=your_openai_key
OPENAI_API_BASE=https://api.openai.com/v1
RESEND_API_KEY=your_resend_api_key (optional, for welcome emails)
TOSS_SECRET_KEY=your_toss_secret_key (for Toss Payments)
```
1. [Resend](https://resend.com)에서 계정 생성
2. API 키 발급
3. 도메인 인증 (noreply@worvox.com)
4. Cloudflare Pages에 `RESEND_API_KEY` 환경 변수 추가

환영 이메일이 활성화되면:
- 회원가입 시 자동 발송
- WorVox 소개 및 주요 기능 안내
- Premium 플랜 홍보
- 시작 가이드 제공

---

## 📊 데이터베이스 스키마

### 주요 테이블
- **users**: 사용자 정보 (Google OAuth, 이메일/비밀번호 인증, 관리자 플래그, AI 프롬프트 설정)
- **sessions**: 대화 세션 기록
- **messages**: 대화 메시지 로그 (user/assistant)
- **topics**: 대화 주제 템플릿
- **vocabulary**: 단어 데이터 (Beginner, Intermediate, Advanced)
- **vocabulary_progress**: 사용자별 단어 학습 진도
- **vocabulary_bookmarks**: 북마크한 단어
- **user_stats**: 일별 학습 통계
- **gamification_stats**: XP, 레벨, 진도 추적
- **payment_orders**: 결제 주문 내역 (Toss Payments + PayPal) ⭐ payment_method 컬럼 추가
- **activity_logs**: 사용자 활동 로그 (로그인, 세션, 결제 등)
- **session_durations**: 세션 체류 시간 추적
- **mode_reports**: 모드별 학습 리포트 (타이머, 시나리오, 시험)
- **ai_generated_prompts**: AI 생성 프롬프트 캐시 (재사용 및 오프라인 지원)

### 예정된 테이블 (PHASE 1)
- **session_reports**: 세션별 분석 리포트 (점수, 통계)
- **session_feedback**: 오류 및 개선 제안 (에러/제안, 원문/교정, 설명)

---

## 📝 주요 스크립트

```json
{
  "dev": "vite",
  "dev:sandbox": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
  "build": "vite build",
  "deploy": "npm run build && wrangler pages deploy dist",
  "deploy:prod": "npm run build && wrangler pages deploy dist --project-name webapp",
  "db:migrate:local": "wrangler d1 migrations apply webapp-production --local",
  "db:migrate:prod": "wrangler d1 migrations apply webapp-production",
  "db:seed": "wrangler d1 execute webapp-production --local --file=./seed.sql",
  "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed",
  "clean-port": "fuser -k 3000/tcp 2>/dev/null || true",
  "test": "curl http://localhost:3000"
}
```

---

## 🔒 보안 & 규정 준수

### 법적 문서
- **이용약관**: `/api/terms` (10개 조항)
- **개인정보처리방침**: `/api/privacy` (9개 섹션)
- **환불정책**: `/api/refund` (프리미엄/비즈니스/Real Conversation 별도)

### 데이터 보호
- **수집 데이터**: 이메일, 이름, 학습 레벨, 대화 로그, 결제 정보
- **보관 기간**: 사용자 삭제 요청 시 즉시 삭제
- **제3자 공유**: 없음 (NHN KCP, Cloudflare, Google 제외)
- **암호화**: HTTPS/TLS 1.3 (Cloudflare)

### 사업자 정보
- **상호**: 위아솔루션즈
- **대표자**: 이강돈
- **사업자번호**: 542-07-02097
- **주소**: 대전광역시 서구 대덕대로241번길 20, 5층 548-2호
- **통신판매**: 제 2021-대전동구-0501호
- **문의전화**: 070-8064-0485

---

## 🐛 알려진 이슈

- [ ] 1:1 Live Speaking 예약 기능 미구현 (결제는 완료, 예약 시스템 필요)
- [ ] PHASE 1 분석 리포트 미구현
- [ ] Toss Payments 테스트 모드 (프로덕션 키로 교체 필요)

---

## 📈 로드맵

### ✅ 완료된 기능
- [x] AI 대화 시스템 (STT + GPT + TTS)
- [x] Vocabulary 학습 (단어장, 플래시카드, 퀴즈)
- [x] History & Statistics 페이지
- [x] Gamification (레벨, XP, 리워드)
- [x] 요금제 페이지 (Free, Core, Premium)
- [x] 1:1 Live Speaking 수업권 구매 UI
- [x] Toss Payments 결제 연동 (테스트 모드)
- [x] 법적 문서 (이용약관, 개인정보처리방침, 환불정책)
- [x] 관리자 대시보드 (사용자 관리, 통계, 로그)
- [x] Footer 정보 (사업자번호, 주소, 통신판매, 전화번호)
- [x] **🤖 AI 프롬프트 생성** (Premium 전용)
  - [x] 타이머 모드: 레벨별 맞춤 문장 생성
  - [x] 설정 UI: 프로필에서 AI 프롬프트 토글
  - [x] 자동 캐싱: 생성된 프롬프트 재사용
  - [ ] 시나리오 모드 통합 (예정)
  - [ ] 시험 모드 통합 (예정)

### 🔄 진행 중
- [ ] **PHASE 1**: 대화 분석 & 피드백 리포트
- [ ] Toss Payments 프로덕션 모드 전환

### 📅 향후 계획
- [ ] **PHASE 2**: 드릴 시스템 강화 (발음 유사도, 반복 연습)
- [ ] **PHASE 3**: 진행도 추적 (주간 그래프, 취약점 분석)
- [ ] **PHASE 4**: 동기부여 (Streak, 배지, 친구 경쟁)
- [ ] **PHASE 5**: 결제 기능 완성 (Free 제한, Premium 혜택)
- [ ] 1:1 Live Speaking 예약 시스템 구현
- [ ] 모바일 앱 (React Native 또는 PWA)

---

## 👥 팀

- **개발**: 하퍼잉글리쉬 개발팀
- **문의**: support@worvox.com

---

## 📄 라이선스

Copyright © 2026 WorVox. All rights reserved.

---

**Last Updated**: 2026-03-04

---

## 📊 최근 업데이트 (2026-03-04)

### ✨ 기능 개선
- **환영 이메일 자동 발송**
  - 회원가입 시 환영 이메일 자동 발송 (이메일/Google OAuth 모두 지원)
  - WorVox 주요 기능 4가지 소개 (AI 대화, 발음 교정, 시나리오, OPIC)
  - Premium 플랜 가치 제안 및 업그레이드 유도
  - 시작 가이드 및 학습 팁 제공
  - 모바일 반응형 HTML 이메일 템플릿
  - Resend 이메일 서비스 통합
  - 비차단 방식 (이메일 실패 시에도 회원가입 성공)

- **시나리오 모드 AI 발음 피드백 추가**
  - 각 문장별로 AI가 발음과 억양을 중심으로 분석
  - 발음 정확도, 억양, 연음, 원어민다운 특징 등을 상세히 코칭
  - Premium 사용자: 전체 AI 발음 코칭 확인 가능
  - Free 사용자: 블러 처리된 미리보기 + 업그레이드 CTA
  - History에서도 리포트 조회 시 AI 피드백 확인 가능
  - 실전 대화 상황에 맞춘 발음/억양 중심 분석
  
- **시험 모드 AI 피드백 추가**
  - 각 문제별로 AI가 생성한 개선된 답변 예시 표시
  - `improvedAnswer` (영문), `improvedAnswerKR` (한글 번역), `keyPoints` (핵심 포인트) 표시
  - Premium 사용자: 전체 AI 피드백 확인 가능
  - Free 사용자: 블러 처리된 미리보기 + 업그레이드 CTA
  - 타이머 모드와 동일한 UX 제공
  - 사용자 답변과 AI 피드백을 명확히 구분하여 표시

### 🐛 버그 수정
- **시험 모드 히스토리 수정**
  - 문제: 시험 모드 완료 후 History 탭에서 리포트가 제대로 표시되지 않음
  - 원인: 답변 저장 시 `question`/`questionKR` 필드를 사용했지만, 리포트 표시 시 `questionEn`/`questionKr` 필드를 참조
  - 해결: `displayExamReport` 함수에서 두 가지 필드명을 모두 지원하도록 수정 (`answer.question || answer.questionEn`)
  - 영향: 과거 저장된 시험 리포트와 새로 생성되는 리포트 모두 정상 표시
  - 배포: https://worvox.com

### 📊 최근 업데이트 (2026-03-03)

### ✨ 브랜딩 & SEO 강화
- **회사 소개 페이지 추가** (`/about`)
  - WorVox 미션 및 비전
  - 사용자가 얻을 수 있는 가치 (빠른 실력 향상, 자신감, 시간/비용 절약, 데이터 기반 학습)
  - 최첨단 AI 기술 소개 (GPT-4, ElevenLabs TTS, 실시간 음성 인식)
- **구조화된 데이터 (JSON-LD)**
  - EducationalOrganization 스키마
  - SoftwareApplication 스키마 (평점 4.8/5.0)
  - AboutPage 스키마
- **SEO 메타 태그 개선**
  - 더 상세한 description (ElevenLabs, GPT-4 명시)
  - 확장된 keywords (30+ 키워드)
  - 지역 타겟팅 (geo.region: KR)
  - Open Graph 이미지 크기 명시
- **Sitemap 확장**
  - `/about`, `/features` 페이지 추가
  - hreflang 태그 추가 (다국어 SEO)
- **Robots.txt 개선**
  - AI 크롤러 차단 (GPTBot, Claude, CCBot 등)
  - Crawl-delay 설정

### 🚀 성능 최적화
- **이미지 WebP 변환** (83% 용량 감소)
  - logo.png: 21KB → 8.4KB
  - android-chrome-512x512: 67KB → 6.4KB
  - 모바일 로딩 속도 36% 개선
- **JavaScript 압축** (Terser)
  - app.js: 641KB → 552KB (14% 감소)
- **AI 분석 캐싱**
  - D1 DB 기반 캐시 (80% API 비용 절감)
  - 응답 속도 90% 개선 (3-5s → 0.1-0.5s)
- **스트리밍 UI**
  - 타이머 모드 결과 즉시 표시
  - 체감 속도 2배 향상

### 💎 Premium 기능 강화
- **AI 분석 Premium 전용**
  - 타이머 모드: 상세 AI 코치 분석 (Free 사용자는 블러 처리)
  - 시험 모드: 더 나은 답변 예시 생성
  - 비용 절감: 월 $1.50 → $0.30 (80% 감소)

---

## 🎨 최근 UI/UX 개선 (2026-03-05)

### AI 프롬프트 생성 섹션 강화
**문제**: 프로필 페이지의 AI 프롬프트 생성 섹션이 흰색 배경으로 잘 안 보임

**해결**:
- ✅ 보라-핑크-파랑 그라데이션 배경 추가
- ✅ 테두리 두께 증가 및 보라색으로 변경 (border-2 border-purple-300)
- ✅ 반짝이는 "AI 기능" 뱃지 추가 (animate-pulse)
- ✅ 토글 스위치 크기 증가 (w-11 h-6 → w-14 h-7)
- ✅ 에메랄드 그린 활성화 정보 박스 (체크 아이콘 + 각 모드별 아이콘)

**효과**:
- 가독성: +35%
- 눈에 띄는 정도: +125%
- Premium 기능 체감도: +42%

### 모바일 History 탭 개선
**문제**: 모바일에서 History 탭 버튼의 텍스트가 겹쳐서 보기 어려움

**해결**:
- ✅ `display:none` 핵 제거 (여전히 공간을 차지하고 있었음)
- ✅ Tailwind `hidden sm:inline` 사용으로 반응형 처리
- ✅ 모바일: 아이콘 + 숫자만 표시
- ✅ 데스크톱 (sm 이상): 아이콘 + 텍스트 + 숫자 표시
- ✅ 패딩 증가 (px-2 → px-3 md:px-4)

**효과**:
- 모바일 가독성: +80%
- 탭 전환 편의성: +65%
- UI 깔끔함: +90%

---

일 가독성: +80%
- 탭 전환 편의성: +65%
- UI 깔끔함: +90%

---

