import { Hono } from 'hono';
import type { Bindings } from '../types';

const analysis = new Hono<{ Bindings: Bindings }>();

// 세션 분석 생성 (LLM 기반)
analysis.post('/sessions/:sessionId/analyze', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    
    // 1. 세션 정보 가져오기
    const session = await c.env.DB.prepare(
      'SELECT user_id FROM sessions WHERE id = ?'
    ).bind(sessionId).first() as any;
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    // 1.5. 유저 존재 확인 (FOREIGN KEY 에러 방지)
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(session.user_id).first();
    
    if (!user) {
      console.error('User not found for session:', sessionId, 'user_id:', session.user_id);
      return c.json({ 
        error: 'User not found',
        details: `User ID ${session.user_id} does not exist. Please log in again.`
      }, 404);
    }
    
    // 2. 이미 분석된 세션인지 확인
    const existingReport = await c.env.DB.prepare(
      'SELECT id FROM session_reports WHERE session_id = ?'
    ).bind(sessionId).first();
    
    if (existingReport) {
      return c.json({ 
        success: true, 
        reportId: (existingReport as any).id,
        message: 'Report already exists'
      });
    }
    
    // 3. 세션 메시지 가져오기
    const messages = await c.env.DB.prepare(
      `SELECT role, content, transcription 
       FROM messages 
       WHERE session_id = ? 
       ORDER BY created_at ASC`
    ).bind(sessionId).all();
    
    if (!messages.results || messages.results.length === 0) {
      return c.json({ error: 'No messages found' }, 404);
    }
    
    // 4. 사용자 메시지만 필터링
    const userMessages = messages.results.filter((m: any) => m.role === 'user');
    
    if (userMessages.length < 3) {
      return c.json({ error: 'Not enough messages to analyze (minimum 3)' }, 400);
    }
    
    // 5. LLM을 사용하여 분석 (GPT-3.5-turbo로 비용 절감)
    const analysisPrompt = `You are an expert English language coach analyzing a student's conversation.

Conversation:
${userMessages.map((m: any, i: number) => `${i + 1}. ${m.content}`).join('\n')}

Analyze this conversation and provide:
1. Overall Score (0-100): Rate the student's English proficiency
2. Grammar Score (0-100)
3. Vocabulary Score (0-100)
4. Fluency Score (0-100)
5. Top 3 Errors: Identify the most important mistakes with corrections
6. Top 2 Better Expressions: Suggest more natural or advanced alternatives

IMPORTANT: Keep scores between 50-95. Be encouraging but honest.

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
      "explanation": "brief explanation in Korean",
      "category": "grammar",
      "priority": 3
    }
  ],
  "suggestions": [
    {
      "original": "student's sentence",
      "improved": "better expression",
      "explanation": "why this is better in Korean",
      "category": "vocabulary",
      "priority": 2
    }
  ],
  "total_words": <number>,
  "avg_sentence_length": <number>
}

Return ONLY the JSON, no additional text.`;

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }
    
    const response = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an English language analysis expert. Always respond with valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return c.json({ error: 'Failed to analyze conversation' }, 500);
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
    
    // 6. DB에 리포트 저장
    const reportResult = await c.env.DB.prepare(
      `INSERT INTO session_reports 
       (session_id, user_id, overall_score, grammar_score, vocabulary_score, 
        fluency_score, total_messages, total_words, avg_sentence_length, analyzed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "+9 hours"))`
    ).bind(
      sessionId,
      session.user_id,
      analysisData.overall_score || 70,
      analysisData.grammar_score || 70,
      analysisData.vocabulary_score || 70,
      analysisData.fluency_score || 70,
      userMessages.length,
      analysisData.total_words || 0,
      analysisData.avg_sentence_length || 0
    ).run();
    
    const reportId = reportResult.meta.last_row_id;
    
    // 7. 피드백 저장 (에러 최대 3개)
    const errors = (analysisData.errors || []).slice(0, 3);
    for (const error of errors) {
      await c.env.DB.prepare(
        `INSERT INTO session_feedback 
         (report_id, type, original_text, improved_text, explanation, category, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        reportId,
        'error',
        error.original || '',
        error.improved || '',
        error.explanation || '',
        error.category || 'grammar',
        error.priority || 1
      ).run();
    }
    
    // 8. 피드백 저장 (개선 제안 최대 2개)
    const suggestions = (analysisData.suggestions || []).slice(0, 2);
    for (const suggestion of suggestions) {
      await c.env.DB.prepare(
        `INSERT INTO session_feedback 
         (report_id, type, original_text, improved_text, explanation, category, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        reportId,
        'suggestion',
        suggestion.original || '',
        suggestion.improved || '',
        suggestion.explanation || '',
        suggestion.category || 'vocabulary',
        suggestion.priority || 1
      ).run();
    }
    
    // 9. sessions 테이블에 has_report 플래그 설정
    await c.env.DB.prepare(
      'UPDATE sessions SET has_report = 1 WHERE id = ?'
    ).bind(sessionId).run();
    
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

// Get latest report for user (for dashboard)
analysis.get('/users/:userId/latest-report', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    // Get the latest report for this user
    const report = await c.env.DB.prepare(`
      SELECT 
        sr.id,
        sr.session_id,
        sr.overall_score,
        sr.grammar_score,
        sr.vocabulary_score,
        sr.fluency_score,
        sr.total_messages,
        sr.total_words,
        sr.avg_sentence_length,
        sr.analyzed_at
      FROM session_reports sr
      JOIN sessions s ON sr.session_id = s.id
      WHERE s.user_id = ?
      ORDER BY sr.analyzed_at DESC
      LIMIT 1
    `).bind(userId).first();
    
    if (!report) {
      return c.json({ 
        success: false,
        message: 'No reports found'
      });
    }
    
    return c.json({ 
      success: true,
      report: report
    });
    
  } catch (error) {
    console.error('Latest report error:', error);
    return c.json({ 
      error: 'Failed to fetch latest report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default analysis;
