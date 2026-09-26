export function validationRecoveryAdvice(
  validationError: string,
  documentType: string,
  deferExercises: boolean,
) {
  if (deferExercises)
    return 'The topic decks were generated separately, but the assembled course did not pass the final cross-topic check. Refine the affected topic or requirements.';
  if (/traceable approved|source trace/i.test(validationError))
    return 'Check that the relevant approved source or pasted knowledge supports this content, then retry.';
  if (
    documentType === 'presentation' &&
    /too dense|slide count|exactly \d+ slides/i.test(validationError)
  )
    return 'The automatic repair could not fit the requested story into readable slides. Increase the slide count or narrow the requested scope.';
  if (/visual/i.test(validationError))
    return 'Review the visual requirement and available evidence, or choose text-only output.';
  if (/mandatory requirement/i.test(validationError))
    return 'Clarify or narrow the affected requirement, then retry.';
  return documentType === 'presentation'
    ? 'The automatic repair could not satisfy this presentation quality check. Review the brief or choose another model.'
    : 'The automatic repair could not produce a valid document; refine the brief or choose another model.';
}
