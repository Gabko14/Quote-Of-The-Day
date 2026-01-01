# CLAUDE.md

Guidance for Claude Code (claude.ai/code) and other AI agents when working in this repository. Propose updates to CLAUDE.md as the project evolves.

## Project Overview

A React Native/Expo app that displays daily rotating quotes as phone wallpapers. Users add quotes, and the app automatically rotates through them daily, generating wallpaper images.

## Mission

Meaningful quotes shouldn't gather digital dust in notes apps. They should influence your day, passively, through your phone's wallpaper.

## Target User

Someone who saves quotes and wants a simple, passive way to be reminded of them daily—without having to do anything.

## Non-Negotiables

- **Old Architecture only**: `newArchEnabled: false` is required. The picker library crashes with New Architecture.
- **Services return results, UI shows feedback**: Services never call `Alert.alert()` or show UI. They return `{ success, error }` objects.
- **No heavy dependencies for simple tasks**: Use `react-native-view-shot` for image capture, not Skia. Prefer standard React Native components.

## Commands

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Build and run on Android

# After native code changes (app.json plugins, native modules)
npx expo prebuild --clean && npm run android

# Type checking
npx tsc --noEmit

# Database inspection (SQLite CLI available)
sqlite3 <path-to-quotes.db>

# GitHub CLI available
gh pr create, gh issue list, etc.
```

## Architecture

### App Structure (expo-router)
```
app/
  _layout.tsx      # Root layout with tab navigation, registers background task
  index.tsx        # Home: daily quote preview + "Set as Wallpaper" button
  settings.tsx     # Dark mode toggles (app UI + wallpaper style)
  categories.tsx   # Category CRUD
  quotes/
    index.tsx      # Quote list with category filter
    [id].tsx       # Add/edit quote form
```

### Core Services (`src/services/`)
- **dailyQuote.ts** - Quote rotation logic (one quote per day, avoids repeats)
- **backgroundTask.ts** - Expo background task that rotates quotes every 12 hours
- **wallpaperService.ts** - Bridge to native Android WallpaperModule
- **wallpaperGenerator.ts** - File management for generated wallpapers

### Data Layer (`src/db/`)
- **database.ts** - SQLite singleton with migrations (quotes, categories, settings tables)
- Uses `expo-sqlite` with a promise-based initialization pattern to prevent race conditions

### Wallpaper Generation
- Uses `react-native-view-shot` to capture a React Native View as PNG
- `WallpaperPreview` component renders quote text, captures at device resolution
- Native `WallpaperModule` (Kotlin) sets the image as Android wallpaper

## Key Design Decisions

**Background task only rotates quotes**: Wallpaper image generation requires UI context and happens when user opens the app, not in background.

## Code Patterns

### Database Access

Always use the `getDatabase()` singleton. It handles initialization and prevents race conditions.

```typescript
const db = await getDatabase();
const quotes = await db.getAllAsync<Quote>('SELECT * FROM quotes');
```

### Component Exports

- **Named exports** for components: `export function WallpaperPreview()`
- **Default exports** only for screens (Expo Router requirement)

## Before Finishing

```bash
npx tsc --noEmit
```

- [ ] App works offline (no network required for core functionality)
- [ ] No new warnings in console
