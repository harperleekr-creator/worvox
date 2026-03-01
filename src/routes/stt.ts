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

    // Create FormData for OpenAI API with detailed analysis
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en'); // English only for English learning
    whisperFormData.append('response_format', 'verbose_json'); // Get detailed info
    whisperFormData.append('timestamp_granularities[]', 'word'); // Word-level timestamps

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

    // Calculate pronunciation and fluency metrics from word-level data
    let pronunciationScore = 75;
    let fluencyScore = 75;
    
    if (result.words && result.words.length > 0) {
      // Pronunciation: based on word-level confidence (if available in future updates)
      // For now, we'll use duration analysis
      const words = result.words;
      const totalDuration = result.duration || 1;
      const wordCount = words.length;
      const avgWordDuration = totalDuration / wordCount;
      
      // Fluency analysis based on pauses and rhythm
      let totalPauseTime = 0;
      let longPauses = 0;
      
      for (let i = 1; i < words.length; i++) {
        const pause = words[i].start - words[i-1].end;
        totalPauseTime += pause;
        if (pause > 0.5) longPauses++; // Pause longer than 0.5s
      }
      
      const avgPause = totalPauseTime / (words.length - 1);
      const speechRate = wordCount / totalDuration; // words per second
      
      // Score fluency (optimal: 2-3 words/sec, minimal long pauses)
      if (speechRate >= 2.0 && speechRate <= 3.5 && longPauses <= 2) {
        fluencyScore = 85 + Math.random() * 10; // 85-95
      } else if (speechRate >= 1.5 && speechRate <= 4.0 && longPauses <= 4) {
        fluencyScore = 70 + Math.random() * 15; // 70-85
      } else if (speechRate >= 1.0 && longPauses <= 6) {
        fluencyScore = 55 + Math.random() * 15; // 55-70
      } else {
        fluencyScore = 40 + Math.random() * 15; // 40-55
      }
      
      // Pronunciation score based on word duration consistency
      const durationVariance = words.reduce((sum: number, word: any) => {
        const duration = word.end - word.start;
        return sum + Math.abs(duration - avgWordDuration);
      }, 0) / words.length;
      
      if (durationVariance < 0.15) {
        pronunciationScore = 80 + Math.random() * 15; // 80-95
      } else if (durationVariance < 0.25) {
        pronunciationScore = 65 + Math.random() * 15; // 65-80
      } else if (durationVariance < 0.40) {
        pronunciationScore = 50 + Math.random() * 15; // 50-65
      } else {
        pronunciationScore = 35 + Math.random() * 15; // 35-50
      }
    }

    return c.json({ 
      transcription: result.text,
      success: true,
      // Additional analysis data
      analysis: {
        duration: result.duration || 0,
        wordCount: result.words?.length || 0,
        words: result.words || [],
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
