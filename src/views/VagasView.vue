<script setup lang="ts">
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import ParkingSpotDialog from '@/components/parking/ParkingSpotDialog.vue'
import ParkingSpotGrid from '@/components/parking/ParkingSpotGrid.vue'
import type { ParkingSpotDisplay } from '@/types/parking-spot'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { spotStatusLabels } from '@/utils/spot-status'

const parkingSpotsStore = useParkingSpotsStore()
const subscriptionsStore = useSubscriptionsStore()
const toast = useToast()

onMounted(async () => {
  await parkingSpotsStore.fetchParkingSpots()
})

const isDialogVisible = ref(false)
const selectedSpot = ref<ParkingSpotDisplay | null>(null)

const spotItems = computed(() =>
  parkingSpotsStore.buildDisplayList(subscriptionsStore.buildActiveSubscriptionMap()),
)

function openSpotDialog(item: ParkingSpotDisplay): void {
  selectedSpot.value = item
  isDialogVisible.value = true
}

function refreshSelectedSpot(): void {
  if (!selectedSpot.value) {
    return
  }

  const updated = spotItems.value.find((item) => item.spot.id === selectedSpot.value?.spot.id)
  selectedSpot.value = updated ?? null
}

async function handleMarkOccupied(spotId: string): Promise<void> {
  const updated = await parkingSpotsStore.markOccupied(spotId)

  if (!updated) {
    return
  }

  refreshSelectedSpot()

  toast.add({
    severity: 'info',
    summary: 'Vaga ocupada',
    detail: selectedSpot.value ? `Vaga ${selectedSpot.value.spot.code}` : undefined,
    life: 3000,
  })
}

async function handleReleaseOccupancy(spotId: string): Promise<void> {
  const hasActiveSubscription = subscriptionsStore.hasActiveSubscriptionOnSpot(spotId)
  const updated = await parkingSpotsStore.releaseOccupancy(spotId, hasActiveSubscription)

  if (!updated) {
    return
  }

  refreshSelectedSpot()

  toast.add({
    severity: 'success',
    summary: 'Vaga liberada',
    detail: selectedSpot.value
      ? `${selectedSpot.value.spot.code} - ${spotStatusLabels[selectedSpot.value.displayStatus]}`
      : undefined,
    life: 3000,
  })
}
</script>

<template>
  <section aria-labelledby="vagas-title" class="space-y-6">
    <header>
      <h1 id="vagas-title" class="text-2xl font-semibold text-surface-900">Vagas</h1>
      <p class="mt-1 text-sm text-surface-600">Visualize o status das vagas de estacionamento.</p>
    </header>

    <ParkingSpotGrid :items="spotItems" @select="openSpotDialog" />

    <ParkingSpotDialog
      v-model:visible="isDialogVisible"
      :item="selectedSpot"
      @mark-occupied="handleMarkOccupied"
      @release-occupancy="handleReleaseOccupancy"
    />

    <Toast />
  </section>
</template>
