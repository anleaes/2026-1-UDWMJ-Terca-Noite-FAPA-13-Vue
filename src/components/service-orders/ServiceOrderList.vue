<script setup lang="ts">
import Tag from 'primevue/tag'
import type { ServiceOrder } from '@/types/service-order'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { useServiceOrdersStore } from '@/stores/serviceOrders'

defineProps<{
  orders: ServiceOrder[]
  activeOrderId: string | null
}>()

const emit = defineEmits<{
  select: [orderId: string]
}>()

const serviceOrdersStore = useServiceOrdersStore()
</script>

<template>
  <div class="space-y-3 rounded-lg border border-surface-200 bg-surface-0 p-4">
    <h2 class="text-base font-semibold text-surface-900">Tickets abertos</h2>

    <p v-if="orders.length === 0" class="text-sm text-surface-500">Nenhum ticket em aberto.</p>

    <ul v-else class="space-y-2">
      <li v-for="order in orders" :key="order.id">
        <button
          type="button"
          class="w-full rounded-lg border px-3 py-3 text-left transition-colors"
          :class="
            activeOrderId === order.id
              ? 'border-primary bg-primary-50'
              : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
          "
          @click="emit('select', order.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-surface-900">{{ order.ticket_number }}</span>
            <Tag value="Aberto" severity="info" />
          </div>
          <p class="mt-1 text-sm text-surface-700">{{ order.vehicle_plate }}</p>
          <p class="text-sm text-surface-600">{{ order.customer_name }}</p>
          <p class="mt-1 text-xs text-surface-500">{{ formatDateTime(order.entry_at) }}</p>
          <p class="mt-1 text-sm font-medium text-surface-900">
            {{ formatCurrency(serviceOrdersStore.getOrderTotal(order)) }}
          </p>
        </button>
      </li>
    </ul>
  </div>
</template>
