<script setup lang="ts">
import Tag from 'primevue/tag'
import ParkingSpotCard from '@/components/parking/ParkingSpotCard.vue'
import type { ParkingSpotDisplay, ParkingSpotStatus } from '@/types/parking-spot'
import { spotStatusLabels, spotStatusSeverity } from '@/utils/spot-status'

defineProps<{
  items: ParkingSpotDisplay[]
}>()

const emit = defineEmits<{
  select: [item: ParkingSpotDisplay]
}>()

const legendItems: ParkingSpotStatus[] = ['free', 'occupied', 'reserved']
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3">
      <Tag
        v-for="status in legendItems"
        :key="status"
        :value="spotStatusLabels[status]"
        :severity="spotStatusSeverity[status]"
      />
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ParkingSpotCard
        v-for="item in items"
        :key="item.spot.id"
        :item="item"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>
