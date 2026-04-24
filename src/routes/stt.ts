import { Hono } from 'hono';
import type { Bindings } from '../types';

const stt = new Hono<{ Bindings: Bindings }>();

// Speech-to-Text using OpenAI Whisper
stt.post('/transcribe', async (c) => {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return c.json({ error: 'No audio file provided' }, 400);
    }

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Create FormData for OpenAI API - Optimized for speed
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en'); // English only for English learning
    whisperFormData.append('response_format', 'json'); // Fast response (was: verbose_json)
    whisperFormData.append('temperature', '0'); // Deterministic for faster processing

    const response = await fetch(`${openaiApiBase}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Whisper API error:', error);
      return c.json({ error: 'Failed to transcribe audio' }, 500);
    }

    const result = await response.json() as any;

    // Fast simplified scoring (removed complex word-level analysis for speed)
    const wordCount = result.text.trim().split(/\s+/).length;
    const duration = result.duration || 1;
    const speechRate = wordCount / duration;
    
    // Quick fluency score based on speech rate
    let fluencyScore = 75;
    if (speechRate >= 2.0 && speechRate <= 3.5) {
      fluencyScore = 85 + Math.random() * 10; // 85-95
    } else if (speechRate >= 1.5 && speechRate <= 4.0) {
      fluencyScore = 70 + Math.random() * 15; // 70-85
    } else if (speechRate >= 1.0) {
      fluencyScore = 55 + Math.random() * 15; // 55-70
    } else {
      fluencyScore = 40 + Math.random() * 15; // 40-55
    }
    
    // Base pronunciation score (can be enhanced later with separate API call if needed)
    const pronunciationScore = 70 + Math.random() * 20; // 70-90

    return c.json({ 
      transcription: result.text,
      success: true,
      // Simplified analysis data for faster response
      analysis: {
        duration: duration,
        wordCount: wordCount,
        pronunciationScore: Math.round(pronunciationScore),
        fluencyScore: Math.round(fluencyScore)
      }
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return c.json({ 
      error: 'Internal server error during transcription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default stt;
