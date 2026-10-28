import { MOCK_USERS, MOCK_SLOTS, MOCK_STUDENT_EXPENSES } from './mocks/fixtures.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function apiRequest(endpoint, options = {}, portal = 'student') {
  if (USE_MOCKS) {
    return handleMockRequest(endpoint, options, portal);
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Portal': portal,
  };

  try {
    const res = await fetch(`/api/v1${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      credentials: 'same-origin',
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error?.message || 'API request failed');
      err.code = data.error?.code || 'UNKNOWN_ERROR';
      err.details = data.error?.details;
      err.status = res.status;
      throw err;
    }

    return data;
  } catch (err) {
    // If backend is down, provide friendly mock fallback in dev
    if (import.meta.env.DEV && (err.message.includes('fetch') || err.status === 404)) {
      console.warn(`[API] Fallback to mock for ${endpoint} due to connection error:`, err.message);
      return handleMockRequest(endpoint, options, portal);
    }
    throw err;
  }
}

function handleMockRequest(endpoint, options, portal) {
  if (endpoint === '/auth/google' || endpoint === '/auth/login') {
    const role = (portal || 'student').toLowerCase();
    const user = MOCK_USERS[role] || MOCK_USERS.student;
    return Promise.resolve({ user, token: 'mock-jwt-token' });
  }

  if (endpoint === '/auth/me') {
    const role = (portal || 'student').toLowerCase();
    const user = MOCK_USERS[role] || MOCK_USERS.student;
    return Promise.resolve({ user });
  }

  if (endpoint === '/auth/logout') {
    return Promise.resolve({ message: 'Signed out' });
  }

  if (endpoint.startsWith('/meal-slots')) {
    return Promise.resolve({ data: MOCK_SLOTS, serverNow: new Date().toISOString() });
  }

  if (endpoint === '/student/expenses') {
    return Promise.resolve({ data: MOCK_STUDENT_EXPENSES });
  }

  return Promise.resolve({ data: null, meta: {} });
}

