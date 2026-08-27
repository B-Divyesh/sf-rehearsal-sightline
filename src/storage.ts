import type { SavedSession } from './types';

export const SESSION_KEY = 'rehearsal-sightline:session:v1';

export function loadSession(): SavedSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as SavedSession : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    throw new Error('Your browser could not save this rehearsal plan. Keep this tab open or export a backup.');
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
