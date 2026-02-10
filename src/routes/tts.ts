import { Hono } from 'hono';
import type { Bindings } from '../types';

const tts = new Hono<{ Bindings: Bindings }>();

// Text-to-Speech using ElevenLabs
tts.post('/speak', async (c) => {
  try {
    const { text } = await c.req.json();

    if (!text || typeof text !== 'string') {
      return c.json({ error: 'Text is required' }, 400);
    }

    const elevenlabsApiKey = c.env.ELEVENLABS_API_KEY;

    if (!elevenlabsApiKey) {
      return c.json({ error: 'ElevenLabs API key not configured' }, 500);
    }

    // Using Rachel voice (a clear, friendly female English voice)
    const voiceId = '21m00Tcm4TlvDq8ikWAM';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5', // Updated to latest model for free tier
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
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

// Get available voices (optional)
tts.get('/voices', async (c) => {
  try {
    const elevenlabsApiKey = c.env.ELEVENLABS_API_KEY;

    if (!elevenlabsApiKey) {
      return c.json({ error: 'ElevenLabs API key not configured' }, 500);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': elevenlabsApiKey,
      },
    });

    if (!response.ok) {
      return c.json({ error: 'Failed to fetch voices' }, 500);
    }

    const data = await response.json();
    return c.json(data);

  } catch (error) {
    console.error('Voices error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default tts;
