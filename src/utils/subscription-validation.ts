import type { SubscriptionFormErrors, SubscriptionFormPayload } from '@/types/subscription'

export function validateSubscriptionForm(payload: SubscriptionFormPayload): SubscriptionFormErrors {
  const errors: SubscriptionFormErrors = {}

  if (!payload.customer_id) {
    errors.customer_id = 'Selecione o cliente.'
  }

  if (!payload.spot_id) {
    errors.spot_id = 'Selecione a vaga.'
  }

  if (!payload.vehicle_id) {
    errors.vehicle_id = 'Selecione o veículo.'
  }

  if (!payload.start_date) {
    errors.start_date = 'Informe a data de início.'
  }

  if (!payload.monthly_fee || payload.monthly_fee <= 0) {
    errors.monthly_fee = 'Informe um valor mensal válido.'
  }

  return errors
}

export function hasSubscriptionFormErrors(errors: SubscriptionFormErrors): boolean {
  return Object.keys(errors).length > 0
}
