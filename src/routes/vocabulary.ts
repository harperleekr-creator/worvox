import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY: string
  OPENAI_API_BASE: string
}

const vocabulary = new Hono<{ Bindings: Bindings }>()

// Search vocabulary words with hybrid approach (DB + ChatGPT)
vocabulary.get('/search', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const query = c.req.query('query')?.trim().toLowerCase()
    
    if (!query) {
      return c.json({
        success: false,
        error: 'Search query is required'
      }, 400)
    }

    // Step 1: Search in DB first (fast + free)
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM vocabulary_words
      WHERE LOWER(word) = ? OR LOWER(word) LIKE ?
      ORDER BY 
        CASE 
          WHEN LOWER(word) = ? THEN 0
          ELSE 1
        END,
        difficulty
      LIMIT 10
    `).bind(query, `${query}%`, query).all()

    if (results && results.length > 0) {
      // Found in DB
      return c.json({
        success: true,
        source: 'database',
        words: results
      })
    }

    // Step 2: Not in DB, use ChatGPT API to generate
    const openaiResponse = await fetch(`${c.env.OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an English vocabulary expert. Provide concise, accurate definitions for English words with Korean translations.'
          },
          {
            role: 'user',
            content: `Provide information about the English word "${query}" in the following JSON format:
{
  "word": "${query}",
  "meaning_ko": "Korean translation",
  "meaning_en": "Simple English definition in one clear sentence",
  "pronunciation": "IPA pronunciation",
  "part_of_speech": "noun/verb/adjective/etc",
  "example_sentence": "One simple example sentence",
  "difficulty": "beginner/intermediate/advanced",
  "toeic_related": true/false,
  "toefl_related": true/false,
  "summary": [
    "Core meaning in 1-2 lines",
    "TOEIC/TOEFL tip if applicable, or usage context",
    "2-3 synonyms or related words",
    "One common collocation or phrase",
    "Pronunciation tip or common mistake to avoid"
  ]
}

Return ONLY valid JSON, no other text. If the word doesn't exist or is invalid, return {"error": "Word not found"}.`
          }
        ],
        temperature: 0.3
      })
    })

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed')
    }

    const openaiData = await openaiResponse.json() as any
    const content = openaiData.choices[0].message.content.trim()
    
    // Parse JSON response
    let wordData
    try {
      wordData = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Failed to parse word data')
    }

    if (wordData.error) {
      return c.json({
        success: false,
        error: 'Word not found',
        message: `"${query}" is not a valid English word.`
      }, 404)
    }

    // Step 3: Save to DB for future searches (caching)
    try {
      await c.env.DB.prepare(`
        INSERT INTO vocabulary_words 
        (word, meaning_ko, meaning_en, pronunciation, part_of_speech, example_sentence, difficulty, category, toeic_related, toefl_related)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        wordData.word,
        wordData.meaning_ko,
        wordData.meaning_en || null,
        wordData.pronunciation,
        wordData.part_of_speech,
        wordData.example_sentence,
        wordData.difficulty,
        'ai_generated',
        wordData.toeic_related ? 1 : 0,
        wordData.toefl_related ? 1 : 0
      ).run()
    } catch (dbError) {
      console.error('Failed to save word to DB:', dbError)
      // Continue anyway - word will be returned even if save fails
    }

    // Return ChatGPT generated word with summary
    return c.json({
      success: true,
      source: 'chatgpt',
      words: [wordData]
    })

  } catch (error: any) {
    console.error('Error searching vocabulary:', error)
    return c.json({
      success: false,
      error: 'Failed to search vocabulary',
      details: error.message
    }, 500)
  }
})

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

// Get all user progress (for individual word status)
vocabulary.get('/progress/:userId/all', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')

    const { results } = await c.env.DB.prepare(`
      SELECT word_id, is_learned, review_count, last_reviewed_at
      FROM user_vocabulary_progress
      WHERE user_id = ?
    `).bind(userId).all()

    return c.json({
      success: true,
      progress: results || []
    })
  } catch (error: any) {
    console.error('Error fetching all progress:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch progress',
      details: error.message
    }, 500)
  }
})

// Bookmark endpoints
vocabulary.post('/bookmarks', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId, wordId } = await c.req.json()

    if (!userId || !wordId) {
      return c.json({ error: 'userId and wordId are required' }, 400)
    }

    await c.env.DB.prepare(`
      INSERT INTO vocabulary_bookmarks (user_id, word_id)
      VALUES (?, ?)
      ON CONFLICT(user_id, word_id) DO NOTHING
    `).bind(userId, wordId).run()

    return c.json({
      success: true,
      message: 'Bookmark added'
    })
  } catch (error: any) {
    console.error('Error adding bookmark:', error)
    return c.json({
      success: false,
      error: 'Failed to add bookmark',
      details: error.message
    }, 500)
  }
})

vocabulary.get('/bookmarks/:userId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')

    const { results } = await c.env.DB.prepare(`
      SELECT word_id, created_at
      FROM vocabulary_bookmarks
      WHERE user_id = ?
    `).bind(userId).all()

    return c.json({
      success: true,
      bookmarks: results || []
    })
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch bookmarks',
      details: error.message
    }, 500)
  }
})

vocabulary.delete('/bookmarks/:userId/:wordId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')
    const wordId = c.req.param('wordId')

    await c.env.DB.prepare(`
      DELETE FROM vocabulary_bookmarks
      WHERE user_id = ? AND word_id = ?
    `).bind(userId, wordId).run()

    return c.json({
      success: true,
      message: 'Bookmark removed'
    })
  } catch (error: any) {
    console.error('Error removing bookmark:', error)
    return c.json({
      success: false,
      error: 'Failed to remove bookmark',
      details: error.message
    }, 500)
  }
})

// Custom wordbook endpoints
vocabulary.post('/wordbooks', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { userId, name, description } = await c.req.json()

    if (!userId || !name) {
      return c.json({ error: 'userId and name are required' }, 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO custom_wordbooks (user_id, name, description)
      VALUES (?, ?, ?)
    `).bind(userId, name, description || null).run()

    return c.json({
      success: true,
      wordbookId: result.meta.last_row_id,
      message: 'Wordbook created'
    })
  } catch (error: any) {
    console.error('Error creating wordbook:', error)
    return c.json({
      success: false,
      error: 'Failed to create wordbook',
      details: error.message
    }, 500)
  }
})

