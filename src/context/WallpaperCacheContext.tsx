import React, { createContext, useContext, useRef, useCallback } from 'react';
import { WallpaperGenerator, WallpaperGeneratorHandle } from '../components/WallpaperGenerator';
import { getQuotesWithoutCache } from '../services/wallpaperCache';
import { getDarkBackground } from '../db';

interface WallpaperCacheContextType {
  generateMissing: () => Promise<void>;
}

const WallpaperCacheContext = createContext<WallpaperCacheContextType | null>(null);

export function WallpaperCacheProvider({ children }: { children: React.ReactNode }) {
  const generatorRef = useRef<WallpaperGeneratorHandle>(null);

  const generateMissing = useCallback(async () => {
    try {
      const isDarkBg = await getDarkBackground();
      const quotesWithoutCache = await getQuotesWithoutCache(isDarkBg);

      if (quotesWithoutCache.length > 0 && generatorRef.current) {
        console.log(`[WallpaperCache] Generating ${quotesWithoutCache.length} missing wallpapers...`);
        const count = await generatorRef.current.generateAll(quotesWithoutCache, isDarkBg);
        console.log(`[WallpaperCache] Generated ${count} wallpapers`);
      }
    } catch (error) {
      console.error('[WallpaperCache] Error generating wallpapers:', error);
    }
  }, []);

  return (
    <WallpaperCacheContext.Provider value={{ generateMissing }}>
      <WallpaperGenerator ref={generatorRef} />
      {children}
    </WallpaperCacheContext.Provider>
  );
}

export function useWallpaperCache() {
  const context = useContext(WallpaperCacheContext);
  if (!context) {
    throw new Error('useWallpaperCache must be used within WallpaperCacheProvider');
  }
  return context;
}
