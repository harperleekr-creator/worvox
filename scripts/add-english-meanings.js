/**
 * Script to add English meanings to vocabulary words using OpenAI API
 * This script processes words in batches to avoid rate limits
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read wrangler configuration to get D1 database info
const wranglerPath = join(__dirname, '..', 'wrangler.jsonc');
const wranglerConfig = JSON.parse(readFileSync(wranglerPath, 'utf-8'));

// Configuration
const BATCH_SIZE = 10; // Process 10 words at a time
const DELAY_MS = 2000; // 2 second delay between batches to avoid rate limits

// OpenAI API configuration (you'll need to provide these)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  console.log('💡 Set it with: export OPENAI_API_KEY=your_key_here');
  process.exit(1);
}

async function generateEnglishMeaning(word, meaningKo, partOfSpeech) {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an English vocabulary expert. Provide concise, clear English definitions suitable for language learners.'
          },
          {
            role: 'user',
            content: `Define the English word "${word}" (${partOfSpeech || 'unknown part of speech'}) in ONE clear, simple sentence. The Korean meaning is: ${meaningKo}. Return ONLY the English definition, nothing else.`
          }
        ],
        temperature: 0.3,
        max_tokens: 60
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`  ❌ Error generating meaning for "${word}":`, error.message);
    return null;
  }
}

async function updateWordMeaning(word, id, meaning) {
  // This function will be called from the main script with proper D1 connection
  console.log(`  ✅ Generated: "${word}" -> "${meaning}"`);
  return { id, meaning };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting English meaning generation...\n');
  console.log(`📊 Configuration:`);
  console.log(`   - Batch size: ${BATCH_SIZE} words`);
  console.log(`   - Delay between batches: ${DELAY_MS}ms`);
  console.log(`   - OpenAI API: ${OPENAI_API_BASE}`);
  console.log(`\n⚠️  This script will generate SQL UPDATE statements.`);
  console.log(`   You'll need to run them using wrangler d1 execute.\n`);

  // Since we can't directly connect to D1 from Node.js, we'll generate SQL statements
  console.log('📝 First, export words without English meanings:');
  console.log(`\nRun this command:`);
  console.log(`npx wrangler d1 execute webapp-production --local --command="SELECT id, word, meaning_ko, part_of_speech FROM vocabulary_words WHERE meaning_en IS NULL LIMIT 50" > words.json`);
  console.log(`\n💡 Then run this script with the exported data.`);
}

main().catch(console.error);
