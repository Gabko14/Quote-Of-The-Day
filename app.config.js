/* global process */
import "dotenv/config";

export default {
  expo: {
    name: "Quote of the Day - Daily Wallpaper Quotes",
    slug: "quote-of-the-day",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    scheme: "quote-of-the-day",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundImage: "./assets/adaptive-icon-background.png",
      },
      edgeToEdgeEnabled: true,
      package: "com.quoteoftheday.app",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-background-task",
      "./plugins/withWallpaperModule",
      "./plugins/withReleaseSigning",
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          organization: process.env.SENTRY_ORG || "",
          project: process.env.SENTRY_PROJECT || "",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
    ],
    extra: {
      // Set WORKER_URL in .env to enable worker mode for testing
      workerUrl: process.env.WORKER_URL || "",
      // Sentry DSN for crash reporting (optional)
      sentryDsn: process.env.SENTRY_DSN || "",
    },
  },
};
