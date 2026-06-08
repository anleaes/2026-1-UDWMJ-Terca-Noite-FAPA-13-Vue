<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import ServiceOrderAddItemForm from '@/components/service-orders/ServiceOrderAddItemForm.vue'
import ServiceOrderBillingPanel from '@/components/service-orders/ServiceOrderBillingPanel.vue'
import ServiceOrderItemsTable from '@/components/service-orders/ServiceOrderItemsTable.vue'
import ServiceOrderList from '@/components/service-orders/ServiceOrderList.vue'
import ServiceOrderOpenForm from '@/components/service-orders/ServiceOrderOpenForm.vue'
import type { ParkingFeeResult } from '@/types/service-order'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import { useServiceOrdersStore } from '@/stores/serviceOrders'
import { useServicesStore } from '@/stores/services'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const serviceOrdersStore = useServiceOrdersStore()
const parkingSpotsStore = useParkingSpotsStore()
const servicesStore = useServicesStore()
const toast = useToast()

onMounted(async () => {
  await Promise.all([
    parkingSpotsStore.fetchParkingSpots(),
    serviceOrdersStore.fetchServiceOrders(),
    servicesStore.fetchCategories(),
  ])
})

const activeOrderId = ref<string | null>(null)
const lastParkingResult = ref<ParkingFeeResult | null>(null)

const loadError = computed(() =>
  serviceOrdersStore.apiError
  ?? servicesStore.apiError
  ?? parkingSpotsStore.apiError
  ?? null,
)

const activeOrder = computed(() =>
  activeOrderId.value ? serviceOrdersStore.getOrderById(activeOrderId.value) ?? null : null,
)

watch(
  () => serviceOrdersStore.openOrders,
  (orders) => {
    if (orders.length === 0) {
      activeOrderId.value = null
      lastParkingResult.value = null
      return
    }

    if (!activeOrderId.value || !orders.some((order) => order.id === activeOrderId.value)) {
      activeOrderId.value = orders[0]?.id ?? null
      lastParkingResult.value = null
    }
  },
  { immediate: true, deep: true },
)

watch(activeOrderId, () => {
  lastParkingResult.value = null
})

function selectOrder(orderId: string): void {
  activeOrderId.value = orderId
}

function handleOrderOpened(orderId: string): void {
  activeOrderId.value = orderId
  lastParkingResult.value = null

  const order = serviceOrdersStore.getOrderById(orderId)

  toast.add({
    severity: 'success',
    summary: 'Ticket aberto',
    detail: order ? `${order.ticket_number} · Entrada ${formatDateTime(order.entry_at)}` : undefined,
    life: 3000,
  })
}

function handleParkingCalculated(result: ParkingFeeResult): void {
  lastParkingResult.value = result
}

async function handleRemoveItem(itemId: string): Promise<void> {
  if (!activeOrderId.value) {
    return
  }

  const removed = await serviceOrdersStore.removeItem(activeOrderId.value, itemId)

  if (!removed) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao remover item',
      detail: serviceOrdersStore.apiError ?? 'Não foi possível remover o item.',
      life: 4000,
    })
  }
}

async function handleCloseOrder(): Promise<void> {
  if (!activeOrderId.value) {
    return
  }

  const closed = await serviceOrdersStore.closeOrder(activeOrderId.value)

  if (!closed) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao registrar saída',
      detail: serviceOrdersStore.apiError ?? 'Não foi possível registrar a saída.',
      life: 4000,
    })
    return
  }

  toast.add({
    severity: 'info',
    summary: 'Saída registrada',
    detail: activeOrder.value?.ticket_number,
    life: 3000,
  })
}

async function handleFinalizeOrder(): Promise<void> {
  if (!activeOrderId.value) {
    return
  }

  const result = await serviceOrdersStore.finalizeOrder(activeOrderId.value)

  if (!result.success) {
    toast.add({
      severity: 'warn',
      summary: 'Faturamento pendente',
      detail: result.message,
      life: 3000,
    })
    return
  }

  toast.add({
    severity: 'success',
    summary: 'Faturamento finalizado',
    detail: `${result.order.ticket_number} - ${formatCurrency(result.total)}`,
    life: 4000,
  })

  lastParkingResult.value = null
  activeOrderId.value = serviceOrdersStore.openOrders[0]?.id ?? null
}
</script>

<template>
  <section aria-labelledby="caixa-title" class="space-y-6">
    <header>
      <h1 id="caixa-title" class="text-2xl font-semibold text-surface-900">Caixa</h1>
      <p class="mt-1 text-sm text-surface-600">Ponto de venda e operação diária de serviços.</p>
    </header>

    <p
      v-if="loadError"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ loadError }}
    </p>

    <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <div class="space-y-4">
        <ServiceOrderOpenForm @opened="handleOrderOpened" />
        <ServiceOrderList
          :orders="serviceOrdersStore.openOrders"
          :active-order-id="activeOrderId"
          @select="selectOrder"
        />
      </div>

      <div class="space-y-4">
        <div v-if="activeOrder" class="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-surface-900">{{ activeOrder.ticket_number }}</h2>
              <p class="text-sm text-surface-600">{{ activeOrder.customer_name }} · {{ activeOrder.vehicle_plate }} · {{ activeOrder.spot_code }}</p>
              <p class="mt-1 text-sm text-surface-700">
                Entrada: {{ formatDateTime(activeOrder.entry_at) }}
              </p>
              <p v-if="activeOrder.exit_at" class="text-sm text-surface-700">
                Saída: {{ formatDateTime(activeOrder.exit_at) }}
              </p>
            </div>
          </div>
        </div>

        <ServiceOrderAddItemForm
          :order-id="activeOrder?.status === 'open' ? activeOrderId : null"
          @item-added="() => {}"
          @parking-calculated="handleParkingCalculated"
        />

        <ServiceOrderItemsTable
          :items="activeOrder?.items ?? []"
          :readonly="activeOrder?.status !== 'open'"
          @remove="handleRemoveItem"
        />
      </div>

      <ServiceOrderBillingPanel
        :order="activeOrder"
        :parking-result="lastParkingResult"
        @close="handleCloseOrder"
        @finalize="handleFinalizeOrder"
      />
    </div>

    <Toast />
  </section>
</template>
