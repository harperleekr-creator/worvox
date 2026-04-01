import { Hono } from 'hono';
import type { Bindings } from '../types';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  CommonErrors, 
  ErrorCodes,
  getHTTPStatus 
} from '../utils/error-handler';

const topics = new Hono<{ Bindings: Bindings }>();

// Get all topics
topics.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT * FROM topics 
       ORDER BY 
         CASE name
           WHEN 'Vocabulary' THEN 1
           WHEN 'Daily Conversation' THEN 2
           WHEN 'Travel English' THEN 3
           WHEN 'Job Interview' THEN 4
           WHEN 'Business English' THEN 5
           ELSE 6
         END`
    ).all();

    return c.json(createSuccessResponse({
      topics: result.results || []
    }));

  } catch (error) {
    console.error('Get topics error:', error);
    const errorResponse = CommonErrors.databaseError('fetch topics');
    return c.json(errorResponse, getHTTPStatus(errorResponse.error.code));
  }
});

// Get topics by level
topics.get('/level/:level', async (c) => {
  try {
    const level = c.req.param('level');

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      const errorResponse = createErrorResponse(
        ErrorCodes.VALIDATION_INVALID_FORMAT,
        '유효하지 않은 레벨입니다.',
        { level, validLevels: ['beginner', 'intermediate', 'advanced'] }
      );
      return c.json(errorResponse, getHTTPStatus(errorResponse.error.code));
    }

    const result = await c.env.DB.prepare(
      'SELECT * FROM topics WHERE level = ? ORDER BY name'
    ).bind(level).all();

    return c.json(createSuccessResponse({
      topics: result.results || []
    }));

  } catch (error) {
    console.error('Get topics by level error:', error);
    const errorResponse = CommonErrors.databaseError('fetch topics by level');
    return c.json(errorResponse, getHTTPStatus(errorResponse.error.code));
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
      const errorResponse = createErrorResponse(
        ErrorCodes.RESOURCE_NOT_FOUND,
        '토픽을 찾을 수 없습니다.',
        { topicId }
      );
      return c.json(errorResponse, getHTTPStatus(errorResponse.error.code));
    }

    return c.json(createSuccessResponse({ topic }));

  } catch (error) {
    console.error('Get topic error:', error);
    const errorResponse = CommonErrors.databaseError('fetch topic');
    return c.json(errorResponse, getHTTPStatus(errorResponse.error.code));
  }
});

export default topics;
