<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { formatCurrency, formatDate } from '@/utils/formatters'

defineProps<{
  subscriptions: Array<{
    id: string
    customerName: string
    spotCode: string
    vehiclePlate: string
    monthlyFee: number
    startDate: string
  }>
}>()
</script>

<template>
  <section class="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-surface-900">Mensalistas ativos</h2>
        <p class="mt-1 text-sm text-surface-600">Assinaturas com vaga fixa vinculada.</p>
      </div>
      <RouterLink to="/mensalidades">
        <Button label="Ver mensalidades" icon="pi pi-calendar" size="small" outlined />
      </RouterLink>
    </div>

    <div
      v-if="subscriptions.length === 0"
      class="mt-4 rounded-lg border border-dashed border-surface-200 px-4 py-8 text-center text-sm text-surface-500"
    >
      Nenhuma assinatura ativa no momento.
    </div>

    <ul v-else class="mt-4 divide-y divide-surface-200">
      <li
        v-for="subscription in subscriptions"
        :key="subscription.id"
        class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div>
          <p class="font-medium text-surface-900">{{ subscription.customerName }}</p>
          <p class="text-sm text-surface-600">
            Vaga {{ subscription.spotCode }} · {{ subscription.vehiclePlate }}
          </p>
          <p class="text-xs text-surface-500">Desde {{ formatDate(subscription.startDate) }}</p>
        </div>
        <div class="flex items-center gap-2">
          <Tag value="Ativa" severity="success" />
          <span class="text-sm font-semibold text-surface-900">
            {{ formatCurrency(subscription.monthlyFee) }}/mês
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
