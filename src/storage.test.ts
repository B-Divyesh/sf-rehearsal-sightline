import { beforeEach, describe, expect, it } from 'vitest';
import { clearSession, DEMO_SESSION_KEY, loadSession, saveSession, SESSION_KEY } from './storage';
import type { SavedSession } from './types';

const session: SavedSession = {
  score: { key: 'abc', fileName: 'part.musicxml', title: 'Part', composer: '', importedAt: '2026-08-27T00:00:00Z', parts: [{ id: 'P1', name: 'Flute', measures: [] }] },
  partId: 'P1', lookahead: 4, current: 0,
  ranges: [{ id: 'r1', start: 0, end: 3, label: 'Opening', note: 'Easy air', status: 'planned' }],
};

describe('local session storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips and removes a plan without a network', () => {
    saveSession(session);
    expect(loadSession()).toEqual(session);
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('fails closed when stored data is unreadable', () => {
    localStorage.setItem('rehearsal-sightline:session:v1', '{bad');
    expect(loadSession()).toBeNull();
  });

  it('keeps demo and real plans in separate namespaces', () => {
    const demo = { ...session, score: { ...session.score, title: 'Demo part' } };
    saveSession(session);
    saveSession(demo, true);

    expect(loadSession()).toEqual(session);
    expect(loadSession(true)).toEqual(demo);
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(localStorage.getItem(DEMO_SESSION_KEY)).not.toBeNull();

    clearSession(true);
    expect(loadSession(true)).toBeNull();
    expect(loadSession()).toEqual(session);
  });
});
