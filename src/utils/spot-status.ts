import type { ParkingSpotStatus } from '@/types/parking-spot'

export const spotStatusLabels: Record<ParkingSpotStatus, string> = {
  free: 'Livre',
  occupied: 'Ocupada',
  reserved: 'Reservada',
}

export const spotStatusSeverity: Record<ParkingSpotStatus, 'success' | 'danger' | 'warn'> = {
  free: 'success',
  occupied: 'danger',
  reserved: 'warn',
}

export const spotStatusCardClass: Record<ParkingSpotStatus, string> = {
  free: 'border-green-200 bg-green-50',
  occupied: 'border-red-200 bg-red-50',
  reserved: 'border-amber-200 bg-amber-50',
}

export function resolveDisplayStatus(
  storedStatus: ParkingSpotStatus,
  hasActiveSubscription: boolean,
): ParkingSpotStatus {
  if (storedStatus === 'occupied') {
    return 'occupied'
  }

  if (hasActiveSubscription || storedStatus === 'reserved') {
    return 'reserved'
  }

  return 'free'
}
