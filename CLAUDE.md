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

# Type checking and build
npx tsc --noEmit       # Type check
npx expo export        # Bundle JS (catches import/bundling errors)

# Database inspection (SQLite CLI available)
sqlite3 <path-to-quotes.db>

# GitHub CLI available
gh pr create, gh issue list, etc.
```

## Git Workflow

- **Never push directly to `master`** - Always create a feature branch
- **New task = new branch** - Create a fresh branch from master for each task
- **Clean up after merge** - Delete the branch locally and remotely after PR is merged
- **Force push on feature branches** - When fixing mistakes on a PR branch, amend and force push instead of creating fixup commits
- Create PRs using GitHub CLI: `gh pr create`
- Branch naming: `feature/description` or `fix/description`

```bash
# Starting a new task
git checkout master && git pull
git checkout -b feature/add-dark-mode
# ... make changes ...
git add . && git commit -m "Add dark mode support"
git push -u origin feature/add-dark-mode
gh pr create --fill

# After PR is merged
git checkout master && git pull
git branch -d feature/add-dark-mode
git push origin --delete feature/add-dark-mode
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
    import.tsx     # Bulk import: paste quotes, AI parses, preview & save
```

### Core Services (`src/services/`)
- **dailyQuote.ts** - Quote rotation logic (one quote per day, avoids repeats)
- **backgroundTask.ts** - Expo background task that rotates quotes and sets wallpaper from cache
- **wallpaperService.ts** - Bridge to native Android WallpaperModule
- **wallpaperCache.ts** - Pre-generated wallpaper image cache per quote
- **bulkImport.ts** - Quote parsing via XAI API (direct) or worker (if configured)

### Data Layer (`src/db/`)
- **database.ts** - SQLite singleton with migrations (quotes, categories, settings tables)
- Uses `expo-sqlite` with a promise-based initialization pattern to prevent race conditions

### Wallpaper Generation
- Uses `react-native-view-shot` to capture a React Native View as PNG
- `WallpaperPreview` component renders quote text, captures at device resolution
- Native `WallpaperModule` (Kotlin) sets the image as Android wallpaper

### Cloudflare Worker (`worker/`)
- Optional proxy for bulk quote parsing (for development/testing)
- In production, the app calls XAI directly using user's API key
- To use worker: set `WORKER_URL` in `.env` (see `.env.example`)
- Without WORKER_URL: app calls XAI directly (production default)
- Worker commands: `cd worker && npm run dev` (local), `npm run deploy` (production)
- XAI API key stored as Cloudflare secret, not in code

## Background Wallpaper Architecture

Wallpaper images are pre-generated and cached when the app is open. The background task uses cached images to set wallpapers without UI context.

- **Cache generation**: On app startup, `WallpaperGenerator` creates images for quotes missing from cache
- **Cache invalidation**: Editing/deleting quotes or changing dark mode setting clears affected cache entries
- **Background task**: Rotates quote and sets wallpaper from cache; logs warning if cache miss

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
npm run lint
npm test
npx expo export
```

- [ ] App works offline (no network required for core functionality)
- [ ] No new warnings in console
