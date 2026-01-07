import { File, Directory, Paths } from 'expo-file-system';
import { getDatabase, Quote } from '../db';
import { logger } from '../utils/logger';

function getWallpaperDir(): Directory {
  return new Directory(Paths.document, 'wallpapers');
}

function ensureWallpaperDir(): Directory {
  const dir = getWallpaperDir();
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

function getCacheFilename(quoteId: number, isDark: boolean): string {
  return `quote_${quoteId}_${isDark ? 'dark' : 'light'}.png`;
}

export function getCachedWallpaperPath(quoteId: number, isDark: boolean): string | null {
  const dir = getWallpaperDir();
  if (!dir.exists) return null;

  const filename = getCacheFilename(quoteId, isDark);
  const file = new File(dir, filename);

  return file.exists ? file.uri : null;
}

export function cacheWallpaper(quoteId: number, isDark: boolean, sourcePath: string): string | null {
  try {
    const dir = ensureWallpaperDir();
    const filename = getCacheFilename(quoteId, isDark);
    const destFile = new File(dir, filename);

    // Remove existing if present
    if (destFile.exists) {
      destFile.delete();
    }

    // Copy from source
    const sourceFile = new File(sourcePath);
    if (sourceFile.exists) {
      sourceFile.copy(destFile);
      return destFile.uri;
    }

    return null;
  } catch (error) {
    logger.error('Error caching wallpaper:', error);
    return null;
  }
}

export function invalidateCache(quoteId?: number): void {
  const dir = getWallpaperDir();
  if (!dir.exists) return;

  const contents = dir.list();
  const files = contents.filter((item): item is File => item instanceof File);

  for (const file of files) {
    if (quoteId !== undefined) {
      // Delete specific quote's wallpapers
      if (file.name.startsWith(`quote_${quoteId}_`)) {
        file.delete();
      }
    } else {
      // Delete all cached wallpapers (but not other wallpaper files)
      if (file.name.startsWith('quote_')) {
        file.delete();
      }
    }
  }
}

export async function getQuotesWithoutCache(isDark: boolean): Promise<Quote[]> {
  const db = await getDatabase();
  const quotes = await db.getAllAsync<Quote>('SELECT * FROM quotes');

  return quotes.filter((quote) => {
    const cached = getCachedWallpaperPath(quote.id, isDark);
    return cached === null;
  });
}

export async function getAllQuotes(): Promise<Quote[]> {
  const db = await getDatabase();
  return db.getAllAsync<Quote>('SELECT * FROM quotes');
}
