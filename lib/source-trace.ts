export const PASTED_KNOWLEDGE_REFERENCE = 'Pasted knowledge notes';

type TraceSource = { name: string; content: string; url?: string };

const ignoredTerms = new Set([
  'about',
  'after',
  'also',
  'from',
  'have',
  'into',
  'more',
  'that',
  'their',
  'these',
  'this',
  'with',
]);

function terms(value: string) {
  return new Set(
    (value.toLowerCase().match(/[a-z0-9]{4,}/g) || []).filter(
      (term) => !ignoredTerms.has(term),
    ),
  );
}

export function inferSourceReferences(
  sectionText: string,
  sources: TraceSource[],
) {
  if (!sources.length) return [];
  if (sources.length === 1) return [sources[0].url || sources[0].name];
  const sectionTerms = terms(sectionText);
  return sources
    .map((source) => {
      const sourceTerms = terms(`${source.name} ${source.content}`);
      const score = [...sectionTerms].reduce(
        (total, term) => total + (sourceTerms.has(term) ? 1 : 0),
        0,
      );
      return { reference: source.url || source.name, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((candidate) => candidate.reference);
}
