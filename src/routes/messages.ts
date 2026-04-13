import { Hono } from 'hono';
import type { Bindings } from '../types';

const messages = new Hono<{ Bindings: Bindings }>();

// Create a new message
messages.post('/create', async (c) => {
  try {
    const { sessionId, role, content, audioUrl, transcription } = await c.req.json();

    // Validate required fields
    if (!sessionId || !role || !content) {
      return c.json({ 
        error: 'Missing required fields: sessionId, role, content' 
      }, 400);
    }

    // Validate role
    if (role !== 'system' && role !== 'user') {
      return c.json({ 
        error: 'Invalid role. Must be "system" or "user"' 
      }, 400);
    }

    // Insert message into database
    const result = await c.env.DB.prepare(`
      INSERT INTO messages (session_id, role, content, audio_url, transcription, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(sessionId, role, content, audioUrl || null, transcription || null).run();

    const messageId = result.meta.last_row_id;

    return c.json({
      success: true,
      messageId,
      message: 'Message created successfully'
    }, 201);

  } catch (error: any) {
    console.error('❌ Error creating message:', error);
    return c.json({ 
      error: 'Failed to create message',
      details: error.message 
    }, 500);
  }
});

// Get messages by session ID
messages.get('/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    const result = await c.env.DB.prepare(`
      SELECT id, session_id, role, content, audio_url, transcription, created_at
      FROM messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).bind(sessionId).all();

    return c.json({
      success: true,
      count: result.results.length,
      messages: result.results
    });

  } catch (error: any) {
    console.error('❌ Error fetching messages:', error);
    return c.json({ 
      error: 'Failed to fetch messages',
      details: error.message 
    }, 500);
  }
});

export default messages;
