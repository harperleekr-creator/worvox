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
    timer: `Generate ONE simple, unique English sentence for speaking practice. Requirements:
- Length: 5-12 words
- Grammar: Simple present, past, or future tense
- Vocabulary: Common, everyday words (A1-A2 level)
- Topics: Rotate between different themes - daily routines, food & drinks, family & friends, shopping, weather, hobbies, travel, health, home, school/work
- Style: Natural, conversational, practical for real-life use
- CRITICAL: Generate a DIFFERENT sentence each time - avoid repetitive patterns like "Set a timer..."
- Examples of variety: "I need to buy some groceries today.", "Can you help me find my keys?", "What time does the store close?", "She's cooking dinner in the kitchen.", "We usually go to the park on weekends."
Return ONLY the English sentence (no translation, no explanation).`,

    scenario: `Generate 5 unique, simple conversation sentences for realistic dialogue practice. Requirements:
- Length: 3-8 words per sentence
- Vocabulary: Basic, everyday words (A1-A2 level)
- Situations: Rotate between - greeting/introducing, restaurant/ordering, asking directions, shopping, making appointments, phone calls, hotel check-in, public transport, emergency help, basic small talk
- Style: Natural, practical, realistic conversational English
- CRITICAL: Each sentence should be DIFFERENT and context-appropriate - avoid repetitive greetings like "Hello, how are you?"
- Examples: "Table for two, please.", "Where's the nearest subway station?", "Can I try this on?", "I'd like to make a reservation.", "Is this seat taken?"
IMPORTANT: Return ONLY the dialogue text without role labels (NO "Customer:", "Waiter:", etc.). Format: numbered 1-5, one per line.`,

    exam: `Generate 5 unique OPIC-style test questions with clear difficulty progression. Requirements:
Q1-2: SIMPLE QUESTIONS (warm-up, 4-10 words each)
- Basic vocabulary, simple present/past tense
- Topics: Rotate between - personal background, daily routine, hobbies, family, hometown, food preferences, weekend activities, favorite things
- CRITICAL: Avoid generic questions like "What is your name?" - make each unique
- Examples: "What do you enjoy doing on weekends?", "Tell me about your hometown.", "What's your favorite type of food?"

Q3-4: INTERMEDIATE QUESTIONS (detailed explanation, 8-15 words each)
- Requires opinion, description, or explanation
- Topics: Rotate between - work/study experience, travel memories, problem-solving, lifestyle changes, future plans, technology use, cultural observations
- Examples: "Describe a memorable trip you've taken.", "How has technology changed your daily life?", "What are your career goals for the next five years?"

Q5: ROLE-PLAY SCENARIO (realistic situation, 15-30 words)
- Must start with "Imagine you are..." or "You're in a situation where..."
- Scenarios: Rotate between - customer service complaint, making arrangements, giving advice, business meeting, negotiation, explaining a problem, apologizing, persuading
- Examples: "Imagine you are calling a restaurant to complain about a wrong order. What would you say?", "You're in a situation where you need to reschedule an important meeting. Call your colleague to explain."

CRITICAL: Generate DIFFERENT questions each time - avoid repetitive patterns.
Return numbered 1-5, one per line.`
  },

  intermediate: {
    timer: `Generate ONE unique intermediate-level English sentence for speaking practice. Requirements:
- Length: 12-20 words
- Grammar: Mix of compound/complex sentences, various tenses, conditionals, passive voice
- Vocabulary: Everyday + some advanced words (B1-B2 level)
- Topics: Rotate between - work/career, education/learning, technology, travel/culture, social issues, environment, health & wellness, relationships, current events, personal development
- Style: More sophisticated than beginner, but still natural and conversational
- CRITICAL: Generate DIVERSE content - avoid repetitive sentence structures
- Examples: "If I had known about the meeting earlier, I would have prepared better.", "The new software update has significantly improved our team's productivity.", "Many experts believe that remote work will become more common in the future."
Return ONLY the English sentence.`,

    scenario: `Generate 5 unique, intermediate-level conversation sentences for professional/social situations. Requirements:
- Length: 8-15 words per sentence
- Vocabulary: Everyday + some advanced words (B1-B2 level)
- Situations: Rotate between - workplace discussions, job interviews, customer complaints, business meetings, networking events, presentations, negotiations, project updates, performance reviews, team collaboration
- Style: Professional yet natural, appropriate for real workplace/social scenarios
- CRITICAL: Generate DIVERSE dialogues - avoid repetitive openings like "I think..." or "Could you..."
- Examples: "We need to discuss the quarterly budget before Friday.", "I'd like to address some concerns about the project timeline.", "Could you walk me through your problem-solving approach?", "The client expressed interest in extending the contract.", "I appreciate your feedback on the proposal."
IMPORTANT: Return ONLY the dialogue text without role labels (NO "Manager:", "Employee:", etc.). Format: numbered 1-5, one per line.`,

    exam: `Generate 5 unique OPIC-style test questions with clear difficulty progression for intermediate level. Requirements:

Q1-2: SIMPLE-INTERMEDIATE QUESTIONS (warm-up, 5-10 words each)
- Vocabulary: Everyday with occasional advanced terms
- Topics: Rotate between - current job/studies, daily routines, leisure activities, travel experiences, personal interests, lifestyle preferences, cultural habits, technology use
- CRITICAL: Make each question unique and engaging - avoid generic "What do you do?" style questions
- Examples: "How do you typically spend your weekday evenings?", "What attracted you to your current field of work?", "Describe your ideal weekend getaway."

Q3-4: ANALYTICAL QUESTIONS (detailed explanation, 10-18 words each)
- Requires critical thinking, comparison, or detailed analysis
- Topics: Rotate between - work-life balance, career development, social trends, environmental issues, education systems, technological impact, cultural differences, personal growth challenges
- Examples: "How has remote work changed professional relationships in your industry?", "Compare traditional and modern approaches to learning a new language.", "What challenges do young professionals face in today's job market?"

Q5: COMPLEX ROLE-PLAY SCENARIO (realistic professional/social situation, 20-35 words)
- Must start with "Imagine you are..." or "You're in a situation where..."
- Scenarios: Rotate between - business negotiation, conflict resolution, giving constructive feedback, client presentation, team leadership, strategic planning, crisis management, cross-cultural communication
- CRITICAL: Each scenario should be unique and contextually rich
- Examples: "Imagine you are leading a project that's behind schedule. Your team is stressed, and the client is demanding results. How would you address both parties?", "You're in a situation where a colleague consistently misses deadlines, affecting team performance. You need to discuss this with them diplomatically. What would you say?"

CRITICAL: Generate DIFFERENT questions each time - vary topics, contexts, and question styles.
Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. What aspects of your job do you find most rewarding?
2. How do you usually unwind after a stressful day?
3. What role does technology play in maintaining your work-life balance?
4. How do you think education systems can better prepare students for the modern workforce?
5. Imagine you are meeting with a client who is unhappy with your team's recent deliverables. They're threatening to cancel the contract. You need to acknowledge their concerns, explain what went wrong, and propose a solution. What would you say?`
  },

  advanced: {
    timer: `Generate ONE unique advanced-level English sentence for speaking practice. Requirements:
- Length: 18-30 words
- Grammar: Complex structures - multiple clauses, advanced conditionals, subjunctive mood, sophisticated connectors
- Vocabulary: Academic, professional, nuanced terminology (C1-C2 level)
- Topics: Rotate between - global economics, scientific research, political analysis, philosophical concepts, advanced business strategy, cultural criticism, innovation & disruption, ethical dilemmas, sustainability, leadership theory
- Style: Formal, articulate, intellectually engaging
- CRITICAL: Each sentence should present unique, thought-provoking content
- Examples: "The integration of artificial intelligence into various sectors raises profound questions about the future of human employment and societal structures.", "Sustainable business practices require a fundamental shift in corporate mindset from short-term profit maximization to long-term stakeholder value creation."
Return ONLY the English sentence.`,

    scenario: `Generate 5 unique, advanced-level conversation sentences for high-level professional/academic contexts. Requirements:
- Length: 12-25 words per sentence
- Vocabulary: Academic, professional, sophisticated terminology (C1-C2 level)
- Situations: Rotate between - executive negotiations, academic conferences, strategic presentations, policy debates, board meetings, research discussions, international diplomacy, crisis leadership, thought leadership talks, high-stakes consultations
- Style: Formal, articulate, intellectually sophisticated yet natural
- CRITICAL: Each sentence should demonstrate nuanced communication - avoid simple declarative statements
- Examples: "We need to reassess our strategic positioning in light of the recent market disruptions.", "I'd like to propose a framework for evaluating the long-term sustainability of this initiative.", "The data suggests a paradigm shift in consumer behavior that we must address proactively.", "Could you elaborate on the methodological approach you employed in this research?", "Our stakeholders are seeking greater transparency regarding the decision-making process."
IMPORTANT: Return ONLY the dialogue text without role labels (NO "Speaker:", "Presenter:", etc.). Format: numbered 1-5, one per line.`,

    exam: `Generate 5 unique OPIC-style test questions for advanced level with sophisticated complexity. Requirements:

Q1-2: MODERATE-ADVANCED QUESTIONS (contextual, 6-12 words each)
- Vocabulary: Professional, nuanced terminology
- Topics: Rotate between - career philosophy, professional achievements, industry trends, leadership experiences, innovation in your field, global perspectives, cultural adaptation, specialized expertise areas
- CRITICAL: Questions should invite thoughtful, detailed responses - avoid surface-level topics
- Examples: "What defines effective leadership in your professional context?", "How has globalization influenced your industry or field?", "Describe a pivotal decision that shaped your career path."

Q3-4: ANALYTICAL-CRITICAL QUESTIONS (deep analysis, 12-20 words each)
- Requires critical thinking, synthesis, evaluation, or comparative analysis
- Topics: Rotate between - societal transformations, technological disruption, ethical frameworks, organizational change, sustainable development, cultural evolution, educational reform, economic paradigms, scientific advancement, policy implications
- CRITICAL: Each question should invite nuanced, multi-dimensional analysis
- Examples: "How do you evaluate the balance between technological innovation and privacy concerns in modern society?", "What are the most significant challenges facing organizations attempting to implement sustainable practices?", "Analyze the relationship between educational systems and workforce preparedness in the 21st century.", "How should industries navigate the tension between profitability and social responsibility?"

Q5: COMPLEX MULTI-LAYERED ROLE-PLAY (sophisticated scenario, 25-40 words)
- Must start with "Imagine you are..." or "You're in a situation where..."
- Scenarios: Rotate between - executive crisis management, international negotiations, organizational transformation, ethical dilemma resolution, strategic pivot, stakeholder conflict, policy advocacy, cultural mediation, innovation championship, reputation management
- CRITICAL: Scenarios must involve multiple competing interests and require diplomatic, strategic thinking
- Examples: "Imagine you are a CEO announcing a major organizational restructuring that will result in layoffs. You must address employees, investors, and the media while maintaining morale and company reputation. How would you communicate this?", "You're in a situation where your company's product has caused unintended harm to a community. Environmental groups, shareholders, and regulators all have different demands. How would you navigate this complex situation?", "Imagine you are leading negotiations between two conflicting departments over resource allocation. Both have valid needs, but the budget can only support one priority. How would you facilitate a resolution?"

CRITICAL: Generate intellectually diverse questions each time - vary complexity, perspectives, and contexts.
Format: Return ONLY 5 questions, one per line, numbered 1-5

Example format:
1. How do you define success in your professional journey?
2. What role does continuous learning play in your career?
3. How do cultural differences impact international business negotiations in your experience?
4. Evaluate the effectiveness of traditional hierarchical structures versus flat organizations in today's business environment.
5. Imagine you are presenting a controversial strategic initiative to the board. Several directors have expressed skepticism, citing past failures. You must address their concerns, present evidence, and convince them to approve funding. How would you structure your argument?`
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

    const { mode, level, userId, topic, description, useCache = false } = await c.req.json();

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
      userPrompt = `Generate a realistic 5-sentence conversation scenario about: "${topic}". Description: ${description || 'A typical situation'}. Make it appropriate for ${level} level English learners. CRITICAL: Return ONLY the dialogue text (e.g., "Hello! How can I help you?") WITHOUT any role labels like "Waiter:", "Customer:", "Speaker:", etc.`;
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
      // Parse numbered sentences and remove role labels
      const sentences = generatedContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          // Remove numbering (e.g., "1. ")
          let cleaned = line.replace(/^\d+\.\s*/, '').trim();
          // Remove role labels (e.g., "Waiter: ", "Customer: ", "Speaker A: ")
          cleaned = cleaned.replace(/^[A-Za-z\s]+:\s*/, '').trim();
          // Remove quotes if present
          cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
          return cleaned;
        })
        .filter(s => s.length > 0);
      
      // Parse Korean translations and remove role labels
      const translations = koreanTranslation
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          // Remove numbering
          let cleaned = line.replace(/^\d+\.\s*/, '').trim();
          // Remove Korean role labels (e.g., "웨이터: ", "고객: ")
          cleaned = cleaned.replace(/^[가-힣\s]+:\s*/, '').trim();
          // Remove quotes if present
          cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
          return cleaned;
        })
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
