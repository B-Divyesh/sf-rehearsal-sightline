import { unzipSync, strFromU8 } from 'fflate';
import type { Measure, NoteGlyph, ParsedScore, ScorePart } from './types';

const text = (parent: ParentNode, selector: string, fallback = ''): string =>
  parent.querySelector(selector)?.textContent?.trim() || fallback;

const directChildren = (parent: Element, tag: string): Element[] =>
  Array.from(parent.children).filter(child => child.localName === tag);

function readXml(source: string): XMLDocument {
  const xml = new DOMParser().parseFromString(source, 'application/xml');
  const parserError = xml.querySelector('parsererror');
  if (parserError) throw new Error('This file is not valid XML. Export it as MusicXML and try again.');
  const root = xml.documentElement.localName;
  if (root !== 'score-partwise') {
    if (root === 'score-timewise') throw new Error('Timewise MusicXML is not supported yet. Export a partwise MusicXML file and try again.');
    throw new Error('This XML file is not a MusicXML partwise score.');
  }
  return xml;
}

function decodeMxl(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error('This compressed score could not be opened. Re-export the .mxl file and try again.');
  }
  const names = Object.keys(files).filter(name => !name.startsWith('META-INF/') && /\.(xml|musicxml)$/i.test(name));
  if (!names.length) throw new Error('The .mxl archive does not contain a MusicXML score.');
  const preferred = names.find(name => !/container\.xml$/i.test(name)) || names[0];
  const data = preferred ? files[preferred] : undefined;
  if (!data) throw new Error('The score data is missing from this .mxl archive.');
  return strFromU8(data);
}

function scoreKey(file: { name: string; size: number }, source: string): string {
  let hash = 2166136261;
  const sample = `${file.name}:${file.size}:${source.slice(0, 4096)}`;
  for (let index = 0; index < sample.length; index += 1) {
    hash ^= sample.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36);
}

function parseMeasure(element: Element, index: number, inherited: { beats: number; beatType: number; tempo: number }): Measure {
  const beats = Number(text(element, 'attributes time beats', String(inherited.beats))) || inherited.beats;
  const beatType = Number(text(element, 'attributes time beat-type', String(inherited.beatType))) || inherited.beatType;
  const soundTempo = element.querySelector('sound[tempo]')?.getAttribute('tempo');
  const metronomeTempo = text(element, 'direction metronome per-minute');
  const tempo = Number(soundTempo || metronomeTempo || inherited.tempo) || inherited.tempo;
  inherited.beats = beats;
  inherited.beatType = beatType;
  inherited.tempo = tempo;
  const notes: NoteGlyph[] = directChildren(element, 'note').filter(note => !note.querySelector('grace')).map(note => ({
    step: text(note, 'pitch step', 'C'),
    octave: Number(text(note, 'pitch octave', '4')) || 4,
    alter: Number(text(note, 'pitch alter', '0')) || 0,
    rest: Boolean(note.querySelector('rest')),
    duration: Number(text(note, 'duration', '1')) || 1,
    chord: Boolean(note.querySelector('chord')),
  }));
  return {
    number: element.getAttribute('number') || String(index + 1),
    index,
    notes,
    beats,
    beatType,
    tempo,
    rehearsal: text(element, 'direction rehearsal'),
  };
}

export function parseMusicXml(source: string, fileName = 'score.musicxml', size = source.length): ParsedScore {
  const xml = readXml(source);
  const partNames = new Map<string, string>();
  xml.querySelectorAll('part-list score-part').forEach(part => {
    const id = part.getAttribute('id') || '';
    partNames.set(id, text(part, 'part-name', `Part ${partNames.size + 1}`));
  });
  const parts: ScorePart[] = Array.from(xml.documentElement.children)
    .filter(child => child.localName === 'part')
    .map((part, partIndex) => {
      const id = part.getAttribute('id') || `part-${partIndex + 1}`;
      const inherited = { beats: 4, beatType: 4, tempo: 96 };
      const measures = directChildren(part, 'measure').map((measure, index) => parseMeasure(measure, index, inherited));
      return { id, name: partNames.get(id) || `Part ${partIndex + 1}`, measures };
    }).filter(part => part.measures.length > 0);
  if (!parts.length) throw new Error('No playable parts or measures were found in this score.');
  const title = text(xml, 'work work-title') || text(xml, 'movement-title') || fileName.replace(/\.(musicxml|xml|mxl)$/i, '');
  const composer = text(xml, 'identification creator[type="composer"]') || text(xml, 'identification creator');
  return { key: scoreKey({ name: fileName, size }, source), fileName, title, composer, parts, importedAt: new Date().toISOString() };
}

export async function parseScoreFile(file: File): Promise<ParsedScore> {
  if (file.size > 25 * 1024 * 1024) throw new Error('That score is over 25 MB. Export a single part or a smaller MusicXML file.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isMxl = /\.mxl$/i.test(file.name) || (bytes[0] === 0x50 && bytes[1] === 0x4b);
  const source = isMxl ? decodeMxl(bytes) : new TextDecoder().decode(bytes);
  return parseMusicXml(source, file.name, file.size);
}
