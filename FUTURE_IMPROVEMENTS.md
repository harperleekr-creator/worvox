# 향후 개선 사항 (Future Improvements)

## 🔮 미구현 기능 (Pending Features)

### 1. Hiing 결제 연동 (Payment Integration)
**위치**: `public/static/app.js` line ~6803
**현재 상태**: 예약 정보만 로그 기록
**필요 작업**:
- 결제 게이트웨이 선택 (Toss Payments, 기타)
- `/api/hiing/bookings` POST 엔드포인트 구현
- 결제 완료 후 예약 확정 플로우
- 결제 실패 시 롤백 처리

**우선순위**: 중간 (Hiing 기능 활성화 시 필수)
**예상 작업 시간**: 4-6시간

---

### 2. Username 업데이트 엔드포인트 (Username Update API)
**위치**: `public/static/app.js` line ~16156
**현재 상태**: localStorage에만 업데이트 (백엔드 동기화 안 됨)
**필요 작업**:
- `PATCH /api/users/:id/username` 엔드포인트 구현
- 중복 username 검증
- 프론트엔드-백엔드 동기화

**우선순위**: 낮음 (현재 username 기능 사용 빈도 낮음)
**예상 작업 시간**: 1-2시간

---

## ✅ 완료된 코드 정리 (2026-04-01)

### 1. showPlan() 중복 제거
- **문제**: 10340줄과 12863줄에 중복 정의
- **해결**: 첫 번째 버전 제거 (450줄 삭제)
- **결과**: 18,910줄 → 18,460줄 (-450줄, -2.4%)

### 2. TODO 주석 명확화
- **문제**: TODO 주석이 모호함
- **해결**: FUTURE로 변경하고 이슈 설명 추가
- **결과**: 향후 작업 추적 가능

---

## 📊 코드 품질 지표

| 지표 | Before | After | 개선 |
|------|--------|-------|------|
| 총 줄 수 | 18,910 | 18,460 | -450 (-2.4%) |
| 중복 메서드 | 1개 | 0개 | ✅ |
| TODO 주석 | 2개 | 0개 | ✅ |
| FUTURE 이슈 | 0개 | 2개 | 📝 |

---

## 🎯 다음 작업 제안

### 즉시 가능 (Low Priority)
1. Username 업데이트 API 구현 (1-2시간)
   - 사용자 경험 개선
   - localStorage-서버 동기화

### 비즈니스 결정 필요 (Medium Priority)
2. Hiing 결제 연동 (4-6시간)
   - 수익화 기능
   - 결제 게이트웨이 선택 필요

---

## 📝 작업 이력

### 2026-04-01
- ✅ showPlan() 중복 제거 (450줄 감소)
- ✅ TODO 주석 → FUTURE 이슈로 변환
- ✅ FUTURE_IMPROVEMENTS.md 문서화
