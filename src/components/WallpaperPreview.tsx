import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { Canvas, Image, Skia, useImage } from '@shopify/react-native-skia';
import { generateWallpaperImage } from '../services/wallpaperGenerator';

interface WallpaperPreviewProps {
  text: string;
  author?: string | null;
  darkBackground: boolean;
  style?: object;
}

export function WallpaperPreview({ text, author, darkBackground, style }: WallpaperPreviewProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Preview aspect ratio matches phone screen (9:16 portrait)
  const previewWidth = 200;
  const previewHeight = (previewWidth * 16) / 9;

  // Generate at higher resolution for quality
  const imageWidth = 720;
  const imageHeight = 1280;

  const image = useMemo(() => {
    if (!text) return null;
    return generateWallpaperImage({
      text,
      author,
      darkBackground,
      width: imageWidth,
      height: imageHeight,
    });
  }, [text, author, darkBackground]);

  if (!image) {
    return (
      <View style={[styles.container, { width: previewWidth, height: previewHeight }, style]}>
        <View style={[styles.placeholder, darkBackground ? styles.darkBg : styles.lightBg]}>
          <Text style={[styles.placeholderText, !darkBackground && styles.darkText]}>
            No preview available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: previewWidth, height: previewHeight }, style]}>
      <Canvas style={styles.canvas}>
        <Image
          image={image}
          x={0}
          y={0}
          width={previewWidth}
          height={previewHeight}
          fit="cover"
        />
      </Canvas>
    </View>
  );
}

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
  canvas: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  darkBg: {
    backgroundColor: '#000',
  },
  lightBg: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  darkText: {
    color: '#000',
  },
});
