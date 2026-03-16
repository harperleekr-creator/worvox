import { Hono } from 'hono';
import type { Bindings } from '../types';
import crypto from 'crypto';

const pronunciationAnalysis = new Hono<{ Bindings: Bindings }>();

// Helper function to generate cache key
function generateCacheKey(type: string, referenceText: string, userTranscription: string): string {
  const input = `${type}:${referenceText.toLowerCase().trim()}:${userTranscription.toLowerCase().trim()}`;
  return crypto.createHash('md5').update(input).digest('hex');
}

// Helper function to calculate Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

// Helper function to calculate quick scores
function calculateQuickScores(
  referenceText: string,
  userTranscription: string,
  audioAnalysis?: { duration: number; wordCount: number; fluencyScore: number; pronunciationScore: number }
) {
  const refWords = referenceText.toLowerCase().trim().split(/\s+/);
  const userWords = userTranscription.toLowerCase().trim().split(/\s+/);
  
  // 1. Accuracy Score (Levenshtein-based)
  const distance = levenshteinDistance(
    referenceText.toLowerCase().trim(),
    userTranscription.toLowerCase().trim()
  );
  const maxLength = Math.max(referenceText.length, userTranscription.length);
  const similarity = maxLength > 0 ? ((maxLength - distance) / maxLength) * 100 : 0;
  const accuracy = Math.max(0, Math.min(100, Math.round(similarity)));
  
  // 2. Pronunciation Score (word matching + audio analysis)
  const matchingWords = userWords.filter(word => refWords.includes(word)).length;
  const wordMatchRate = refWords.length > 0 ? (matchingWords / refWords.length) * 100 : 0;
  const pronunciation = audioAnalysis?.pronunciationScore || Math.round(wordMatchRate * 0.9);
  
  // 3. Fluency Score (use audio analysis or calculate from word count)
  const fluency = audioAnalysis?.fluencyScore || (() => {
    if (!audioAnalysis) return 70;
    const wordsPerSecond = audioAnalysis.wordCount / audioAnalysis.duration;
    // Optimal speech rate: 2-3 words/sec for English learners
    if (wordsPerSecond >= 2 && wordsPerSecond <= 3) return 90;
    if (wordsPerSecond >= 1.5 && wordsPerSecond <= 3.5) return 80;
    if (wordsPerSecond >= 1 && wordsPerSecond <= 4) return 70;
    return 60;
  })();
  
  // 4. Grammar Score (basic rule check)
  let grammarScore = 85; // Default good score
  
  // Check for common grammar issues
  const userLower = userTranscription.toLowerCase();
  
  // Subject-verb agreement issues
  if (/\b(he|she|it)\s+(go|do|have)\b/.test(userLower)) grammarScore -= 10;
  
  // Tense issues (simple detection)
  if (/yesterday.*\b(go|come|see|do)\b/.test(userLower)) grammarScore -= 10;
  if (/tomorrow.*\b(went|came|saw|did)\b/.test(userLower)) grammarScore -= 10;
  
  // Article issues (very basic)
  if (/\bi am\s+(student|teacher|doctor)\b/.test(userLower)) grammarScore -= 5;
  
  // Missing articles before countable nouns (simplified check)
  if (/\b(go to|at|in)\s+(school|university|hospital)\b/.test(userLower)) {
    // These are actually correct (go to school, at school)
  } else if (/\bhave\s+(car|house|dog|cat)\b/.test(userLower)) {
    grammarScore -= 5;
  }
  
  // Ensure score is within bounds
  const grammar = Math.max(50, Math.min(100, grammarScore));

  return { accuracy, pronunciation, fluency, grammar };
}

