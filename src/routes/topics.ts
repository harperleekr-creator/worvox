import { Hono } from 'hono';
import type { Bindings } from '../types';

const topics = new Hono<{ Bindings: Bindings }>();

// Get all topics
topics.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM topics ORDER BY level, name'
    ).all();

    return c.json({
      topics: result.results || [],
      success: true,
    });

  } catch (error) {
    console.error('Get topics error:', error);
    return c.json({ 
      error: 'Failed to fetch topics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get topics by level
topics.get('/level/:level', async (c) => {
  try {
    const level = c.req.param('level');

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return c.json({ error: 'Invalid level' }, 400);
    }

    const result = await c.env.DB.prepare(
      'SELECT * FROM topics WHERE level = ? ORDER BY name'
    ).bind(level).all();

    return c.json({
      topics: result.results || [],
      success: true,
    });

  } catch (error) {
    console.error('Get topics by level error:', error);
    return c.json({ 
      error: 'Failed to fetch topics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get single topic
topics.get('/:topicId', async (c) => {
  try {
    const topicId = c.req.param('topicId');

    const topic = await c.env.DB.prepare(
      'SELECT * FROM topics WHERE id = ?'
    ).bind(topicId).first();

    if (!topic) {
      return c.json({ error: 'Topic not found' }, 404);
    }

    return c.json({
      topic,
      success: true,
    });

  } catch (error) {
    console.error('Get topic error:', error);
    return c.json({ 
      error: 'Failed to fetch topic',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default topics;
