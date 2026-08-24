/** User-facing message for a failed persist/save. */
export function persistErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return 'Changes could not be saved. Try again.'
}
