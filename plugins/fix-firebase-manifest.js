const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Resolves manifest merger conflict between expo-notifications and
 * @react-native-firebase/messaging on the meta-data key:
 * com.google.firebase.messaging.default_notification_color
 *
 * Both libraries set this value differently. This plugin adds
 * tools:replace="android:resource" so the app's value wins.
 */
function withFirebaseManifestMerge(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.$) manifest.$ = {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = manifest.application?.[0];
    if (!application) return config;

    const metaData = application['meta-data'];
    if (!Array.isArray(metaData)) return config;

    const TARGET_NAME = 'com.google.firebase.messaging.default_notification_color';
    let found = false;

    for (const entry of metaData) {
      if (!entry.$) continue;
      if (entry.$['android:name'] === TARGET_NAME) {
        entry.$['tools:replace'] = 'android:resource';
        found = true;
        break;
      }
    }

    // If not found yet (added by a later plugin or library merge),
    // inject it ourselves with tools:replace so it wins in Gradle merge.
    if (!found) {
      metaData.push({
        $: {
          'android:name': TARGET_NAME,
          'android:resource': '@color/notification_icon_color',
          'tools:replace': 'android:resource',
        },
      });
    }

    return config;
  });
}

module.exports = withFirebaseManifestMerge;
