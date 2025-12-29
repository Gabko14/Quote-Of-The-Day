import { getDatabase } from './database';

export interface Quote {
  id: number;
  text: string;
  author: string | null;
  category_id: number | null;
  created_at: string;
}

export interface QuoteInput {
  text: string;
  author?: string | null;
  category_id?: number | null;
}

export async function getAllQuotes(): Promise<Quote[]> {
  const db = await getDatabase();
  return db.getAllAsync<Quote>('SELECT * FROM quotes ORDER BY created_at DESC');
}

export async function getQuoteById(id: number): Promise<Quote | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Quote>('SELECT * FROM quotes WHERE id = ?', [id]);
}

export async function getQuotesByCategory(categoryId: number): Promise<Quote[]> {
  const db = await getDatabase();
  return db.getAllAsync<Quote>(
    'SELECT * FROM quotes WHERE category_id = ? ORDER BY created_at DESC',
    [categoryId]
  );
}

export async function getRandomQuote(): Promise<Quote | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Quote>('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1');
}

export async function getRandomQuoteExcluding(excludeId: number): Promise<Quote | null> {
  const db = await getDatabase();
  const quote = await db.getFirstAsync<Quote>(
    'SELECT * FROM quotes WHERE id != ? ORDER BY RANDOM() LIMIT 1',
    [excludeId]
  );
  // If no other quote exists, return the excluded one
  if (!quote) {
    return db.getFirstAsync<Quote>('SELECT * FROM quotes WHERE id = ?', [excludeId]);
  }
  return quote;
}

export async function createQuote(input: QuoteInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO quotes (text, author, category_id) VALUES (?, ?, ?)',
    [input.text, input.author ?? null, input.category_id ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateQuote(id: number, input: QuoteInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE quotes SET text = ?, author = ?, category_id = ? WHERE id = ?',
    [input.text, input.author ?? null, input.category_id ?? null, id]
  );
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
