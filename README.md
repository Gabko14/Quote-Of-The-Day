# Quote of the Day - Daily Wallpaper Quotes

A React Native/Expo app that displays daily rotating quotes as your phone wallpaper.

## Download

[**Download APK**](https://github.com/Gabko14/Quote-Of-The-Day/releases/latest) - Get the latest release for Android

## Why?

Meaningful quotes shouldn't gather digital dust in notes apps. They should influence your day, passively, through your phone's wallpaper.

## Features

- **Daily Quote Rotation** - Automatically cycles through your quotes, one per day
- **Automatic Wallpaper** - Sets your quote as your phone wallpaper (Android)
- **Categories** - Organize quotes by topic
- **Dark/Light Mode** - Both for the app UI and wallpaper style
- **AI-Powered Import** - Paste text and let AI extract quotes automatically
- **Offline First** - Works without internet (except AI import)

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio (for Android development)
- An Android device or emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/Gabko14/Quote-Of-The-Day.git
cd quote-of-the-day

# Install dependencies
npm install

# Start the development server
npm start

# Build and run on Android
npm run android
```

### Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

For AI-powered quote import, you'll need an XAI API key (configured in the app's Settings screen).

## Development

```bash
npm start              # Start Expo dev server
npm run android        # Build and run on Android
npm run lint           # Run ESLint
npm run typecheck      # Type check TypeScript
npm test               # Run tests
```

After making native code changes (plugins, native modules):

```bash
npx expo prebuild --clean && npm run android
```

## Project Structure

```
app/                    # Screens (expo-router)
  _layout.tsx           # Tab navigation
  index.tsx             # Home: daily quote preview
  settings.tsx          # App settings
  categories.tsx        # Category management
  quotes/
    index.tsx           # Quote list
    [id].tsx            # Add/edit quote
    import.tsx          # AI bulk import

src/
  components/           # Reusable components
  db/                   # SQLite database layer
  services/             # Business logic
  theme/                # Theming (dark/light mode)

worker/                 # Optional Cloudflare Worker for testing
```

## Tech Stack

- **React Native** + **Expo** - Cross-platform mobile framework
- **expo-router** - File-based navigation
- **expo-sqlite** - Local database
- **expo-background-task** - Daily wallpaper rotation
- **react-native-view-shot** - Wallpaper image generation
- **XAI (Grok)** - AI-powered quote parsing

## License

MIT
