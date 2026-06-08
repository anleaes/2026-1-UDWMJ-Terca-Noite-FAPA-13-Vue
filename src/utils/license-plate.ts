function randomLetter(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return letters[Math.floor(Math.random() * letters.length)] ?? 'A'
}

function randomDigit(): string {
  return String(Math.floor(Math.random() * 10))
}

export function generateValidLicensePlate(): string {
  if (Math.random() >= 0.5) {
    return `${randomLetter()}${randomLetter()}${randomLetter()}${randomDigit()}${randomLetter()}${randomDigit()}${randomDigit()}`
  }

  return `${randomLetter()}${randomLetter()}${randomLetter()}-${randomDigit()}${randomDigit()}${randomDigit()}${randomDigit()}`
}

export function formatLicensePlate(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7)

  if (sanitized.length <= 3) {
    return sanitized.replace(/[^A-Z]/g, '')
  }

  const prefix = sanitized.slice(0, 3).replace(/[^A-Z]/g, '')
  const suffix = sanitized.slice(3)

  if (/\d/.test(suffix[0] ?? '') && /[A-Z]/.test(suffix[1] ?? '')) {
    const body = `${prefix}${suffix[0] ?? ''}${(suffix[1] ?? '').replace(/[^A-Z]/g, '')}${suffix.slice(2).replace(/\D/g, '')}`
    return body.slice(0, 7)
  }

  const digits = suffix.replace(/\D/g, '').slice(0, 4)

  if (digits.length === 0) {
    return prefix
  }

  return `${prefix}-${digits}`
}

export function isValidLicensePlate(value: string): boolean {
  const plate = value.trim().toUpperCase()

  return /^[A-Z]{3}-\d{4}$/.test(plate) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate)
}

export function normalizeLicensePlate(value: string): string {
  return formatLicensePlate(value)
}
