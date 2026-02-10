# Google OAuth 설정 가이드

## 🔐 Google OAuth Client ID 발급하기

### 1단계: Google Cloud Console 접속
1. https://console.cloud.google.com/ 접속
2. 구글 계정으로 로그인

### 2단계: 프로젝트 생성 (또는 기존 프로젝트 선택)
1. 상단의 "프로젝트 선택" 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름: `HeySpeak` (원하는 이름)
4. "만들기" 클릭

### 3단계: OAuth 동의 화면 구성
1. 왼쪽 메뉴 → "API 및 서비스" → "OAuth 동의 화면"
2. 사용자 유형: **외부** 선택 → "만들기"
3. 앱 정보 입력:
   - 앱 이름: `HeySpeak`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. "저장 후 계속" 클릭
5. 범위: 기본값 유지 → "저장 후 계속"
6. 테스트 사용자: 본인 이메일 추가 (개발 중)
7. "저장 후 계속" 클릭

### 4단계: OAuth 클라이언트 ID 생성
1. 왼쪽 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. 상단 "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `HeySpeak Web Client`
5. 승인된 JavaScript 원본 추가:
   ```
   http://localhost:3000
   https://3000-iy14bstt9s2i67kxrmjhs-b32ec7bb.sandbox.novita.ai
   ```
   (나중에 실제 도메인도 추가)
6. 승인된 리디렉션 URI: (비워둬도 됨)
7. "만들기" 클릭

### 5단계: 클라이언트 ID 복사
생성 완료 후 표시되는 팝업에서:
- **클라이언트 ID** 복사: `123456789-abcdefg.apps.googleusercontent.com`
- (클라이언트 보안 비밀은 웹 앱에서 사용하지 않음)

---

## 📝 코드에 클라이언트 ID 적용

### 1. index.tsx 파일 수정
파일 위치: `/home/user/webapp/src/index.tsx`

48번 라인 근처:
```typescript
<meta name="google-signin-client_id" content="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com">
```

→ 실제 클라이언트 ID로 교체:
```typescript
<meta name="google-signin-client_id" content="123456789-abcdefg.apps.googleusercontent.com">
```

### 2. app.js 파일 수정
파일 위치: `/home/user/webapp/public/static/app.js`

42번 라인 근처:
```javascript
client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
```

→ 실제 클라이언트 ID로 교체:
```javascript
client_id: '123456789-abcdefg.apps.googleusercontent.com',
```

### 3. 빌드 및 재시작
```bash
cd /home/user/webapp
npm run build
pm2 restart webapp
```

---

## ✅ 테스트

1. 브라우저에서 접속: https://3000-iy14bstt9s2i67kxrmjhs-b32ec7bb.sandbox.novita.ai
2. "Sign in with Google" 버튼 클릭
3. Google 계정 선택
4. 권한 승인
5. 자동 로그인 및 온보딩 진행!

---

## 🚀 프로덕션 배포 시

### Cloudflare Pages 도메인 추가
Google Cloud Console → OAuth 클라이언트 ID 편집 → 승인된 JavaScript 원본에 추가:
```
https://heyspeak.pages.dev
https://yourdomain.com  (커스텀 도메인)
```

---

## 🔒 보안 참고사항

- 클라이언트 ID는 공개되어도 안전 (프론트엔드에서 사용)
- 클라이언트 보안 비밀은 절대 공개하지 마세요 (웹 앱에서는 사용 안 함)
- 승인된 JavaScript 원본에 신뢰할 수 있는 도메인만 추가

---

## 🎉 완료!

이제 Google 소셜 로그인이 작동합니다!
