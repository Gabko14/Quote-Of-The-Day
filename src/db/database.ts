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
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    dbPromise = null;
  }
}
