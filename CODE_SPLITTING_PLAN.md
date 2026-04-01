# 코드 스플리팅 계획서

## 🎯 목표
- app.js (844 KB) → core.js (150 KB) + 동적 모듈들
- 초기 로딩: 844 KB → 150 KB (-82%)
- 로딩 시간: 8-10초 → 3-5초 (-50~62%)

## 📦 모듈 분리 계획

### Core Module (150 KB) - 즉시 로드
- WorVox 클래스 기본 구조
- constructor, init
- 로그인/회원가입 (showLogin, getStep1HTML, getStep2HTML, getStep3HTML)
- 토픽 선택 (showTopicSelection)
- 네비게이션 (setupHistoryNavigation, navigateToPage)
- 세션 타이머 (startSessionTimer, stopSessionTimer)
- 다크모드 (toggleDarkMode, initDarkMode)
- 모바일 사이드바 (toggleMobileSidebar)
- 기본 UI (getFooter)
- **모듈 로더 시스템** (loadModule 메서드)

### Conversation Module (120 KB) - 대화 모드 시작 시 로드
- startConversation
- sendMessage
- handleSpeech
- showAnalysis
- 모든 대화 관련 메서드

### Timer Module (80 KB) - 타이머 모드 시작 시 로드
- showTimerMode
- startTimerChallenge
- startTimerRecording
- analyzeTimerPerformance
- showTimerResults
- 모든 타이머 관련 메서드

### Scenario Module (100 KB) - 시나리오 모드 시작 시 로드
- showScenarioMode
- startScenario
- showScenarioPractice
- toggleScenarioRecording
- analyzeScenarioRecording
- showScenarioResults
- 모든 시나리오 관련 메서드

### Exam Module (80 KB) - 시험 모드 시작 시 로드
- showExamMode
- startExam
- generateExamQuestions
- submitExam
- showExamResults
- 모든 시험 관련 메서드

### Pronunciation Module (60 KB) - 발음 연습 시작 시 로드
- startVocabulary
- recordPronunciation
- analyzePronunciation
- 모든 발음 관련 메서드

### Admin Module (120 KB) - 관리자 페이지 접근 시 로드
- showAdminDashboard
- 모든 관리자 관련 메서드

### Profile Module (80 KB) - 프로필 페이지 접근 시 로드
- showProfile
- showSettings
- 모든 프로필 관련 메서드

## 🔧 구현 방법

### 1. Proxy Pattern으로 안전한 지연 로딩

```javascript
// Core 모듈에 포함
WorVox.prototype.loadModule = async function(moduleName) {
  if (this.loadedModules[moduleName]) {
    return; // 이미 로드됨
  }
  
  const moduleUrl = `/static/modules/${moduleName}.js?v=${BUILD_TIME}`;
  await import(moduleUrl);
  this.loadedModules[moduleName] = true;
};

// 각 모드 진입 시 자동 로드
WorVox.prototype.showTimerMode = async function() {
  await this.loadModule('timer');
  this._showTimerMode(); // 실제 구현은 timer 모듈에서
};
```

### 2. HTML 수정 없음
- 기존 `onclick="worvox.showTimerMode()"` 그대로 유지
- Proxy 메서드가 모듈 로드 후 실제 메서드 호출

### 3. 빌드 프로세스
1. app.js를 core.js + 모듈들로 분리
2. 각 모듈을 개별 파일로 저장 (`public/static/modules/`)
3. core.js는 app.js로 복사 (기존 HTML 참조 유지)
4. minify 적용

## ✅ 검증 체크리스트
- [ ] 로그인/회원가입 동작
- [ ] 토픽 선택 화면
- [ ] 대화 모드 시작 및 동작
- [ ] 타이머 모드 시작 및 동작
- [ ] 시나리오 모드 시작 및 동작
- [ ] 시험 모드 시작 및 동작
- [ ] 발음 연습 동작
- [ ] 관리자 페이지 접근
- [ ] 프로필 페이지 접근
- [ ] 다크모드 토글
- [ ] 모바일 반응형

## 🚨 위험 요소
1. ✅ HTML onclick 이벤트 깨짐 → Proxy 패턴으로 해결
2. ✅ 모듈 로딩 실패 시 에러 → try-catch + fallback
3. ✅ 순환 참조 문제 → 명확한 모듈 경계
4. ✅ 기존 사용자 캐시 → cache busting (BUILD_TIME)
