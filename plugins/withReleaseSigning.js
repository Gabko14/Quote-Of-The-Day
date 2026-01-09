/* eslint-disable no-undef */
const { withDangerousMod, withAppBuildGradle } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to configure release signing for Play Store builds.
 *
 * Setup:
 * 1. Generate keystore: keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
 * 2. Create .release-keystore.properties with your credentials (see .release-keystore.properties.example)
 * 3. Run: npx expo prebuild --clean
 */
function withReleaseSigning(config) {
  const projectRoot = process.cwd();
  const propsPath = path.join(projectRoot, ".release-keystore.properties");
  const keystorePath = path.join(projectRoot, "release.keystore");

  // Check if release signing is configured
  const hasProps = fs.existsSync(propsPath);
  const hasKeystore = fs.existsSync(keystorePath);

  if (!hasProps || !hasKeystore) {
    console.log(
      "\n⚠️  Release signing not configured - using debug keystore for release builds"
    );
    if (!hasKeystore)
      console.log("   Missing: release.keystore (run keytool to generate)");
    if (!hasProps)
      console.log(
        "   Missing: .release-keystore.properties (copy from .example)"
      );
    console.log("");
    return config;
  }

  // Read properties
  const propsContent = fs.readFileSync(propsPath, "utf8");
  const props = {};
  propsContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      props[key.trim()] = valueParts.join("=").trim();
    }
  });

  const storePassword = props.storePassword;
  const keyAlias = props.keyAlias;
  const keyPassword = props.keyPassword;

  if (!storePassword || !keyAlias || !keyPassword) {
    console.log(
      "\n⚠️  Release signing properties incomplete - check .release-keystore.properties"
    );
    return config;
  }

  // Copy keystore to android/app during prebuild
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const destPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "release.keystore"
      );
      fs.copyFileSync(keystorePath, destPath);
      console.log("✓ Copied release.keystore to android/app/");
      return config;
    },
  ]);

  // Modify build.gradle to add release signing config
  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Check if release signing is already configured
    if (contents.includes("signingConfigs.release")) {
      return config;
    }

    // Add release signing config after debug config
    const signingConfigRegex = /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\})/;
    const releaseSigningConfig = `$1
        release {
            storeFile file('release.keystore')
            storePassword '${storePassword}'
            keyAlias '${keyAlias}'
            keyPassword '${keyPassword}'
        }`;

    contents = contents.replace(signingConfigRegex, releaseSigningConfig);

    // Update release build type to use release signing config
    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release"
    );

    config.modResults.contents = contents;
    console.log("✓ Configured release signing in build.gradle");
    return config;
  });

  return config;
}

module.exports = withReleaseSigning;
