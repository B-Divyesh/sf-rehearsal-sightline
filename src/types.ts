export type NoteGlyph = {
  step: string;
  octave: number;
  alter: number;
  rest: boolean;
  duration: number;
  chord: boolean;
};

export type Measure = {
  number: string;
  index: number;
  notes: NoteGlyph[];
  beats: number;
  beatType: number;
  tempo: number;
  rehearsal: string;
};

export type ScorePart = {
  id: string;
  name: string;
  measures: Measure[];
};

export type ParsedScore = {
  key: string;
  fileName: string;
  title: string;
  composer: string;
  parts: ScorePart[];
  importedAt: string;
};

export type RangeStatus = 'planned' | 'needs-work' | 'passed';

export type RehearsalRange = {
  id: string;
  start: number;
  end: number;
  label: string;
  note: string;
  status: RangeStatus;
  targetTempo?: number;
};

export type SavedSession = {
  score: ParsedScore;
  partId: string;
  lookahead: number;
  current: number;
  ranges: RehearsalRange[];
};
