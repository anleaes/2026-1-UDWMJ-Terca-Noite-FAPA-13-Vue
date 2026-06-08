export interface Vehicle {
  id: string
  customer_id: string
  license_plate: string
  model: string
  color: string
}

export interface VehicleFormItem {
  id?: string
  license_plate: string
  model: string
  color: string
}
