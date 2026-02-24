# 🚀 PHASE 1 구현 계획 - "대화 → 피드백 체감"

## 📊 현재 상태 분석

### ✅ 이미 구현된 기능
1. **세션 관리**
   - ✅ Session ID 생성 및 저장 (`sessions` 테이블)
   - ✅ 사용자별 세션 추적
   - ✅ 세션 시작/종료 시간 기록
   
2. **메시지 저장**
   - ✅ 사용자 발화 로그 저장 (`messages` 테이블)
   - ✅ AI 응답 로그 저장
   - ✅ 음성 전사(transcription) 저장
   - ✅ 세션별 메시지 히스토리 관리

3. **기본 UI**
   - ✅ AI 대화 인터페이스
   - ✅ History 페이지 (과거 대화 목록)
   - ✅ Statistics 페이지 (통계)

### ❌ 누락된 PHASE 1 핵심 기능
1. **자동 코칭 리포트** - 없음
2. **문장별 오류 분석** - 없음
3. **마이크로 드릴 연결** - 없음
4. **세션 종료 시 자동 분석** - 없음

---

## 🎯 PHASE 1 목표

> **"첫 사용 10분 안에 사용자가 '이 앱은 나를 분석한다'라고 느끼게 만들기"**

### 핵심 플로우
```
대화 시작 
  ↓
5-10개 메시지 교환
  ↓
[End Session] 버튼 클릭
  ↓
🎉 자동 리포트 생성
  ↓
1. 총점 (0-100점)
2. 고쳐야 할 문장 3개
3. 더 나은 표현 2개
4. [다시 연습하기] 버튼
```

---

## 📋 구현 단계별 계획

### STEP 1: 데이터베이스 스키마 확장 (30분)

**새로운 테이블 생성**

```sql
-- 세션 리포트 테이블
CREATE TABLE IF NOT EXISTS session_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  
  -- 점수 (간단 룰 기반)
  overall_score INTEGER DEFAULT 0,        -- 0-100점
  grammar_score INTEGER DEFAULT 0,        -- 문법 점수
  vocabulary_score INTEGER DEFAULT 0,     -- 어휘 점수
  fluency_score INTEGER DEFAULT 0,        -- 유창성 점수
  
  -- 통계
  total_messages INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  avg_sentence_length REAL DEFAULT 0,
  
  -- 분석 완료 시간
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 오류 및 개선 제안 테이블
CREATE TABLE IF NOT EXISTS session_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  
  -- 피드백 타입: 'error' (고쳐야 할 것) 또는 'suggestion' (더 나은 표현)
  type TEXT NOT NULL,
  
  -- 원본 문장 (사용자가 말한 것)
  original_text TEXT NOT NULL,
  
  -- 개선된 문장
  improved_text TEXT NOT NULL,
  
  -- 설명
  explanation TEXT,
  
  -- 카테고리: grammar, vocabulary, pronunciation, style
  category TEXT,
  
  -- 중요도 (1-3, 3이 가장 중요)
  priority INTEGER DEFAULT 1,
  
  -- 연습 완료 여부
  practiced BOOLEAN DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (report_id) REFERENCES session_reports(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_session_reports_session ON session_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reports_user ON session_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_report ON session_feedback(report_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_type ON session_feedback(type);
```

**마이그레이션 파일 생성:**
- `migrations/0015_add_session_analysis.sql`

---

### STEP 2: 백엔드 API 구현 (2시간)

#### 2-1. 세션 분석 API 생성

**파일:** `src/routes/analysis.ts`

```typescript
import { Hono } from 'hono';
import type { Bindings } from '../types';

const analysis = new Hono<{ Bindings: Bindings }>();

// 세션 분석 생성 (LLM 기반)
analysis.post('/sessions/:sessionId/analyze', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    
    // 1. 세션 메시지 가져오기
    const messages = await c.env.DB.prepare(
      `SELECT role, content, transcription 
       FROM messages 
       WHERE session_id = ? 
       ORDER BY created_at ASC`
    ).bind(sessionId).all();
    
    if (!messages.results || messages.results.length === 0) {
      return c.json({ error: 'No messages found' }, 404);
    }
    
    // 2. 사용자 메시지만 필터링
    const userMessages = messages.results.filter((m: any) => m.role === 'user');
    
    if (userMessages.length === 0) {
      return c.json({ error: 'No user messages found' }, 404);
    }
    
    // 3. LLM을 사용하여 분석 (GPT-4)
    const analysisPrompt = `
