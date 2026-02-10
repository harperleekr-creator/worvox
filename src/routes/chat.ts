import { Hono } from 'hono';
import type { Bindings, Message } from '../types';

const chat = new Hono<{ Bindings: Bindings }>();

// Generate AI response using OpenAI GPT-4
chat.post('/message', async (c) => {
  try {
    const { sessionId, userMessage, systemPrompt } = await c.req.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return c.json({ error: 'User message is required' }, 400);
    }

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Get conversation history if sessionId is provided
    let conversationHistory: Array<{ role: string; content: string }> = [];
    
    if (sessionId) {
      const historyResult = await c.env.DB.prepare(
        'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 20'
      ).bind(sessionId).all();

      if (historyResult.results) {
        conversationHistory = historyResult.results.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    }

    // Build messages array for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful English tutor. Keep responses conversational and engaging.',
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call OpenAI Chat Completion API
    const response = await fetch(`${openaiApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return c.json({ error: 'Failed to generate response' }, 500);
    }

    const result = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const assistantMessage = result.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save messages to database if sessionId is provided
    if (sessionId) {
      // Save user message
      await c.env.DB.prepare(
        'INSERT INTO messages (session_id, role, content, transcription) VALUES (?, ?, ?, ?)'
      ).bind(sessionId, 'user', userMessage, userMessage).run();

      // Save assistant message
      await c.env.DB.prepare(
        'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)'
      ).bind(sessionId, 'assistant', assistantMessage).run();

      // Update session message count
      await c.env.DB.prepare(
        'UPDATE sessions SET total_messages = total_messages + 2 WHERE id = ?'
      ).bind(sessionId).run();
    }

    return c.json({
      message: assistantMessage,
      success: true,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return c.json({ 
      error: 'Internal server error during chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get conversation history
chat.get('/history/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    const result = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC'
    ).bind(sessionId).all();

    return c.json({
      messages: result.results || [],
      success: true,
    });

  } catch (error) {
    console.error('History error:', error);
    return c.json({ 
      error: 'Failed to fetch conversation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default chat;
