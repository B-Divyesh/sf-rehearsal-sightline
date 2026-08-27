import { describe, expect, it } from 'vitest';
import { parseMusicXml } from './musicxml';

const score = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Ice Etude</work-title></work>
  <identification><creator type="composer">A. Player</creator></identification>
  <part-list><score-part id="P1"><part-name>Clarinet</part-name></score-part></part-list>
  <part id="P1">
    <measure number="12">
      <attributes><divisions>2</divisions><time><beats>3</beats><beat-type>4</beat-type></time></attributes>
      <direction><direction-type><rehearsal>B</rehearsal><metronome><per-minute>72</per-minute></metronome></direction-type></direction>
      <note><pitch><step>F</step><alter>1</alter><octave>5</octave></pitch><duration>2</duration></note>
      <note><rest/><duration>4</duration></note>
    </measure>
    <measure number="13"><note><pitch><step>G</step><octave>5</octave></pitch><duration>6</duration></note></measure>
  </part>
</score-partwise>`;

describe('parseMusicXml', () => {
  it('extracts player-facing score, part, measure, tempo, and note details', () => {
    const parsed = parseMusicXml(score, 'ice.musicxml');
    expect(parsed.title).toBe('Ice Etude');
    expect(parsed.composer).toBe('A. Player');
    expect(parsed.parts[0]?.name).toBe('Clarinet');
    expect(parsed.parts[0]?.measures).toHaveLength(2);
    expect(parsed.parts[0]?.measures[0]).toMatchObject({ number: '12', beats: 3, beatType: 4, tempo: 72, rehearsal: 'B' });
    expect(parsed.parts[0]?.measures[1]?.tempo).toBe(72);
    expect(parsed.parts[0]?.measures[0]?.notes[0]).toMatchObject({ step: 'F', octave: 5, alter: 1, rest: false });
    expect(parsed.parts[0]?.measures[0]?.notes[1]?.rest).toBe(true);
  });

  it('rejects malformed and timewise XML with an actionable message', () => {
    expect(() => parseMusicXml('<not-score/>')).toThrow(/not a MusicXML partwise score/);
    expect(() => parseMusicXml('<score-timewise/>')).toThrow(/Export a partwise MusicXML/);
    expect(() => parseMusicXml('<score-partwise>')).toThrow(/not valid XML/);
  });
});
