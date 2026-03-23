# 일일 목표 대시보드 디버깅 가이드

## 🐛 문제 증상
- XP는 반영되지만 모드 횟수(대화, 타이머, 단어)가 업데이트되지 않음
- 일일 목표 대시보드가 실시간으로 반영되지 않음

## 🔍 디버깅 단계

### 1. 브라우저 콘솔 확인 (F12 또는 Cmd+Option+I)

**로그인 후 확인할 로그:**
```
✅ Daily goals initialized
📊 Loading gamification stats for user: [USER_ID]
```

**활동 수행 후 확인할 로그:**
```javascript
// AI 대화 완료 시
🎯 Updating daily goal: conversation +1
✅ Daily goal updated: conversation +1

// 타이머 챌린지 완료 시
🎯 Updating daily goal: timer +1
✅ Daily goal updated: timer +1

// 단어 학습 시
🎯 Updating daily goal: word +10
✅ Daily goal updated: word +10
```

**경고 메시지 (문제 발생 시):**
```
⚠️ Daily goals: No user logged in
⚠️ Daily goals: Manager not initialized
❌ Failed to update daily goal progress: [ERROR]
```

### 2. 대시보드 열기 시 확인할 로그

**트로피 버튼 클릭 시:**
```
🔄 Loading fresh daily goals data...
✅ Fresh data loaded, rendering dashboard...
```

**에러 발생 시:**
```
❌ Failed to load daily goals: [ERROR]
❌ DailyGoalsManager not initialized
```

### 3. Network 탭 확인 (F12 → Network)

**활동 수행 후 API 호출 확인:**

1. **대화 모드 완료 후:**
   - `POST /api/daily-goals/update-progress`
   - Request: `{"userId": 1, "activity": "conversation", "amount": 1}`
   - Response: `{"success": true, "goal": {...}}`

2. **타이머 챌린지 완료 후:**
   - `POST /api/daily-goals/update-progress`
   - Request: `{"userId": 1, "activity": "timer", "amount": 1}`

3. **단어 학습 완료 후:**
   - `POST /api/daily-goals/update-progress`
   - Request: `{"userId": 1, "activity": "word", "amount": 10}`

4. **XP 획득 시 (gamification.js):**
   - `POST /api/gamification/xp/add`
   - `POST /api/daily-goals/update-progress`
   - Request: `{"userId": 1, "activity": "xp", "amount": 50}`

**실패 케이스:**
- Status 500: 서버 에러
- Status 404: API 엔드포인트 없음
- Status 400: 잘못된 요청

### 4. 수동 테스트 명령어

**콘솔에서 직접 실행:**

```javascript
// 1. dailyGoalsManager 초기화 확인
console.log('DailyGoalsManager:', window.dailyGoalsManager);
console.log('Current Goal:', window.dailyGoalsManager?.currentGoal);
console.log('Current User:', window.worvox?.currentUser);

// 2. 수동으로 진행도 업데이트
await window.updateDailyGoalProgress('conversation', 1);
await window.updateDailyGoalProgress('timer', 1);
await window.updateDailyGoalProgress('word', 10);
await window.updateDailyGoalProgress('xp', 50);

// 3. 대시보드 데이터 새로고침
await window.dailyGoalsManager.loadStreak(window.worvox.currentUser.id);
window.dailyGoalsManager.renderDashboard();

// 4. API 직접 호출 테스트
const response = await fetch('/api/daily-goals/' + window.worvox.currentUser.id);
const data = await response.json();
console.log('Current Goal:', data);
```

## 🔧 문제별 해결 방법

### 문제 1: "Manager not initialized" 경고
**원인**: DailyGoalsManager가 로드되지 않음

**해결:**
1. 페이지 새로고침 (Ctrl+Shift+R / Cmd+Shift+R)
2. 캐시 삭제 후 재접속
3. 로그아웃 후 다시 로그인

### 문제 2: API 호출이 안됨
**원인**: `window.updateDailyGoalProgress` 함수가 호출되지 않음

