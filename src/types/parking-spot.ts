export type ParkingSpotStatus = 'free' | 'occupied' | 'reserved'

export interface ParkingSpot {
  id: string
  code: string
  status: ParkingSpotStatus
}

export interface ParkingSpotDisplay {
  spot: ParkingSpot
  displayStatus: ParkingSpotStatus
  subscriptionId?: string
  customerName?: string
  vehiclePlate?: string
}
