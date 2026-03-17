# 🎯 XP 시스템 현황 분석 및 개선 방안

## 📊 현재 XP 지급 방법

### ✅ 구현된 방법

1. **랜덤박스 (Random Box)** 🎁
   - 위치: Rewards 페이지
   - 지급량: 50 XP (55%), 100 XP (30.48%), 200 XP (7%)
   - 조건: 스핀 카운트 보유 (레벨업 시 획득)
   - 상태: ✅ 레벨업 자동 처리 완료

### ❌ 미구현 영역

2. **AI Conversation (대화 학습)** 💬
   - 현재: 세션 종료 시 분석만 수행
   - 제안: 메시지당 XP 지급 없음
   - 개선 필요: ✅

3. **Timer Mode (타이머 모드)** ⏱️
   - 현재: 완료 시 XP 지급 없음
   - 제안: 문장 완료당 XP 지급 필요
   - 개선 필요: ✅

4. **Scenario Mode (시나리오 모드)** 🎭
   - 현재: 완료 시 XP 지급 없음
   - 제안: 시나리오 완료당 XP 지급 필요
   - 개선 필요: ✅

5. **Exam Mode (시험 모드)** 📝
   - 현재: 완료 시 XP 지급 없음
   - 제안: 문제 정답당 XP 지급 필요
   - 개선 필요: ✅

6. **Vocabulary (단어 학습)** 📚
   - 현재: Quiz 완료 시 XP 지급 없음
   - 제안: 정답당 XP 지급 필요
   - 개선 필요: ✅

7. **Daily Login (출석체크)** 📅
   - 현재: Attendance 기능은 있으나 XP 지급 없음
   - 제안: 출석 시 XP 보너스 지급
   - 개선 필요: ✅

8. **Streak Bonus (연속 학습)** 🔥
   - 현재: Streak 추적은 있으나 XP 보너스 없음
   - 제안: 연속 학습 시 추가 XP 보너스
   - 개선 필요: ✅

---

## 🎮 제안하는 XP 시스템

### 1️⃣ **기본 활동 XP**

| 활동 | XP | 조건 | 우선순위 |
|------|----|----|---------|
| 타이머 문장 완료 | 10 XP | 정확도 80% 이상 | 🔴 High |
| 시나리오 완료 | 30 XP | 시나리오 1개 완료 | 🔴 High |
| 시험 정답 | 15 XP | 문제 1개 정답 | 🔴 High |
| 단어 퀴즈 정답 | 5 XP | 단어 1개 정답 | 🟡 Medium |
| AI 대화 메시지 | 3 XP | 메시지 1개 전송 (최대 30개/일) | 🟡 Medium |
| 단어 북마크 추가 | 2 XP | 단어 1개 북마크 | 🟢 Low |

### 2️⃣ **보너스 XP**

| 보너스 | XP | 조건 | 우선순위 |
|--------|----|----|---------|
| 완벽한 타이머 | +20 XP | 정확도 100% | 🟡 Medium |
| 연속 정답 | +10 XP | 5연속 정답 | 🟡 Medium |
| 첫 출석 | 20 XP | 매일 첫 로그인 | 🔴 High |
| 연속 출석 3일 | +10 XP | 3일 연속 | 🟡 Medium |
| 연속 출석 7일 | +30 XP | 7일 연속 | 🟡 Medium |
| 연속 출석 30일 | +100 XP | 30일 연속 | 🟢 Low |

### 3️⃣ **특별 이벤트 XP**

| 이벤트 | XP | 조건 | 우선순위 |
|--------|----|----|---------|
| 주간 챌린지 완료 | 100 XP | 주간 목표 달성 | 🟢 Low |
| 월간 MVP | 500 XP | 월간 최다 활동 | 🟢 Low |
| 친구 추천 | 50 XP | 친구 가입 시 | 🟢 Low |

---

## 🚀 우선 구현 순서

