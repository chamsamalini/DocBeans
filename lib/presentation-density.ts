import type { AdvancedDocument } from './job-generation';

const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);

function concise(value: string, limit: number) {
  const tokens = words(value);
  if (tokens.length <= limit) return value.trim();
  const clipped = tokens.slice(0, limit).join(' ').replace(/[,;:]$/, '');
  return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
}

function addNote(notes: string[], label: string, value: string) {
  const note = `${label}: ${value.trim()}`;
  if (!notes.includes(note)) notes.push(note);
}

export function compactPresentationDensity(document: AdvancedDocument) {
  let changed = false;
  for (const section of document.sections) {
    const notes = Array.isArray(section.facilitatorNotes)
      ? [...section.facilitatorNotes]
      : [];
    if (words(section.title).length > 8) {
      addNote(notes, 'Full original title', section.title);
      section.title = concise(section.title, 8);
      changed = true;
    }
    if (words(section.summary).length > 24) {
      addNote(notes, 'Extended explanation', section.summary);
      section.summary = concise(section.summary, 24);
      changed = true;
    }
    const qna = /(?:q\s*(?:&|and)\s*a|questions?\s*(?:&|and)\s*answers?|frequently asked questions)/i.test(
      `${section.title} ${section.summary}`,
    );
    const bulletLimit = qna ? 32 : 16;
    const visibleBulletLimit = qna ? 2 : 4;
    const compactedBullets = section.bullets.map((bullet) => {
      if (words(bullet).length <= bulletLimit) return bullet;
      addNote(notes, 'Extended evidence', bullet);
      changed = true;
      return concise(bullet, bulletLimit);
    });
    if (compactedBullets.length > visibleBulletLimit) {
      for (const bullet of compactedBullets.slice(visibleBulletLimit))
        addNote(notes, 'Additional evidence', bullet);
      changed = true;
    }
    section.bullets = compactedBullets.slice(0, visibleBulletLimit);
    section.facilitatorNotes = notes;
  }
  return changed;
}
