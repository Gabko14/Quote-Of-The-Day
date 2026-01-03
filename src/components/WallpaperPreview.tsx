import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WallpaperPreviewProps {
  text: string;
  author?: string | null;
  darkBackground: boolean;
  style?: object;
}

export function WallpaperPreview({ text, author, darkBackground, style }: WallpaperPreviewProps) {
  // Preview dimensions (9:16 aspect ratio)
  const previewWidth = 240;
  const previewHeight = (previewWidth * 16) / 9;

  const bgColor = darkBackground ? '#000000' : '#FFFFFF';
  const textColor = darkBackground ? '#FFFFFF' : '#000000';
  const authorColor = darkBackground ? '#AAAAAA' : '#666666';

  // Calculate font sizes based on preview width
  const quoteFontSize = previewWidth * 0.07;
  const authorFontSize = quoteFontSize * 0.6;

  return (
    <View style={style}>
      <View
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
          <Text
            style={[
              styles.quoteText,
              {
                color: textColor,
                fontSize: quoteFontSize,
                lineHeight: quoteFontSize * 1.4,
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
                  fontSize: authorFontSize,
                  marginTop: quoteFontSize * 0.5,
                },
              ]}
            >
              — {author}
            </Text>
          )}
        </View>
      </View>
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
});
