export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  enhance: '/api/enhance',
  purchase: '/api/purchase',
  restore: '/api/restore',
  analytics: '/api/analytics',
  image: '/api/image',
  enhancements: '/api/enhancements',
  userEnhancements: '/api/enhancements', // GET /api/enhancements/{user_id}

  // New AI features
  filter: '/api/filter',
  customEdit: '/api/custom-edit',

  // Email sync endpoints
  sendVerification: '/api/email/send-verification',
  verifyCode: '/api/email/verify-code',
  getDevices: '/api/email/devices',
  removeDevice: '/api/email/remove-device',
  syncedHistory: '/api/sync/history',
};