# 🚀 Worvox 배포 체크리스트

## Phase 1 배포를 위한 필수 단계

### ✅ 1단계: Cloudflare API 키 설정
```bash
# Deploy 탭에서 API 키 설정 후
setup_cloudflare_api_key  # 도구로 환경 확인
```

### ✅ 2단계: 프로덕션 배포
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name worvox
```

### ✅ 3단계: OpenAI API 키 설정 (매우 중요!)
```bash
# Phase 1 분석 기능을 위해 필수!
npx wrangler pages secret put OPENAI_API_KEY --project-name worvox
# 입력창에 본인의 OpenAI API 키 붙여넣기

npx wrangler pages secret put OPENAI_API_BASE --project-name worvox
# 입력: https://api.openai.com/v1

npx wrangler pages secret put ELEVENLABS_API_KEY --project-name worvox
# 입력창에 본인의 ElevenLabs API 키 붙여넣기
```

### ✅ 4단계: D1 데이터베이스 마이그레이션 (Phase 1 테이블 추가)
```bash
# 0015_add_session_analysis.sql 마이그레이션 적용
npx wrangler d1 migrations apply worvox-production --remote
```

### ✅ 5단계: 배포 확인
```bash
# 서비스 상태 확인
curl https://worvox.com/api/health

# 테스트 세션 생성 및 분석 테스트
# 1. worvox.com 접속
# 2. AI Conversation 시작
# 3. 3개 이상 메시지 주고받기
# 4. End Session 클릭
# 5. 로딩 → 리포트 확인
```

---

## 🔍 문제 해결

### ❌ 분석 리포트가 안 나타나는 경우

**원인**: OpenAI API 키가 설정되지 않음

**해결**:
```bash
# 환경 변수 확인
npx wrangler pages secret list --project-name worvox

# OPENAI_API_KEY가 없으면 3단계 실행
npx wrangler pages secret put OPENAI_API_KEY --project-name worvox
```

### ❌ "no such table: session_reports" 에러

**원인**: D1 마이그레이션이 적용되지 않음

**해결**:
```bash
npx wrangler d1 migrations apply worvox-production --remote
```

---

## 📋 현재 상황 정리

### ✅ 완료된 것
- [x] Phase 1 코드 구현 완료
- [x] 로컬 개발 환경 테스트 완료
- [x] 로컬 DB 마이그레이션 완료
- [x] GitHub 푸시 완료

### ⏳ 대기 중
- [ ] Cloudflare API 키 설정 (사용자 액션 필요)
- [ ] 프로덕션 배포
- [ ] OpenAI API 키 환경 변수 설정
- [ ] 프로덕션 DB 마이그레이션
- [ ] worvox.com에서 테스트

---

## 🎯 배포 후 테스트 시나리오

1. **로그인**: worvox.com 접속
2. **대화 시작**: AI Conversation 선택
3. **메시지 3개+**: 영어로 대화
4. **세션 종료**: End Session 버튼
5. **로딩 확인**: "🧠 AI가 대화를 분석하고 있어요"
6. **리포트 확인**:
   - 종합 점수 (50-95)
   - 카테고리별 점수 (문법, 어휘, 유창성)
   - 고쳐야 할 문장 TOP 3
   - 더 나은 표현 2개
   - 각 문장마다 "🔄 다시 연습하기" 버튼
7. **버튼 테스트**:
   - "🏠 홈으로 돌아가기"
   - "📚 히스토리 보기"

---

## 💡 참고사항

- **로컬 개발**: `.dev.vars` 파일 사용 (자동 로드)
- **프로덕션**: `wrangler pages secret` 명령어로 설정
- **보안**: API 키는 절대 코드에 포함하지 않음
- **비용**: GPT-3.5-turbo 사용 (분석당 약 $0.01-0.02)
