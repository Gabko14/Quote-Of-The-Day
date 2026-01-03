interface Env {
  XAI_API_KEY: string;
}

interface ParseRequest {
  text: string;
  categories: string[];
}

interface ParsedQuote {
  text: string;
  author: string | null;
  categories: string[];
}

interface ParseResponse {
  quotes: ParsedQuote[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function buildSystemPrompt(categories: string[]): string {
  const categoryList = categories.length > 0
    ? categories.join(', ')
    : 'none available';

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
  // Try to find JSON object in the text
  let content = text.trim();

  // Remove markdown code blocks
  if (content.includes('```')) {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      content = match[1].trim();
    } else {
      // Fallback: remove all ``` markers
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

async function parseQuotesWithXAI(
  text: string,
  categories: string[],
  apiKey: string
): Promise<ParsedQuote[]> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      messages: [
        { role: 'system', content: buildSystemPrompt(categories) },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_completion_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`XAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: { content: string };
      finish_reason: string;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
    };
  };

  const choice = data.choices[0];
  if (!choice?.message?.content) {
    console.error('XAI response:', JSON.stringify(data, null, 2));
    throw new Error('No content in XAI response');
  }

  // Log for debugging
  console.log('Finish reason:', choice.finish_reason);
  console.log('Token usage:', JSON.stringify(data.usage));

  if (choice.finish_reason === 'length') {
    console.warn('Response was truncated due to length limit');
  }

  const content = choice.message.content;

  // Extract JSON from the response
  let jsonContent: string;
  try {
    jsonContent = extractJSON(content);
  } catch {
    console.error('Failed to extract JSON. Raw content:', content.substring(0, 500));
    throw new Error('Failed to extract JSON from response');
  }

  let parsed: ParseResponse;
  try {
    parsed = JSON.parse(jsonContent) as ParseResponse;
  } catch (e) {
    console.error('JSON parse failed. Extracted content:', jsonContent.substring(0, 500));
    console.error('Parse error:', e);
    throw new Error(`Invalid JSON in response: ${e instanceof Error ? e.message : 'unknown error'}`);
  }

  // Validate the response structure
  if (!Array.isArray(parsed.quotes)) {
    console.error('Invalid structure:', JSON.stringify(parsed).substring(0, 500));
    throw new Error('Invalid response structure: quotes is not an array');
  }

  // Validate each quote and ensure categories match exactly
  const validCategories = new Set(categories);
  return parsed.quotes.map((quote) => ({
    text: String(quote.text || '').trim(),
    author: quote.author ? String(quote.author).trim() : null,
    categories: Array.isArray(quote.categories)
      ? quote.categories.filter((cat: string) => validCategories.has(cat))
      : [],
  })).filter((quote) => quote.text.length > 0);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json() as ParseRequest;

      if (!body.text || typeof body.text !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid "text" field' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const categories = Array.isArray(body.categories) ? body.categories : [];

      const quotes = await parseQuotesWithXAI(body.text, categories, env.XAI_API_KEY);

      return new Response(
        JSON.stringify({ quotes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error parsing quotes:', error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
