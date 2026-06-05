/** Strip to digits only; US numbers compare on last 10 digits. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

/** Return true if two phone strings refer to the same number. */
export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a)
  const nb = normalizePhone(b)
  return na.length > 0 && na === nb
}
