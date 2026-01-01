/* eslint-disable no-undef */
const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WALLPAPER_MODULE_KT = `package {{PACKAGE_NAME}}

import android.app.WallpaperManager
import android.graphics.BitmapFactory
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class WallpaperModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "WallpaperModule"

    @ReactMethod
    fun setWallpaper(imagePath: String, target: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val wallpaperManager = WallpaperManager.getInstance(context)

            // Remove file:// prefix if present
            val cleanPath = if (imagePath.startsWith("file://")) {
                imagePath.substring(7)
            } else {
                imagePath
            }

            val bitmap = BitmapFactory.decodeFile(cleanPath)
            if (bitmap == null) {
                promise.reject("ERROR", "Failed to decode image at path: $cleanPath")
                return
            }

            when (target) {
                "home" -> {
                    wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM)
                }
                "lock" -> {
                    wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK)
                }
                "both" -> {
                    wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK)
                }
                else -> {
                    promise.reject("ERROR", "Invalid target: $target. Use 'home', 'lock', or 'both'")
                    return
                }
            }

            bitmap.recycle()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to set wallpaper: \${e.message}", e)
        }
    }
}
`;

const WALLPAPER_PACKAGE_KT = `package {{PACKAGE_NAME}}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class WallpaperPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(WallpaperModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

function withWallpaperModule(config) {
  // Step 1: Add SET_WALLPAPER permission
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const hasPermission = manifest['uses-permission'].some(
      (p) => p.$?.['android:name'] === 'android.permission.SET_WALLPAPER'
    );

    if (!hasPermission) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.SET_WALLPAPER' },
      });
    }

    return config;
  });

  // Step 2: Add WallpaperPackage to MainApplication
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // Add the package import if not present (it's in the same package, so no import needed)
    // Just add the package to getPackages()

    if (!contents.includes('WallpaperPackage()')) {
      // Find the packages.apply block and add our package
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{([^}]*)\}/,
        (match, inner) => {
          // Check if there's already content or just comments
          if (inner.includes('add(')) {
            // There's already an add statement, add ours after
            return match.replace(inner, inner + '\n              add(WallpaperPackage())');
          } else {
            // Just comments, add our package
            return `PackageList(this).packages.apply {${inner}\n              add(WallpaperPackage())\n            }`;
          }
        }
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  // Step 3: Create the Kotlin files and local.properties
  config = withDangerousMod(config, ['android', async (config) => {
    const packageName = config.android?.package || 'com.quoteoftheday.app';
    const packagePath = packageName.replace(/\./g, '/');
    const srcDir = path.join(
      config.modRequest.platformProjectRoot,
      'app/src/main/java',
      packagePath
    );

    // Ensure directory exists
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // Write WallpaperModule.kt
    const moduleContent = WALLPAPER_MODULE_KT.replace(/\{\{PACKAGE_NAME\}\}/g, packageName);
    fs.writeFileSync(path.join(srcDir, 'WallpaperModule.kt'), moduleContent);

    // Write WallpaperPackage.kt
    const packageContent = WALLPAPER_PACKAGE_KT.replace(/\{\{PACKAGE_NAME\}\}/g, packageName);
    fs.writeFileSync(path.join(srcDir, 'WallpaperPackage.kt'), packageContent);

    // Create local.properties with SDK path if it doesn't exist and ANDROID_HOME isn't set
    const localPropsPath = path.join(config.modRequest.platformProjectRoot, 'local.properties');
    if (!fs.existsSync(localPropsPath)) {
      const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
      if (androidHome) {
        fs.writeFileSync(localPropsPath, `sdk.dir=${androidHome.replace(/\\/g, '\\\\')}\n`);
      } else {
        // Fallback to common Windows location
        const defaultSdk = path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk');
        if (fs.existsSync(defaultSdk)) {
          fs.writeFileSync(localPropsPath, `sdk.dir=${defaultSdk.replace(/\\/g, '\\\\')}\n`);
        }
      }
    }

    return config;
  }]);

  return config;
}

module.exports = withWallpaperModule;
