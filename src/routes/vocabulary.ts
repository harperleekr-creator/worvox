import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY: string
  OPENAI_API_BASE: string
}

const vocabulary = new Hono<{ Bindings: Bindings }>()

// Get all vocabulary words (for basic list view)
vocabulary.get('/list', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM vocabulary_words
      ORDER BY difficulty, id
      LIMIT 50
    `).all()

    return c.json({
      success: true,
      words: results || []
    })
  } catch (error: any) {
    console.error('Error fetching vocabulary list:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch vocabulary',
      details: error.message
    }, 500)
  }
})

// Get random words for learning
vocabulary.get('/words/random', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const difficulty = c.req.query('difficulty') || 'beginner'
    const limit = parseInt(c.req.query('limit') || '10')
    const userId = c.req.query('userId')

    // Get random words that user hasn't learned yet (if userId provided)
    let query = `
      SELECT w.* 
      FROM vocabulary_words w
      WHERE w.difficulty = ?
    `
    
    if (userId) {
      query += `
        AND w.id NOT IN (
          SELECT word_id FROM user_vocabulary_progress 
          WHERE user_id = ? AND is_learned = 1
        )
      `
    }
    
    query += `ORDER BY RANDOM() LIMIT ?`

    const params = userId ? [difficulty, userId, limit] : [difficulty, limit]
    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({
      success: true,
      words: results || []
    })
  } catch (error: any) {
    console.error('Error fetching random words:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch words',
      details: error.message
    }, 500)
  }
})

// Get words by category
vocabulary.get('/words/category/:category', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const category = c.req.param('category')
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM vocabulary_words
      WHERE category = ?
      ORDER BY id
    `).bind(category).all()

    return c.json({
      success: true,
      words: results || []
    })
  } catch (error: any) {
    console.error('Error fetching words by category:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch words',
      details: error.message
    }, 500)
  }
})

// Get all categories
vocabulary.get('/categories', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT category, COUNT(*) as word_count
      FROM vocabulary_words
      GROUP BY category
      ORDER BY category
    `).all()

    return c.json({
      success: true,
      categories: results || []
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message
    }, 500)
  }
})

// Mark word as learned
vocabulary.post('/progress', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId, wordId, isLearned } = await c.req.json()

    if (!userId || !wordId) {
      return c.json({ error: 'userId and wordId are required' }, 400)
    }

    // Insert or update progress
    await c.env.DB.prepare(`
      INSERT INTO user_vocabulary_progress (user_id, word_id, is_learned, review_count, last_reviewed_at)
      VALUES (?, ?, ?, 1, datetime('now'))
      ON CONFLICT(user_id, word_id) 
      DO UPDATE SET 
        is_learned = ?,
        review_count = review_count + 1,
        last_reviewed_at = datetime('now')
    `).bind(userId, wordId, isLearned ? 1 : 0, isLearned ? 1 : 0).run()

    return c.json({
      success: true,
      message: 'Progress updated'
    })
  } catch (error: any) {
    console.error('Error updating progress:', error)
    return c.json({
      success: false,
      error: 'Failed to update progress',
      details: error.message
    }, 500)
  }
})

// Get user's learned words count
vocabulary.get('/progress/:userId/stats', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')

    const { results: stats } = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_reviewed,
        SUM(CASE WHEN is_learned = 1 THEN 1 ELSE 0 END) as total_learned,
        SUM(review_count) as total_reviews
      FROM user_vocabulary_progress
      WHERE user_id = ?
    `).bind(userId).all()

    const { results: byDifficulty } = await c.env.DB.prepare(`
      SELECT 
        w.difficulty,
        COUNT(*) as learned_count
      FROM user_vocabulary_progress p
      JOIN vocabulary_words w ON p.word_id = w.id
      WHERE p.user_id = ? AND p.is_learned = 1
      GROUP BY w.difficulty
    `).bind(userId).all()

    return c.json({
      success: true,
      stats: stats?.[0] || { total_reviewed: 0, total_learned: 0, total_reviews: 0 },
      byDifficulty: byDifficulty || []
    })
  } catch (error: any) {
    console.error('Error fetching progress stats:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch progress',
      details: error.message
    }, 500)
  }
})

export default vocabulary
