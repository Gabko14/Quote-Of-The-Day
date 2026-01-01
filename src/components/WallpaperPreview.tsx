import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { File, Directory, Paths } from 'expo-file-system';

interface WallpaperPreviewProps {
  text: string;
  author?: string | null;
  darkBackground: boolean;
  style?: object;
}

export interface WallpaperPreviewHandle {
  capture: (width: number, height: number) => Promise<string | null>;
}

function getWallpaperDir(): Directory {
  return new Directory(Paths.document, 'wallpapers');
}

async function ensureWallpaperDir(): Promise<Directory> {
  const dir = getWallpaperDir();
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

export const WallpaperPreview = forwardRef<WallpaperPreviewHandle, WallpaperPreviewProps>(
  function WallpaperPreview({ text, author, darkBackground, style }, ref) {
    const viewRef = useRef<View>(null);
    const fullSizeRef = useRef<View>(null);

    // Preview dimensions (9:16 aspect ratio)
    const previewWidth = 200;
    const previewHeight = (previewWidth * 16) / 9;

    const bgColor = darkBackground ? '#000000' : '#FFFFFF';
    const textColor = darkBackground ? '#FFFFFF' : '#000000';
    const authorColor = darkBackground ? '#AAAAAA' : '#666666';

    useImperativeHandle(ref, () => ({
      capture: async (width: number, height: number): Promise<string | null> => {
        if (!fullSizeRef.current) return null;

        try {
          // Capture the full-size hidden view
          const uri = await captureRef(fullSizeRef, {
            format: 'png',
            quality: 1,
            width,
            height,
          });

          // Save to wallpapers directory
          const dir = await ensureWallpaperDir();
          const filename = `wallpaper_${Date.now()}.png`;
          const destFile = new File(dir, filename);

          // Copy from temp location to our directory
          const sourceFile = new File(uri.replace('file://', ''));
          if (sourceFile.exists) {
            sourceFile.move(destFile);
          }

          return destFile.uri;
        } catch (error) {
          console.error('Error capturing wallpaper:', error);
          return null;
        }
      },
    }));

    // Calculate font sizes based on preview width
    const quoteFontSize = previewWidth * 0.07;
    const authorFontSize = quoteFontSize * 0.6;

    const renderContent = (fontSize: number, authorSize: number) => (
      <>
        <Text
          style={[
            styles.quoteText,
            {
              color: textColor,
              fontSize,
              lineHeight: fontSize * 1.4,
            },
          ]}
        >
          "{text}"
        </Text>
        {author && (
          <Text
            style={[
              styles.authorText,
              {
                color: authorColor,
                fontSize: authorSize,
                marginTop: fontSize * 0.5,
              },
            ]}
          >
            — {author}
          </Text>
        )}
      </>
    );

    return (
      <View style={style}>
        {/* Visible preview */}
        <View
          ref={viewRef}
          style={[
            styles.container,
            {
              width: previewWidth,
              height: previewHeight,
              backgroundColor: bgColor,
            },
          ]}
        >
          <View style={styles.contentContainer}>
            {renderContent(quoteFontSize, authorFontSize)}
          </View>
        </View>

        {/* Hidden full-size view for capture (720x1280) */}
        <View
          ref={fullSizeRef}
          style={[
            styles.hiddenCapture,
            {
              width: 720,
              height: 1280,
              backgroundColor: bgColor,
            },
          ]}
          collapsable={false}
        >
          <View style={styles.contentContainer}>
            {renderContent(720 * 0.06, 720 * 0.06 * 0.6)}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '10%',
  },
  quoteText: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
  authorText: {
    textAlign: 'center',
  },
  hiddenCapture: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});
