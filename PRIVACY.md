# Privacy Policy

**Quote of the Day - Daily Wallpaper Quotes**
**Last Updated:** January 2026

## Introduction

Quote of the Day is a mobile application that displays daily rotating quotes as phone wallpapers. This privacy policy explains how the app handles your data.

## Data Collection

**We do not collect any personal data.** The app does not collect names, email addresses, device identifiers, or any other personal information.

## Local Data Storage

All app data is stored locally on your device using SQLite:

- **Quotes** - Text and author information you enter
- **Categories** - Custom category labels you create
- **Settings** - Your preferences (dark mode, wallpaper style)
- **Daily quote state** - Which quote is currently displayed

This data never leaves your device unless you use the optional AI import feature.

## Network Usage

The app works entirely offline except for one optional feature:

### AI-Powered Quote Import (Optional)

If you choose to use the bulk import feature, the app sends your pasted text to the XAI API to parse and extract quotes. This requires:

- Your own XAI API key (stored encrypted on your device)
- An active internet connection
- Your explicit action to initiate the import

**What is sent:** The raw text you paste for parsing, plus your category names for auto-categorization.

**What is NOT sent:** Your saved quotes, personal information, or device data.

## API Key Storage

If you provide an XAI API key for the import feature, it is stored using Expo Secure Store, which provides encrypted storage on your device. The key is only used to authenticate with the XAI API and is never transmitted elsewhere.

## Permissions

The app requests the following Android permissions:

| Permission | Purpose |
|------------|---------|
| SET_WALLPAPER | Set your device wallpaper (core functionality) |
| INTERNET | Connect to XAI API for optional quote import |
| READ_MEDIA_IMAGES | Access photo library for potential future features |
| VIBRATE | Haptic feedback for UI interactions |

## Third-Party Services

The only third-party service used is:

- **XAI API** (api.x.ai) - Used solely for parsing bulk quote imports when you choose to use this feature with your own API key

## Data Sharing

We do not share any data with third parties. All data remains on your device.

## Analytics and Tracking

The app contains **no analytics, tracking, or telemetry**. We do not monitor your usage or behavior.

## Children's Privacy

This app is suitable for general audiences and does not knowingly collect data from children.

## Data Retention and Deletion

- All data is stored locally on your device
- Deleting a quote removes it permanently
- Uninstalling the app removes all associated data
- There is no server-side data to delete

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last Updated" date above.

## Contact

For questions or concerns about this privacy policy, please open an issue on our GitHub repository:

https://github.com/Gabko14/quote-of-the-day/issues

## Open Source

This app is open source. You can review the complete source code to verify our privacy practices:

https://github.com/Gabko14/quote-of-the-day
