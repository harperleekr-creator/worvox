import { Hono } from 'hono';
import type { Bindings } from '../types';

const pronunciationAnalysis = new Hono<{ Bindings: Bindings }>();

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

    // Use GPT-4o-mini for detailed pronunciation analysis
    const prompt = `You are an expert English pronunciation coach. Analyze the following:

REFERENCE TEXT (what user should say):
"${referenceText}"

USER'S ACTUAL SPEECH (transcribed):
"${userTranscription}"

${audioAnalysis ? `
AUDIO ANALYSIS:
- Duration: ${audioAnalysis.duration}s
- Word count: ${audioAnalysis.wordCount}
- Speech rate: ${(audioAnalysis.wordCount / audioAnalysis.duration).toFixed(2)} words/sec
- Initial Fluency Score: ${audioAnalysis.fluencyScore}
- Initial Pronunciation Score: ${audioAnalysis.pronunciationScore}
` : ''}

Provide a detailed analysis with these scores (0-100):

1. **Accuracy Score**: How closely the content matches the reference text
   - 95-100: Perfect match with maybe 1 minor word difference
   - 85-94: Very close, 1-2 words different or minor grammar mistakes
   - 70-84: Good understanding, several words different but meaning preserved
   - 50-69: Partial understanding, missing key words or wrong structure
   - Below 50: Significant differences, wrong meaning or very incomplete

2. **Pronunciation Score**: Quality of pronunciation (considering transcription accuracy)
   - 95-100: Near-native, all words correctly recognized
   - 85-94: Very clear, might have 1-2 difficult words misrecognized
   - 70-84: Clear but noticeable accent, several words misrecognized
   - 50-69: Understandable but many pronunciation issues
   - Below 50: Difficult to understand, many words misrecognized

3. **Fluency Score**: Natural flow and rhythm${audioAnalysis ? ' (use provided audio analysis)' : ''}
   - 95-100: Natural rhythm, appropriate pauses, smooth delivery
   - 85-94: Good flow with minor hesitations
   - 70-84: Noticeable pauses but maintains communication
   - 50-69: Frequent pauses, choppy delivery
   - Below 50: Very slow, many long pauses, broken speech

IMPORTANT: 
- Be strict but fair - native-like performance should score 90+
- Clear non-native accent with good comprehensibility should score 70-85
- Significant pronunciation issues that affect understanding should score below 70
- Consider that STT might misrecognize words due to pronunciation issues

Respond ONLY with valid JSON:
{
  "accuracy": <number>,
  "pronunciation": <number>,
  "fluency": <number>,
  "feedback": "<detailed constructive feedback in Korean, 1-2 paragraphs>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific area to improve 1>", "<specific area to improve 2>"],
  "nextSteps": "<practical advice for next practice in Korean>"
}

FEEDBACK GUIDELINES:
- Start with what they did well (positive reinforcement)
- Point out 2-3 specific pronunciation issues with examples from their speech
- Explain WHY these issues matter (comprehension, natural flow, etc.)
- Give concrete improvement tips (tongue position, stress patterns, etc.)
- End with encouraging next steps
- Write in friendly, supportive Korean tone
- Length: 1-2 paragraphs (3-6 sentences)`;

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
        max_tokens: 500,
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

    return c.json({
      success: true,
      accuracy: Math.round(scores.accuracy),
      pronunciation: Math.round(scores.pronunciation),
      fluency: Math.round(scores.fluency),
      feedback: scores.feedback || '',
      strengths: scores.strengths || [],
      improvements: scores.improvements || [],
      nextSteps: scores.nextSteps || '',
    });

  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    return c.json({ 
      error: 'Internal server error during analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Generate improved answer example for exam mode
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

export default pronunciationAnalysis;