vocabulary.get('/wordbooks/:userId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const userId = c.req.param('userId')

    const { results } = await c.env.DB.prepare(`
      SELECT id, name, description, created_at
      FROM custom_wordbooks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all()

    return c.json({
      success: true,
      wordbooks: results || []
    })
  } catch (error: any) {
    console.error('Error fetching wordbooks:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch wordbooks',
      details: error.message
    }, 500)
  }
})

vocabulary.post('/wordbooks/:wordbookId/words', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const wordbookId = c.req.param('wordbookId')
    const { wordId } = await c.req.json()

    if (!wordId) {
      return c.json({ error: 'wordId is required' }, 400)
    }

    await c.env.DB.prepare(`
      INSERT INTO wordbook_words (wordbook_id, word_id)
      VALUES (?, ?)
      ON CONFLICT(wordbook_id, word_id) DO NOTHING
    `).bind(wordbookId, wordId).run()

    return c.json({
      success: true,
      message: 'Word added to wordbook'
    })
  } catch (error: any) {
    console.error('Error adding word to wordbook:', error)
    return c.json({
      success: false,
      error: 'Failed to add word',
      details: error.message
    }, 500)
  }
})

vocabulary.get('/wordbooks/:wordbookId/words', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const wordbookId = c.req.param('wordbookId')

    const { results } = await c.env.DB.prepare(`
      SELECT w.*
      FROM vocabulary_words w
      JOIN wordbook_words ww ON w.id = ww.word_id
      WHERE ww.wordbook_id = ?
      ORDER BY ww.created_at DESC
    `).bind(wordbookId).all()

    return c.json({
      success: true,
      words: results || []
    })
  } catch (error: any) {
    console.error('Error fetching wordbook words:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch words',
      details: error.message
    }, 500)
  }
})

vocabulary.delete('/wordbooks/:wordbookId/words/:wordId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const wordbookId = c.req.param('wordbookId')
    const wordId = c.req.param('wordId')

    await c.env.DB.prepare(`
      DELETE FROM wordbook_words
      WHERE wordbook_id = ? AND word_id = ?
    `).bind(wordbookId, wordId).run()

    return c.json({
      success: true,
      message: 'Word removed from wordbook'
    })
  } catch (error: any) {
    console.error('Error removing word from wordbook:', error)
    return c.json({
      success: false,
      error: 'Failed to remove word',
      details: error.message
    }, 500)
  }
})

vocabulary.delete('/wordbooks/:wordbookId', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const wordbookId = c.req.param('wordbookId')

    // Delete all words in the wordbook first
    await c.env.DB.prepare(`
      DELETE FROM wordbook_words WHERE wordbook_id = ?
    `).bind(wordbookId).run()

    // Delete the wordbook
    await c.env.DB.prepare(`
      DELETE FROM custom_wordbooks WHERE id = ?
    `).bind(wordbookId).run()

    return c.json({
      success: true,
      message: 'Wordbook deleted'
    })
  } catch (error: any) {
    console.error('Error deleting wordbook:', error)
    return c.json({
      success: false,
      error: 'Failed to delete wordbook',
      details: error.message
    }, 500)
  }
})

export default vocabulary
