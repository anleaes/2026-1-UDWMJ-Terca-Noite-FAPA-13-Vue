<script setup lang="ts">
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import type { ParkingFeeResult, ServiceOrder } from '@/types/service-order'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { useServiceOrdersStore } from '@/stores/serviceOrders'

const props = defineProps<{
  order: ServiceOrder | null
  parkingResult?: ParkingFeeResult | null
}>()

const emit = defineEmits<{
  finalize: []
  close: []
}>()

const serviceOrdersStore = useServiceOrdersStore()

const subtotal = computed(() => (props.order ? serviceOrdersStore.getOrderTotal(props.order) : 0))

const statusLabel = computed(() => {
  if (!props.order) {
    return ''
  }

  if (props.order.status === 'open') {
    return 'Aberto'
  }

  if (props.order.status === 'closed') {
    return 'Fechado'
  }

  return 'Pago'
})

const statusSeverity = computed(() => {
  if (!props.order) {
    return 'secondary'
  }

  if (props.order.status === 'open') {
    return 'info'
  }

  if (props.order.status === 'closed') {
    return 'warn'
  }

  return 'success'
})
</script>

<template>
  <div class="space-y-4 rounded-lg border border-surface-200 bg-surface-0 p-4">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-base font-semibold text-surface-900">Faturamento</h2>
      <Tag v-if="order" :value="statusLabel" :severity="statusSeverity" />
    </div>

    <div v-if="order" class="space-y-2 text-sm text-surface-700">
      <p><span class="font-medium text-surface-900">Ticket:</span> {{ order.ticket_number }}</p>
      <p><span class="font-medium text-surface-900">Cliente:</span> {{ order.customer_name }}</p>
      <p><span class="font-medium text-surface-900">Placa:</span> {{ order.vehicle_plate }}</p>
      <p><span class="font-medium text-surface-900">Vaga:</span> {{ order.spot_code }}</p>
      <p><span class="font-medium text-surface-900">Entrada:</span> {{ formatDateTime(order.entry_at) }}</p>
      <p v-if="order.exit_at">
        <span class="font-medium text-surface-900">Saída:</span> {{ formatDateTime(order.exit_at) }}
      </p>
    </div>

    <p v-else class="text-sm text-surface-500">Selecione um ticket para visualizar o faturamento.</p>

    <div
      v-if="parkingResult"
      class="rounded-lg border border-amber-200 bg-amber-50 p-4"
    >
      <p class="text-sm font-medium text-surface-900">Taxa de estacionamento</p>
      <p class="mt-1 text-sm text-surface-700">
        {{ parkingResult.hours }} h × {{ formatCurrency(parkingResult.base_price) }}
      </p>
      <p class="mt-2 text-lg font-bold text-surface-900">
        {{ formatCurrency(parkingResult.total) }}
      </p>
    </div>

    <Divider v-if="order" />

    <div v-if="order" class="space-y-2">
      <div class="flex items-center justify-between text-sm text-surface-700">
        <span>Itens</span>
        <span>{{ order.items.length }}</span>
      </div>
      <div class="flex items-center justify-between text-base font-semibold text-surface-900">
        <span>Total</span>
        <span>{{ formatCurrency(subtotal) }}</span>
      </div>
    </div>

    <div v-if="order && order.status !== 'paid'" class="flex flex-col gap-2">
      <Button
        v-if="order.status === 'open'"
        type="button"
        label="Registrar saída"
        icon="pi pi-sign-out"
        severity="secondary"
        outlined
        :disabled="order.items.length === 0"
        @click="emit('close')"
      />
      <Button
        type="button"
        label="Finalizar faturamento"
        icon="pi pi-check"
        :disabled="order.items.length === 0"
        @click="emit('finalize')"
      />
    </div>

    <div
      v-if="order && order.status === 'paid'"
      class="rounded-lg border border-green-200 bg-green-50 p-4 text-center"
    >
      <p class="text-sm font-medium text-green-800">Faturamento concluído</p>
      <p class="mt-1 text-2xl font-bold text-green-900">{{ formatCurrency(subtotal) }}</p>
    </div>
  </div>
</template>
