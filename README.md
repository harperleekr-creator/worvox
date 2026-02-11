# HeySpeak - AI English Learning 🎓

AI 기반 실시간 영어 회화 학습 웹 애플리케이션입니다. 사용자가 마이크로 영어를 말하면 AI가 듣고, 이해하고, 자연스러운 대화로 응답합니다.

## 📚 프로젝트 개요

**HeySpeak**는 Heyring 앱에서 영감을 받아 제작된 웹 기반 AI 전화영어 서비스입니다. 브라우저에서 바로 사용할 수 있으며, 실시간 음성 인식과 AI 대화를 통해 영어 학습을 돕습니다.

## 🌐 URLs

- **개발 서버**: https://3000-iy14bstt9s2i67kxrmjhs-b32ec7bb.sandbox.novita.ai
- **API Health Check**: `/api/health`
- **GitHub**: (추후 업데이트 예정)

## ✨ 현재 완성된 기능

### 핵심 기능
- ✅ **6단계 온보딩**: 이름, 레벨, 유입경로, 나이대, 성별, 직업 수집
- ✅ **사용자 프로필**: 상세한 사용자 정보 관리 및 분석
- ✅ **다양한 학습 주제**: 
  - ☀️ Daily Conversation (일상 대화)
  - ✈️ Travel English (여행 영어)
  - 🎯 Job Interview (면접 준비)
  - 💼 Business English (비즈니스 영어)
  - 📚 **Vocabulary** (단어 학습) - **NEW!**
- ✅ **음성 녹음**: 브라우저 마이크를 통한 실시간 녹음
- ✅ **음성 인식 (STT)**: OpenAI Whisper API를 통한 음성→텍스트 변환
- ✅ **AI 대화 생성**: GPT-3.5-turbo를 활용한 빠른 영어 대화 (1-2초 응답)
- ✅ **음성 합성 (TTS)**: OpenAI TTS (nova 음성)를 통한 자연스러운 영어 발음
- ✅ **학습 히스토리**: 날짜별 세션 목록 및 전체 대화 내용 조회
- ✅ **학습 통계 대시보드**: 
  - 📊 일별 활동 차트 (최근 30일)
  - 🎯 주제별 학습 분포 (도넛 차트)
  - 📅 주간 진행률 (최근 12주)
  - 🎓 레벨별 학습 분포
  - ⏰ 시간대별 학습 패턴
  - 🔥 학습 스트릭 (연속 학습 일수)
- ✅ **실시간 단어 카운트**: 학습한 단어 수 실시간 표시
- ✅ **단어 학습 기능** (Vocabulary): **NEW!**
  - 📚 영어 단어 카드 형식으로 표시
  - 🇰🇷 한국어 뜻 제공
  - 🔊 단어 발음 듣기 (OpenAI TTS)
  - 📝 예문과 품사 정보
  - 🎯 난이도별 분류 (beginner/intermediate/advanced)
  - 35개 이상의 기본 단어 제공

### API 엔드포인트

#### 사용자 관리
- `POST /api/users/auth` - 사용자 생성 또는 로그인
- `GET /api/users/:userId` - 사용자 프로필 조회
- `PATCH /api/users/:userId/level` - 사용자 레벨 변경
- `GET /api/users/:userId/stats` - 사용자 학습 통계

#### 학습 주제
- `GET /api/topics` - 모든 주제 목록
- `GET /api/topics/level/:level` - 레벨별 주제 조회
- `GET /api/topics/:topicId` - 특정 주제 상세 정보

#### 세션 관리
- `POST /api/sessions/create` - 새 학습 세션 생성
- `POST /api/sessions/end/:sessionId` - 세션 종료
- `GET /api/sessions/:sessionId` - 세션 상세 정보
- `GET /api/sessions/user/:userId` - 사용자의 모든 세션

#### 학습 히스토리
- `GET /api/history/sessions/:userId` - 사용자의 모든 세션 목록 (최근 50개)
- `GET /api/history/conversation/:sessionId` - 특정 세션의 전체 대화 내용
- `GET /api/history/stats/:userId` - 사용자 학습 통계 (주제별, 일별)

#### 대화 처리
- `POST /api/chat/message` - AI 응답 생성 및 저장
- `GET /api/chat/history/:sessionId` - 대화 히스토리 조회

#### 음성 처리
- `POST /api/stt/transcribe` - 음성을 텍스트로 변환 (Whisper)
- `POST /api/tts/speak` - 텍스트를 음성으로 변환 (OpenAI TTS)
- `GET /api/tts/voices` - 사용 가능한 음성 목록

