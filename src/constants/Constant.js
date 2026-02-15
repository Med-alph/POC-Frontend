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
  ? "https://backend-emr.medalph.com/api"
  : isLocal
    ? "/api" // Relative path for Vite proxy
    : "";

// Socket.IO URL
export const socketUrl = isProd
  ? "https://backend-emr.medalph.com"
  : isLocal
    ? "" // Relative path for Vite proxy
    : "";

// Voice Processing Socket.IO URL
// Socket.IO uses http/https URLs and handles WebSocket upgrade internally
// For transports: ['websocket'], it will use ws:// or wss:// automatically
export const getVoiceProcessingSocketUrl = () => {
  const baseSocketUrl = socketUrl;

  // If baseSocketUrl is empty (local proxy mode), return relative path
  if (!baseSocketUrl && isLocal) {
    return '/voice-processing';
  }

  if (!baseSocketUrl) {
    return 'http://localhost:9009/voice-processing';
  }

  // Socket.IO expects http/https, not ws/wss
  return `${baseSocketUrl}/voice-processing`;
};

export const voiceProcessingSocketUrl = getVoiceProcessingSocketUrl();

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
// RBAC UI MODULES (Basic definitions only)
// ============================================
export const UI_MODULES = {
  DASHBOARD: 'DASHBOARD',
  PATIENTS: 'PATIENTS',
  DOCTORS: 'DOCTORS',
  APPOINTMENTS: 'APPOINTMENTS',
  INVENTORY: 'INVENTORY',
  STAFF_MANAGEMENT: 'STAFF_MANAGEMENT',
  LEAVE_MANAGEMENT: 'LEAVE_MANAGEMENT',
  ATTENDANCE: 'ATTENDANCE',
  REMINDERS: 'REMINDERS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  BILLING: 'BILLING',
  GALLERY: 'GALLERY',
  VIDEO_CONSULTATIONS: 'VIDEO_CONSULTATIONS',
  AI_ANALYSIS: 'AI_ANALYSIS',
  REPORTS: 'REPORTS',
  CANCELLATION_REQUESTS: 'CANCELLATION_REQUESTS',
  EMAIL_TEMPLATES: 'EMAIL_TEMPLATES',
  PROCEDURES: 'PROCEDURES'
};

export const UI_MODULE_LABELS = {
  DASHBOARD: 'Dashboard',
  PATIENTS: 'Patient Management',
  DOCTORS: 'Doctor Management',
  APPOINTMENTS: 'Appointments',
  INVENTORY: 'Inventory Management',
  STAFF_MANAGEMENT: 'Staff Management',
  LEAVE_MANAGEMENT: 'Leave Management',
  ATTENDANCE: 'Attendance Management',
  REMINDERS: 'Reminders',
  NOTIFICATIONS: 'Notifications',
  BILLING: 'Billing & Payments',
  GALLERY: 'Patient Gallery',
  VIDEO_CONSULTATIONS: 'Video Consultations',
  AI_ANALYSIS: 'AI Medical Analysis',
  REPORTS: 'Reports & Analytics',
  CANCELLATION_REQUESTS: 'Cancellation Requests',
  EMAIL_TEMPLATES: 'Email Notifications',
  PROCEDURES: 'Procedures'
};

// Plan Feature → UI Modules Mapping
export const PLAN_FEATURE_TO_MODULES = {
  // Core Features (Starter Plan)
  'patient_records_limit': [
    UI_MODULES.DASHBOARD,
    UI_MODULES.PATIENTS,
    UI_MODULES.GALLERY
  ],
  'appointments_limit': [
    UI_MODULES.APPOINTMENTS,
    UI_MODULES.REMINDERS,
    UI_MODULES.CANCELLATION_REQUESTS
  ],
  'staff_limit': [
    UI_MODULES.DOCTORS,
    UI_MODULES.STAFF_MANAGEMENT,
    UI_MODULES.LEAVE_MANAGEMENT,
    UI_MODULES.ATTENDANCE
  ],
  'hospital_limit': [
    // Tenant-level feature, not user-level
  ],
  'procedures': [
    UI_MODULES.PROCEDURES
  ],

  // Premium Features
  'inventory_management': [UI_MODULES.INVENTORY],
  'video_calls': [UI_MODULES.VIDEO_CONSULTATIONS],
  'whatsapp_integration': [UI_MODULES.NOTIFICATIONS],

  // Enterprise Features
  'ai_analysis': [UI_MODULES.AI_ANALYSIS],

  // Future features (to be added to backend)
  'billing_management': [UI_MODULES.BILLING],
  'reports_analytics': [UI_MODULES.REPORTS]
};