// Analyze pronunciation quality by comparing reference text with user transcription
pronunciationAnalysis.post('/analyze', async (c) => {
  try {
    const { 
      referenceText, 
      userTranscription, 
      audioAnalysis 
    } = await c.req.json();

    if (!referenceText || !userTranscription) {
      return c.json({ error: 'Reference text and user transcription are required' }, 400);
    }

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // 🚀 CACHE: Check if we have cached analysis
    const cacheKey = generateCacheKey('pronunciation', referenceText, userTranscription);
    
    try {
      const cached = await c.env.DB.prepare(
        'SELECT analysis_data, hit_count FROM ai_analysis_cache WHERE cache_key = ?'
      ).bind(cacheKey).first();

      if (cached) {
        // Update hit count and last used
        await c.env.DB.prepare(
          'UPDATE ai_analysis_cache SET hit_count = hit_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE cache_key = ?'
        ).bind(cacheKey).run();

        // Update cache stats
        await c.env.DB.prepare(`
          INSERT INTO ai_cache_stats (date, cache_hits, api_calls_saved, cost_saved_usd)
          VALUES (DATE('now'), 1, 1, 0.001)
          ON CONFLICT(date) DO UPDATE SET
            cache_hits = cache_hits + 1,
            api_calls_saved = api_calls_saved + 1,
            cost_saved_usd = cost_saved_usd + 0.001
        `).run();

        console.log(`✅ Cache HIT for pronunciation analysis (${cached.hit_count + 1} hits)`);
        const cachedData = JSON.parse(cached.analysis_data as string);
        return c.json({
          success: true,
          ...cachedData,
          cached: true
        });
      }
    } catch (error) {
      console.warn('⚠️ Cache lookup failed, proceeding with API call:', error);
    }

    // Optimized prompt for faster response
    const prompt = `Compare pronunciation quality:

Reference: "${referenceText}"
User said: "${userTranscription}"
${audioAnalysis ? `Speech: ${(audioAnalysis.wordCount / audioAnalysis.duration).toFixed(1)} words/sec` : ''}

Score 0-100 for:
- Accuracy: content match
- Pronunciation: clarity (STT shows quality)
- Fluency: natural flow

Respond ONLY valid JSON:
{
  "accuracy": <number>,
  "pronunciation": <number>,
  "fluency": <number>,
  "pronunciationFeedback": "<Korean: 2-3문장, 잘한점→개선점→조언>",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improve1", "improve2"],
  "pronunciationIssues": [{"word": "word", "issue": "problem", "tip": "Korean tip"}],
  "nextSteps": "<Korean: 1문장 실천조언>"
}

Guidelines:
- Native-like: 90+, Good accent: 70-85, Issues: <70
- Focus pronunciation ONLY
- Be encouraging but honest
- Keep Korean feedback concise`;

    const response = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English pronunciation and fluency analyzer. Provide accurate, strict scores based on real pronunciation quality.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent scoring
        max_tokens: 300, // Reduced for faster response (detailed analysis)
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GPT analysis error:', error);
      return c.json({ error: 'Failed to analyze pronunciation' }, 500);
    }

    const result = await response.json() as any;
    const analysisText = result.choices[0].message.content;

    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse analysis:', analysisText);
      return c.json({ 
        error: 'Failed to parse analysis result',
        fallback: {
          accuracy: 70,
          pronunciation: 70,
          fluency: audioAnalysis?.fluencyScore || 70,
          feedback: '분석 중 오류가 발생했습니다.'
        }
      }, 500);
    }

    const scores = JSON.parse(jsonMatch[0]);

    const resultData = {
      accuracy: Math.round(scores.accuracy),
      pronunciation: Math.round(scores.pronunciation),
      fluency: Math.round(scores.fluency),
      pronunciationFeedback: scores.pronunciationFeedback || '',
      strengths: scores.strengths || [],
      improvements: scores.improvements || [],
      pronunciationIssues: scores.pronunciationIssues || [],
      nextSteps: scores.nextSteps || '',
    };

    // 🚀 CACHE: Store result in cache for future use
    try {
      await c.env.DB.prepare(`
        INSERT INTO ai_analysis_cache (cache_key, cache_type, input_hash, analysis_data)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
          analysis_data = excluded.analysis_data,
          last_used_at = CURRENT_TIMESTAMP
      `).bind(
        cacheKey,
        'pronunciation',
        cacheKey,
        JSON.stringify(resultData)
      ).run();

      // Update cache stats
      await c.env.DB.prepare(`
        INSERT INTO ai_cache_stats (date, cache_misses)
        VALUES (DATE('now'), 1)
        ON CONFLICT(date) DO UPDATE SET cache_misses = cache_misses + 1
      `).run();

      console.log('✅ Analysis result cached for future use');
    } catch (error) {
      console.warn('⚠️ Failed to cache result:', error);
    }

    return c.json({
      success: true,
      ...resultData,
      cached: false
    });

  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    return c.json({ 
      error: 'Internal server error during analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Generate improved answers in batch (more efficient)
pronunciationAnalysis.post('/generate-improved-answers-batch', async (c) => {
  try {
    const { questions, userLevel = 'intermediate' } = await c.req.json();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return c.json({ error: 'Questions array is required' }, 400);
    }

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Set appropriate level for example answer
    let levelGuidance = '';
    if (userLevel === 'beginner') {
      levelGuidance = 'Use simple vocabulary and short sentences (10-15 words). Focus on basic grammar and common expressions.';
    } else if (userLevel === 'intermediate') {
      levelGuidance = 'Use intermediate vocabulary with some descriptive words. Use compound sentences (15-25 words). Include transitional phrases.';
    } else {
      levelGuidance = 'Use advanced vocabulary and complex sentence structures (20-35 words). Include idioms, nuanced expressions, and varied grammar patterns.';
    }

    // Build batch prompt for all questions
    const questionsText = questions.map((q, i) => 
      `QUESTION ${i + 1}:
"${q.question}"
${q.questionKR ? `(Korean: ${q.questionKR})` : ''}

USER'S ANSWER ${i + 1}:
"${q.userAnswer}"
`
    ).join('\n---\n\n');

    const prompt = `You are an OPIC/TOEFL speaking expert. Given multiple questions and user answers, provide IMPROVED answer examples for each.

${questionsText}

LEVEL: ${userLevel}
${levelGuidance}

For each question, generate an improved answer that:
1. Directly addresses the question
2. Is appropriate for ${userLevel} level
3. Uses natural, conversational English
4. Is more complete and well-structured than the user's answer
5. Includes specific details and examples
6. Demonstrates good speaking patterns

Respond ONLY with valid JSON array:
[
  {
    "questionId": 1,
    "improvedAnswer": "<the improved answer in English>",
    "improvedAnswerKR": "<Korean translation>",
    "keyPoints": ["<key improvement 1>", "<key improvement 2>", "<key improvement 3>"]
  },
  {
    "questionId": 2,
    ...
  }
]

KEY POINTS should explain in Korean what makes each answer better.`;

    const response = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English speaking coach specializing in OPIC and TOEFL speaking tests. Provide practical, improved answer examples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500, // Increased for multiple answers
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GPT batch improved answer error:', error);
      return c.json({ error: 'Failed to generate improved answers' }, 500);
    }

    const result = await response.json() as any;
    const answerText = result.choices[0].message.content;

    // Extract JSON array from response
    const jsonMatch = answerText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Failed to parse batch improved answers:', answerText);
      return c.json({ 
        error: 'Failed to parse improved answers',
        fallback: questions.map((_, i) => ({
          questionId: i + 1,
          improvedAnswer: 'Failed to generate improved answer.',
          improvedAnswerKR: '개선된 답변 생성 실패',
          keyPoints: []
        }))
      }, 500);
    }

    const improvedAnswers = JSON.parse(jsonMatch[0]);

    return c.json({
      success: true,
      answers: improvedAnswers
    });

  } catch (error) {
    console.error('Batch improved answer generation error:', error);
    return c.json({ 
      error: 'Internal server error during batch answer generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Generate improved answer example for exam mode (single)
pronunciationAnalysis.post('/generate-improved-answer', async (c) => {
  try {
    const { 
      question,
      questionKR,
      userAnswer,
      userLevel = 'intermediate'
    } = await c.req.json();

    if (!question || !userAnswer) {
      return c.json({ error: 'Question and user answer are required' }, 400);
    }

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Set appropriate level for example answer
    let levelGuidance = '';
    if (userLevel === 'beginner') {
      levelGuidance = 'Use simple vocabulary and short sentences (10-15 words). Focus on basic grammar and common expressions.';
    } else if (userLevel === 'intermediate') {
      levelGuidance = 'Use intermediate vocabulary with some descriptive words. Use compound sentences (15-25 words). Include transitional phrases.';
    } else {
      levelGuidance = 'Use advanced vocabulary and complex sentence structures (20-35 words). Include idioms, nuanced expressions, and varied grammar patterns.';
    }

    const prompt = `You are an OPIC/TOEFL speaking expert. Given a question and a user's answer, provide an IMPROVED answer example that the user can learn from.

QUESTION:
"${question}"
${questionKR ? `(Korean: ${questionKR})` : ''}

USER'S ANSWER:
"${userAnswer}"

LEVEL: ${userLevel}

Generate an improved answer that:
1. Directly addresses the question
2. Is appropriate for ${userLevel} level: ${levelGuidance}
3. Uses natural, conversational English
4. Is more complete and well-structured than the user's answer
5. Includes specific details and examples
6. Demonstrates good speaking patterns (transition words, varied sentence structures)

Respond ONLY with valid JSON:
{
  "improvedAnswer": "<the improved answer in English>",
  "improvedAnswerKR": "<Korean translation of the improved answer>",
  "keyPoints": [
    "<key improvement 1>",
    "<key improvement 2>",
    "<key improvement 3>"
  ]
}

KEY POINTS should explain in Korean what makes this answer better (e.g., "구체적인 예시 추가", "자연스러운 연결어 사용", "다양한 문장 구조").`;

    const response = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English speaking coach specializing in OPIC and TOEFL speaking tests. Provide practical, improved answer examples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GPT improved answer error:', error);
      return c.json({ error: 'Failed to generate improved answer' }, 500);
    }

    const result = await response.json() as any;
    const answerText = result.choices[0].message.content;

    // Extract JSON from response
    const jsonMatch = answerText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse improved answer:', answerText);
      return c.json({ 
        error: 'Failed to parse improved answer',
        fallback: {
          improvedAnswer: 'Failed to generate improved answer.',
          improvedAnswerKR: '개선된 답변 생성 실패',
          keyPoints: []
        }
      }, 500);
    }

    const improvedData = JSON.parse(jsonMatch[0]);

    return c.json({
      success: true,
      improvedAnswer: improvedData.improvedAnswer || '',
      improvedAnswerKR: improvedData.improvedAnswerKR || '',
      keyPoints: improvedData.keyPoints || [],
    });

  } catch (error) {
    console.error('Improved answer generation error:', error);
    return c.json({ 
      error: 'Internal server error during answer generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// 🚀 NEW: Quick score calculation endpoint (returns in ~500ms)
pronunciationAnalysis.post('/analyze-quick', async (c) => {
  try {
    const { 
      referenceText, 
      userTranscription, 
      audioAnalysis 
    } = await c.req.json();

    if (!referenceText || !userTranscription) {
      return c.json({ error: 'Reference text and user transcription are required' }, 400);
    }

    const startTime = Date.now();
    
    // Calculate quick scores using algorithms
    const scores = calculateQuickScores(referenceText, userTranscription, audioAnalysis);
    
    console.log(`⚡ Quick scores calculated in ${Date.now() - startTime}ms`);

    return c.json({
      success: true,
      ...scores,
      cached: false,
      quick: true,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Quick analysis error:', error);
    return c.json({ 
      error: 'Failed to calculate quick scores',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default pronunciationAnalysis;
