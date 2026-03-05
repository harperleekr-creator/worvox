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
    timer: `You are an English learning assistant. Generate ONE simple English sentence for beginner learners.

Requirements:
- Use only basic vocabulary (1000 most common English words)
- Keep sentence between 5-10 words
- Use simple present tense or simple past tense
- Use simple grammar (subject + verb + object)
- Topics: daily life, family, food, weather, hobbies, pets, school
- The sentence should be natural and commonly used in real life

Return ONLY the sentence, no explanations or extra text.`,

    scenario: `You are an English learning assistant. Generate a simple conversation scenario for beginner learners.

Requirements:
- Create 5 simple conversational sentences
- Use basic vocabulary (1000 most common words)
- Each sentence should be 3-8 words
- Use simple grammar
- Common situations: greeting, ordering food, asking directions, shopping, introducing
- Format: Return ONLY 5 sentences, one per line, numbered 1-5

Example format:
1. Hello, how are you?
2. I am fine, thank you.
3. What is your name?
4. My name is John.
5. Nice to meet you.`,

    exam: `You are an English learning assistant. Generate 5 OPIC-style speaking test questions with SPECIFIC difficulty distribution:

CRITICAL Requirements:
- Question 1-2: SIMPLE QUESTIONS (easy difficulty)
  * Use basic vocabulary (1000 most common words)
  * 4-10 words each
  * Simple question forms (What is, Do you, Where do you, etc.)
  * Topics: personal info, daily routine, family, hobbies, food
  * Should require 10-20 second simple answers

- Question 3-4: INTERMEDIATE QUESTIONS (medium difficulty)
  * Use everyday vocabulary with some advanced words
  * 8-15 words each
  * Require explanation or opinion
  * Topics: work, education, travel, experiences, preferences
  * Should require 30-60 second detailed answers

- Question 5: ROLE-PLAYING SCENARIO (hard difficulty)
  * 15-30 words complex situation
  * Real-life scenario requiring natural conversation
  * Must start with "Imagine you are..." or "You are at..." or "I'm calling to..."
  * Examples: restaurant reservation, hotel complaint, job interview, customer service issue
  * Should require 60-90 second response with multiple sentences

Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. What is your favorite food?
2. Do you have any brothers or sisters?
3. Can you describe your typical day at work or school?
4. What are your thoughts on learning English? Why is it important?
5. Imagine you are at a restaurant and your order is wrong. The waiter brings you fish, but you ordered chicken. You're allergic to seafood. Explain the situation and ask for a solution politely.`
  },

  intermediate: {
    timer: `You are an English learning assistant. Generate ONE intermediate-level English sentence for learners.

Requirements:
- Use everyday vocabulary with some advanced words
- Keep sentence between 12-20 words
- Use compound sentences or complex grammar
- Include past/present/future tenses, conditionals, or passive voice
- Topics: work, education, travel, technology, health, relationships, opinions
- The sentence should express a complete idea or opinion

Return ONLY the sentence, no explanations or extra text.`,

    scenario: `You are an English learning assistant. Generate a realistic conversation scenario for intermediate learners.

Requirements:
- Create 5 conversational sentences
- Use everyday vocabulary with some advanced expressions
- Each sentence should be 8-15 words
- Include compound sentences, questions, and responses
- Situations: workplace, doctor's office, interview, complaint, making plans
- Use natural conversational English with common phrases
- Format: Return ONLY 5 sentences, one per line, numbered 1-5

Example format:
1. I'd like to schedule a meeting for next Tuesday afternoon.
2. Could you explain the project requirements in more detail?
3. I'm afraid I have a conflict at that time.
4. Let me check my calendar and get back to you.
5. That would work perfectly for me, thank you.`,

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
    timer: `You are an English learning assistant. Generate ONE advanced-level English sentence for proficient learners.

Requirements:
- Use sophisticated vocabulary and idiomatic expressions
- Keep sentence between 18-30 words
- Use complex grammar: conditionals, subjunctive, passive voice, relative clauses
- Include phrasal verbs, idioms, or advanced expressions
- Topics: business, technology, global issues, philosophy, culture, economics, politics
- The sentence should express nuanced ideas or abstract concepts

Return ONLY the sentence, no explanations or extra text.`,

    scenario: `You are an English learning assistant. Generate a sophisticated conversation scenario for advanced learners.

Requirements:
- Create 5 professional or academic conversational sentences
- Use sophisticated vocabulary and complex expressions
- Each sentence should be 12-25 words
- Include complex grammar, idioms, and formal language
- Situations: business negotiation, academic discussion, formal presentation, diplomatic conversation
- Use advanced transitional phrases and professional tone
- Format: Return ONLY 5 sentences, one per line, numbered 1-5

Example format:
1. I'd like to propose a strategic partnership that could benefit both organizations significantly.
2. While I appreciate your perspective, we need to consider the long-term implications carefully.
3. Could you elaborate on how this approach aligns with our core business objectives?
4. I believe we should explore alternative solutions before making a final decision.
5. Let's schedule a follow-up meeting to discuss the implementation timeline in greater detail.`,

    exam: `You are an English learning assistant. Generate 5 OPIC-style speaking test questions with SPECIFIC difficulty distribution:

CRITICAL Requirements:
- Question 1-2: SIMPLE-TO-MODERATE QUESTIONS (easy difficulty)
  * Use clear, straightforward vocabulary
  * 6-12 words each
  * Direct questions about experiences or preferences
  * Topics: background, interests, daily life, career
  * Should require 20-30 second answers

- Question 3-4: ANALYTICAL QUESTIONS (medium difficulty)
  * Use sophisticated vocabulary
  * 12-20 words each
  * Require critical thinking, comparison, or evaluation
  * Topics: societal issues, technology impact, cultural differences, professional challenges
  * Should require 60-90 second analytical responses

- Question 5: COMPLEX ROLE-PLAYING SCENARIO (hard difficulty)
  * 25-40 words multi-layered situation
  * Professional, diplomatic, or complex social scenario
  * Must start with "Imagine you are..." or "You're in a situation where..." or "You need to..."
  * Include multiple constraints or conflicting requirements
  * Examples: crisis management, diplomatic negotiation, ethical dilemma, strategic planning
  * Should require 2-3 minute response with structured argumentation

Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. What field are you currently working in or studying?
2. What are your long-term career aspirations?
3. How has technology transformed workplace communication, and what are the implications for team dynamics?
4. To what extent should companies prioritize employee well-being over productivity targets?
5. Imagine you are the project manager of a critical product launch scheduled for next week. Your lead developer just informed you that a major bug was discovered that could compromise user data security. Your CEO is pressuring you to launch on time due to investor commitments, but your technical team recommends a two-week delay for proper fixes. Your company's reputation and customer trust are at stake. Explain how you would handle this situation, who you would consult, and what decision you would make. Justify your reasoning.`
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

    const { mode, level, userId, topic, description } = await c.req.json();

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
      model: 'gpt-3.5-turbo',
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
      model: 'gpt-3.5-turbo',
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
    if (userId) {
      await c.env.DB.prepare(`
        INSERT INTO ai_generated_prompts (user_id, mode, level, content, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(userId, mode, level, JSON.stringify(result)).run();
    }

    return c.json({ 
      success: true, 
      data: result,
      level,
      mode
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
