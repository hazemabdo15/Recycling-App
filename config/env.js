import Constants from "expo-constants";
import logger from "../utils/logger";

export const ENV = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  STAGING: "staging",
};

export const getCurrentEnv = () => {
  if (__DEV__) return ENV.DEVELOPMENT;

  const releaseChannel = Constants.expoConfig?.releaseChannel;
  if (releaseChannel === "staging") return ENV.STAGING;

  return ENV.PRODUCTION;
};

export const isDevelopment = () => getCurrentEnv() === ENV.DEVELOPMENT;
export const isProduction = () => getCurrentEnv() === ENV.PRODUCTION;
export const isStaging = () => getCurrentEnv() === ENV.STAGING;

const API_CONFIGS = {
  [ENV.DEVELOPMENT]: {
    baseUrl: "https://recycling-backend-2vxx.onrender.com", //"http://192.168.0.165:5000"
    timeout: 15000,
    retries: 2,
    debug: true,
  },
  [ENV.STAGING]: {
    baseUrl: "https://recycling-backend-2vxx.onrender.com",
    timeout: 10000,
    retries: 1,
    debug: true,
  },
  [ENV.PRODUCTION]: {
    baseUrl: "https://recycling-backend-2vxx.onrender.com",
    timeout: 8000,
    retries: 1,
    debug: false,
  },
};

export const getApiConfig = () => {
  const env = getCurrentEnv();
  const config = API_CONFIGS[env];

  if (!isProduction()) {
    logger.info(`Using API config for ${env}`, {
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retries: config.retries,
    });
  }

  return config;
};

export const FEATURE_FLAGS = {
  ENABLE_CONSOLE_LOGS: isDevelopment(),
  ENABLE_DEBUG_LOGS: isDevelopment(),
  ENABLE_PERFORMANCE_LOGS: true,
  ENABLE_REMOTE_LOGGING: isProduction(),

  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_RENDER_TRACKING: isDevelopment(),
  ENABLE_MEMORY_TRACKING: true,
  ENABLE_API_MONITORING: true,

  ENABLE_REDUX_DEVTOOLS: isDevelopment(),
  ENABLE_FLIPPER: isDevelopment(),
  ENABLE_NETWORK_INSPECTOR: isDevelopment(),

  ENABLE_CODE_SPLITTING: isProduction(),
  ENABLE_BUNDLE_ANALYZER: isDevelopment(),
  ENABLE_MINIFICATION: isProduction(),

  ENABLE_SSL_PINNING: isProduction(),
  ENABLE_ROOT_DETECTION: isProduction(),
  ENABLE_DEBUG_PROTECTION: isProduction(),

  // New flag to control component debug logging
  ENABLE_COMPONENT_DEBUG_LOGS: false, // Disabled to prevent infinite logs
};

const getSecureApiKey = () => {
  try {
    const fromEnv = process.env.EXPO_PUBLIC_GROQ_API_KEY;

    const fromConstants = Constants.expoConfig?.extra?.EXPO_PUBLIC_GROQ_API_KEY;

    const devKey = isDevelopment()
      ? process.env.EXPO_PUBLIC_GROQ_API_KEY
      : null;

    const apiKey = fromEnv || fromConstants || devKey;

    if (!apiKey || apiKey === "your-api-key-here") {
      const message =
        "No valid API key found. Please check your environment configuration.";

      if (isProduction()) {
        logger.error(message, null, "CONFIG");

        throw new Error(message);
      } else {
        logger.warn(message, null, "CONFIG");
      }

      return null;
    }

    if (!isProduction()) {
      logger.debug(
        "API key loaded successfully",
        { hasKey: !!apiKey },
        "CONFIG"
      );
    }
    return apiKey;
  } catch (error) {
    logger.error("Failed to load API key", error, "CONFIG");
    if (isProduction()) {
      throw error;
    }
    return null;
  }
};

export const APP_CONFIG = {
  VERSION: "1.0.0",
  BUILD_NUMBER:
    Constants.expoConfig?.ios?.buildNumber ||
    Constants.expoConfig?.android?.versionCode ||
    "1",
  APP_NAME: Constants.expoConfig?.name || "Recycling App",
  ENVIRONMENT: getCurrentEnv(),
  IS_DEVELOPMENT: isDevelopment(),
  IS_PRODUCTION: isProduction(),
  IS_STAGING: isStaging(),
  FEATURE_FLAGS,
  API: getApiConfig(),
  GROQ_API_KEY: getSecureApiKey(),
  GOOGLE_MOBILE_CLIENT_ID:
    "330056808594-aqkfehg0apfa7v00hv8ndf7t30ikrjha.apps.googleusercontent.com",
};

export const configureLogging = () => {
  logger.setConsoleLogging(FEATURE_FLAGS.ENABLE_CONSOLE_LOGS);
  logger.setRemoteLogging(FEATURE_FLAGS.ENABLE_REMOTE_LOGGING);

  if (isDevelopment()) {
    logger.setLogLevel(3);
  } else if (isStaging()) {
    logger.setLogLevel(2);
  } else {
    logger.setLogLevel(1);
  }

  if (!isProduction()) {
    logger.info(
      "Logging system configured",
      {
        environment: getCurrentEnv(),
        consoleLogging: FEATURE_FLAGS.ENABLE_CONSOLE_LOGS,
        remoteLogging: FEATURE_FLAGS.ENABLE_REMOTE_LOGGING,
        performanceLogging: FEATURE_FLAGS.ENABLE_PERFORMANCE_LOGS,
      },
      "CONFIG"
    );
  }
};

export const configurePerformanceMonitoring = () => {
  if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING) {
    require("../utils/performanceMonitor").default.disable();
    return;
  }

  const performanceMonitor = require("../utils/performanceMonitor").default;

  if (isProduction()) {
    performanceMonitor.setThresholds(200, 32);
  } else {
    performanceMonitor.setThresholds(100, 16);
  }

  if (!isProduction()) {
    logger.info(
      "Performance monitoring configured",
      {
        enabled: true,
        renderTracking: FEATURE_FLAGS.ENABLE_RENDER_TRACKING,
        memoryTracking: FEATURE_FLAGS.ENABLE_MEMORY_TRACKING,
        apiMonitoring: FEATURE_FLAGS.ENABLE_API_MONITORING,
      },
      "CONFIG"
    );
  }
};

export const initializeAppConfig = () => {
  try {
    configureLogging();
    configurePerformanceMonitoring();

    if (!isProduction()) {
      logger.info(
        "App configuration initialized",
        {
          version: APP_CONFIG.VERSION,
          environment: APP_CONFIG.ENVIRONMENT,
          features: Object.keys(FEATURE_FLAGS).filter(
            (key) => FEATURE_FLAGS[key]
          ).length,
        },
        "CONFIG"
      );
    }

    return APP_CONFIG;
  } catch (error) {
    console.error("Failed to initialize app configuration:", error);
    throw error;
  }
};

export { getSecureApiKey };
export default APP_CONFIG;
