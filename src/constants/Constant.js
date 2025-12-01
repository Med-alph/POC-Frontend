// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================
// Toggle these flags to switch between environments


// Set ONLY ONE to true at a time
const isProd = true;   // Production environment
const isLocal = false;   // Local development environment

// ============================================
// API CONFIGURATION
// ============================================
export const baseUrl = isProd
  ? "https://backend-emr.medalph.com"
  : isLocal
    ? "http://localhost:9009"
    : "";

// Socket.IO URL (usually same as API base URL)
export const socketUrl = isProd
  ? "https://backend-emr.medalph.com"
  : isLocal
    ? "http://localhost:9009"
    : "";

// ============================================
// FEATURE FLAGS
// ============================================
export const features = {
  enableVideoCall: true,
  enableNotifications: true,
  enableAnalytics: isProd, // Only enable analytics in production
  debugMode: isLocal,      // Enable debug logs in local
};

// ============================================
// APP CONFIGURATION
// ============================================
export const config = {
  appName: "MedAlph EMR",
  appVersion: "1.0.0",
  environment: isProd ? "production" : isLocal ? "local" : "development",

  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100,

  // Timeouts (in milliseconds)
  apiTimeout: 30000,        // 30 seconds
  socketTimeout: 10000,     // 10 seconds

  // Call settings
  callTimeout: 120000,      // 2 minutes (120 seconds)
  callRingDuration: 120,    // 2 minutes in seconds

  // Timezone
  timezone: "Asia/Kolkata", // IST
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getEnvironment = () => {
  if (isProd) return "production";
  if (isLocal) return "local";
  return "development";
};

export const isProduction = () => isProd;
export const isLocalDevelopment = () => isLocal;

// Log current environment (only in development)
if (isLocal) {
  console.log("🚀 Environment:", getEnvironment());
  console.log("🌐 API Base URL:", baseUrl);
  console.log("🔌 Socket URL:", socketUrl);
}
