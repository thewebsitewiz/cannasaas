const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = sessionStorage.getItem('platform-token');
  const res = await fetch(API + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'API error');
  return json.data;
}

export async function login(email: string, password: string) {
  const res = await fetch(API + '/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();
  const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
  if (payload.role !== 'super_admin') throw new Error('Platform manager requires super_admin role');
  sessionStorage.setItem('platform-token', data.accessToken);
  sessionStorage.setItem('platform-user', JSON.stringify(payload));
  return payload;
}

export function getUser() {
  const u = sessionStorage.getItem('platform-user');
  return u ? JSON.parse(u) : null;
}

export function logout() {
  sessionStorage.removeItem('platform-token');
  sessionStorage.removeItem('platform-user');
}
