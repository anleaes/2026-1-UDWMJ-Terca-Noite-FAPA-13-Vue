import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import { useCustomersStore } from '@/stores/customers'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import { useServicesStore } from '@/stores/services'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type {
  ParkingFeeResult,
  ServiceItem,
  ServiceItemFormPayload,
  ServiceOrder,
  ServiceOrderOpenPayload,
} from '@/types/service-order'
import { getApiErrorMessage } from '@/utils/api-error'
import {
  calculateItemTotal,
  calculateOrderTotal,
  calculateParkingDurationHours,
} from '@/utils/service-order-calculator'
import {
  hasServiceItemFormErrors,
  hasServiceOrderOpenErrors,
  validateServiceItemForm,
  validateServiceOrderOpen,
} from '@/utils/service-order-validation'
import { getFullName } from '@/utils/formatters'

export const useServiceOrdersStore = defineStore('serviceOrders', () => {
  const orders = ref<ServiceOrder[]>([])
  const isLoading = ref(false)
  const apiError = ref<string | null>(null)

  const servicesStore = useServicesStore()
  const customersStore = useCustomersStore()
  const parkingSpotsStore = useParkingSpotsStore()
  const subscriptionsStore = useSubscriptionsStore()

  const openOrders = computed(() =>
    orders.value.filter((order) => order.status === 'open').sort((left, right) =>
      right.entry_at.localeCompare(left.entry_at),
    ),
  )

  const closedOrders = computed(() =>
    orders.value.filter((order) => order.status !== 'open').sort((left, right) =>
      right.entry_at.localeCompare(left.entry_at),
    ),
  )

  function resolveCustomerName(customerId: string | null): string {
    if (!customerId) {
      return 'Cliente rotativo'
    }

    const customer = customersStore.getCustomerById(customerId)

    return customer ? getFullName(customer.first_name, customer.last_name) : 'Cliente rotativo'
  }

  function generateTicketNumber(): string {
    const maxNumber = orders.value.reduce((max, order) => {
      const match = order.ticket_number.match(/OS-(\d+)/)

      if (!match) {
        return max
      }

      return Math.max(max, Number.parseInt(match[1], 10))
    }, 0)

    return `OS-${String(maxNumber + 1).padStart(4, '0')}`
  }

  function getOrderById(id: string): ServiceOrder | undefined {
    return orders.value.find((order) => order.id === id)
  }

  function getOrderTotal(order: ServiceOrder): number {
    return calculateOrderTotal(order.items)
  }

  function buildServiceItem(orderId: string, payload: ServiceItemFormPayload): ServiceItem | null {
    const category = servicesStore.getCategoryByType(payload.type)

    if (!category) {
      return null
    }

    const unitPrice = category.base_price
    const total = calculateItemTotal(payload.quantity, unitPrice)

    return {
      id: crypto.randomUUID(),
      service_order_id: orderId,
      type: payload.type,
      description: category.name,
      quantity: payload.quantity,
      unit_price: unitPrice,
      total,
    }
  }

  async function fetchServiceOrders(): Promise<void> {
    isLoading.value = true
    apiError.value = null

    try {
      const response = await api.get<ServiceOrder[]>('/serviceOrders')
      orders.value = response.data
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function persistOrder(order: ServiceOrder): Promise<ServiceOrder | null> {
    try {
      const response = await api.put<ServiceOrder>(`/serviceOrders/${order.id}`, order)
      const index = orders.value.findIndex((item) => item.id === order.id)

      if (index === -1) {
        orders.value.unshift(response.data)
      } else {
        orders.value[index] = response.data
      }

      apiError.value = null
      return response.data
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
      return null
    }
  }

  async function openOrder(payload: ServiceOrderOpenPayload) {
    const errors = validateServiceOrderOpen(payload)

    if (hasServiceOrderOpenErrors(errors)) {
      return { success: false as const, errors }
    }

    const spot = parkingSpotsStore.getSpotById(payload.spot_id)

    if (!spot) {
      return { success: false as const, errors: { spot_id: 'Vaga não encontrada.' } }
    }

    if (spot.status === 'occupied') {
      return { success: false as const, errors: { spot_id: 'Vaga ocupada.' } }
    }

    const occupied = await parkingSpotsStore.patchSpotStatus(payload.spot_id, 'Ocupada')

    if (!occupied) {
      return { success: false as const, errors: { spot_id: 'Vaga indisponível.' } }
    }

    const orderPayload: Omit<ServiceOrder, 'id'> = {
      ticket_number: generateTicketNumber(),
      customer_id: payload.customer_id,
      customer_name: resolveCustomerName(payload.customer_id),
      vehicle_plate: payload.vehicle_plate.trim().toUpperCase(),
      spot_id: spot.id,
      spot_code: spot.code,
      entry_at: new Date().toISOString(),
      exit_at: null,
      status: 'open',
      items: [],
    }

    try {
      const response = await api.post<ServiceOrder>('/serviceOrders', orderPayload)
      orders.value.unshift(response.data)
      apiError.value = null

      return { success: true as const, order: response.data }
    } catch (error) {
      await parkingSpotsStore.patchSpotStatus(
        payload.spot_id,
        subscriptionsStore.hasActiveSubscriptionOnSpot(payload.spot_id) ? 'Reservada' : 'Livre',
      )

      return { success: false as const, errors: { api: getApiErrorMessage(error) } }
    }
  }

  async function addItem(orderId: string, payload: ServiceItemFormPayload) {
    const order = getOrderById(orderId)

    if (!order) {
      return { success: false as const, errors: {} }
    }

    if (order.status !== 'open') {
      return { success: false as const, errors: { type: 'Ordem de serviço fechada.' } }
    }

    const errors = validateServiceItemForm(payload)

    if (hasServiceItemFormErrors(errors)) {
      return { success: false as const, errors }
    }

    const item = buildServiceItem(orderId, payload)

    if (!item) {
      return { success: false as const, errors: { type: 'Categoria de serviço não encontrada.' } }
    }

    const updatedOrder = await persistOrder({
      ...order,
      items: [...order.items, item],
    })

    if (!updatedOrder) {
      return { success: false as const, errors: { type: apiError.value ?? 'Erro ao salvar item.' } }
    }

    return { success: true as const, item, order: updatedOrder }
  }

  async function calculateParkingFee(
    orderId: string,
  ): Promise<{ success: true; result: ParkingFeeResult } | { success: false; errors: { type?: string } }> {
    const order = getOrderById(orderId)

    if (!order) {
      return { success: false, errors: { type: 'Ordem de serviço não encontrada.' } }
    }

    if (order.status !== 'open') {
      return { success: false, errors: { type: 'Ordem de serviço indisponível.' } }
    }

    const category = servicesStore.getCategoryByType('parking')

    if (!category) {
      return { success: false, errors: { type: 'Categoria Taxa de estacionamento não configurada.' } }
    }

    const exitAt = new Date().toISOString()
    const hours = Math.max(calculateParkingDurationHours(order.entry_at, exitAt), 0.01)
    const basePrice = category.base_price
    const total = calculateItemTotal(hours, basePrice)

    const parkingItem: ServiceItem = {
      id: crypto.randomUUID(),
      service_order_id: orderId,
      type: 'parking',
      description: category.name,
      quantity: hours,
      unit_price: basePrice,
      total,
    }

    const updatedOrder = await persistOrder({
      ...order,
      exit_at: exitAt,
      items: [...order.items.filter((item) => item.type !== 'parking'), parkingItem],
    })

    if (!updatedOrder) {
      return { success: false, errors: { type: apiError.value ?? 'Erro ao calcular estacionamento.' } }
    }

    return {
      success: true,
      result: {
        exit_at: exitAt,
        hours,
        base_price: basePrice,
        total,
        item: parkingItem,
      },
    }
  }

  async function removeItem(orderId: string, itemId: string): Promise<boolean> {
    const order = getOrderById(orderId)

    if (!order || order.status !== 'open') {
      return false
    }

    const updatedOrder = await persistOrder({
      ...order,
      items: order.items.filter((item) => item.id !== itemId),
    })

    return Boolean(updatedOrder)
  }

  async function closeOrder(orderId: string, exitAt: string = new Date().toISOString()): Promise<boolean> {
    const order = getOrderById(orderId)

    if (!order || order.status !== 'open') {
      return false
    }

    const updatedOrder = await persistOrder({
      ...order,
      exit_at: exitAt,
      status: 'closed',
    })

    return Boolean(updatedOrder)
  }

  async function finalizeOrder(orderId: string) {
    const order = getOrderById(orderId)

    if (!order) {
      return { success: false as const, message: 'Ordem de serviço não encontrada.' }
    }

    if (order.items.length === 0) {
      return { success: false as const, message: 'Adicione ao menos um item antes de faturar.' }
    }

    const exitAt = order.exit_at ?? new Date().toISOString()
    const updatedOrder = await persistOrder({
      ...order,
      exit_at: exitAt,
      status: 'paid',
    })

    if (!updatedOrder) {
      return { success: false as const, message: apiError.value ?? 'Erro ao finalizar faturamento.' }
    }

    const spotReleased = await parkingSpotsStore.patchSpotStatus(
      order.spot_id,
      subscriptionsStore.hasActiveSubscriptionOnSpot(order.spot_id) ? 'Reservada' : 'Livre',
    )

    if (!spotReleased) {
      return {
        success: false as const,
        message: 'Faturamento salvo, mas não foi possível liberar a vaga.',
      }
    }

    return {
      success: true as const,
      order: updatedOrder,
      total: getOrderTotal(updatedOrder),
    }
  }

  return {
    orders,
    isLoading,
    apiError,
    openOrders,
    closedOrders,
    fetchServiceOrders,
    getOrderById,
    getOrderTotal,
    openOrder,
    addItem,
    calculateParkingFee,
    removeItem,
    closeOrder,
    finalizeOrder,
  }
})