### Phase 1: 핵심 학습 활동 (🔴 High Priority)

1. **타이머 모드 XP** ⏱️
   - 문장 완료 시: 10 XP
   - 완벽한 발음 (100%): +20 XP 보너스
   - 구현 위치: Timer report 제출 시

2. **시나리오 모드 XP** 🎭
   - 시나리오 완료 시: 30 XP
   - 구현 위치: Scenario report 제출 시

3. **시험 모드 XP** 📝
   - 정답당: 15 XP
   - 구현 위치: Exam report 제출 시

4. **출석 체크 XP** 📅
   - 매일 첫 로그인: 20 XP
   - 구현 위치: 출석 API 호출 시

### Phase 2: 부가 학습 활동 (🟡 Medium Priority)

5. **단어 퀴즈 XP** 📚
   - 정답당: 5 XP
   - 구현 위치: Vocabulary quiz 제출 시

6. **AI 대화 XP** 💬
   - 메시지당: 3 XP (일일 최대 30개 = 90 XP)
   - 구현 위치: 메시지 전송 시

7. **연속 보너스** 🔥
   - 3일 연속: +10 XP
   - 7일 연속: +30 XP
   - 구현 위치: 출석 시 Streak 체크

### Phase 3: 특별 이벤트 (🟢 Low Priority)

8. **주간/월간 챌린지**
9. **친구 추천 시스템**
10. **시즌 이벤트**

---

## 💾 데이터베이스 준비사항

### 현재 테이블 상태 ✅
- `user_activity_log` - 활동 기록
- `users` - user_level, xp, total_xp, coins
- `attendance` - 출석 기록
- `gamification` API - XP 지급 로직

### 필요한 추가 작업 ❌
1. 일일 XP 제한 추적 (AI 대화)
2. 연속 보너스 지급 기록
3. 활동별 XP 설정 관리

---

## 🎯 구현 예시 (Phase 1 - 타이머 모드)

### 백엔드 (src/routes/mode-reports.ts)

```typescript
// Timer report submission
router.post('/timer', async (c) => {
  const { userId, accuracy, sentences } = await c.req.json();
  
  // Calculate XP based on accuracy
  let xp = 0;
  if (accuracy >= 80) {
    xp = sentences.length * 10; // 10 XP per sentence
    
    if (accuracy === 100) {
      xp += 20; // Perfect bonus
    }
  }
  
  // Award XP using gamification API
  if (xp > 0) {
    await c.env.DB.prepare(`
      INSERT INTO user_activity_log (user_id, activity_type, xp_gained, details)
      VALUES (?, ?, ?, ?)
    `).bind(userId, 'timer_mode', xp, `Timer: ${sentences.length} sentences, ${accuracy}% accuracy`).run();
    
    // Update user XP (with level up check)
    // ... (same logic as rewards.ts)
  }
  
  return c.json({ success: true, xp });
});
```

### 프론트엔드 (public/static/app.js)

```javascript
// After timer completion
async submitTimerReport(accuracy, sentences) {
  const response = await axios.post('/api/mode-reports/timer', {
    userId: this.currentUser.id,
    accuracy,
    sentences
  });
  
  if (response.data.success && response.data.xp > 0) {
    // Show XP gained notification
    this.showXPNotification(response.data.xp);
    
    // Reload stats
    await this.loadGamificationStats();
  }
}
```

---

## 📈 기대 효과

### 사용자 참여도 증가
- 모든 학습 활동에 보상 제공
- 명확한 진행도 가시화
- 레벨업 동기 부여

### 학습 효과 향상
- 꾸준한 학습 유도 (출석 보너스)
- 정확도 중심 학습 (보너스 XP)
- 다양한 학습 모드 경험

### 리텐션 향상
- 일일 목표 달성 (출석 + 활동)
- 레벨업 재미 요소
- 보상 시스템 강화

---

**다음 단계: Phase 1 구현부터 시작하겠습니까?**
