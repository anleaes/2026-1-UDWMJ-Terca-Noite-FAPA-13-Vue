import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import { useCustomersStore } from '@/stores/customers'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import type {
  Subscription,
  SubscriptionFormErrors,
  SubscriptionFormPayload,
  SubscriptionStatus,
} from '@/types/subscription'
import { getApiErrorMessage } from '@/utils/api-error'
import { getFullName } from '@/utils/formatters'
import { hasSubscriptionFormErrors, validateSubscriptionForm } from '@/utils/subscription-validation'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const subscriptions = ref<Subscription[]>([])
  const isLoading = ref(false)
  const apiError = ref<string | null>(null)

  const customersStore = useCustomersStore()
  const parkingSpotsStore = useParkingSpotsStore()

  const activeSubscriptions = computed(() =>
    subscriptions.value.filter((subscription) => subscription.status === 'active'),
  )

  const sortedActiveSubscriptions = computed(() =>
    [...activeSubscriptions.value].sort((left, right) =>
      left.start_date.localeCompare(right.start_date),
    ),
  )

  function getSubscriptionById(id: string): Subscription | undefined {
    return subscriptions.value.find((subscription) => subscription.id === id)
  }

  function getActiveSubscriptionBySpotId(spotId: string): Subscription | undefined {
    return activeSubscriptions.value.find((subscription) => subscription.spot_id === spotId)
  }

  function getActiveSubscriptionByCustomerId(customerId: string): Subscription | undefined {
    return activeSubscriptions.value.find((subscription) => subscription.customer_id === customerId)
  }

  function hasActiveSubscriptionOnSpot(spotId: string, excludeId?: string): boolean {
    return activeSubscriptions.value.some(
      (subscription) => subscription.spot_id === spotId && subscription.id !== excludeId,
    )
  }

  function hasActiveSubscriptionForCustomer(customerId: string, excludeId?: string): boolean {
    return activeSubscriptions.value.some(
      (subscription) => subscription.customer_id === customerId && subscription.id !== excludeId,
    )
  }

  function validatePayload(payload: SubscriptionFormPayload, excludeId?: string): SubscriptionFormErrors {
    const errors = validateSubscriptionForm(payload)

    if (Object.keys(errors).length > 0) {
      return errors
    }

    const customer = customersStore.getCustomerById(payload.customer_id)

    if (!customer) {
      return { customer_id: 'Cliente não encontrado.' }
    }

    const vehicle = customer.vehicles.find((item) => item.id === payload.vehicle_id)

    if (!vehicle) {
      return { vehicle_id: 'Veículo não pertence ao cliente.' }
    }

    const spot = parkingSpotsStore.getSpotById(payload.spot_id)

    if (!spot) {
      return { spot_id: 'Vaga não encontrada.' }
    }

    if (hasActiveSubscriptionOnSpot(payload.spot_id, excludeId)) {
      return { spot_id: 'Vaga já possui assinatura ativa.' }
    }

    if (!excludeId && !parkingSpotsStore.isSpotAvailableForSubscription(payload.spot_id)) {
      return { spot_id: 'Vaga indisponível para assinatura.' }
    }

    if (excludeId) {
      const current = getSubscriptionById(excludeId)

      if (
        current &&
        current.spot_id !== payload.spot_id &&
        !parkingSpotsStore.isSpotAvailableForSubscription(payload.spot_id)
      ) {
        return { spot_id: 'Vaga indisponível para assinatura.' }
      }
    }

    if (hasActiveSubscriptionForCustomer(payload.customer_id, excludeId)) {
      return { customer_id: 'Cliente já possui assinatura ativa.' }
    }

    return {}
  }

  function buildSubscriptionPayload(
    payload: SubscriptionFormPayload,
    status: SubscriptionStatus,
  ): Omit<Subscription, 'id'> {
    return {
      customer_id: payload.customer_id,
      spot_id: payload.spot_id,
      vehicle_id: payload.vehicle_id,
      monthly_fee: payload.monthly_fee,
      start_date: payload.start_date,
      status,
    }
  }

  async function fetchSubscriptions(): Promise<void> {
    isLoading.value = true
    apiError.value = null

    try {
      const response = await api.get<Subscription[]>('/subscriptions')
      subscriptions.value = response.data
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function syncSpotAfterSubscriptionChange(spotId: string): Promise<void> {
    if (hasActiveSubscriptionOnSpot(spotId)) {
      await parkingSpotsStore.patchSpotStatus(spotId, 'Reservada')
      return
    }

    const spot = parkingSpotsStore.getSpotById(spotId)

    if (spot?.status === 'reserved') {
      await parkingSpotsStore.patchSpotStatus(spotId, 'Livre')
    }
  }

  async function createSubscription(payload: SubscriptionFormPayload) {
    const errors = validatePayload(payload)

    if (hasSubscriptionFormErrors(errors)) {
      return { success: false as const, errors }
    }

    const previousSpotStatus = parkingSpotsStore.getSpotById(payload.spot_id)?.status

    try {
      const reserved = await parkingSpotsStore.patchSpotStatus(payload.spot_id, 'Reservada')

      if (!reserved) {
        return { success: false as const, errors: { spot_id: 'Vaga indisponível para reserva.' } }
      }

      const response = await api.post<Subscription>(
        '/subscriptions',
        buildSubscriptionPayload(payload, 'active'),
      )

      subscriptions.value.push(response.data)
      apiError.value = null

      return { success: true as const, subscription: response.data }
    } catch (error) {
      if (previousSpotStatus === 'free') {
        await parkingSpotsStore.patchSpotStatus(payload.spot_id, 'Livre')
      }

      return { success: false as const, errors: { api: getApiErrorMessage(error) } }
    }
  }

  async function updateSubscription(id: string, payload: SubscriptionFormPayload) {
    const index = subscriptions.value.findIndex((subscription) => subscription.id === id)

    if (index === -1) {
      return { success: false as const, errors: {} }
    }

    const current = subscriptions.value[index]
    const errors = validatePayload(payload, id)

    if (hasSubscriptionFormErrors(errors)) {
      return { success: false as const, errors }
    }

    const previousSpotId = current.spot_id
    const previousSpotStatus = parkingSpotsStore.getSpotById(payload.spot_id)?.status

    try {
      if (current.spot_id !== payload.spot_id) {
        await syncSpotAfterSubscriptionChange(current.spot_id)
        const reserved = await parkingSpotsStore.patchSpotStatus(payload.spot_id, 'Reservada')

        if (!reserved) {
          await syncSpotAfterSubscriptionChange(previousSpotId)
          return { success: false as const, errors: { spot_id: 'Vaga indisponível para reserva.' } }
        }
      }

      const response = await api.put<Subscription>(`/subscriptions/${id}`, {
        id,
        ...buildSubscriptionPayload(payload, current.status),
      })

      subscriptions.value[index] = response.data

      if (response.data.status === 'active') {
        await parkingSpotsStore.patchSpotStatus(response.data.spot_id, 'Reservada')
      }

      apiError.value = null

      return { success: true as const, subscription: response.data }
    } catch (error) {
      if (current.spot_id !== payload.spot_id && previousSpotStatus === 'free') {
        await parkingSpotsStore.patchSpotStatus(payload.spot_id, 'Livre')
        await parkingSpotsStore.patchSpotStatus(previousSpotId, 'Reservada')
      }

      return { success: false as const, errors: { api: getApiErrorMessage(error) } }
    }
  }

  async function deactivateSubscription(id: string): Promise<boolean> {
    const index = subscriptions.value.findIndex((subscription) => subscription.id === id)

    if (index === -1) {
      return false
    }

    const subscription = subscriptions.value[index]

    if (subscription.status === 'inactive') {
      return false
    }

    try {
      const response = await api.put<Subscription>(`/subscriptions/${id}`, {
        ...subscription,
        status: 'inactive',
      })

      subscriptions.value[index] = response.data
      await syncSpotAfterSubscriptionChange(subscription.spot_id)
      apiError.value = null

      return true
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
      return false
    }
  }

  async function deleteSubscription(id: string): Promise<boolean> {
    const index = subscriptions.value.findIndex((subscription) => subscription.id === id)

    if (index === -1) {
      return false
    }

    const subscription = subscriptions.value[index]

    try {
      await api.delete(`/subscriptions/${id}`)
      subscriptions.value.splice(index, 1)
      await syncSpotAfterSubscriptionChange(subscription.spot_id)
      apiError.value = null

      return true
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
      return false
    }
  }

  function buildActiveSubscriptionMap(): Map<
    string,
    { subscriptionId: string; customerName: string; vehiclePlate: string }
  > {
    const map = new Map<string, { subscriptionId: string; customerName: string; vehiclePlate: string }>()

    activeSubscriptions.value.forEach((subscription) => {
      const customer = customersStore.getCustomerById(subscription.customer_id)
      const vehicle = customer?.vehicles.find((item) => item.id === subscription.vehicle_id)

      if (!customer) {
        return
      }

      map.set(subscription.spot_id, {
        subscriptionId: subscription.id,
        customerName: getFullName(customer.first_name, customer.last_name),
        vehiclePlate: vehicle?.license_plate ?? '-',
      })
    })

    return map
  }

  function getSubscriptionDetails(subscription: Subscription) {
    const customer = customersStore.getCustomerById(subscription.customer_id)
    const spot = parkingSpotsStore.getSpotById(subscription.spot_id)
    const vehicle = customer?.vehicles.find((item) => item.id === subscription.vehicle_id)

    return {
      customerName: customer ? getFullName(customer.first_name, customer.last_name) : '-',
      spotCode: spot?.code ?? '-',
      vehiclePlate: vehicle?.license_plate ?? '-',
    }
  }

  return {
    subscriptions,
    isLoading,
    apiError,
    activeSubscriptions,
    sortedActiveSubscriptions,
    fetchSubscriptions,
    getSubscriptionById,
    getActiveSubscriptionBySpotId,
    getActiveSubscriptionByCustomerId,
    hasActiveSubscriptionOnSpot,
    createSubscription,
    updateSubscription,
    deactivateSubscription,
    deleteSubscription,
    buildActiveSubscriptionMap,
    getSubscriptionDetails,
    validatePayload,
  }
})
