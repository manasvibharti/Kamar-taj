/**
 * API client helper with auth headers and time simulator support
 */

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('mess_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('mess_token', token);
  } else {
    localStorage.removeItem('mess_token');
  }
}

export function getSimulatedTime() {
  return localStorage.getItem('mess_simulated_time') || null;
}

export function setSimulatedTime(timeStr) {
  if (timeStr) {
    localStorage.setItem('mess_simulated_time', timeStr);
  } else {
    localStorage.removeItem('mess_simulated_time');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const mockTime = getSimulatedTime();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(mockTime ? { 'x-mock-time': mockTime } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  login: (identifierOrCreds, password, role) => {
    const body =
      typeof identifierOrCreds === 'object'
        ? identifierOrCreds
        : { identifier: identifierOrCreds, password, role };
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  getMe: () => request('/auth/me'),

  getMeals: () => request('/meals'),

  getMealQr: (mealId) => request(`/qr/${mealId}`),

  scanQr: (token) =>
    request('/scan', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),

  getStudentHistory: () => request('/student/history'),

  getRecentScans: () => request('/scan/recent'),

  getTodayMealStats: () => request('/meals/today-stats')
};
