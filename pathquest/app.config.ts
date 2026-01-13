import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic Expo config wrapper.
 *
 * - Uses the `config` argument as the base (this comes from `app.json` + defaults),
 *   which avoids warnings about "app.config.ts not using app.json".
 * - For Mapbox downloads auth, rely on the env var `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`
 *   (recommended by the Mapbox/Expo plugin; the old `RNMapboxMapsDownloadToken` option is deprecated).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  const pluginsArr = (Array.isArray(base.plugins) ? base.plugins : []) as any[];

  const hasRnMapboxPlugin = pluginsArr.some(
    (p) => (Array.isArray(p) ? p[0] : p) === "@rnmapbox/maps"
  );

  const hasDateTimePickerPlugin = pluginsArr.some(
    (p) => (Array.isArray(p) ? p[0] : p) === "@react-native-community/datetimepicker"
  );

  if (!process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN) {
    // Helpful when running locally. EAS builds should provide this via `eas secret`.
    // We intentionally do NOT throw here so local non-map flows can still run.
    // Mapbox-native builds may fail if this is missing.
    // eslint-disable-next-line no-console
    console.warn(
      "[app.config] RNMAPBOX_MAPS_DOWNLOAD_TOKEN is not set. Mapbox Android/iOS builds may fail to download SDK artifacts."
    );
  }

  // Build final plugins array
  let finalPlugins = pluginsArr;
  if (!hasRnMapboxPlugin) {
    finalPlugins = [...finalPlugins, "@rnmapbox/maps"];
  }
  if (!hasDateTimePickerPlugin) {
    finalPlugins = [...finalPlugins, "@react-native-community/datetimepicker"];
  }

  return {
    ...base,
    plugins: finalPlugins,
    android: {
      ...base.android,
      // Use EAS secret file path if available, otherwise fall back to local file for development
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? base.android?.googleServicesFile ?? "./google-services.json",
    },
  } as ExpoConfig;
};