#### 단어 학습 (Vocabulary)
- `GET /api/vocabulary/list` - 모든 단어 목록 (최대 50개)
- `GET /api/vocabulary/words/random` - 랜덤 단어 가져오기
- `GET /api/vocabulary/words/category/:category` - 카테고리별 단어
- `GET /api/vocabulary/categories` - 모든 카테고리 목록
- `POST /api/vocabulary/progress` - 단어 학습 진도 저장
- `GET /api/vocabulary/progress/:userId/stats` - 사용자 단어 학습 통계

## 🗄️ 데이터 아키텍처

### 데이터 모델

#### Users (사용자)
```sql
- id: 사용자 고유 ID
- username: 사용자명
- email: 이메일 (선택)
- level: 학습 레벨 (beginner/intermediate/advanced)
- referral_source: 유입 경로 (search/social/friend/ad/other)
- age_group: 나이대 (10s/20s/30s/40s/50s_plus)
- gender: 성별 (male/female/other/prefer_not_to_say)
- occupation: 직업 (entrepreneur/employee/freelancer/student)
- created_at: 가입일시
```

#### Topics (학습 주제)
```sql
- id: 주제 ID
- name: 주제명
- description: 설명
- level: 난이도
- system_prompt: AI 시스템 프롬프트
- icon: 아이콘 이모지
```

#### Sessions (학습 세션)
```sql
- id: 세션 ID
- user_id: 사용자 ID
- topic: 주제명
- level: 학습 레벨
- started_at: 시작 시간
- ended_at: 종료 시간
- total_messages: 총 메시지 수
```

#### Messages (대화 메시지)
```sql
- id: 메시지 ID
- session_id: 세션 ID
- role: 역할 (user/assistant)
- content: 메시지 내용
- audio_url: 음성 파일 URL (선택)
- transcription: 음성 텍스트 (사용자 메시지)
- created_at: 생성 시간
```

#### Vocabulary Words (단어 목록)
```sql
- id: 단어 ID
- word: 영어 단어
- meaning_ko: 한국어 뜻
- pronunciation: 발음 기호
- part_of_speech: 품사 (noun/verb/adjective 등)
- example_sentence: 예문
- difficulty: 난이도 (beginner/intermediate/advanced)
- category: 카테고리 (nouns/verbs/adjectives 등)
- created_at: 생성 시간
```

#### User Vocabulary Progress (단어 학습 진도)
```sql
- id: 진도 ID
- user_id: 사용자 ID
- word_id: 단어 ID
- is_learned: 학습 완료 여부 (0/1)
- review_count: 복습 횟수
- last_reviewed_at: 마지막 복습 시간
- created_at: 생성 시간
```

### 저장소 서비스
- **Cloudflare D1**: 모든 데이터 저장 (사용자, 세션, 메시지, 통계)
- **로컬 개발**: SQLite with `--local` 플래그

### 데이터 흐름
1. 사용자 음성 입력 → 브라우저에서 녹음
2. 음성 파일 → `/api/stt/transcribe` → OpenAI Whisper
3. 텍스트 → `/api/chat/message` → GPT-3.5-turbo → AI 응답
4. AI 응답 텍스트 → `/api/tts/speak` → ElevenLabs → 음성
5. 모든 대화 → D1 데이터베이스에 저장

## 🎨 사용자 가이드

### 시작하기
1. 웹사이트 접속
2. 사용자명과 레벨 선택하여 로그인
3. 학습하고 싶은 주제 선택
4. 마이크 버튼을 눌러 영어로 말하기
5. AI의 응답 듣고 계속 대화하기

### 사용 팁
- 🎤 **명확한 발음**: 마이크에 가까이 대고 명확하게 말하기
- 💬 **자연스러운 대화**: 완벽한 문장이 아니어도 괜찮습니다
- 📚 **레벨 맞춤**: 본인의 수준에 맞는 주제 선택
- 🔄 **반복 연습**: 같은 주제를 여러 번 연습하여 익숙해지기

## 🚀 배포 상태

### 개발 환경
- ✅ **로컬 서버**: PM2로 실행 중
- ✅ **포트**: 3000
- ✅ **D1 데이터베이스**: 로컬 모드로 실행 중
- ✅ **Public URL**: https://3000-iy14bstt9s2i67kxrmjhs-b32ec7bb.sandbox.novita.ai

### 기술 스택
- **Backend**: Hono (TypeScript)
- **Frontend**: Vanilla JavaScript + TailwindCSS
- **Database**: Cloudflare D1 (SQLite)
- **AI Services**: 
  - OpenAI Whisper (STT - 음성 인식)
  - OpenAI GPT-3.5-turbo (Chat - AI 대화) ⚡ Fast!
  - OpenAI TTS (TTS - 음성 합성) ✨ Nova voice
- **Deployment**: Cloudflare Pages/Workers (프로덕션 배포 준비 완료)

