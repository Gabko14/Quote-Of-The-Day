import { Platform, Alert, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Note: react-native-manage-wallpaper requires a development build
// For Expo Go, we'll use a fallback to share/save the image
let ManageWallpaper: any = null;

try {
  ManageWallpaper = require('react-native-manage-wallpaper').default;
} catch (e) {
  // Native module not available (Expo Go)
  console.log('ManageWallpaper not available, using fallback');
}

export type WallpaperTarget = 'home' | 'lock' | 'both';

interface SetWallpaperOptions {
  imagePath: string;
  target?: WallpaperTarget;
}

export async function isWallpaperSupported(): Promise<boolean> {
  return Platform.OS === 'android' && ManageWallpaper !== null;
}

export async function setWallpaper(options: SetWallpaperOptions): Promise<boolean> {
  const { imagePath, target = 'both' } = options;

  if (Platform.OS !== 'android') {
    Alert.alert('Not Supported', 'Setting wallpaper is only supported on Android');
    return false;
  }

  // Check if file exists
  const fileInfo = await FileSystem.getInfoAsync(imagePath);
  if (!fileInfo.exists) {
    Alert.alert('Error', 'Wallpaper image not found');
    return false;
  }

  // If native module is available, use it
  if (ManageWallpaper) {
    return new Promise((resolve) => {
      const wallpaperType = getWallpaperType(target);

      ManageWallpaper.setWallpaper(
        {
          uri: imagePath,
        },
        (result: any) => {
          if (result.status === 'success') {
            Alert.alert('Success', 'Wallpaper has been set!');
            resolve(true);
          } else {
            Alert.alert('Error', 'Failed to set wallpaper');
            resolve(false);
          }
        },
        wallpaperType
      );
    });
  }

  // Fallback: Open share dialog to let user set it manually
  return fallbackShareWallpaper(imagePath);
}

function getWallpaperType(target: WallpaperTarget): string {
  switch (target) {
    case 'home':
      return 'home';
    case 'lock':
      return 'lock';
    case 'both':
    default:
      return 'both';
  }
}

async function fallbackShareWallpaper(imagePath: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert(
        'Manual Setup Required',
        'Please save this image and set it as your wallpaper through your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }

    Alert.alert(
      'Set Wallpaper',
      'This will open a share dialog. Choose "Set as wallpaper" or save the image and set it manually.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            await Sharing.shareAsync(imagePath, {
              mimeType: 'image/png',
              dialogTitle: 'Set as wallpaper',
            });
          },
        },
      ]
    );

    return true;
  } catch (error) {
    console.error('Error sharing wallpaper:', error);
    Alert.alert('Error', 'Failed to share wallpaper image');
    return false;
  }
}

export async function setHomeScreenWallpaper(imagePath: string): Promise<boolean> {
  return setWallpaper({ imagePath, target: 'home' });
}

export async function setLockScreenWallpaper(imagePath: string): Promise<boolean> {
  return setWallpaper({ imagePath, target: 'lock' });
}

export async function setBothWallpapers(imagePath: string): Promise<boolean> {
  return setWallpaper({ imagePath, target: 'both' });
}
