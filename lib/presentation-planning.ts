export const MIN_PRESENTATION_SLIDES = 5;
export const MAX_PRESENTATION_SLIDES = 30;
export const DEFAULT_PRESENTATION_SLIDES = 10;

export function normalisePresentationSlideCount(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_PRESENTATION_SLIDES;
  return Math.max(
    MIN_PRESENTATION_SLIDES,
    Math.min(MAX_PRESENTATION_SLIDES, Math.round(parsed)),
  );
}

export function presentationContentSlideCount(totalSlides: unknown) {
  return normalisePresentationSlideCount(totalSlides) - 1;
}

export function recommendedPresentationOutputTokens({
  slideCount,
  sourceCount = 0,
  requirementCount = 0,
  requirementCharacters = 0,
  visuals = false,
  longPurpose = false,
}: {
  slideCount: unknown;
  sourceCount?: number;
  requirementCount?: number;
  requirementCharacters?: number;
  visuals?: boolean;
  longPurpose?: boolean;
}) {
  const contentSlides = presentationContentSlideCount(slideCount);
  const estimate =
    3500 +
    contentSlides * 650 +
    Math.min(2000, Math.max(0, sourceCount) * 250) +
    Math.max(0, requirementCount - 3) * 400 +
    Math.floor(Math.max(0, requirementCharacters) / 600) * 400 +
    (visuals ? 750 : 0) +
    (longPurpose ? 750 : 0);
  return Math.max(4000, Math.min(24000, Math.ceil(estimate / 1000) * 1000));
}
