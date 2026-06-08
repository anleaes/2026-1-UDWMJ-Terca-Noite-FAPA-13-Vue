<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import { spotStatusLabels } from '@/utils/spot-status'

defineProps<{
  stats: {
    free: number
    occupied: number
    reserved: number
    total: number
    inUse: number
    occupancyRate: number
  }
}>()

const statusItems = [
  { key: 'free' as const, barClass: 'bg-green-500', label: spotStatusLabels.free },
  { key: 'occupied' as const, barClass: 'bg-red-500', label: spotStatusLabels.occupied },
  { key: 'reserved' as const, barClass: 'bg-amber-500', label: spotStatusLabels.reserved },
]
</script>

<template>
  <section class="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-surface-900">Ocupação das vagas</h2>
        <p class="mt-1 text-sm text-surface-600">
          {{ stats.inUse }} de {{ stats.total }} vagas em uso ({{ stats.occupancyRate }}%)
        </p>
      </div>
      <RouterLink to="/vagas">
        <Button label="Ver vagas" icon="pi pi-external-link" size="small" outlined />
      </RouterLink>
    </div>

    <div class="mt-5 flex h-3 overflow-hidden rounded-full bg-surface-100">
      <div
        v-for="item in statusItems"
        :key="item.key"
        class="h-full transition-all"
        :class="item.barClass"
        :style="{ width: stats.total > 0 ? `${(stats[item.key] / stats.total) * 100}%` : '0%' }"
        :title="`${item.label}: ${stats[item.key]}`"
      />
    </div>

    <ul class="mt-4 grid gap-3 sm:grid-cols-3">
      <li
        v-for="item in statusItems"
        :key="item.key"
        class="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2 text-sm"
      >
        <span class="flex items-center gap-2 text-surface-700">
          <span class="h-2.5 w-2.5 rounded-full" :class="item.barClass" />
          {{ item.label }}
        </span>
        <span class="font-semibold text-surface-900">{{ stats[item.key] }}</span>
      </li>
    </ul>
  </section>
</template>
