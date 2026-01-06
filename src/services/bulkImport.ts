const WORKER_URL = 'https://quote-parser.gabkolistiak.workers.dev';

export interface ParsedQuote {
  text: string;
  author: string | null;
  categories: string[];
}

interface ParseResponse {
  quotes: ParsedQuote[];
  error?: string;
}

export async function parseQuotesFromText(
  text: string,
  categoryNames: string[],
  apiKey?: string
): Promise<ParsedQuote[]> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      categories: categoryNames,
      apiKey,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Request failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as ParseResponse;

  if (data.error) {
    throw new Error(data.error);
  }

  return data.quotes;
}
