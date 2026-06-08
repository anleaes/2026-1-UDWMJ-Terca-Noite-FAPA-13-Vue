export type SubscriptionStatus = 'active' | 'inactive'

export interface Subscription {
  id: string
  customer_id: string
  spot_id: string
  vehicle_id: string
  monthly_fee: number
  start_date: string
  status: SubscriptionStatus
}

export interface SubscriptionFormPayload {
  customer_id: string
  spot_id: string
  vehicle_id: string
  monthly_fee: number
  start_date: string
}

export interface SubscriptionFormErrors {
  customer_id?: string
  spot_id?: string
  vehicle_id?: string
  monthly_fee?: string
  start_date?: string
  api?: string
}
