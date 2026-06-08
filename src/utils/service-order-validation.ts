import type {
  ServiceItemFormErrors,
  ServiceItemFormPayload,
  ServiceOrderOpenErrors,
  ServiceOrderOpenPayload,
} from '@/types/service-order'

export function validateServiceOrderOpen(payload: ServiceOrderOpenPayload): ServiceOrderOpenErrors {
  const errors: ServiceOrderOpenErrors = {}

  if (!payload.vehicle_plate.trim()) {
    errors.vehicle_plate = 'Informe a placa do veículo.'
  }

  if (!payload.spot_id) {
    errors.spot_id = 'Selecione a vaga.'
  }

  return errors
}

export function validateServiceItemForm(payload: ServiceItemFormPayload): ServiceItemFormErrors {
  const errors: ServiceItemFormErrors = {}

  if (!payload.type) {
    errors.type = 'Selecione o serviço.'
  }

  if (!payload.quantity || payload.quantity <= 0) {
    errors.quantity = 'Informe uma quantidade válida.'
  }

  return errors
}

export function hasServiceOrderOpenErrors(errors: ServiceOrderOpenErrors): boolean {
  return Object.keys(errors).length > 0
}

export function hasServiceItemFormErrors(errors: ServiceItemFormErrors): boolean {
  return Object.keys(errors).length > 0
}
