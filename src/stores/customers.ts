import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import type { Customer, CustomerFormPayload } from '@/types/customer'
import type { Person } from '@/types/person'
import type { Vehicle, VehicleFormItem } from '@/types/vehicle'
import { getApiErrorMessage } from '@/utils/api-error'
import { hasFormErrors, validateCustomerForm } from '@/utils/customer-validation'
import { normalizeLicensePlate } from '@/utils/license-plate'

type CustomerRecord = Person & { id: string }

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])
  const isLoading = ref(false)
  const apiError = ref<string | null>(null)

  const sortedCustomers = computed(() =>
    [...customers.value].sort((left, right) =>
      `${left.last_name} ${left.first_name}`.localeCompare(`${right.last_name} ${right.first_name}`, 'pt-BR'),
    ),
  )

  function normalizeCpf(value: string): string {
    return value.replace(/\D/g, '')
  }

  function buildCustomerRecord(payload: CustomerFormPayload): Omit<CustomerRecord, 'id'> {
    return {
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      cpf: normalizeCpf(payload.cpf),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
    }
  }

  function buildVehiclePayload(customerId: string, vehicle: VehicleFormItem): Omit<Vehicle, 'id'> {
    return {
      customer_id: customerId,
      license_plate: normalizeLicensePlate(vehicle.license_plate),
      model: vehicle.model.trim(),
      color: vehicle.color.trim(),
    }
  }

  function mapCustomersWithVehicles(records: CustomerRecord[], vehicles: Vehicle[]): Customer[] {
    return records.map((record) => ({
      ...record,
      vehicles: vehicles.filter((vehicle) => vehicle.customer_id === record.id),
    }))
  }

  function isCpfTaken(cpf: string, excludeId?: string): boolean {
    const normalized = normalizeCpf(cpf)

    return customers.value.some(
      (customer) => customer.cpf === normalized && customer.id !== excludeId,
    )
  }

  function validatePayload(payload: CustomerFormPayload, excludeId?: string) {
    return validateCustomerForm(payload, (cpf) => isCpfTaken(cpf, excludeId))
  }

  async function fetchCustomers(): Promise<void> {
    isLoading.value = true
    apiError.value = null

    try {
      const [customersResponse, vehiclesResponse] = await Promise.all([
        api.get<CustomerRecord[]>('/customers'),
        api.get<Vehicle[]>('/vehicles'),
      ])

      customers.value = mapCustomersWithVehicles(customersResponse.data, vehiclesResponse.data)
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function syncVehicles(customerId: string, vehicles: VehicleFormItem[]): Promise<Vehicle[]> {
    const existingVehicles = customers.value.find((customer) => customer.id === customerId)?.vehicles ?? []
    const payloadIds = new Set(vehicles.filter((vehicle) => vehicle.id).map((vehicle) => vehicle.id as string))
    const vehiclesToDelete = existingVehicles.filter((vehicle) => !payloadIds.has(vehicle.id))

    await Promise.all(vehiclesToDelete.map((vehicle) => api.delete(`/vehicles/${vehicle.id}`)))

    const syncedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        const body = buildVehiclePayload(customerId, vehicle)

        if (vehicle.id) {
          const response = await api.put<Vehicle>(`/vehicles/${vehicle.id}`, {
            id: vehicle.id,
            ...body,
          })

          return response.data
        }

        const response = await api.post<Vehicle>('/vehicles', body)
        return response.data
      }),
    )

    return syncedVehicles
  }

  async function createCustomer(payload: CustomerFormPayload) {
    const errors = validatePayload(payload)

    if (hasFormErrors(errors)) {
      return { success: false as const, errors }
    }

    try {
      const customerResponse = await api.post<CustomerRecord>('/customers', buildCustomerRecord(payload))
      const vehicles = await Promise.all(
        payload.vehicles.map(async (vehicle) => {
          const response = await api.post<Vehicle>(
            '/vehicles',
            buildVehiclePayload(customerResponse.data.id, vehicle),
          )

          return response.data
        }),
      )

      const customer: Customer = {
        ...customerResponse.data,
        vehicles,
      }

      customers.value.push(customer)
      apiError.value = null

      return { success: true as const, customer }
    } catch (error) {
      return { success: false as const, errors: { api: getApiErrorMessage(error) } }
    }
  }

  async function updateCustomer(id: string, payload: CustomerFormPayload) {
    const index = customers.value.findIndex((customer) => customer.id === id)

    if (index === -1) {
      return { success: false as const, errors: {} }
    }

    const errors = validatePayload(payload, id)

    if (hasFormErrors(errors)) {
      return { success: false as const, errors }
    }

    try {
      const customerResponse = await api.put<CustomerRecord>(`/customers/${id}`, {
        id,
        ...buildCustomerRecord(payload),
      })

      const vehicles = await syncVehicles(id, payload.vehicles)
      const customer: Customer = {
        ...customerResponse.data,
        vehicles,
      }

      customers.value[index] = customer
      apiError.value = null

      return { success: true as const, customer }
    } catch (error) {
      return { success: false as const, errors: { api: getApiErrorMessage(error) } }
    }
  }

  async function deleteCustomer(id: string): Promise<boolean> {
    const customer = customers.value.find((item) => item.id === id)

    if (!customer) {
      return false
    }

    try {
      await Promise.all(customer.vehicles.map((vehicle) => api.delete(`/vehicles/${vehicle.id}`)))
      await api.delete(`/customers/${id}`)
      customers.value = customers.value.filter((item) => item.id !== id)
      apiError.value = null

      return true
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
      return false
    }
  }

  function getCustomerById(id: string): Customer | undefined {
    return customers.value.find((customer) => customer.id === id)
  }

  return {
    customers,
    isLoading,
    apiError,
    sortedCustomers,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    validatePayload,
  }
})
