const { withAndroidManifest } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const DEBUG_LOG = path.join(__dirname, '..', '.cursor', 'debug.log');
function debugLog(payload) {
  try {
    fs.appendFileSync(DEBUG_LOG, JSON.stringify({ ...payload, timestamp: Date.now() }) + '\n');
  } catch (_) {}
}

/**
 * Resolves manifest merger conflict between expo-notifications and
 * react-native-firebase/messaging on meta-data#com.google.firebase.messaging.default_notification_color.
 * Adds tools:replace="android:resource" so the app's value wins.
 */
function withFirebaseManifestMerge(config) {
  return withAndroidManifest(config, (config) => {
    // #region agent log
    debugLog({ hypothesisId: 'H1', location: 'fix-firebase-manifest.js:entry', message: 'plugin ran', data: { manifestRootKeys: config.modResults?.manifest ? Object.keys(config.modResults.manifest) : [] } });
    // #endregion
    const manifest = config.modResults.manifest;
    if (!manifest.$) manifest.$ = {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = manifest.application?.[0];
    // #region agent log
    debugLog({ hypothesisId: 'H2', location: 'fix-firebase-manifest.js:after-application', message: 'application check', data: { hasApplication: !!application, applicationKeys: application ? Object.keys(application) : [] } });
    // #endregion
    if (!application) return config;

    const metaData = application['meta-data'];
    // #region agent log
    const metaDataIsArray = Array.isArray(metaData);
    const metaDataLen = metaDataIsArray ? metaData.length : (metaData ? 'non-array' : 'missing');
    const names = metaDataIsArray ? metaData.map((e, i) => ({ i, keys: e.$ ? Object.keys(e.$) : [], name: e.$?.['android:name'] })) : [];
    debugLog({ hypothesisId: 'H3', location: 'fix-firebase-manifest.js:meta-data', message: 'meta-data structure', data: { metaDataIsArray, metaDataLen, entries: names } });
    // #endregion
    if (!Array.isArray(metaData)) return config;

    const TARGET_NAME = 'com.google.firebase.messaging.default_notification_color';
    let found = false;
    for (const entry of metaData) {
      if (!entry.$) continue;
      const nameVal = entry.$['android:name'];
      // #region agent log
      if (nameVal && (String(nameVal).includes('firebase') || String(nameVal).includes('notification'))) {
        debugLog({ hypothesisId: 'H3', location: 'fix-firebase-manifest.js:entry-check', message: 'firebase/notif meta-data', data: { nameVal, allKeys: Object.keys(entry.$) } });
      }
      // #endregion
      if (nameVal === TARGET_NAME) {
        entry.$['tools:replace'] = 'android:resource';
        found = true;
        // #region agent log
        debugLog({ hypothesisId: 'H4', location: 'fix-firebase-manifest.js:replaced', message: 'added tools:replace', data: { nameVal } });
        // #endregion
        break;
      }
    }
    // Target meta-data is added by a plugin that runs after us or by library merge;
    // add it ourselves with tools:replace so the app manifest wins in Gradle merge.
    if (!found) {
      metaData.push({
        $: {
          'android:name': TARGET_NAME,
          'android:resource': '@color/notification_icon_color',
          'tools:replace': 'android:resource',
        },
      });
      debugLog({ hypothesisId: 'H5', location: 'fix-firebase-manifest.js:injected', message: 'injected meta-data with tools:replace', data: {} });
    }
    // #region agent log
    debugLog({ hypothesisId: 'H1', location: 'fix-firebase-manifest.js:exit', message: 'plugin exit', data: { found } });
    // #endregion
    return config;
  });
}

module.exports = withFirebaseManifestMerge;