You are an expert English language coach analyzing a student's conversation.

Conversation:
${userMessages.map((m: any, i: number) => `${i + 1}. ${m.content}`).join('\n')}

Analyze this conversation and provide:
1. Overall Score (0-100): Rate the student's English proficiency
2. Grammar Score (0-100)
3. Vocabulary Score (0-100)
4. Fluency Score (0-100)
5. Top 3 Errors: Identify the most important mistakes with corrections
6. Top 2 Better Expressions: Suggest more natural or advanced alternatives

Format your response as JSON:
{
  "overall_score": <number>,
  "grammar_score": <number>,
  "vocabulary_score": <number>,
  "fluency_score": <number>,
  "errors": [
    {
      "original": "student's sentence",
      "improved": "corrected sentence",
      "explanation": "brief explanation",
      "category": "grammar|vocabulary|pronunciation|style",
      "priority": 1-3
    }
  ],
  "suggestions": [
    {
      "original": "student's sentence",
      "improved": "better expression",
      "explanation": "why this is better",
      "category": "vocabulary|style",
      "priority": 1-3
    }
  ],
  "total_words": <number>,
  "avg_sentence_length": <number>
}

IMPORTANT: Return ONLY the JSON, no additional text.
`;

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    
    const response = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an English language analysis expert. Always respond with valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });
    
    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }
    
    const result = await response.json() as any;
    const analysisText = result.choices[0]?.message?.content || '{}';
    
    // JSON 파싱
    let analysisData;
    try {
      analysisData = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse analysis:', analysisText);
      return c.json({ error: 'Analysis parsing failed' }, 500);
    }
    
    // 4. DB에 리포트 저장
    const session = await c.env.DB.prepare(
      'SELECT user_id FROM sessions WHERE id = ?'
    ).bind(sessionId).first() as any;
    
    const reportResult = await c.env.DB.prepare(
      `INSERT INTO session_reports 
       (session_id, user_id, overall_score, grammar_score, vocabulary_score, 
        fluency_score, total_messages, total_words, avg_sentence_length, analyzed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "+9 hours"))`
    ).bind(
      sessionId,
      session.user_id,
      analysisData.overall_score,
      analysisData.grammar_score,
      analysisData.vocabulary_score,
      analysisData.fluency_score,
      userMessages.length,
      analysisData.total_words,
      analysisData.avg_sentence_length
    ).run();
    
    const reportId = reportResult.meta.last_row_id;
    
    // 5. 피드백 저장 (에러 3개)
    for (const error of (analysisData.errors || []).slice(0, 3)) {
      await c.env.DB.prepare(
        `INSERT INTO session_feedback 
         (report_id, type, original_text, improved_text, explanation, category, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        reportId,
        'error',
        error.original,
        error.improved,
        error.explanation,
        error.category,
        error.priority
      ).run();
    }
    
    // 6. 피드백 저장 (개선 제안 2개)
    for (const suggestion of (analysisData.suggestions || []).slice(0, 2)) {
      await c.env.DB.prepare(
        `INSERT INTO session_feedback 
         (report_id, type, original_text, improved_text, explanation, category, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        reportId,
        'suggestion',
        suggestion.original,
        suggestion.improved,
        suggestion.explanation,
        suggestion.category,
        suggestion.priority
      ).run();
    }
    
    return c.json({
      success: true,
      reportId: reportId,
      analysis: analysisData
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({ 
      error: 'Failed to analyze session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// 리포트 조회
analysis.get('/reports/:reportId', async (c) => {
  try {
    const reportId = c.req.param('reportId');
    
    // 리포트 정보 가져오기
    const report = await c.env.DB.prepare(
      'SELECT * FROM session_reports WHERE id = ?'
    ).bind(reportId).first();
    
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // 피드백 가져오기
    const feedback = await c.env.DB.prepare(
      'SELECT * FROM session_feedback WHERE report_id = ? ORDER BY priority DESC, type ASC'
    ).bind(reportId).all();
    
    return c.json({
      success: true,
      report: report,
      feedback: feedback.results || []
    });
    
  } catch (error) {
    console.error('Get report error:', error);
    return c.json({ 
      error: 'Failed to fetch report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// 세션별 리포트 조회
analysis.get('/sessions/:sessionId/report', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    
    const report = await c.env.DB.prepare(
      'SELECT * FROM session_reports WHERE session_id = ?'
    ).bind(sessionId).first() as any;
    
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    const feedback = await c.env.DB.prepare(
      'SELECT * FROM session_feedback WHERE report_id = ? ORDER BY priority DESC, type ASC'
    ).bind(report.id).all();
    
    return c.json({
      success: true,
      report: report,
      feedback: feedback.results || []
    });
    
  } catch (error) {
    console.error('Get session report error:', error);
    return c.json({ 
      error: 'Failed to fetch session report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// 피드백 항목에 연습 완료 표시
analysis.post('/feedback/:feedbackId/practice', async (c) => {
  try {
    const feedbackId = c.req.param('feedbackId');
    
    await c.env.DB.prepare(
      'UPDATE session_feedback SET practiced = 1 WHERE id = ?'
    ).bind(feedbackId).run();
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error('Practice feedback error:', error);
    return c.json({ 
      error: 'Failed to mark as practiced',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default analysis;
```

**index.tsx에 추가:**
```typescript
import analysis from './routes/analysis';
app.route('/api/analysis', analysis);
```

---

### STEP 3: 프론트엔드 UI 구현 (2-3시간)

#### 3-1. 세션 종료 시 분석 트리거

**파일:** `public/static/app.js`

**수정할 함수:** `endSession()`

```javascript
async endSession() {
  try {
    if (this.currentSession) {
      // 1. 세션 종료 API 호출
      await axios.post(`/api/sessions/end/${this.currentSession}`);
      
      // 2. 분석 시작 (최소 3개 이상의 사용자 메시지가 있을 때)
      const userMessages = this.messages.filter(m => m.role === 'user');
      
      if (userMessages.length >= 3) {
        // 분석 중 로딩 표시
        this.showAnalysisLoading(this.currentSession);
        
        try {
          // 3. 분석 API 호출
          const analysisResponse = await axios.post(
            `/api/analysis/sessions/${this.currentSession}/analyze`
          );
          
          if (analysisResponse.data.success) {
            // 4. 리포트 페이지로 이동
            this.showSessionReport(analysisResponse.data.reportId);
          } else {
            throw new Error('Analysis failed');
          }
        } catch (error) {
          console.error('Analysis error:', error);
          // 분석 실패 시 그냥 대시보드로
          this.currentSession = null;
          this.currentTopic = null;
          this.messages = [];
          this.showTopicSelection();
        }
      } else {
        // 메시지가 너무 적으면 분석 없이 종료
        this.currentSession = null;
        this.currentTopic = null;
        this.messages = [];
        this.showTopicSelection();
      }
    }
  } catch (error) {
    console.error('Error ending session:', error);
    this.showTopicSelection();
  }
}
```

#### 3-2. 분석 로딩 화면

```javascript
showAnalysisLoading(sessionId) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div class="text-center p-8">
        <div class="mb-6">
          <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">🧠 AI가 대화를 분석하고 있어요</h2>
        <p class="text-gray-600">잠시만 기다려주세요...</p>
        <div class="mt-6 space-y-2 text-sm text-gray-500">
          <p>✓ 문법 체크 중</p>
          <p>✓ 어휘 분석 중</p>
          <p>✓ 개선점 찾는 중</p>
        </div>
      </div>
    </div>
  `;
}
```

#### 3-3. 리포트 페이지 (핵심!)

```javascript
async showSessionReport(reportId) {
  try {
    // 리포트 데이터 가져오기
    const response = await axios.get(`/api/analysis/reports/${reportId}`);
    const { report, feedback } = response.data;
    
    // 에러와 제안 분리
    const errors = feedback.filter(f => f.type === 'error');
    const suggestions = feedback.filter(f => f.type === 'suggestion');
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        ${this.getSidebar('conversation')}
        
        <div class="flex-1 overflow-y-auto">
          <div class="max-w-4xl mx-auto p-6 md:p-8">
            
            <!-- 헤더 -->
            <div class="text-center mb-8">
              <div class="text-6xl mb-4">🎉</div>
              <h1 class="text-3xl font-bold text-gray-800 mb-2">대화 분석 완료!</h1>
              <p class="text-gray-600">AI가 당신의 대화를 분석했어요</p>
            </div>
            
            <!-- 점수 카드 -->
            <div class="grid md:grid-cols-4 gap-4 mb-8">
              <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center">
                <div class="text-sm mb-1">종합 점수</div>
                <div class="text-4xl font-bold">${report.overall_score}</div>
                <div class="text-sm opacity-80">/ 100</div>
              </div>
              <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                <div class="text-sm text-gray-600 mb-1">문법</div>
                <div class="text-3xl font-bold text-gray-800">${report.grammar_score}</div>
              </div>
              <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                <div class="text-sm text-gray-600 mb-1">어휘</div>
                <div class="text-3xl font-bold text-gray-800">${report.vocabulary_score}</div>
              </div>
              <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                <div class="text-sm text-gray-600 mb-1">유창성</div>
                <div class="text-3xl font-bold text-gray-800">${report.fluency_score}</div>
              </div>
            </div>
            
            <!-- 고쳐야 할 문장 -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span class="text-2xl">⚠️</span>
                고쳐야 할 문장 TOP 3
              </h2>
              <div class="space-y-4">
                ${errors.map((err, i) => `
                  <div class="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                    <div class="flex items-start justify-between mb-2">
                      <span class="text-sm font-bold text-red-700">#${i + 1} ${this.getCategoryBadge(err.category)}</span>
                      <span class="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">우선순위 ${err.priority}</span>
                    </div>
                    <div class="mb-2">
                      <div class="text-sm text-gray-600 mb-1">❌ 당신의 문장:</div>
                      <div class="text-gray-800 font-mono bg-white px-3 py-2 rounded">${err.original_text}</div>
                    </div>
                    <div class="mb-2">
                      <div class="text-sm text-gray-600 mb-1">✅ 올바른 표현:</div>
                      <div class="text-green-700 font-mono bg-green-50 px-3 py-2 rounded font-semibold">${err.improved_text}</div>
                    </div>
                    <div class="text-sm text-gray-700 bg-white px-3 py-2 rounded italic">
                      💡 ${err.explanation}
                    </div>
                    <button 
                      onclick="worvox.practiceSentence(${err.id}, '${err.improved_text.replace(/'/g, "\\'")}', ${report.session_id})"
                      class="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all">
                      🔄 이 문장 다시 연습하기
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- 더 나은 표현 -->
            ${suggestions.length > 0 ? `
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span class="text-2xl">💡</span>
                더 나은 표현
              </h2>
              <div class="space-y-4">
                ${suggestions.map((sug, i) => `
                  <div class="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <div class="flex items-start justify-between mb-2">
                      <span class="text-sm font-bold text-blue-700">#${i + 1} ${this.getCategoryBadge(sug.category)}</span>
                    </div>
                    <div class="mb-2">
                      <div class="text-sm text-gray-600 mb-1">😊 당신의 표현:</div>
                      <div class="text-gray-800 font-mono bg-white px-3 py-2 rounded">${sug.original_text}</div>
                    </div>
                    <div class="mb-2">
                      <div class="text-sm text-gray-600 mb-1">🌟 더 자연스러운 표현:</div>
                      <div class="text-blue-700 font-mono bg-blue-50 px-3 py-2 rounded font-semibold">${sug.improved_text}</div>
                    </div>
                    <div class="text-sm text-gray-700 bg-white px-3 py-2 rounded italic">
                      💡 ${sug.explanation}
                    </div>
                    <button 
                      onclick="worvox.practiceSentence(${sug.id}, '${sug.improved_text.replace(/'/g, "\\'")}', ${report.session_id})"
                      class="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                      🔄 이 표현 연습하기
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <!-- 액션 버튼 -->
            <div class="flex gap-4">
              <button 
                onclick="worvox.showTopicSelection()"
                class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg">
                🏠 홈으로 돌아가기
              </button>
              <button 
                onclick="worvox.showHistory()"
                class="flex-1 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg transition-all">
                📚 히스토리 보기
              </button>
            </div>
            
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Show report error:', error);
    alert('리포트를 불러오는 데 실패했습니다.');
    this.showTopicSelection();
  }
}

getCategoryBadge(category) {
  const badges = {
    'grammar': '<span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">문법</span>',
    'vocabulary': '<span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">어휘</span>',
    'pronunciation': '<span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">발음</span>',
    'style': '<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">스타일</span>',
  };
  return badges[category] || '';
}
```

#### 3-4. 마이크로 드릴 연결

```javascript
async practiceSentence(feedbackId, sentence, sessionId) {
  // 확인 대화상자
  const confirmed = confirm(`
🎯 문장 연습하기

다음 문장을 따라 말해보세요:

"${sentence}"

준비되셨나요?
  `);
  
  if (!confirmed) return;
  
  // 1. 피드백 완료 표시
  try {
    await axios.post(`/api/analysis/feedback/${feedbackId}/practice`);
  } catch (e) {
    console.error('Failed to mark as practiced:', e);
  }
  
  // 2. 간단한 연습 UI 표시
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div class="max-w-2xl w-full p-8">
        <div class="bg-white rounded-3xl shadow-2xl p-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">🎯 문장 연습</h2>
          
          <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
            <p class="text-lg text-gray-800 font-semibold text-center leading-relaxed">
              ${sentence}
            </p>
          </div>
          
          <div class="text-center mb-6">
            <button 
              id="practiceRecordBtn"
              onclick="worvox.startPracticeRecording('${sentence.replace(/'/g, "\\'")}', ${sessionId})"
              class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-xl shadow-lg transition-all transform hover:scale-105">
              <i class="fas fa-microphone mr-2"></i>
              녹음 시작
            </button>
          </div>
          
          <div id="practiceStatus" class="text-center text-gray-600 mb-6">
            버튼을 눌러 문장을 따라 말해보세요
          </div>
          
          <button 
            onclick="worvox.showSessionReport(${sessionId})"
            class="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all">
            ← 리포트로 돌아가기
          </button>
        </div>
      </div>
    </div>
  `;
}

async startPracticeRecording(targetSentence, reportSessionId) {
  // STT로 녹음 → 비교 → 피드백
  // (간단 구현: 단순 STT만)
  
  const btn = document.getElementById('practiceRecordBtn');
  const status = document.getElementById('practiceStatus');
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle text-red-500 animate-pulse mr-2"></i>녹음 중...';
    status.textContent = '🎤 말씀하세요...';
    
    // 실제 녹음 로직 (기존 recordAudio 재사용)
    await this.startRecording();
    
    // 3초 후 자동 정지
    setTimeout(async () => {
      await this.stopRecording();
      
      status.textContent = '✅ 잘하셨어요!';
      btn.innerHTML = '<i class="fas fa-check text-green-500 mr-2"></i>완료!';
      
      setTimeout(() => {
        // 리포트로 돌아가기
        this.showSessionReport(reportSessionId);
      }, 1500);
      
    }, 3000);
    
  } catch (error) {
    console.error('Practice recording error:', error);
    status.textContent = '❌ 녹음 실패. 다시 시도해주세요.';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-microphone mr-2"></i>다시 시도';
  }
}
```

---

### STEP 4: History 페이지에 리포트 링크 추가 (30분)

**수정:** History 페이지의 각 세션에 "리포트 보기" 버튼 추가

```javascript
// showHistory() 함수 내부 세션 카드에 추가
${session.has_report ? `
  <button 
    onclick="worvox.showSessionReportBySessionId(${session.id})"
    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all">
    📊 리포트 보기
  </button>
` : ''}

async showSessionReportBySessionId(sessionId) {
  try {
    const response = await axios.get(`/api/analysis/sessions/${sessionId}/report`);
    if (response.data.success && response.data.report) {
      this.showSessionReport(response.data.report.id);
    } else {
      alert('이 세션의 리포트가 없습니다.');
    }
  } catch (error) {
    console.error('Report not found:', error);
    alert('리포트를 찾을 수 없습니다.');
  }
}
```

---

## ✅ PHASE 1 완료 기준 체크리스트

- [ ] **데이터베이스**
  - [ ] `session_reports` 테이블 생성
  - [ ] `session_feedback` 테이블 생성
  - [ ] 마이그레이션 실행 완료

- [ ] **백엔드 API**
  - [ ] `POST /api/analysis/sessions/:sessionId/analyze` 구현
  - [ ] `GET /api/analysis/reports/:reportId` 구현
  - [ ] `GET /api/analysis/sessions/:sessionId/report` 구현
  - [ ] `POST /api/analysis/feedback/:feedbackId/practice` 구현
  - [ ] GPT-4 분석 프롬프트 최적화

- [ ] **프론트엔드**
  - [ ] `endSession()` 함수에 자동 분석 트리거 추가
  - [ ] 분석 로딩 화면 구현
  - [ ] 리포트 페이지 UI 구현
  - [ ] 마이크로 드릴 연습 기능 구현
  - [ ] History 페이지에 리포트 링크 추가

- [ ] **사용자 테스트**
  - [ ] 대화 → 분석 → 리포트 플로우 테스트
  - [ ] 에러 문장 3개 표시 확인
  - [ ] 개선 제안 2개 표시 확인
  - [ ] "다시 연습하기" 버튼 동작 확인
  - [ ] 10분 내 피드백 체감 확인

---

## 🎯 예상 결과

### 사용자 경험
```
1. AI와 5-10분 대화
   ↓
2. [End Session] 클릭
   ↓
3. "AI가 대화를 분석하고 있어요" (10-20초)
   ↓
4. 🎉 리포트 화면 등장
   - 총점: 75/100
   - 문법: 70, 어휘: 80, 유창성: 75
   - 고쳐야 할 문장 3개 (빨간색)
   - 더 나은 표현 2개 (파란색)
   ↓
5. [이 문장 다시 연습하기] 클릭
   ↓
6. 문장 따라 말하기 → 완료
   ↓
7. 리포트로 복귀 or 홈으로
```

### 핵심 가치 전달
- ✅ "이 앱은 내 말을 분석한다"
- ✅ "구체적으로 뭘 고쳐야 하는지 알려준다"
- ✅ "즉시 연습할 수 있다"
- ✅ "진짜 영어 실력이 늘 것 같다"

---

## 📊 다음 단계 (PHASE 2 미리보기)

PHASE 1이 완성되면:

1. **드릴 시스템 강화**
   - 문장 비교 알고리즘
   - 발음 유사도 체크
   - 반복 연습 횟수 추적

2. **진행도 추적**
   - 주간/월간 성장 그래프
   - 취약점 카테고리 분석
   - 레벨 업 시스템

3. **동기부여**
   - 연속 학습 일수 (Streak)
   - 배지 시스템
   - 친구와 경쟁

4. **결제 연동**
   - Premium 플랜: 무제한 분석
   - Free 플랜: 일 3회 제한

---

## 🚀 구현 우선순위

| 순위 | 작업 | 소요 시간 | 중요도 |
|------|------|----------|--------|
| 1 | DB 스키마 추가 | 30분 | ⭐⭐⭐ |
| 2 | 분석 API 구현 | 2시간 | ⭐⭐⭐ |
| 3 | 리포트 UI 구현 | 2시간 | ⭐⭐⭐ |
| 4 | endSession 수정 | 30분 | ⭐⭐⭐ |
| 5 | 마이크로 드릴 | 1시간 | ⭐⭐ |
| 6 | History 연동 | 30분 | ⭐ |

**총 예상 시간: 6-7시간**

---

## 💡 구현 팁

### LLM 비용 절감
- GPT-4 대신 GPT-3.5-turbo로 시작 (10배 저렴)
- 분석 결과 캐싱
- 짧은 대화는 룰 기반 점수 사용

### 성능 최적화
- 분석은 비동기로 (사용자 대기 최소화)
- 리포트 생성 실패 시 fallback UI

### 사용자 경험
- 분석 중 로딩 화면 필수
- 점수는 항상 긍정적으로 (최소 50점 이상)
- 에러보다 '개선 기회'로 표현

---

## 📝 추가 고려사항

### A/B 테스트 준비
- 리포트 보여줌 vs 안 보여줌
- 3개 vs 5개 피드백
- 점수 vs 레벨 표시

### 데이터 수집
- 리포트 오픈율
- 연습하기 클릭률
- 리포트 후 재대화율

---

이 계획대로 구현하면 **사용자가 첫 10분 안에 "이 앱은 나를 분석한다"**는 느낌을 확실히 받을 수 있습니다! 🚀
