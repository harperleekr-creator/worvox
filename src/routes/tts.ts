import { Hono } from 'hono';
import type { Bindings } from '../types';

const tts = new Hono<{ Bindings: Bindings }>();

// Scenario-specific voice mapping (Premium feature)
const SCENARIO_VOICES = {
  // 군사/국방
  '군사 영어': { provider: 'elevenlabs', voice: 'pNInz6obpgDQGcFmaJgB', name: 'Adam - Military Officer' },
  '군대 훈련': { provider: 'elevenlabs', voice: 'pNInz6obpgDQGcFmaJgB', name: 'Adam - Military Officer' },
  
  // 의료/병원
  '병원 대화': { provider: 'elevenlabs', voice: 'nPczCjzI2devNBz1zQrb', name: 'Brian - Doctor' },
  '응급실': { provider: 'elevenlabs', voice: 'nPczCjzI2devNBz1zQrb', name: 'Brian - Doctor' },
  
  // 비즈니스
  '비즈니스 회의': { provider: 'elevenlabs', voice: 'ErXwobaYiN019PkySvjV', name: 'Antoni - Business Professional' },
  '프레젠테이션': { provider: 'elevenlabs', voice: 'ErXwobaYiN019PkySvjV', name: 'Antoni - Business Professional' },
  
  // 호텔/서비스
  '호텔 체크인': { provider: 'elevenlabs', voice: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Hotel Staff' },
  '호텔 서비스': { provider: 'elevenlabs', voice: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Hotel Staff' },
  
  // 공항/여행
  '공항 안내': { provider: 'elevenlabs', voice: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Airport Staff' },
  '비행기': { provider: 'elevenlabs', voice: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Airport Staff' },
  
  // 레스토랑
  '레스토랑 주문': { provider: 'elevenlabs', voice: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Waitress' },
  
  // Default (OpenAI for Free users and unmapped scenarios)
  'default': { provider: 'openai', voice: 'nova', name: 'Nova - Default' }
};

// Text-to-Speech using OpenAI TTS or ElevenLabs (Premium)
tts.post('/speak', async (c) => {
  try {
    const { text, scenario, isPremium } = await c.req.json();

    if (!text || typeof text !== 'string') {
      return c.json({ error: 'Text is required' }, 400);
    }

    // Determine voice based on scenario and premium status
    const voiceConfig = (isPremium && scenario && SCENARIO_VOICES[scenario]) 
      ? SCENARIO_VOICES[scenario] 
      : SCENARIO_VOICES['default'];

    console.log(`🎙️ TTS Request: Premium=${isPremium}, Scenario=${scenario}, Provider=${voiceConfig.provider}, Voice=${voiceConfig.name}`);

    // Route to appropriate TTS provider
    if (voiceConfig.provider === 'elevenlabs' && isPremium) {
      // ElevenLabs TTS (Premium only)
      const elevenlabsApiKey = c.env.ELEVENLABS_API_KEY;
      
      if (!elevenlabsApiKey) {
        console.warn('⚠️ ElevenLabs API key not configured, falling back to OpenAI');
        // Fallback to OpenAI
        return generateOpenAITTS(c, text, 'nova');
      }

      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voice}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenlabsApiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('❌ ElevenLabs TTS API error:', error);
          // Fallback to OpenAI
          return generateOpenAITTS(c, text, 'nova');
        }

        const audioBuffer = await response.arrayBuffer();
        console.log(`✅ ElevenLabs TTS success: ${audioBuffer.byteLength} bytes`);

        return new Response(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
            'X-Voice-Provider': 'elevenlabs',
            'X-Voice-Name': voiceConfig.name,
          },
        });
      } catch (error) {
        console.error('❌ ElevenLabs TTS error:', error);
        // Fallback to OpenAI
        return generateOpenAITTS(c, text, 'nova');
      }
    } else {
      // OpenAI TTS (Free users or default)
      return generateOpenAITTS(c, text, voiceConfig.voice);
    }

  } catch (error) {
    console.error('❌ TTS error:', error);
    return c.json({ 
      error: 'Internal server error during speech synthesis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Helper function to generate OpenAI TTS
async function generateOpenAITTS(c: any, text: string, voice: string) {
  const openaiApiKey = c.env.OPENAI_API_KEY;
  const openaiApiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  if (!openaiApiKey) {
    return c.json({ error: 'OpenAI API key not configured' }, 500);
  }

  const response = await fetch(`${openaiApiBase}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd', // HD model for better quality (same speed as tts-1)
      input: text,
      voice: voice,
      speed: 1.15, // 15% faster playback for quicker responses
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ OpenAI TTS API error:', error);
    return c.json({ error: 'Failed to generate speech' }, 500);
  }

  const audioBuffer = await response.arrayBuffer();
  console.log(`✅ OpenAI TTS success: ${audioBuffer.byteLength} bytes`);

  return new Response(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength.toString(),
      'X-Voice-Provider': 'openai',
      'X-Voice-Name': voice,
    },
  });
}

// Get available voices (including Premium ElevenLabs voices)
tts.get('/voices', async (c) => {
  try {
    const { isPremium } = c.req.query();

    // OpenAI TTS voices (Free tier)
    const freeVoices = [
      { id: 'nova', name: 'Nova', description: 'Female, warm and friendly', provider: 'openai', tier: 'free' },
      { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', provider: 'openai', tier: 'free' },
      { id: 'echo', name: 'Echo', description: 'Male, clear and articulate', provider: 'openai', tier: 'free' },
      { id: 'fable', name: 'Fable', description: 'Male, warm and expressive', provider: 'openai', tier: 'free' },
      { id: 'onyx', name: 'Onyx', description: 'Male, deep and authoritative', provider: 'openai', tier: 'free' },
      { id: 'shimmer', name: 'Shimmer', description: 'Female, soft and gentle', provider: 'openai', tier: 'free' },
    ];

    // ElevenLabs voices (Premium tier)
    const premiumVoices = [
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Military Officer - Deep, authoritative male', provider: 'elevenlabs', tier: 'premium', scenarios: ['군사 영어', '군대 훈련'] },
      { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Doctor - Professional, calm male', provider: 'elevenlabs', tier: 'premium', scenarios: ['병원 대화', '응급실'] },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Business Professional - Confident, clear male', provider: 'elevenlabs', tier: 'premium', scenarios: ['비즈니스 회의', '프레젠테이션'] },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Service Staff - Friendly, elegant female', provider: 'elevenlabs', tier: 'premium', scenarios: ['호텔 체크인', '레스토랑 주문'] },
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Airport Staff - Clear, professional female', provider: 'elevenlabs', tier: 'premium', scenarios: ['공항 안내', '비행기'] },
    ];

    const allVoices = isPremium === 'true' ? [...freeVoices, ...premiumVoices] : freeVoices;

    return c.json({
      voices: allVoices,
      success: true,
      scenarioMapping: SCENARIO_VOICES,
    });

  } catch (error) {
    console.error('Voices error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ✅ Add /synthesize endpoint as alias to /speak for compatibility
tts.post('/synthesize', async (c) => {
  try {
    const { text, scenario, isPremium } = await c.req.json();

    if (!text || typeof text !== 'string') {
      return c.json({ error: 'Text is required' }, 400);
    }

    // Determine voice based on scenario and premium status
    const voiceConfig = (isPremium && scenario && SCENARIO_VOICES[scenario]) 
      ? SCENARIO_VOICES[scenario] 
      : SCENARIO_VOICES['default'];

    console.log(`🎙️ TTS Request (synthesize): Premium=${isPremium}, Scenario=${scenario}, Provider=${voiceConfig.provider}, Voice=${voiceConfig.name}`);

    // Route to appropriate TTS provider
    if (voiceConfig.provider === 'elevenlabs' && isPremium) {
      // ElevenLabs TTS (Premium only)
      const elevenlabsApiKey = c.env.ELEVENLABS_API_KEY;
      
      if (!elevenlabsApiKey) {
        console.warn('⚠️ ElevenLabs API key not configured, falling back to OpenAI');
        // Fallback to OpenAI
        return generateOpenAITTS(c, text, 'nova');
      }

      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voice}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenlabsApiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('❌ ElevenLabs TTS API error:', error);
          // Fallback to OpenAI
          return generateOpenAITTS(c, text, 'nova');
        }

        const audioBuffer = await response.arrayBuffer();
        console.log(`✅ ElevenLabs TTS success: ${audioBuffer.byteLength} bytes`);

        return new Response(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
            'X-Voice-Provider': 'elevenlabs',
            'X-Voice-Name': voiceConfig.name,
          },
        });
      } catch (error) {
        console.error('❌ ElevenLabs TTS error:', error);
        // Fallback to OpenAI
        return generateOpenAITTS(c, text, 'nova');
      }
    } else {
      // OpenAI TTS (Free users or default)
      return generateOpenAITTS(c, text, voiceConfig.voice);
    }

  } catch (error) {
    console.error('❌ TTS synthesize error:', error);
    return c.json({ 
      error: 'Internal server error during speech synthesis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default tts;
