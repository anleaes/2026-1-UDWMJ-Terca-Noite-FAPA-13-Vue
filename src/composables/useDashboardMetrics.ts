import { computed } from 'vue'
import { useCustomersStore } from '@/stores/customers'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import { useServiceOrdersStore } from '@/stores/serviceOrders'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type { ServiceCategoryType } from '@/types/service-order'
import { calculateOrderTotal } from '@/utils/service-order-calculator'
import { formatCurrency } from '@/utils/formatters'

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate)
  const today = new Date()

  return (
    date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
  )
}

export function useDashboardMetrics() {
  const customersStore = useCustomersStore()
  const parkingSpotsStore = useParkingSpotsStore()
  const subscriptionsStore = useSubscriptionsStore()
  const serviceOrdersStore = useServiceOrdersStore()

  const totalCustomers = computed(() => customersStore.customers.length)

  const totalVehicles = computed(() =>
    customersStore.customers.reduce((sum, customer) => sum + customer.vehicles.length, 0),
  )

  const activeSubscriptionsCount = computed(() => subscriptionsStore.activeSubscriptions.length)

  const monthlyRecurringRevenue = computed(() =>
    subscriptionsStore.activeSubscriptions.reduce((sum, subscription) => sum + subscription.monthly_fee, 0),
  )

  const spotStats = computed(() => {
    const subscriptionMap = subscriptionsStore.buildActiveSubscriptionMap()
    const spots = parkingSpotsStore.buildDisplayList(subscriptionMap)

    const counts = spots.reduce(
      (accumulator, item) => {
        accumulator[item.displayStatus] += 1
        return accumulator
      },
      { free: 0, occupied: 0, reserved: 0 },
    )

    const total = spots.length
    const inUse = counts.occupied + counts.reserved
    const occupancyRate = total > 0 ? Math.round((inUse / total) * 100) : 0

    return {
      ...counts,
      total,
      inUse,
      occupancyRate,
    }
  })

  const openOrdersCount = computed(() => serviceOrdersStore.openOrders.length)

  const paidOrders = computed(() =>
    serviceOrdersStore.orders.filter((order) => order.status === 'paid'),
  )

  const todayPaidOrders = computed(() =>
    paidOrders.value.filter((order) => isToday(order.exit_at ?? order.entry_at)),
  )

  const todayRevenue = computed(() =>
    todayPaidOrders.value.reduce((sum, order) => sum + calculateOrderTotal(order.items), 0),
  )

  const totalRevenue = computed(() =>
    paidOrders.value.reduce((sum, order) => sum + calculateOrderTotal(order.items), 0),
  )

  const revenueByService = computed(() => {
    const totals = new Map<ServiceCategoryType, number>()

    paidOrders.value.forEach((order) => {
      order.items.forEach((item) => {
        totals.set(item.type, (totals.get(item.type) ?? 0) + item.total)
      })
    })

    return [...totals.entries()]
      .map(([type, total]) => ({ type, total }))
      .sort((left, right) => right.total - left.total)
  })

  const recentOrders = computed(() =>
    [...serviceOrdersStore.orders]
      .sort((left, right) => right.entry_at.localeCompare(left.entry_at))
      .slice(0, 6),
  )

  const activeSubscriptionRows = computed(() =>
    subscriptionsStore.sortedActiveSubscriptions.map((subscription) => {
      const details = subscriptionsStore.getSubscriptionDetails(subscription)

      return {
        id: subscription.id,
        customerName: details.customerName,
        spotCode: details.spotCode,
        vehiclePlate: details.vehiclePlate,
        monthlyFee: subscription.monthly_fee,
        startDate: subscription.start_date,
      }
    }),
  )

  const loadError = computed(
    () =>
      customersStore.apiError
      ?? parkingSpotsStore.apiError
      ?? subscriptionsStore.apiError
      ?? serviceOrdersStore.apiError
      ?? null,
  )

  return {
    totalCustomers,
    totalVehicles,
    activeSubscriptionsCount,
    monthlyRecurringRevenue,
    spotStats,
    openOrdersCount,
    todayPaidOrders,
    todayRevenue,
    totalRevenue,
    revenueByService,
    recentOrders,
    activeSubscriptionRows,
    loadError,
    formatCurrency,
  }
}
