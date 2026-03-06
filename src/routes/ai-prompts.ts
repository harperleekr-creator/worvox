import { Hono } from 'hono';
import OpenAI from 'openai';
import type { Bindings } from '../types';

const aiPrompts = new Hono<{ Bindings: Bindings }>();

// Initialize OpenAI client (needs to be called with env from context)
const getOpenAIClient = (env: any) => {
  const apiKey = env.OPENAI_API_KEY;
  const baseURL = env.OPENAI_BASE_URL || env.OPENAI_API_BASE || env.OPENAI_BASE_URL;
  
  console.log('🔧 Initializing OpenAI client:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
    baseURL: baseURL || 'default (api.openai.com)',
    envKeys: Object.keys(env || {}).filter(k => k.includes('OPENAI'))
  });
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured in environment variables');
  }
  
  return new OpenAI({
    apiKey,
    baseURL,
  });
};

// System prompts for each level
const systemPrompts = {
  beginner: {
    timer: `Generate ONE simple English sentence (5-10 words, basic vocabulary, present/past tense, topics: daily life/family/food). Return only the sentence.`,

    scenario: `Generate 5 simple conversation sentences (3-8 words, basic vocabulary, situations: greeting/ordering/directions). Format: numbered 1-5, one per line.`,

    exam: `Generate 5 OPIC test questions:
Q1-2: Simple (4-10 words, basic vocab, 10-20s answer)
Q3-4: Intermediate (8-15 words, explanation needed, 30-60s)
Q5: Role-play (15-30 words, start "Imagine you are...", 60-90s)
Return numbered 1-5, one per line.`
  },

  intermediate: {
    timer: `Generate ONE intermediate sentence (12-20 words, compound/complex grammar, topics: work/education/travel). Return only the sentence.`,

    scenario: `Generate 5 intermediate conversation sentences (8-15 words, situations: workplace/interview/complaint). Format: numbered 1-5, one per line.`,

    exam: `You are an English learning assistant. Generate 5 OPIC-style speaking test questions with SPECIFIC difficulty distribution:

CRITICAL Requirements:
- Question 1-2: SIMPLE QUESTIONS (easy difficulty)
  * Use basic vocabulary
  * 5-10 words each
  * Simple present/past tense
  * Topics: background, daily life, preferences
  * Should require 15-25 second answers

- Question 3-4: INTERMEDIATE QUESTIONS (medium difficulty)
  * Use everyday vocabulary with some advanced words
  * 10-18 words each
  * Require explanation, opinion, or detailed description
  * Topics: work experience, education, travel, problem-solving, cultural topics
  * Should require 45-75 second detailed answers

- Question 5: ROLE-PLAYING SCENARIO (hard difficulty)
  * 20-35 words complex situation
  * Real-life professional or social scenario
  * Must start with "Imagine you are..." or "You're in a situation where..." or "I'm calling because..."
  * Examples: business negotiation, complaint handling, making arrangements, giving advice
  * Should require 90-120 second response with natural conversation

Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. What is your current job or field of study?
2. What do you usually do on weekends?
3. Can you describe a challenging project you worked on and how you handled it?
4. What are your thoughts on the importance of work-life balance in modern society?
5. Imagine you are meeting with a potential business partner who is 30 minutes late to an important presentation. You have another meeting scheduled right after. Call them to politely express your concern and discuss how to proceed with the shortened time. What would you say?`
  },

  advanced: {
    timer: `Generate ONE advanced sentence (18-30 words, sophisticated vocab, complex grammar, topics: business/technology/global issues). Return only the sentence.`,

    scenario: `Generate 5 advanced conversation sentences (12-25 words, professional/academic tone, situations: negotiation/presentation). Format: numbered 1-5, one per line.`,

    exam: `Generate 5 OPIC advanced questions:
Q1-2: Moderate (6-12 words, 20-30s answer)
Q3-4: Analytical (12-20 words, critical thinking, 60-90s)
Q5: Complex role-play (25-40 words, start "Imagine you are...", 2-3min response)
Return numbered 1-5, one per line.`
  }
};

