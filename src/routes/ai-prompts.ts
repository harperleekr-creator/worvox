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

    exam: `You are an English learning assistant. Generate 5 simple speaking test questions for beginner learners.

Requirements:
- Create 5 simple questions
- Use basic vocabulary (1000 most common words)
- Questions should be 4-10 words each
- Use simple question forms (What, Who, Where, When, Do you...?)
- Topics: personal information, daily routine, family, hobbies, food
- Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. What is your favorite food?
2. Do you have any brothers or sisters?
3. Where do you live?
4. What do you do every day?
5. What is your hobby?`
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

    exam: `You are an English learning assistant. Generate 5 intermediate-level speaking test questions.

Requirements:
- Create 5 thoughtful questions requiring detailed answers
- Use everyday vocabulary with some advanced words
- Questions should be 8-15 words each
- Use various question forms (Why, How, Can you describe, What do you think about...?)
- Topics: work experience, education, travel, opinions, problem-solving
- Questions should encourage 30-60 second responses
- Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. Can you describe a challenging situation you faced at work?
2. What are your thoughts on working from home?
3. How do you usually prepare for important meetings?
4. Tell me about a memorable trip you've taken.
5. What skills would you like to improve in the future?`
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

    exam: `You are an English learning assistant. Generate 5 advanced-level speaking test questions requiring analytical thinking.

Requirements:
- Create 5 challenging questions requiring in-depth analysis
- Use sophisticated vocabulary and complex question structures
- Questions should be 12-25 words each
- Use analytical question forms (To what extent, Analyze, Discuss, Evaluate, Compare and contrast...)
- Topics: global issues, ethical dilemmas, business strategy, societal trends, innovation
- Questions should encourage 1-2 minute detailed responses
- Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. How has globalization impacted local cultures, and what strategies can preserve cultural identity?
2. Discuss the ethical implications of artificial intelligence in decision-making processes.
3. To what extent should companies prioritize sustainability over profitability?
4. Analyze the advantages and disadvantages of remote work in modern organizations.
5. What role does education play in addressing income inequality in society?`
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

    const { mode, level, userId } = await c.req.json();

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

    // Call OpenAI API
    const client = getOpenAIClient(c.env);
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a ${mode} prompt for ${level} level.` }
      ],
      temperature: 0.8,
      max_completion_tokens: 300
    });

    const generatedContent = completion.choices[0].message.content?.trim() || '';

    // Parse content based on mode
    let result;
    if (mode === 'timer') {
      result = { sentence: generatedContent };
    } else if (mode === 'scenario') {
      // Parse numbered sentences
      const sentences = generatedContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(s => s.length > 0);
      
      result = { sentences: sentences.slice(0, 5) };
    } else if (mode === 'exam') {
      // Parse numbered questions
      const questions = generatedContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 0);
      
      result = { questions: questions.slice(0, 5) };
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

export default aiPrompts;