**확인:**
```javascript
console.log(typeof window.updateDailyGoalProgress);
// 결과: "function" 이어야 함
```

**해결:**
- daily-goals-integration.js 파일 로드 확인
- 네트워크 탭에서 스크립트 로딩 확인

### 문제 3: API 호출은 되지만 대시보드가 업데이트 안됨
**원인**: 대시보드가 자동 새로고침되지 않음

**해결:**
1. 대시보드 닫고 다시 열기 (최신 데이터 로드)
2. 콘솔에서 수동 새로고침:
   ```javascript
   await window.dailyGoalsManager.loadStreak(window.worvox.currentUser.id);
   window.dailyGoalsManager.renderDashboard();
   ```

### 문제 4: XP는 반영되지만 다른 것은 안됨
**원인**: `gamification.js`의 `addXP`만 작동하고 다른 활동의 업데이트 코드가 실행 안됨

**확인할 위치:**
1. AI 대화: `app.js:8131-8133`
2. 타이머: `app.js:1725-1727`
3. 시나리오: `app.js:3729-3731`
4. 시험: `app.js:4808-4810`
5. 단어: `app.js:3302-3304, 5049-5051`

**해결:**
- 각 모드를 실제로 완료하고 콘솔 로그 확인
- 에러 메시지 확인

## 📊 정상 동작 시 예상 결과

### AI 대화 1회 완료 후:
- 콘솔: `🎯 Updating daily goal: conversation +1`
- 콘솔: `✅ Daily goal updated: conversation +1`
- Network: `POST /api/daily-goals/update-progress` (200 OK)
- 대시보드: 대화 횟수 1 증가

### 타이머 챌린지 1회 완료 후:
- 콘솔: `🎯 Updating daily goal: timer +1`
- Network: `POST /api/daily-goals/update-progress` (200 OK)
- 대시보드: 타이머 세션 1 증가

### XP 50 획득 후:
- 콘솔: `🎯 Updating daily goal: xp +50`
- Network: `POST /api/daily-goals/update-progress` (200 OK)
- 대시보드: XP 50 증가

## 🚀 최신 배포 정보

- **배포 URL**: https://8aeb979b.worvox.pages.dev
- **Git 커밋**: 06418ac
- **빌드 시간**: 2026-03-23 02:41:34
- **변경 사항**:
  - 상세 로깅 추가
  - 대시보드 자동 새로고침
  - 에러 핸들링 개선

## 📝 테스트 시나리오

### 시나리오 1: AI 대화 테스트
1. 로그인
2. AI 대화 모드 선택
3. 마이크로 1개 문장 말하기
4. AI 응답 대기
5. 콘솔에서 `🎯 Updating daily goal: conversation +1` 확인
6. 트로피 버튼 클릭하여 대시보드 열기
7. 대화 횟수 증가 확인

### 시나리오 2: 타이머 챌린지 테스트
1. 타이머 챌린지 모드 선택
2. 1회 완료
3. 콘솔에서 `🎯 Updating daily goal: timer +1` 확인
4. 대시보드에서 타이머 세션 증가 확인

### 시나리오 3: 모든 목표 달성 테스트
1. 대화 3회 완료
2. 타이머 5회 완료
3. 단어 10개 학습
4. XP 100 획득
5. 대시보드에서 전체 진행도 100% 확인
6. 목표 완료 보상 지급 확인

## 🔗 관련 파일

- `/home/user/webapp/public/static/daily-goals.js` - DailyGoalsManager 클래스
- `/home/user/webapp/public/static/daily-goals-integration.js` - 통합 코드
- `/home/user/webapp/public/static/app.js` - 각 모드별 업데이트 호출
- `/home/user/webapp/public/static/gamification.js` - XP 업데이트
- `/home/user/webapp/src/routes/daily-goals.ts` - 백엔드 API

## ❓ 추가 지원

문제가 계속되면 다음 정보 제공:
1. 브라우저 콘솔 스크린샷
2. Network 탭 스크린샷
3. 어떤 모드를 실행했는지
4. 에러 메시지 전체 내용