// Generate AI prompt
aiPrompts.post('/generate', async (c) => {
  try {
    // Debug: Check if environment variables exist
    console.log('🔍 Environment check:', {
      hasApiKey: !!c.env.OPENAI_API_KEY,
      hasBaseUrl: !!c.env.OPENAI_API_BASE,
      apiKeyLength: c.env.OPENAI_API_KEY?.length,
      baseUrl: c.env.OPENAI_API_BASE
    });

    const { mode, level, userId, topic, description, useCache = true } = await c.req.json();

    // Validate input
    if (!mode || !level) {
      return c.json({ success: false, error: 'Mode and level are required' }, 400);
    }

    if (!['timer', 'scenario', 'exam'].includes(mode)) {
      return c.json({ success: false, error: 'Invalid mode' }, 400);
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return c.json({ success: false, error: 'Invalid level' }, 400);
    }

    // 🚀 Option B: Try cache first (for timer mode without custom topic)
    if (useCache && mode === 'timer' && !topic) {
      try {
        const cached = await c.env.DB.prepare(`
          SELECT content, created_at
          FROM ai_generated_prompts
          WHERE mode = ? AND level = ? AND user_id IS NULL
          ORDER BY RANDOM()
          LIMIT 1
        `).bind(mode, level).first();

        if (cached) {
          const cachedContent = JSON.parse(cached.content as string);
          console.log('✅ Using cached prompt:', cachedContent);
          return c.json({
            success: true,
            data: cachedContent,
            level,
            mode,
            cached: true,
            cachedAt: cached.created_at
          });
        }
      } catch (cacheError) {
        console.log('⚠️ Cache lookup failed, generating new:', cacheError);
        // Continue to generate new prompt
      }
    }

    // Check if user is Premium or Core (if userId provided)
    if (userId) {
      const user = await c.env.DB.prepare(
        'SELECT plan, use_ai_prompts FROM users WHERE id = ?'
      ).bind(userId).first<{ plan: string | null; use_ai_prompts: number }>();

      const userPlan = user?.plan || 'free';
      const aiEnabled = user?.use_ai_prompts || 0;

      console.log('👤 User plan check:', { userId, plan: userPlan, use_ai_prompts: aiEnabled });

      // Allow: premium, core, b2b plans
      if (!['premium', 'core', 'b2b'].includes(userPlan)) {
        return c.json({ 
          success: false, 
          error: `Premium or Core plan required for AI-generated prompts. Current plan: ${userPlan}`,
          requiresPremium: true,
          currentPlan: userPlan
        }, 403);
      }

      // Check if user has AI prompts enabled
      if (aiEnabled !== 1) {
        return c.json({
          success: false,
          error: 'AI prompts not enabled. Please enable in profile settings.',
          requiresActivation: true
        }, 403);
      }
    }

    // Get system prompt
    const systemPrompt = systemPrompts[level][mode];

    // Build user prompt with topic/description if provided
    let userPrompt = `Generate a ${mode} prompt for ${level} level.`;
    if (mode === 'scenario' && topic) {
      userPrompt = `Generate a realistic 5-sentence conversation scenario about: "${topic}". Description: ${description || 'A typical situation'}. Make it appropriate for ${level} level English learners.`;
    }

    // Call OpenAI API for English content
    const client = getOpenAIClient(c.env);
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_completion_tokens: 300
    });

    const generatedContent = completion.choices[0].message.content?.trim() || '';

    // Generate Korean translation
    const translationCompletion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional English-to-Korean translator. Translate the given English text to natural Korean. Only provide the translation, no explanations.'
        },
        { 
          role: 'user', 
          content: generatedContent
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 500
    });

    const koreanTranslation = translationCompletion.choices[0].message.content?.trim() || '';

    // Parse content based on mode
    let result;
    if (mode === 'timer') {
      result = { 
        sentence: generatedContent,
        translation: koreanTranslation
      };
    } else if (mode === 'scenario') {
      // Parse numbered sentences
      const sentences = generatedContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(s => s.length > 0);
      
      // Parse Korean translations
      const translations = koreanTranslation
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(s => s.length > 0);
      
      result = { 
        sentences: sentences.slice(0, 5),
        translations: translations.slice(0, 5)
      };
    } else if (mode === 'exam') {
      // Parse numbered questions
      const questions = generatedContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 0);
      
      // Parse Korean translations
      const translations = koreanTranslation
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 0);
      
      result = { 
        questions: questions.slice(0, 5),
        translations: translations.slice(0, 5)
      };
    }

    // Cache the generated prompt in database
    // 🚀 Option B: Cache for all users (global cache for common prompts)
    if (mode === 'timer' && !topic) {
      // Cache globally for timer mode (no user-specific)
      await c.env.DB.prepare(`
        INSERT INTO ai_generated_prompts (user_id, mode, level, content, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(null, mode, level, JSON.stringify(result)).run();
    } else if (userId) {
      // Cache user-specific prompts
      await c.env.DB.prepare(`
        INSERT INTO ai_generated_prompts (user_id, mode, level, content, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(userId, mode, level, JSON.stringify(result)).run();
    }

    return c.json({ 
      success: true, 
      data: result,
      level,
      mode,
      cached: false
    });

  } catch (error) {
    console.error('❌ AI prompt generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate prompt',
      debug: {
        hasApiKey: !!c.env.OPENAI_API_KEY,
        hasBaseUrl: !!c.env.OPENAI_API_BASE
      }
    }, 500);
  }
});

