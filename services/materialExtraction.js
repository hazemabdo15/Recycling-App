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

  // Create candidates with their scores and metadata
  const scoredCandidates = [];

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase();

    // Exact match gets highest priority
    if (input === candidateLower) {
      return { match: candidate, score: 100 };
    }

    let score = 0;
    const lengthRatio = Math.min(input.length, candidateLower.length) / Math.max(input.length, candidateLower.length);

    // Check substring relationships with length consideration
    if (candidateLower.includes(input)) {
      // If input is much shorter than candidate, it might be a generic match
      if (lengthRatio < 0.6) {
        score = Math.max(70, lengthRatio * 85); // Lower score for generic matches
      } else {
        score = 90; // Good substring match when lengths are similar
      }
    } else if (input.includes(candidateLower)) {
      // If candidate is much shorter than input, it might be a generic match
      if (lengthRatio < 0.6) {
        score = Math.max(70, lengthRatio * 85); // Lower score for generic matches
      } else {
        score = 90; // Good substring match when lengths are similar
      }
    } else {
      // Character-level similarity for typos and variations
      const maxLen = Math.max(input.length, candidateLower.length);
      const minLen = Math.min(input.length, candidateLower.length);
      const ratio = (minLen / maxLen) * 100;
      
      if (ratio > 60) {
        let commonChars = 0;
        for (let i = 0; i < minLen; i++) {
          if (input[i] === candidateLower[i]) commonChars++;
        }
        score = (commonChars / maxLen) * 100;
      }
    }

    if (score >= threshold) {
      scoredCandidates.push({
        candidate,
        score,
        length: candidateLower.length,
        isSubstring: candidateLower.includes(input) || input.includes(candidateLower)
      });
    }
  }

  if (scoredCandidates.length === 0) {
    return null;
  }

  // Sort by score and specificity
  scoredCandidates.sort((a, b) => {
    // If scores are close, prefer longer/more specific terms
    if (Math.abs(a.score - b.score) <= 5) {
      // For substring matches, prefer longer terms (more specific)
      if (a.isSubstring && b.isSubstring) {
        return b.length - a.length;
      }
      // Prefer non-substring matches over substring matches
      if (a.isSubstring && !b.isSubstring) return 1;
      if (!a.isSubstring && b.isSubstring) return -1;
    }
    return b.score - a.score;
  });

  return { match: scoredCandidates[0].candidate, score: scoredCandidates[0].score };
}

function mapToCanonicalMaterial(input) {
  const cleaned = input.trim().toLowerCase();

  if (enToInfo[cleaned]) {
    return { name: cleaned, unit: enToInfo[cleaned].unit };
  }

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
      "originalText": "Original text from transcription if different from English name",
      "quantity": float,
      "unit": "KG" | "piece"
    }
  ]
}
- If you do not follow this, the system will fail.
- Only use materials from the provided list (see below). If a material is not in the list, ignore it.
- If a material appears multiple times, merge them and sum their quantities.
- For each material, use the canonical English name from the list.
- Include "originalText" field with the original Arabic/transcribed text if the input was not in English
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
    { "material": "Plastics", "originalText": "بلاستيك", "quantity": 3, "unit": "KG" },
    { "material": "Chair", "originalText": "كراسي", "quantity": 2, "unit": "piece" },
    { "material": "Iron", "originalText": "مكواة", "quantity": 1, "unit": "piece" }
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

    const materialCounts = {};

    for (const item of parsed) {
      if (!item.material) continue;
      
      const mapped = mapToCanonicalMaterial(item.material);
      if (!mapped) continue;
      
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      const unit = item.unit ? normalizeUnit(item.unit) : normalizeUnit(mapped.unit);

      const canonicalName = Object.keys(itemsData).find(
        k => k.toLowerCase() === mapped.name
      ) || mapped.name;

      const key = `${canonicalName}_${unit}`;
      if (materialCounts[key]) {
        materialCounts[key].quantity += quantity;
        // If we have multiple instances, keep the first originalText or prefer Arabic if available
        if (item.originalText && !materialCounts[key].originalText) {
          materialCounts[key].originalText = item.originalText;
        }
      } else {
        materialCounts[key] = {
          material: canonicalName,
          originalText: item.originalText || null, // Preserve original text if provided
          quantity,
          unit,
        };
      }
    }

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
