import { getDatabase } from './database';

export interface Quote {
  id: number;
  text: string;
  author: string | null;
  category_id: number | null; // Legacy, kept for compatibility
  category_ids: number[]; // New: multiple categories
  created_at: string;
}

export interface QuoteInput {
  text: string;
  author?: string | null;
  category_id?: number | null; // Legacy, kept for compatibility
  category_ids?: number[]; // New: multiple categories
}

interface QuoteRow {
  id: number;
  text: string;
  author: string | null;
  category_id: number | null;
  created_at: string;
  category_ids_csv: string | null;
}

function parseQuoteRow(row: QuoteRow): Quote {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    category_id: row.category_id,
    category_ids: row.category_ids_csv
      ? row.category_ids_csv.split(',').map(Number).filter((n) => !Number.isNaN(n))
      : [],
    created_at: row.created_at,
  };
}

const QUOTE_SELECT = `
  SELECT q.*, GROUP_CONCAT(qc.category_id) as category_ids_csv
  FROM quotes q
  LEFT JOIN quote_categories qc ON q.id = qc.quote_id
`;

export async function getAllQuotes(): Promise<Quote[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuoteRow>(`
    ${QUOTE_SELECT}
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `);
  return rows.map(parseQuoteRow);
}

export async function getQuoteById(id: number): Promise<Quote | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<QuoteRow>(`
    ${QUOTE_SELECT}
    WHERE q.id = ?
    GROUP BY q.id
  `, [id]);
  return row ? parseQuoteRow(row) : null;
}

export async function getQuotesByCategory(categoryId: number): Promise<Quote[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuoteRow>(`
    ${QUOTE_SELECT}
    WHERE q.id IN (SELECT quote_id FROM quote_categories WHERE category_id = ?)
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `, [categoryId]);
  return rows.map(parseQuoteRow);
}

export async function getRandomQuote(): Promise<Quote | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<QuoteRow>(`
    ${QUOTE_SELECT}
    GROUP BY q.id
    ORDER BY RANDOM()
    LIMIT 1
  `);
  return row ? parseQuoteRow(row) : null;
}

export async function getRandomQuoteExcluding(excludeId: number): Promise<Quote | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<QuoteRow>(`
    ${QUOTE_SELECT}
    WHERE q.id != ?
    GROUP BY q.id
    ORDER BY RANDOM()
    LIMIT 1
  `, [excludeId]);
  // If no other quote exists, return the excluded one
  if (!row) {
    return getQuoteById(excludeId);
  }
  return parseQuoteRow(row);
}

export async function createQuote(input: QuoteInput): Promise<number> {
  const db = await getDatabase();

  // Get category_ids from either new field or legacy field
  const categoryIds = input.category_ids ?? (input.category_id ? [input.category_id] : []);
  const legacyCategoryId = categoryIds[0] ?? null;

  const result = await db.runAsync(
    'INSERT INTO quotes (text, author, category_id) VALUES (?, ?, ?)',
    [input.text, input.author ?? null, legacyCategoryId]
  );

  const quoteId = result.lastInsertRowId;

  // Insert into junction table
  for (const categoryId of categoryIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO quote_categories (quote_id, category_id) VALUES (?, ?)',
      [quoteId, categoryId]
    );
  }

  return quoteId;
}

export async function updateQuote(id: number, input: QuoteInput): Promise<void> {
  const db = await getDatabase();

  // Get category_ids from either new field or legacy field
  const categoryIds = input.category_ids ?? (input.category_id ? [input.category_id] : []);
  const legacyCategoryId = categoryIds[0] ?? null;

  await db.runAsync(
    'UPDATE quotes SET text = ?, author = ?, category_id = ? WHERE id = ?',
    [input.text, input.author ?? null, legacyCategoryId, id]
  );

  // Update junction table: remove old, add new
  await db.runAsync('DELETE FROM quote_categories WHERE quote_id = ?', [id]);
  for (const categoryId of categoryIds) {
    await db.runAsync(
      'INSERT INTO quote_categories (quote_id, category_id) VALUES (?, ?)',
      [id, categoryId]
    );
  }
}

export async function deleteQuote(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM quotes WHERE id = ?', [id]);
}

export async function getQuoteCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM quotes');
  return result?.count ?? 0;
}
