import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Quote } from '../db';
import { cacheWallpaper } from '../services/wallpaperCache';

export interface WallpaperGeneratorHandle {
  generateForQuote: (quote: Quote, isDark: boolean) => Promise<string | null>;
  generateAll: (quotes: Quote[], isDark: boolean) => Promise<number>;
}

export const WallpaperGenerator = forwardRef<WallpaperGeneratorHandle, {}>(
  function WallpaperGenerator(_, ref) {
    const viewRef = useRef<View>(null);
    const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
    const [isDarkBg, setIsDarkBg] = useState(true);

    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
    const captureWidth = Math.round(screenWidth * 2);
    const captureHeight = Math.round(screenHeight * 2);

    const generateForQuote = useCallback(async (quote: Quote, isDark: boolean): Promise<string | null> => {
      // Update state and wait for render
      setCurrentQuote(quote);
      setIsDarkBg(isDark);

      // Wait for next frame to ensure view is rendered
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));

      if (!viewRef.current) return null;

      try {
        const uri = await captureRef(viewRef, {
          format: 'png',
          quality: 1,
          width: captureWidth,
          height: captureHeight,
        });

        // Cache the wallpaper
        const cachedPath = cacheWallpaper(quote.id, isDark, uri);
        return cachedPath;
      } catch (error) {
        console.error('Error generating wallpaper for quote:', quote.id, error);
        return null;
      }
    }, [captureWidth, captureHeight]);

    const generateAll = useCallback(async (quotes: Quote[], isDark: boolean): Promise<number> => {
      let successCount = 0;

      for (const quote of quotes) {
        const result = await generateForQuote(quote, isDark);
        if (result) {
          successCount++;
          console.log(`[WallpaperGenerator] Cached quote ${quote.id}`);
        }
      }

      return successCount;
    }, [generateForQuote]);

    useImperativeHandle(ref, () => ({
      generateForQuote,
      generateAll,
    }));

    const bgColor = isDarkBg ? '#000000' : '#FFFFFF';
    const textColor = isDarkBg ? '#FFFFFF' : '#000000';
    const authorColor = isDarkBg ? '#AAAAAA' : '#666666';

    // Font sizes for capture resolution
    const baseFontSize = captureWidth * 0.04;
    const authorFontSize = baseFontSize * 0.6;

    return (
      <View
        ref={viewRef}
        style={[
          styles.container,
          {
            width: captureWidth,
            height: captureHeight,
            backgroundColor: bgColor,
          },
        ]}
        collapsable={false}
      >
        {currentQuote && (
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.quoteText,
                {
                  color: textColor,
                  fontSize: baseFontSize,
                  lineHeight: baseFontSize * 1.4,
                },
              ]}
            >
              "{currentQuote.text}"
            </Text>
            {currentQuote.author && (
              <Text
                style={[
                  styles.authorText,
                  {
                    color: authorColor,
                    fontSize: authorFontSize,
                    marginTop: baseFontSize * 0.5,
                  },
                ]}
              >
                — {currentQuote.author}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -9999,
    top: 0,
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
