import { Hono } from 'hono';
import type { Bindings } from '../types';

const tts = new Hono<{ Bindings: Bindings }>();

// Text-to-Speech using OpenAI TTS
tts.post('/speak', async (c) => {
  try {
    const { text } = await c.req.json();

    if (!text || typeof text !== 'string') {
      return c.json({ error: 'Text is required' }, 400);
    }

    const openaiApiKey = c.env.OPENAI_API_KEY;
    const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Using OpenAI TTS with 'alloy' voice (natural, balanced English voice)
    // Available voices: alloy, echo, fable, onyx, nova, shimmer
    const response = await fetch(`${openaiApiBase}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // tts-1 is optimized for speed, tts-1-hd for quality
        input: text,
        voice: 'nova', // nova is a warm, friendly female voice
        speed: 1.0, // 0.25 to 4.0
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS API error:', error);
      return c.json({ error: 'Failed to generate speech' }, 500);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS error:', error);
    return c.json({ 
      error: 'Internal server error during speech synthesis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get available OpenAI voices
tts.get('/voices', async (c) => {
  try {
    // OpenAI TTS available voices
    const voices = [
      { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
      { id: 'echo', name: 'Echo', description: 'Male, clear and articulate' },
      { id: 'fable', name: 'Fable', description: 'Male, warm and expressive' },
      { id: 'onyx', name: 'Onyx', description: 'Male, deep and authoritative' },
      { id: 'nova', name: 'Nova', description: 'Female, warm and friendly (default)' },
      { id: 'shimmer', name: 'Shimmer', description: 'Female, soft and gentle' },
    ];

    return c.json({
      voices,
      success: true,
    });

  } catch (error) {
    console.error('Voices error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default tts;
