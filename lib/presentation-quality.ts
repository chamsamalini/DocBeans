export function professionalTrainingSubtitle(value:string,fallback='Professional training material'){
  const cleaned=value
    .replace(/^\s*(?:course plan for\s+)?\d+(?:\.\d+)?\s*(?:[-–—]\s*)?(?:minutes?|mins?|hours?|hrs?|days?)\s*(?:[·:–—-]\s*)?/i,'')
    .trim();
  return cleaned||fallback;
}
