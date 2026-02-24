# WorVox - AI English Learning Platform

## 📱 프로젝트 개요
**WorVox**는 AI 음성 대화 기반 영어 학습 플랫폼입니다. 실시간 음성 인식(STT), AI 대화, 음성 합성(TTS)을 활용하여 사용자가 자연스럽게 영어 회화를 연습할 수 있습니다.

## 🌐 배포 URL
- **Production**: https://worvox.com
- **GitHub**: https://github.com/harperleekr-creator/worvox

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
- **Learning History**: 과거 대화 세션 기록 및 조회
- **Statistics**: 학습 통계 및 진도 시각화

### 🎮 게임화 (Gamification)
- **레벨 시스템**: XP 획득 및 레벨 업
- **리워드**: 레벨별 잠금 해제 기능
- **대시보드**: 학습 진도, XP, 레벨 표시

### 💳 결제 시스템 (준비 중)
- **플랜**: Free, Premium (₩9,900/월), Business (₩32,000/월)
- **Real Conversation**: 1:1 프리미엄 전화영어
  - 1회 체험권 (무료)
  - Pro 10회권 (₩165,000)
  - Pro 30회권 (₩495,000)
  - Premium 회원: 15% 추가 할인
  - Business 회원: 25% 추가 할인
- **NHN KCP 결제 연동 예정**

### 🔐 인증
- **Google OAuth 로그인** (임시 비활성화 - 개발 중)
- **테스트 사용자 자동 생성** (현재)

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
- **LLM**: OpenAI GPT-3.5/4
- **Payment**: NHN KCP (예정)

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
│   └── (0015_add_session_analysis.sql - 예정)
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

# 테스트 데이터 추가 (선택사항)
npm run db:seed
```

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
```bash
# 1. Cloudflare API 키 설정 (최초 1회)
# Deploy 탭에서 API 키 설정 필요

# 2. 빌드
npm run build

# 3. 배포
npm run deploy

# 또는 프로덕션 배포 (프로젝트명 지정)
npm run deploy:prod
```

### 데이터베이스 마이그레이션 (프로덕션)
```bash
# 프로덕션 D1 데이터베이스에 마이그레이션 적용
npm run db:migrate:prod
```

---

## 📊 데이터베이스 스키마

### 주요 테이블
- **users**: 사용자 정보 (Google OAuth 연동)
- **sessions**: 대화 세션 기록
- **messages**: 대화 메시지 로그 (user/assistant)
- **topics**: 대화 주제 템플릿
- **vocabulary**: 단어 데이터 (Beginner, Intermediate, Advanced)
- **vocabulary_progress**: 사용자별 단어 학습 진도
- **vocabulary_bookmarks**: 북마크한 단어
- **user_stats**: 일별 학습 통계
- **gamification_stats**: XP, 레벨, 진도 추적

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
- **상호**: 하퍼잉글리쉬
- **대표자**: 이강돈
- **사업자번호**: 542-07-02097

---

## 🐛 알려진 이슈

- [ ] Google 로그인 임시 비활성화 (NHN KCP 연동 작업 중)
- [ ] Real Conversation 예약 기능 미구현 (UI만 존재)
- [ ] PHASE 1 분석 리포트 미구현

---

## 📈 로드맵

### ✅ 완료된 기능
- [x] AI 대화 시스템 (STT + GPT + TTS)
- [x] Vocabulary 학습 (단어장, 플래시카드, 퀴즈)
- [x] History & Statistics 페이지
- [x] Gamification (레벨, XP, 리워드)
- [x] 요금제 페이지 (Free, Premium, Business)
- [x] Real Conversation 수업권 구매 UI
- [x] 법적 문서 (이용약관, 개인정보처리방침, 환불정책)

### 🔄 진행 중
- [ ] **PHASE 1**: 대화 분석 & 피드백 리포트
- [ ] NHN KCP 결제 연동 (배치결제 + 일반결제)

### 📅 향후 계획
- [ ] **PHASE 2**: 드릴 시스템 강화 (발음 유사도, 반복 연습)
- [ ] **PHASE 3**: 진행도 추적 (주간 그래프, 취약점 분석)
- [ ] **PHASE 4**: 동기부여 (Streak, 배지, 친구 경쟁)
- [ ] **PHASE 5**: 결제 기능 완성 (Free 제한, Premium 혜택)
- [ ] Real Conversation 예약 시스템 구현
- [ ] Google 로그인 재활성화
- [ ] 모바일 앱 (React Native 또는 PWA)

---

## 👥 팀

- **개발**: 하퍼잉글리쉬 개발팀
- **문의**: support@worvox.com

---

## 📄 라이선스

Copyright © 2026 WorVox. All rights reserved.

---

**Last Updated**: 2026-02-24
