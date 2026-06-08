import type { ParkingSpotStatus } from '@/types/parking-spot'

export type ApiParkingSpotStatus = 'Livre' | 'Ocupada' | 'Reservada'

const toApiMap: Record<ParkingSpotStatus, ApiParkingSpotStatus> = {
  free: 'Livre',
  occupied: 'Ocupada',
  reserved: 'Reservada',
}

const fromApiMap: Record<string, ParkingSpotStatus> = {
  Livre: 'free',
  Ocupada: 'occupied',
  Reservada: 'reserved',
  free: 'free',
  occupied: 'occupied',
  reserved: 'reserved',
}

export function toApiParkingSpotStatus(status: ParkingSpotStatus): ApiParkingSpotStatus {
  return toApiMap[status]
}

export function fromApiParkingSpotStatus(status: string): ParkingSpotStatus {
  return fromApiMap[status] ?? 'free'
}
