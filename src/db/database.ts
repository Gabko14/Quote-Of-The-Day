import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Return existing connection
  if (db) return db;

  // If initialization is in progress, wait for it
  if (dbPromise) return dbPromise;

  // Start initialization (only once)
  dbPromise = initDatabase();
  return dbPromise;
}

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync('quotes.db');
  await runMigrations(database);
  db = database;
  return database;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Initial schema
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      author TEXT,
      category_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('darkBackground', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('darkMode', 'true');
  `);

  // Migration: Add quote_categories junction table for multi-category support
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS quote_categories (
      quote_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (quote_id, category_id),
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing category_id data to junction table (only for quotes not yet migrated)
  await database.execAsync(`
    INSERT OR IGNORE INTO quote_categories (quote_id, category_id)
    SELECT id, category_id FROM quotes WHERE category_id IS NOT NULL;
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    dbPromise = null;
  }
}
