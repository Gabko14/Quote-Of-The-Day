import { Skia, FontStyle, SkImage } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import { Dimensions } from 'react-native';

interface WallpaperOptions {
  text: string;
  author?: string | null;
  darkBackground: boolean;
  width?: number;
  height?: number;
}

const WALLPAPER_DIR = `${FileSystem.documentDirectory}wallpapers/`;

async function ensureWallpaperDir() {
  const dirInfo = await FileSystem.getInfoAsync(WALLPAPER_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(WALLPAPER_DIR, { intermediates: true });
  }
}

export function generateWallpaperImage(options: WallpaperOptions): SkImage | null {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
  const width = options.width ?? screenWidth;
  const height = options.height ?? screenHeight;

  const { text, author, darkBackground } = options;

  const surface = Skia.Surface.Make(width, height);
  if (!surface) return null;

  const canvas = surface.getCanvas();

  // Background
  const bgColor = darkBackground ? Skia.Color('#000000') : Skia.Color('#FFFFFF');
  const textColor = darkBackground ? Skia.Color('#FFFFFF') : Skia.Color('#000000');
  const authorColor = darkBackground ? Skia.Color('#AAAAAA') : Skia.Color('#666666');

  const bgPaint = Skia.Paint();
  bgPaint.setColor(bgColor);
  canvas.drawRect(Skia.XYWHRect(0, 0, width, height), bgPaint);

  // Quote text
  const quoteFontSize = Math.min(width * 0.06, 48);
  const quoteParagraphStyle = {
    textAlign: 1 as const, // Center
  };
  const quoteTextStyle = {
    color: textColor,
    fontSize: quoteFontSize,
    fontStyle: {
      weight: 400,
      width: 5,
      slant: 2, // Italic
    } as FontStyle,
  };

  const paragraphBuilder = Skia.ParagraphBuilder.Make(quoteParagraphStyle);
  paragraphBuilder.pushStyle(quoteTextStyle);
  paragraphBuilder.addText(`"${text}"`);
  paragraphBuilder.pop();

  const paragraph = paragraphBuilder.build();
  const paragraphWidth = width * 0.8;
  paragraph.layout(paragraphWidth);

  const paragraphHeight = paragraph.getHeight();
  const paragraphX = (width - paragraphWidth) / 2;

  // Calculate vertical position
  let totalTextHeight = paragraphHeight;
  if (author) {
    totalTextHeight += quoteFontSize * 1.5; // Space for author
  }
  const startY = (height - totalTextHeight) / 2;

  canvas.save();
  canvas.translate(paragraphX, startY);
  paragraph.paint(canvas, 0, 0);
  canvas.restore();

  // Author text
  if (author) {
    const authorFontSize = quoteFontSize * 0.6;
    const authorParagraphStyle = {
      textAlign: 1 as const, // Center
    };
    const authorTextStyle = {
      color: authorColor,
      fontSize: authorFontSize,
      fontStyle: {
        weight: 400,
        width: 5,
        slant: 0, // Normal
      } as FontStyle,
    };

    const authorBuilder = Skia.ParagraphBuilder.Make(authorParagraphStyle);
    authorBuilder.pushStyle(authorTextStyle);
    authorBuilder.addText(`— ${author}`);
    authorBuilder.pop();

    const authorParagraph = authorBuilder.build();
    authorParagraph.layout(paragraphWidth);

    const authorY = startY + paragraphHeight + quoteFontSize * 0.5;

    canvas.save();
    canvas.translate(paragraphX, authorY);
    authorParagraph.paint(canvas, 0, 0);
    canvas.restore();
  }

  return surface.makeImageSnapshot();
}

export async function saveWallpaperToFile(
  image: SkImage,
  filename: string = 'wallpaper.png'
): Promise<string> {
  await ensureWallpaperDir();

  const data = image.encodeToBase64();
  const filePath = `${WALLPAPER_DIR}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return filePath;
}

export async function generateAndSaveWallpaper(options: WallpaperOptions): Promise<string | null> {
  const image = generateWallpaperImage(options);
  if (!image) return null;

  const filename = `wallpaper_${Date.now()}.png`;
  return saveWallpaperToFile(image, filename);
}

export async function getWallpaperPath(): Promise<string | null> {
  await ensureWallpaperDir();

  const files = await FileSystem.readDirectoryAsync(WALLPAPER_DIR);
  const wallpapers = files.filter((f) => f.startsWith('wallpaper_') && f.endsWith('.png'));

  if (wallpapers.length === 0) return null;

  // Return most recent
  wallpapers.sort().reverse();
  return `${WALLPAPER_DIR}${wallpapers[0]}`;
}

export async function cleanOldWallpapers(keepCount: number = 1): Promise<void> {
  await ensureWallpaperDir();

  const files = await FileSystem.readDirectoryAsync(WALLPAPER_DIR);
  const wallpapers = files.filter((f) => f.startsWith('wallpaper_') && f.endsWith('.png'));

  if (wallpapers.length <= keepCount) return;

  wallpapers.sort().reverse();
  const toDelete = wallpapers.slice(keepCount);

  for (const file of toDelete) {
    await FileSystem.deleteAsync(`${WALLPAPER_DIR}${file}`, { idempotent: true });
  }
}
