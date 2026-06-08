export function calculateParkingDurationHours(entryAt: string, exitAt: string): number {
  const elapsedMs = new Date(exitAt).getTime() - new Date(entryAt).getTime()
  const hours = elapsedMs / (1000 * 60 * 60)

  return Number(Math.max(hours, 0).toFixed(2))
}

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return Number((quantity * unitPrice).toFixed(2))
}

export function calculateOrderTotal(items: Array<{ total: number }>): number {
  return Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2))
}
