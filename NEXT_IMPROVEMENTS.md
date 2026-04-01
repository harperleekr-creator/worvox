# 다음 개선 작업 제안

## 🎯 우선순위 1: 에러 응답 표준화 (2-3시간)

### 현재 문제
백엔드 에러 형식이 일관되지 않음:
```javascript
// 현재 다양한 에러 형식
{ error: "message" }
{ success: false, message: "..." }
{ success: false, error: { ... } }
```

### 목표: 표준 에러 형식
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;          // "AUTH_INVALID_CREDENTIALS"
    message: string;       // "이메일 또는 비밀번호가 올바르지 않습니다."
    details?: any;         // { field: "password" }
  };
  timestamp: string;       // ISO 8601
}
```

### 작업 내용
1. `src/utils/error-handler.ts` 생성
2. 모든 API 라우트에 적용 (26개 파일)
3. 프론트엔드 에러 처리 통일

### 예상 효과
- 디버깅 효율 +70%
- 사용자 경험 개선 (명확한 에러 메시지)
- 프론트엔드 에러 처리 일관성

---

## 🎯 우선순위 2: 코드 정리 (30분)

### 2-1. showPlan() 중복 제거
```javascript
// Line 10340: 첫 번째 정의
showPlan() { ... }

// Line 12863: 두 번째 정의 (async)
async showPlan() { ... }
```

**작업**: 하나로 통합 (async 버전 유지)

### 2-2. TODO 주석 처리
```javascript
// Line 6794: TODO: Implement actual payment integration
// Line 16597: TODO: Add backend endpoint for username update
```

**작업**: 구현하거나 이슈로 이동

---

## 🎯 우선순위 3: 접근성 개선 (3-4시간)

### WCAG 2.1 AA 준수

#### 3-1. ARIA 속성 추가
```html
<!-- Before -->
<button onclick="worvox.showTimerMode()">
  <i class="fas fa-stopwatch"></i>타이머 모드
</button>

<!-- After -->
<button 
  onclick="worvox.showTimerMode()"
  aria-label="타이머 모드 시작"
  role="button">
  <i class="fas fa-stopwatch" aria-hidden="true"></i>타이머 모드
</button>
```

#### 3-2. 키보드 네비게이션
- Tab 순서 최적화
- ESC로 모달 닫기
- Enter로 버튼 활성화

#### 3-3. 스크린 리더 지원
- Toast 알림에 `aria-live="polite"` 추가
- 로딩 상태에 `aria-busy="true"` 추가

---

## 🎯 우선순위 4: 모니터링 시스템 (1-2시간)

### 4-1. Cloudflare Web Analytics (무료)
```html
<!-- src/index.tsx에 추가 -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

**제공 지표**:
- 페이지 뷰, 방문자 수
- 로딩 시간 분포
- 국가별 접속 통계

### 4-2. Sentry 에러 추적 (무료 플랜)
```javascript
// 프론트엔드
Sentry.init({
  dsn: "YOUR_DSN",
  environment: "production",
  release: BUILD_TIME
});

// 백엔드
Sentry.init({
  dsn: "YOUR_DSN",
  tracesSampleRate: 0.1
});
```

**제공 기능**:
- 실시간 에러 추적
- 사용자 세션 재생
- 성능 모니터링

---

## 🎯 우선순위 5: 코드 스플리팅 (선택, 2-3시간)

### ⚠️ 주의: 고위험 작업

#### Phase 1: Admin + Payment 분리
```javascript
// public/static/modules/admin.js
// 관리자 대시보드 관련 코드만 분리

// 메인 app.js에서 동적 로드
WorVox.prototype.showAdmin = async function() {
  if (!this._adminModuleLoaded) {
    await import('/static/modules/admin.js');
    this._adminModuleLoaded = true;
  }
  this._showAdminImpl();
};
```

**예상 효과**: 844 KB → 780 KB (-8%)

#### Phase 2: Timer, Scenario, Exam 분리
**예상 효과**: 780 KB → 150 KB (core) + 동적 로드

**최종 목표**: 첫 방문 8-10초 → 3-5초 (-40~50%)

---

## 📋 작업 순서 추천

### 이번 주 (빠른 효과)
1. ✅ Service Worker 최적화 (완료)
2. **showPlan() 중복 제거** (30분) ← 가장 간단
3. **TODO 주석 처리** (30분)

### 다음 주 (안정성)
4. **에러 응답 표준화** (2-3시간)
5. **모니터링 시스템** (1-2시간)

### 다음 달 (선택)
6. **접근성 개선** (3-4시간)
7. **코드 스플리팅** (2-3시간, 높은 위험)

---

## 💡 각 작업의 영향도

| 작업 | 시간 | 위험도 | 효과 | 우선순위 |
|------|------|--------|------|----------|
| showPlan() 중복 제거 | 30분 | ✅ 낮음 | 코드 일관성 | ⭐⭐⭐⭐ |
| TODO 처리 | 30분 | ✅ 낮음 | 코드 품질 | ⭐⭐⭐ |
| 에러 표준화 | 2-3시간 | ✅ 낮음 | 디버깅 +70% | ⭐⭐⭐⭐⭐ |
| 모니터링 | 1-2시간 | ✅ 낮음 | 운영 +80% | ⭐⭐⭐⭐⭐ |
| 접근성 | 3-4시간 | ⚠️ 중간 | 사용자 +15% | ⭐⭐⭐ |
| 코드 스플리팅 | 2-3시간 | ⚠️ 높음 | 로딩 -40% | ⭐⭐⭐⭐ |

---

## 🎓 추천 이유

### 왜 에러 표준화가 우선?
1. **낮은 위험**: 기존 기능 영향 없음
2. **높은 효과**: 디버깅 시간 대폭 감소
3. **빠른 구현**: 2-3시간이면 완료
4. **장기 이득**: 향후 유지보수 크게 개선

### 왜 모니터링이 중요?
1. **현황 파악**: 실제 사용자 경험 측정
2. **문제 발견**: 에러 실시간 추적
3. **데이터 기반**: 다음 최적화 방향 결정
4. **무료 도구**: Cloudflare + Sentry 무료 플랜

### 코드 스플리팅은 언제?
- 에러 표준화 완료 후
- 모니터링 시스템 구축 후
- 충분한 테스트 시간 확보 시
- 롤백 계획 준비 완료 시

---

## 🚀 다음 작업 시작하기

가장 간단한 작업부터 시작:

```bash
# 1. showPlan() 중복 제거 (30분)
# 2. TODO 주석 처리 (30분)
# 총 1시간이면 코드 품질 크게 개선!
```

어떤 작업을 먼저 진행할까요?
