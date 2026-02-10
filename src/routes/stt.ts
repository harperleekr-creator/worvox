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

    // Create FormData for OpenAI API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en'); // English only for English learning

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

    const result = await response.json() as { text: string };

    return c.json({ 
      transcription: result.text,
      success: true 
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