// Get cached prompts for offline/fallback
aiPrompts.get('/cached/:mode/:level', async (c) => {
  try {
    const { mode, level } = c.req.param();
    const limit = c.req.query('limit') || '10';

    const prompts = await c.env.DB.prepare(`
      SELECT content, created_at
      FROM ai_generated_prompts
      WHERE mode = ? AND level = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(mode, level, parseInt(limit)).all();

    return c.json({ 
      success: true, 
      prompts: prompts.results.map(p => ({
        content: JSON.parse(p.content as string),
        createdAt: p.created_at
      }))
    });

  } catch (error) {
    console.error('Cached prompts error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to retrieve cached prompts'
    }, 500);
  }
});

// Generate pronunciation feedback (Premium feature)
aiPrompts.post('/generate-pronunciation-feedback', async (c) => {
  try {
    const { 
      originalSentence, 
      userTranscription, 
      pronunciation, 
      fluency, 
      accuracy,
      context 
    } = await c.req.json();

    if (!originalSentence || !userTranscription) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400);
    }

    const openai = getOpenAIClient(c.env);

    // Focus on pronunciation and intonation for scenario mode
    const systemPrompt = context?.includes('시나리오') ? `
You are an expert English pronunciation coach specializing in real-life conversation scenarios.

Analyze the user's pronunciation focusing on:
1. **Pronunciation accuracy** (발음 정확도): Individual sound accuracy, stress patterns
2. **Intonation** (억양): Natural rhythm, pitch variation, emphasis
3. **Connected speech** (연음): Linking words naturally
4. **Native-like qualities** (원어민다운 특징): Natural flow, reduction, weak forms

Provide feedback in Korean (한글) with:
- What they did well (긍정적인 부분)
- Specific pronunciation/intonation issues (구체적 문제점)
- How to improve with examples (개선 방법 + 예시)

Keep it concise (3-5 sentences), encouraging, and actionable.
` : `
You are an expert English pronunciation coach.

Analyze the user's pronunciation and provide feedback in Korean (한글) focusing on:
1. Pronunciation accuracy
2. Fluency and rhythm
3. Areas to improve
4. Encouragement

Keep it concise (3-4 sentences) and actionable.
`;

    const userPrompt = `
원문: "${originalSentence}"
사용자 발화: "${userTranscription}"

점수:
- 정확도: ${accuracy}%
- 발음: ${pronunciation}%
- 유창성: ${fluency}%

${context || ''}

한글로 발음과 억양을 중심으로 피드백을 제공해주세요.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const feedback = completion.choices[0]?.message?.content?.trim();

    if (!feedback) {
      throw new Error('No feedback generated');
    }

    return c.json({ 
      success: true, 
      feedback 
    });

  } catch (error) {
    console.error('❌ Pronunciation feedback generation error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate feedback'
    }, 500);
  }
});

export default aiPrompts;
