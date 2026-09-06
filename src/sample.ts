import type { SavedSession } from './types';

/**
 * A small original score plan used only by /demo. It is intentionally stored
 * in code so a player can open the complete example without an upload or a
 * network request beyond the app shell.
 */
const sample: SavedSession = {
  score: {
    key: 'north-window-demo',
    fileName: 'north-window-study.musicxml',
    title: 'North Window Study',
    composer: 'Factory original',
    importedAt: '2026-09-06T00:00:00.000Z',
    parts: [
      {
        id: 'P1',
        name: 'Clarinet in B♭',
        measures: [
          { number: '1', index: 0, beats: 4, beatType: 4, tempo: 120, rehearsal: '', notes: [{ step: 'C', octave: 4, alter: 0, rest: false, duration: 4, chord: false }, { step: 'E', octave: 4, alter: 0, rest: false, duration: 4, chord: false }, { step: 'G', octave: 4, alter: 0, rest: false, duration: 8, chord: false }] },
          { number: '2', index: 1, beats: 4, beatType: 4, tempo: 120, rehearsal: '', notes: [{ step: 'D', octave: 4, alter: 0, rest: false, duration: 4, chord: false }, { step: 'C', octave: 4, alter: 0, rest: true, duration: 4, chord: false }, { step: 'F', octave: 4, alter: 1, rest: false, duration: 8, chord: false }] },
          { number: '3', index: 2, beats: 4, beatType: 4, tempo: 120, rehearsal: 'A', notes: [{ step: 'A', octave: 4, alter: 0, rest: false, duration: 8, chord: false }, { step: 'B', octave: 4, alter: 0, rest: false, duration: 8, chord: false }] },
          { number: '4', index: 3, beats: 4, beatType: 4, tempo: 120, rehearsal: '', notes: [{ step: 'C', octave: 5, alter: 0, rest: false, duration: 4, chord: false }, { step: 'B', octave: 4, alter: 0, rest: false, duration: 4, chord: false }, { step: 'A', octave: 4, alter: 0, rest: false, duration: 8, chord: false }] },
          { number: '5', index: 4, beats: 4, beatType: 4, tempo: 120, rehearsal: '', notes: [{ step: 'C', octave: 4, alter: 0, rest: true, duration: 16, chord: false }] },
          { number: '6', index: 5, beats: 4, beatType: 4, tempo: 88, rehearsal: '', notes: [{ step: 'G', octave: 4, alter: 0, rest: false, duration: 4, chord: false }, { step: 'E', octave: 4, alter: 0, rest: false, duration: 4, chord: false }, { step: 'D', octave: 4, alter: 0, rest: false, duration: 8, chord: false }] },
          { number: '7', index: 6, beats: 4, beatType: 4, tempo: 88, rehearsal: '', notes: [{ step: 'F', octave: 4, alter: 0, rest: false, duration: 16, chord: false }] },
          { number: '8', index: 7, beats: 4, beatType: 4, tempo: 88, rehearsal: '', notes: [{ step: 'C', octave: 4, alter: 0, rest: false, duration: 16, chord: false }] },
        ],
      },
      {
        id: 'P2',
        name: 'Cello',
        measures: [
          { number: '1', index: 0, beats: 4, beatType: 4, tempo: 96, rehearsal: '', notes: [{ step: 'C', octave: 3, alter: 0, rest: false, duration: 16, chord: false }] },
          { number: '2', index: 1, beats: 4, beatType: 4, tempo: 96, rehearsal: '', notes: [{ step: 'G', octave: 2, alter: 0, rest: false, duration: 16, chord: false }] },
        ],
      },
    ],
  },
  partId: 'P1',
  lookahead: 4,
  current: 2,
  ranges: [
    { id: 'demo-opening', start: 0, end: 1, label: 'Opening shape', note: 'Keep the first leap light.', status: 'passed' },
    { id: 'demo-rehearsal-a', start: 2, end: 3, label: 'Rehearsal A lift', note: 'Breathe before the ascent.', status: 'needs-work' },
    { id: 'demo-rest', start: 4, end: 5, label: 'Rest before the turn', note: 'Count the full bar before the slower return.', status: 'planned' },
    { id: 'demo-return', start: 5, end: 7, label: 'Return figure', note: 'Set the target after the notes settle.', status: 'planned' },
  ],
};

export function createDemoSession(): SavedSession {
  return JSON.parse(JSON.stringify(sample)) as SavedSession;
}
