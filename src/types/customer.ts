import type { Person } from '@/types/person'
import type { Vehicle, VehicleFormItem } from '@/types/vehicle'

export interface Customer extends Person {
  id: string
  vehicles: Vehicle[]
}

export interface CustomerFormPayload extends Person {
  vehicles: VehicleFormItem[]
}

export interface CustomerFormErrors {
  first_name?: string
  last_name?: string
  cpf?: string
  phone?: string
  email?: string
  api?: string
  vehicles?: Record<number, Partial<Record<'license_plate' | 'model' | 'color', string>>>
}
