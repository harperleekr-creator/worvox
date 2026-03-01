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
  "feedback": "<brief constructive feedback in Korean, 2-3 sentences>"
}`;

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
    });

  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    return c.json({ 
      error: 'Internal server error during analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default pronunciationAnalysis;
