import type { SavedSession } from './types';

export const SESSION_KEY = 'rehearsal-sightline:session:v1';
export const DEMO_SESSION_KEY = 'demo:rehearsal-sightline:session:v1';

function keyFor(demo = false): string {
  return demo ? DEMO_SESSION_KEY : SESSION_KEY;
}

export function loadSession(demo = false): SavedSession | null {
  try {
    const value = localStorage.getItem(keyFor(demo));
    return value ? JSON.parse(value) as SavedSession : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession, demo = false): void {
  try {
    localStorage.setItem(keyFor(demo), JSON.stringify(session));
  } catch {
    throw new Error('Your browser could not save this rehearsal plan. Keep this tab open or export a backup.');
  }
}

export function clearSession(demo = false): void {
  localStorage.removeItem(keyFor(demo));
}
