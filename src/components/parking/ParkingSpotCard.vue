<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import type { ParkingSpotDisplay } from '@/types/parking-spot'
import { spotStatusCardClass, spotStatusLabels, spotStatusSeverity } from '@/utils/spot-status'

defineProps<{
  item: ParkingSpotDisplay
}>()

const emit = defineEmits<{
  select: [item: ParkingSpotDisplay]
}>()
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    class="cursor-pointer border transition-shadow hover:shadow-md"
    :class="spotStatusCardClass[item.displayStatus]"
    @click="emit('select', item)"
    @keyup.enter="emit('select', item)"
  >
    <template #title>
      <div class="flex items-center justify-between gap-2">
        <span class="text-lg font-semibold text-surface-900">{{ item.spot.code }}</span>
        <Tag
          :value="spotStatusLabels[item.displayStatus]"
          :severity="spotStatusSeverity[item.displayStatus]"
        />
      </div>
    </template>

    <template #content>
      <div class="space-y-1 text-sm text-surface-700">
        <p v-if="item.customerName">
          <span class="font-medium text-surface-900">Mensalista:</span>
          {{ item.customerName }}
        </p>
        <p v-if="item.vehiclePlate">
          <span class="font-medium text-surface-900">Placa:</span>
          {{ item.vehiclePlate }}
        </p>
        <p v-if="!item.customerName" class="text-surface-500">Sem assinatura vinculada</p>
      </div>
    </template>
  </Card>
</template>
