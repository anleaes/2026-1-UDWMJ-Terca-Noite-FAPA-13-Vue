export type ServiceCategoryType = 'parking' | 'washing' | 'detailing'

export type ServiceOrderStatus = 'open' | 'closed' | 'paid'

export interface ServiceCategory {
  type: ServiceCategoryType
  name: string
  base_price: number
  unit_label: string
}

export interface ServiceItem {
  id: string
  service_order_id: string
  type: ServiceCategoryType
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface ServiceOrder {
  id: string
  ticket_number: string
  customer_id: string | null
  customer_name: string
  vehicle_plate: string
  spot_id: string
  spot_code: string
  entry_at: string
  exit_at: string | null
  status: ServiceOrderStatus
  items: ServiceItem[]
}

export interface ServiceOrderOpenPayload {
  vehicle_plate: string
  customer_id: string | null
  spot_id: string
}

export interface ServiceOrderOpenErrors {
  vehicle_plate?: string
  spot_id?: string
  api?: string
}

export interface ServiceItemFormPayload {
  type: ServiceCategoryType
  quantity: number
}

export interface ServiceItemFormErrors {
  type?: string
  quantity?: string
}

export interface ParkingFeeResult {
  exit_at: string
  hours: number
  base_price: number
  total: number
  item: ServiceItem
}
