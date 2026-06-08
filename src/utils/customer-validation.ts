import type { CustomerFormErrors, CustomerFormPayload } from '@/types/customer'
import { isValidLicensePlate } from '@/utils/license-plate'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '')

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false
  }

  const calculateDigit = (slice: string, factor: number): number => {
    const total = slice
      .split('')
      .reduce((sum, digit, index) => sum + Number(digit) * (factor - index), 0)
    const remainder = (total * 10) % 11

    return remainder === 10 ? 0 : remainder
  }

  const firstDigit = calculateDigit(digits.slice(0, 9), 10)
  const secondDigit = calculateDigit(digits.slice(0, 10), 11)

  return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10])
}

export function validateCustomerForm(
  payload: CustomerFormPayload,
  isCpfTaken: (cpf: string) => boolean,
): CustomerFormErrors {
  const errors: CustomerFormErrors = {}

  if (!payload.first_name.trim()) {
    errors.first_name = 'Informe o nome.'
  }

  if (!payload.last_name.trim()) {
    errors.last_name = 'Informe o sobrenome.'
  }

  if (!payload.cpf.trim()) {
    errors.cpf = 'Informe o CPF.'
  } else if (!isValidCpf(payload.cpf)) {
    errors.cpf = 'CPF inválido.'
  } else if (isCpfTaken(payload.cpf)) {
    errors.cpf = 'CPF já cadastrado.'
  }

  if (!payload.phone.trim()) {
    errors.phone = 'Informe o telefone.'
  } else {
    const phoneDigits = payload.phone.replace(/\D/g, '')

    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      errors.phone = 'Telefone inválido.'
    }
  }

  if (!payload.email.trim()) {
    errors.email = 'Informe o e-mail.'
  } else if (!emailPattern.test(payload.email.trim())) {
    errors.email = 'E-mail inválido.'
  }

  const vehicleErrors: CustomerFormErrors['vehicles'] = {}

  payload.vehicles.forEach((vehicle, index) => {
    const itemErrors: Partial<Record<'license_plate' | 'model' | 'color', string>> = {}

    if (!vehicle.license_plate.trim()) {
      itemErrors.license_plate = 'Informe a placa.'
    } else if (!isValidLicensePlate(vehicle.license_plate)) {
      itemErrors.license_plate = 'Placa inválida. Use AAA-9999 ou AAA9A99.'
    }

    if (!vehicle.model.trim()) {
      itemErrors.model = 'Informe o modelo.'
    }

    if (!vehicle.color.trim()) {
      itemErrors.color = 'Informe a cor.'
    }

    if (Object.keys(itemErrors).length > 0) {
      vehicleErrors[index] = itemErrors
    }
  })

  if (Object.keys(vehicleErrors).length > 0) {
    errors.vehicles = vehicleErrors
  }

  return errors
}

export function hasFormErrors(errors: CustomerFormErrors): boolean {
  const hasFieldErrors = Boolean(
    errors.first_name ||
      errors.last_name ||
      errors.cpf ||
      errors.phone ||
      errors.email ||
      errors.api,
  )

  const hasVehicleErrors = Boolean(errors.vehicles && Object.keys(errors.vehicles).length > 0)

  return hasFieldErrors || hasVehicleErrors
}