### 최근 업데이트
- **2026-02-11**: 🆕 **Vocabulary 기능 추가** - 단어 학습 카드와 발음 듣기
- **2026-02-11**: 히스토리 날짜/시간 표시를 한국어 형식으로 개선
- **2026-02-10**: 초기 버전 완성 및 모든 기능 구현
- **2026-02-10**: OpenAI TTS로 전환 (ElevenLabs → OpenAI TTS with Nova voice)
- **2026-02-10**: GPT-3.5-turbo로 변경 (빠른 응답 속도)

## ⚙️ 설치 및 실행

### 필수 요구사항
- Node.js 18+
- npm
- OpenAI API 키
- ElevenLabs API 키

### 설치
```bash
cd /home/user/webapp
npm install
```

### 환경 변수 설정
`.dev.vars` 파일 생성:
```bash
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key  # (옵션, OpenAI TTS 사용 중)
```

**참고**: 현재는 OpenAI TTS를 사용하므로 OpenAI API 키만 필요합니다.

### 데이터베이스 마이그레이션
```bash
npm run db:migrate:local
```

### 개발 서버 실행
```bash
# 빌드
npm run build

# PM2로 실행
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:sandbox
```

### 프로덕션 배포 (Cloudflare Pages)
```bash
# Cloudflare D1 데이터베이스 생성
npx wrangler d1 create webapp-production

# wrangler.jsonc에 database_id 업데이트

# 프로덕션 마이그레이션
npm run db:migrate:prod

# 배포
npm run deploy:prod
```

## 🔧 아직 구현되지 않은 기능

### 예정된 기능
- ⏳ **발음 평가**: AI 기반 발음 정확도 분석
- ⏳ **학습 진도 시각화**: 그래프와 차트로 학습 진행도 표시
- ⏳ **커스텀 주제**: 사용자가 직접 학습 주제 생성
- ⏳ **오프라인 모드**: 대화 히스토리 오프라인 접근
- ⏳ **모바일 앱**: React Native 버전
- ⏳ **다국어 지원**: 한국어 UI 추가

### 개선 계획
- 🔄 음성 인식 정확도 개선
- 🔄 AI 응답 속도 최적화
- 🔄 더 다양한 학습 주제 추가
- 🔄 사용자 피드백 시스템

## 📝 개발 가이드

### 프로젝트 구조
```
webapp/
├── src/
│   ├── index.tsx          # 메인 애플리케이션
│   ├── routes/            # API 라우트
│   │   ├── stt.ts         # 음성 인식
│   │   ├── tts.ts         # 음성 합성
│   │   ├── chat.ts        # AI 대화
│   │   ├── sessions.ts    # 세션 관리
│   │   ├── users.ts       # 사용자 관리
│   │   ├── topics.ts      # 주제 관리
│   │   ├── history.ts     # 학습 히스토리
│   │   └── vocabulary.ts  # 단어 학습 (NEW!)
│   └── types/             # TypeScript 타입 정의
├── public/static/
│   ├── app.js             # 프론트엔드 JavaScript
│   └── style.css          # 커스텀 CSS
├── migrations/            # D1 데이터베이스 마이그레이션
├── wrangler.jsonc         # Cloudflare 설정
├── ecosystem.config.cjs   # PM2 설정
└── package.json
```

### 주요 명령어
```bash
npm run build              # 프로젝트 빌드
npm run dev:sandbox        # 로컬 개발 서버
npm run db:migrate:local   # 로컬 DB 마이그레이션
npm run db:console:local   # 로컬 DB 콘솔
npm run deploy:prod        # 프로덕션 배포
npm run clean-port         # 포트 3000 정리
npm test                   # 서비스 테스트
```

## 🤝 추천 다음 단계

1. **API 키 설정**: `.dev.vars` 파일에 실제 OpenAI 및 ElevenLabs API 키 추가
2. **프로덕션 배포**: Cloudflare Pages에 배포하여 전 세계에서 접근 가능하게 만들기
3. **GitHub 연동**: 코드를 GitHub 저장소에 푸시
4. **발음 평가 기능**: 사용자 발음을 분석하고 피드백 제공
5. **학습 통계 대시보드**: 사용자의 학습 진행도를 시각화
6. **모바일 최적화**: 반응형 디자인 개선 및 PWA 구현

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 🙏 감사의 말

이 프로젝트는 다음 기술들로 만들어졌습니다:
- [Hono](https://hono.dev/) - 초고속 웹 프레임워크
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge 컴퓨팅 플랫폼
- [OpenAI](https://openai.com/) - AI 모델 (Whisper, GPT-3.5-turbo)
- [ElevenLabs](https://elevenlabs.io/) - 음성 합성 기술
- [TailwindCSS](https://tailwindcss.com/) - 유틸리티 CSS 프레임워크

---

**Made with ❤️ for English learners worldwide**
