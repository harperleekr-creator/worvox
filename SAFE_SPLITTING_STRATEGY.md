# 안전한 코드 스플리팅 전략

## 📊 현재 상황 분석

### 파일 크기
- **app.js**: 18,910 줄 (844 KB)
- **API 호출**: 138개 (axios/fetch)
- **show* 메서드**: 30개 이상

### 🔴 절대 건드리면 안 되는 핵심 기능 (HIGH RISK)
1. **로그인/회원가입** (6850-7215): 모든 사용자 인증
2. **토픽 선택** (showTopicSelection): 메인 대시보드
3. **대화 시작** (startConversation): 핵심 기능
4. **API 호출 로직**: 138개 axios/fetch 호출
5. **WorVox 클래스 초기화**: constructor, init()
6. **세션 관리**: syncUserToDB, loadGamificationStats

### 🟡 중간 위험도 (MEDIUM RISK)
1. **타이머 모드** (1454): 프리미엄 기능
2. **시나리오 모드** (2859): 프리미엄 기능  
3. **시험 모드** (4398): 프리미엄 기능
4. **발음 연습** (startVocabulary): 기본 기능

### 🟢 안전하게 분리 가능 (LOW RISK)
1. **프로필 페이지** (15593): 독립적 UI
2. **결제 페이지** (10791): 독립적 UI
3. **관리자 대시보드**: 소수 사용자만 접근
4. **게임화 UI**: showPrizeClaimForm, showSpinWheel
5. **히스토리 탭**: showHistoryTab

## 🎯 안전한 Wrapper 전략

### Phase 1: 기존 코드 100% 보존
```javascript
// public/static/app.js (기존 파일 그대로 유지)
// 아무것도 수정하지 않음

// public/static/app-loader.js (새 파일 - 5KB)
class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.moduleCache = {};
  }
  
  async loadModule(name) {
    if (this.loadedModules.has(name)) return;
    
    try {
      const script = document.createElement('script');
      script.src = `/static/modules/${name}.js?v=${BUILD_TIME}`;
      script.async = true;
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      this.loadedModules.add(name);
    } catch (error) {
      console.error(`Failed to load module ${name}:`, error);
      // Fallback: 기존 app.js에 이미 모든 기능이 있음
    }
  }
}

window.moduleLoader = new ModuleLoader();
```

### Phase 2: 저위험 모듈만 추출
우선순위 (영향도 낮은 순서):
1. **Admin Module** (5% 사용자) - showAdminDashboard 관련
2. **Payment Module** (10% 사용자) - showPlan, showPaymentPage
3. **Gamification Module** (선택 기능) - showSpinWheel, showPrizeClaimForm
4. **History Module** (선택 기능) - showHistoryTab

### Phase 3: HTML 수정 최소화
```html
<!-- src/index.tsx - 기존 -->
<script src="/static/app.js?v=${BUILD_TIME}"></script>

<!-- src/index.tsx - 새로운 (fallback 포함) -->
<script src="/static/app.js?v=${BUILD_TIME}"></script>
<script src="/static/app-loader.js?v=${BUILD_TIME}" async></script>
```

## 🛡️ 안전장치

### 1. 롤백 준비
```bash
# 배포 전 백업
cp public/static/app.js public/static/app.js.backup-$(date +%Y%m%d)

# 문제 발생 시 즉시 롤백
cp public/static/app.js.backup-20260401 public/static/app.js
npm run build && npx wrangler pages deploy dist
```

### 2. 에러 핸들링
```javascript
// 모듈 로딩 실패 시 기존 기능 사용
window.addEventListener('error', (event) => {
  if (event.filename.includes('/static/modules/')) {
    console.warn('Module load failed, using built-in functionality');
    event.preventDefault();
  }
});
```

### 3. 단계별 테스트
- [ ] 로컬 빌드 성공
- [ ] 모든 페이지 로딩 확인
- [ ] 로그인/회원가입 테스트
- [ ] 대화 시작 테스트
- [ ] 타이머/시나리오/시험 모드 테스트
- [ ] 결제 페이지 테스트
- [ ] 관리자 페이지 테스트

## 📈 예상 효과

### Phase 1 (Admin + Payment 분리)
- 초기 로딩: 844 KB → 780 KB (-8%)
- 로딩 시간: 8-10초 → 7-9초 (-10~12%)
- **위험도: 매우 낮음** (5% 사용자만 영향)

### Phase 2 (Gamification 분리)
- 초기 로딩: 780 KB → 720 KB (-15%)
- 로딩 시간: 7-9초 → 6-8초 (-20~25%)
- **위험도: 낮음** (선택 기능)

### Phase 3 (History 분리)
- 초기 로딩: 720 KB → 680 KB (-20%)
- 로딩 시간: 6-8초 → 5-7초 (-30~37%)
- **위험도: 낮음** (선택 기능)

## ✅ 실행 계획

1. **백업 생성** (1분)
2. **Admin 모듈 추출** (30분)
3. **로컬 테스트** (15분)
4. **배포** (5분)
5. **프로덕션 검증** (10분)
6. **문제 없으면 다음 모듈 진행**

총 예상 시간: **1시간** (안전하게 진행)
