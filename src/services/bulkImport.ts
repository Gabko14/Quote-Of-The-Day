import { getXaiApiKey } from './secureStorage';

export interface ParsedQuote {
  text: string;
  author: string | null;
  categories: string[];
}

interface ParseResponse {
  quotes: ParsedQuote[];
}

function buildSystemPrompt(categories: string[]): string {
  const categoryList = categories.length > 0 ? categories.join(', ') : 'none available';

  return `You are a quote parser. Extract individual quotes from the provided text.

For each quote, identify:
1. The quote text itself (without surrounding quotation marks)
2. The author (if mentioned, otherwise null)
3. Matching categories from this list: [${categoryList}]
   - Only use categories from the provided list exactly as written
   - A quote can have multiple categories if relevant
   - Use an empty array [] if no categories match or if no categories are available

Return ONLY valid JSON in this exact format, no other text:
{"quotes": [{"text": "quote text here", "author": "Author Name" or null, "categories": ["Category1", "Category2"] or []}]}`;
}

function extractJSON(text: string): string {
  let content = text.trim();

  // Remove markdown code blocks
  if (content.includes('```')) {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      content = match[1].trim();
    } else {
      content = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    }
  }

  // Try to find JSON object starting with {
  const jsonStart = content.indexOf('{');
  if (jsonStart > 0) {
    content = content.substring(jsonStart);
  }

  // Try to find the closing brace (handle truncated JSON)
  const lastBrace = content.lastIndexOf('}');
  if (lastBrace !== -1) {
    content = content.substring(0, lastBrace + 1);
  }

  return content;
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getXaiApiKey();
  return !!key;
}

export async function parseQuotesFromText(
  text: string,
  categoryNames: string[]
): Promise<ParsedQuote[]> {
  const apiKey = await getXaiApiKey();

  if (!apiKey) {
    throw new Error('XAI API key not configured. Please add your API key in Settings.');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      messages: [
        { role: 'system', content: buildSystemPrompt(categoryNames) },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_completion_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your XAI API key in Settings.');
    }
    throw new Error(`XAI API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: { content: string };
      finish_reason: string;
    }>;
  };

  const choice = data.choices[0];
  if (!choice?.message?.content) {
    throw new Error('No content in XAI response');
  }

  const content = choice.message.content;
  const jsonContent = extractJSON(content);

  let parsed: ParseResponse;
  try {
    parsed = JSON.parse(jsonContent) as ParseResponse;
  } catch (e) {
    throw new Error(
      `Invalid JSON in response: ${e instanceof Error ? e.message : 'unknown error'}`
    );
  }

  if (!Array.isArray(parsed.quotes)) {
    throw new Error('Invalid response structure: quotes is not an array');
  }

  // Validate each quote and ensure categories match (case-insensitive)
  const categoryMap = new Map<string, string>();
  for (const cat of categoryNames) {
    categoryMap.set(cat.toLowerCase(), cat);
  }

  return parsed.quotes
    .map((quote) => ({
      text: String(quote.text || '').trim(),
      author: quote.author ? String(quote.author).trim() : null,
      categories: Array.isArray(quote.categories)
        ? quote.categories
            .map((cat: string) => categoryMap.get(cat.toLowerCase()))
            .filter((cat): cat is string => cat !== undefined)
        : [],
    }))
    .filter((quote) => quote.text.length > 0);
}
