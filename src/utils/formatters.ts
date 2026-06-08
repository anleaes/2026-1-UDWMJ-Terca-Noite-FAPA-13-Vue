export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length !== 11) {
    return value
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function generateValidCpf(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))

  const calculateDigit = (slice: number[]): number => {
    const factor = slice.length + 1
    const total = slice.reduce((sum, digit, index) => sum + digit * (factor - index), 0)
    const remainder = (total * 10) % 11

    return remainder === 10 ? 0 : remainder
  }

  const firstDigit = calculateDigit(digits)
  const secondDigit = calculateDigit([...digits, firstDigit])
  const cpfDigits = [...digits, firstDigit, secondDigit]

  return cpfDigits.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return value
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function formatDateTime(value: string): string {
  const date = new Date(value)

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}
