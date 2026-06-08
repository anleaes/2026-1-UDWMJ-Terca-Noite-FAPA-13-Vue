<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { ServiceOrder } from '@/types/service-order'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { calculateOrderTotal } from '@/utils/service-order-calculator'

defineProps<{
  orders: ServiceOrder[]
}>()

const statusLabels = {
  open: 'Aberto',
  closed: 'Fechado',
  paid: 'Pago',
} as const

const statusSeverity = {
  open: 'info',
  closed: 'warn',
  paid: 'success',
} as const
</script>

<template>
  <section class="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-surface-900">Tickets recentes</h2>
        <p class="mt-1 text-sm text-surface-600">Últimas movimentações do caixa.</p>
      </div>
      <RouterLink to="/caixa">
        <Button label="Ir ao caixa" icon="pi pi-wallet" size="small" outlined />
      </RouterLink>
    </div>

    <div v-if="orders.length === 0" class="mt-4 rounded-lg border border-dashed border-surface-200 px-4 py-8 text-center text-sm text-surface-500">
      Nenhum ticket registrado ainda.
    </div>

    <ul v-else class="mt-4 divide-y divide-surface-200">
      <li
        v-for="order in orders"
        :key="order.id"
        class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="font-medium text-surface-900">{{ order.ticket_number }}</p>
          <p class="text-sm text-surface-600">
            {{ order.customer_name }} · {{ order.vehicle_plate }} · {{ order.spot_code }}
          </p>
          <p class="text-xs text-surface-500">{{ formatDateTime(order.entry_at) }}</p>
        </div>
        <div class="flex items-center gap-3">
          <Tag :value="statusLabels[order.status]" :severity="statusSeverity[order.status]" />
          <span class="text-sm font-semibold text-surface-900">
            {{ formatCurrency(calculateOrderTotal(order.items)) }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
