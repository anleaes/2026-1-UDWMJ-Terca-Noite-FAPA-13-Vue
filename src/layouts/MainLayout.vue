<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useCustomersStore } from '@/stores/customers'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import { useSubscriptionsStore } from '@/stores/subscriptions'

const customersStore = useCustomersStore()
const parkingSpotsStore = useParkingSpotsStore()
const subscriptionsStore = useSubscriptionsStore()

onMounted(async () => {
  await Promise.all([
    customersStore.fetchCustomers(),
    parkingSpotsStore.fetchParkingSpots(),
    subscriptionsStore.fetchSubscriptions(),
  ])
})
</script>

<template>
  <div class="flex min-h-screen bg-surface-50 text-surface-900">
    <AppSidebar />
    <div class="flex min-h-screen flex-1 flex-col">
      <main class="flex-1 p-6 md:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