// Reverse mapping: UI Module → Plan Features
export const MODULE_TO_PLAN_FEATURES = {
  [UI_MODULES.DASHBOARD]: ['patient_records_limit'], // Basic access
  [UI_MODULES.PATIENTS]: ['patient_records_limit'],
  [UI_MODULES.GALLERY]: ['patient_records_limit'],
  [UI_MODULES.APPOINTMENTS]: ['appointments_limit'],
  [UI_MODULES.REMINDERS]: ['appointments_limit'],
  [UI_MODULES.CANCELLATION_REQUESTS]: ['appointments_limit'],
  [UI_MODULES.DOCTORS]: ['staff_limit'],
  [UI_MODULES.STAFF_MANAGEMENT]: ['staff_limit'],
  [UI_MODULES.LEAVE_MANAGEMENT]: ['staff_limit'],
  [UI_MODULES.ATTENDANCE]: ['staff_limit'],
  [UI_MODULES.INVENTORY]: ['inventory_management'],
  [UI_MODULES.VIDEO_CONSULTATIONS]: ['video_calls'],
  [UI_MODULES.NOTIFICATIONS]: ['whatsapp_integration'],
  [UI_MODULES.EMAIL_TEMPLATES]: ['whatsapp_integration'],
  [UI_MODULES.AI_ANALYSIS]: ['ai_analysis'],
  [UI_MODULES.PROCEDURES]: ['procedures'],
  [UI_MODULES.BILLING]: ['billing_management'], // Future
  [UI_MODULES.REPORTS]: ['reports_analytics'] // Future
};

// Helper function to convert UI modules to plan features
export const convertModulesToPlanFeatures = (modules) => {
  const planFeatures = new Set();

  modules.forEach(module => {
    const features = MODULE_TO_PLAN_FEATURES[module] || [];
    features.forEach(feature => planFeatures.add(feature));
  });

  return Array.from(planFeatures);
};

// Helper function to convert plan features to UI modules
export const convertPlanFeaturesToModules = (features) => {
  const uiModules = new Set();

  features.forEach(feature => {
    const modules = PLAN_FEATURE_TO_MODULES[feature] || [];
    modules.forEach(module => uiModules.add(module));
  });

  return Array.from(uiModules);
};
// ============================================
// RBAC FEATURES (Legacy - for backward compatibility)
// ============================================
export const FEATURES = {
  INVENTORY: 'INVENTORY',
  APPOINTMENTS: 'APPOINTMENTS',
  DERMA_AI: 'DERMA_AI',
  REPORTS: 'REPORTS',
  STAFF_MANAGEMENT: 'STAFF_MANAGEMENT',
  BILLING: 'BILLING',
  PATIENTS: 'PATIENTS'
};

export const FEATURE_LABELS = {
  INVENTORY: 'Inventory Management',
  APPOINTMENTS: 'Appointments',
  DERMA_AI: 'Dermatology AI',
  REPORTS: 'Reports & Analytics',
  STAFF_MANAGEMENT: 'Staff Management',
  BILLING: 'Billing & Payments',
  PATIENTS: 'Patient Management'
};

// ============================================
// VALIDATION CONSTANTS
// ============================================
export const PHONE_REGEX = /^(\+\d{1,3}[\s-]?)?(\d{10})$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SUPPORTED_COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "United States" },
  { code: "+44", country: "United Kingdom" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+66", country: "Thailand" },
];

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
  console.log("🎤 Voice Processing Socket URL:", voiceProcessingSocketUrl);
}
