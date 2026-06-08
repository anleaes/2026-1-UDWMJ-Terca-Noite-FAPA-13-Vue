<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import type { ParkingSpotDisplay } from '@/types/parking-spot'
import { spotStatusLabels, spotStatusSeverity } from '@/utils/spot-status'

const visible = defineModel<boolean>('visible', { required: true })

const props = defineProps<{
  item: ParkingSpotDisplay | null
}>()

const emit = defineEmits<{
  markOccupied: [spotId: string]
  releaseOccupancy: [spotId: string]
}>()

const canMarkOccupied = computed(() => {
  if (!props.item) {
    return false
  }

  return props.item.displayStatus !== 'occupied'
})

const canReleaseOccupancy = computed(() => props.item?.displayStatus === 'occupied')
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="item ? `Vaga ${item.spot.code}` : 'Vaga'"
    :style="{ width: 'min(480px, 95vw)' }"
    :draggable="false"
  >
    <div v-if="item" class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-surface-700">Status:</span>
        <Tag
          :value="spotStatusLabels[item.displayStatus]"
          :severity="spotStatusSeverity[item.displayStatus]"
        />
      </div>

      <div v-if="item.customerName" class="rounded-lg border border-surface-200 p-4 text-sm text-surface-700">
        <p><span class="font-medium text-surface-900">Mensalista:</span> {{ item.customerName }}</p>
        <p class="mt-1"><span class="font-medium text-surface-900">Placa:</span> {{ item.vehiclePlate }}</p>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <Button
          v-if="canMarkOccupied"
          label="Marcar ocupada"
          icon="pi pi-car"
          @click="emit('markOccupied', item.spot.id)"
        />
        <Button
          v-if="canReleaseOccupancy"
          label="Liberar vaga"
          icon="pi pi-check"
          severity="success"
          @click="emit('releaseOccupancy', item.spot.id)"
        />
      </div>
    </div>
  </Dialog>
</template>
