import { File, Directory, Paths } from 'expo-file-system';

function getWallpaperDir(): Directory {
  return new Directory(Paths.document, 'wallpapers');
}

export async function getWallpaperPath(): Promise<string | null> {
  const dir = getWallpaperDir();
  if (!dir.exists) return null;

  const contents = dir.list();
  const wallpapers = contents
    .filter((item): item is File => item instanceof File)
    .filter((f) => f.name.startsWith('wallpaper_') && f.name.endsWith('.png'));

  if (wallpapers.length === 0) return null;

  // Return most recent (sort by name which includes timestamp)
  wallpapers.sort((a, b) => b.name.localeCompare(a.name));
  return wallpapers[0].uri;
}

export async function cleanOldWallpapers(keepCount: number = 1): Promise<void> {
  const dir = getWallpaperDir();
  if (!dir.exists) return;

  const contents = dir.list();
  const wallpapers = contents
    .filter((item): item is File => item instanceof File)
    .filter((f) => f.name.startsWith('wallpaper_') && f.name.endsWith('.png'));

  if (wallpapers.length <= keepCount) return;

  // Sort by name (timestamp) descending
  wallpapers.sort((a, b) => b.name.localeCompare(a.name));
  const toDelete = wallpapers.slice(keepCount);

  for (const file of toDelete) {
    file.delete();
  }
}
