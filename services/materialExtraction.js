import Constants from 'expo-constants';
import itemsData from '../data/items.json';

const getApiKey = () => {
  const apiKeyFromEnv = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const apiKeyFromExtra = Constants.expoConfig?.extra?.EXPO_PUBLIC_GROQ_API_KEY;
  return apiKeyFromEnv || apiKeyFromExtra;
};

const enToInfo = {};
for (const [en, info] of Object.entries(itemsData)) {
  enToInfo[en.toLowerCase()] = info;
}

const arToEn = {};
const allNames = [];
for (const [en, info] of Object.entries(enToInfo)) {
  arToEn[info.arname] = en;
  allNames.push(en.toLowerCase(), info.arname);
}

function normalizeUnit(unit) {
  const u = unit.trim().toLowerCase();
  if (['kg', 'كيلو', 'كجم', 'kilogram', 'kilograms'].includes(u)) return 'KG';
  return 'piece';
}

function fuzzyMatch(input, candidates, threshold = 80) {
  input = input.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase();
    
    // Exact match
    if (input === candidateLower) {
      return { match: candidate, score: 100 };
    }
    
    // Contains match
    if (candidateLower.includes(input) || input.includes(candidateLower)) {
      const score = Math.max(
        (input.length / candidateLower.length) * 90,
        (candidateLower.length / input.length) * 90
      );
      if (score > bestScore) {
        bestMatch = candidate;
        bestScore = score;
      }
    }
    
    // Levenshtein distance approximation
    const maxLen = Math.max(input.length, candidateLower.length);
    const minLen = Math.min(input.length, candidateLower.length);
    const ratio = (minLen / maxLen) * 100;
    
    if (ratio > 60) { // Basic similarity threshold
      let commonChars = 0;
      for (let i = 0; i < minLen; i++) {
        if (input[i] === candidateLower[i]) commonChars++;
      }
      const score = (commonChars / maxLen) * 100;
      if (score > bestScore) {
        bestMatch = candidate;
        bestScore = score;
      }
    }
  }

  return bestScore >= threshold ? { match: bestMatch, score: bestScore } : null;
}

function mapToCanonicalMaterial(input) {
  const cleaned = input.trim().toLowerCase();
  
  // Direct English match
  if (enToInfo[cleaned]) {
    return { name: cleaned, unit: enToInfo[cleaned].unit };
  }
  
  // Fuzzy matching
  const fuzzyResult = fuzzyMatch(cleaned, allNames);
  if (fuzzyResult) {
    const match = fuzzyResult.match;
    if (enToInfo[match]) {
      return { name: match, unit: enToInfo[match].unit };
    }
    if (arToEn[match]) {
      return { name: arToEn[match], unit: enToInfo[arToEn[match]].unit };
    }
  }
  
  return null;
}

const SYSTEM_PROMPT = `
You are a professional AI assistant for a recycling app. Extract a list of materials, their quantities, and units from noisy, possibly misspelled, Arabic or English speech transcriptions.

Rules:
- CRITICAL: Only return valid JSON in this exact format:
{
  "items": [
    {
      "material": "English name here",
      "quantity": float,
      "unit": "KG" | "piece"
    }
  ]
}
- If you do not follow this, the system will fail.
- Only use materials from the provided list (see below). If a material is not in the list, ignore it.
- If a material appears multiple times, merge them and sum their quantities.
- For each material, use the canonical English name from the list.
- If the unit is missing or ambiguous, use the default unit for that material from the list.
- Accept both Arabic and English names, and be robust to typos and variants.
- If the quantity is missing, assume 1.
- Accept both singular and plural units ("piece", "pieces", "KG").
- Do not output any explanation, only the JSON object.

Material List (English name, Arabic name, unit):
${Object.entries(enToInfo)
  .map(([en, info]) => `- ${en} (${info.arname}) [${info.unit}]`)
  .join('\n')}

Example:
Input: "3 كيلو بلاستيك و 2 كراسي و مكواة"
Output: {
  "items": [
    { "material": "Plastics", "quantity": 3, "unit": "KG" },
    { "material": "Chair", "quantity": 2, "unit": "piece" },
    { "material": "Iron", "quantity": 1, "unit": "piece" }
  ]
}
`;

export async function extractMaterialsFromTranscription(transcription) {
  try {
    const apiKey = getApiKey();
    console.log('🧠 Starting material extraction for:', transcription);
    console.log('🔑 API Key present:', !!apiKey);
    
    if (!apiKey) {
      throw new Error('No API key found. Please check your environment configuration.');
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Input: ${transcription}` },
        ],
      }),
    });

    console.log('🧠 Material extraction API status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Groq Chat Error:', errorData);
      throw new Error(`Material extraction failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    
    console.log('🧠 Raw AI output:', rawContent);

    if (!rawContent) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let parsed = [];
    try {
      const raw = JSON.parse(rawContent);
      if (Array.isArray(raw)) {
        parsed = raw;
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray(raw.items)) {
          parsed = raw.items;
        } else if (Array.isArray(raw.materials)) {
          parsed = raw.materials;
        } else {
          parsed = [];
        }
      }
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return [];
    }

    console.log('🧠 Parsed materials:', parsed);

    // Process and validate the results
    const materialCounts = {}; // For merging duplicates

    for (const item of parsed) {
      if (!item.material) continue;
      
      const mapped = mapToCanonicalMaterial(item.material);
      if (!mapped) continue;
      
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      const unit = item.unit ? normalizeUnit(item.unit) : normalizeUnit(mapped.unit);
      
      // Find the canonical name (proper case)
      const canonicalName = Object.keys(itemsData).find(
        k => k.toLowerCase() === mapped.name
      ) || mapped.name;

      // Merge duplicates
      const key = `${canonicalName}_${unit}`;
      if (materialCounts[key]) {
        materialCounts[key].quantity += quantity;
      } else {
        materialCounts[key] = {
          material: canonicalName,
          quantity,
          unit,
        };
      }
    }

    // Convert back to array
    const result = Object.values(materialCounts);
    console.log('✅ Final extracted materials:', result);
    return result;
  } catch (error) {
    console.error('❌ Material extraction error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      error: error
    });
    throw error;
  }
}
