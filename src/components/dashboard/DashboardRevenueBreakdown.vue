<script setup lang="ts">
import Tag from 'primevue/tag'
import type { ServiceCategoryType } from '@/types/service-order'
import { formatCurrency } from '@/utils/formatters'

defineProps<{
  items: Array<{ type: ServiceCategoryType; total: number }>
  totalRevenue: number
}>()

const serviceLabels: Record<ServiceCategoryType, string> = {
  parking: 'Estacionamento',
  washing: 'Lavagem',
  detailing: 'Detalhamento',
}
</script>

<template>
  <section class="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-sm">
    <div>
      <h2 class="text-base font-semibold text-surface-900">Receita por serviço</h2>
      <p class="mt-1 text-sm text-surface-600">Distribuição dos tickets já faturados.</p>
    </div>

    <p class="mt-4 text-3xl font-semibold text-surface-900">{{ formatCurrency(totalRevenue) }}</p>
    <p class="text-xs text-surface-500">Total acumulado faturado</p>

    <div
      v-if="items.length === 0"
      class="mt-4 rounded-lg border border-dashed border-surface-200 px-4 py-6 text-center text-sm text-surface-500"
    >
      Ainda não há receita registrada.
    </div>

    <ul v-else class="mt-5 space-y-3">
      <li
        v-for="item in items"
        :key="item.type"
        class="space-y-1"
      >
        <div class="flex items-center justify-between text-sm">
          <Tag :value="serviceLabels[item.type]" severity="secondary" />
          <span class="font-medium text-surface-900">{{ formatCurrency(item.total) }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-surface-100">
          <div
            class="h-full rounded-full bg-primary"
            :style="{ width: totalRevenue > 0 ? `${(item.total / totalRevenue) * 100}%` : '0%' }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
