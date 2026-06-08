<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import type { ServiceOrderOpenErrors, ServiceOrderOpenPayload } from '@/types/service-order'
import { useCustomersStore } from '@/stores/customers'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import { useServiceOrdersStore } from '@/stores/serviceOrders'
import { getFullName } from '@/utils/formatters'
import { generateValidLicensePlate } from '@/utils/license-plate'

const emit = defineEmits<{
  opened: [orderId: string]
}>()

const customersStore = useCustomersStore()
const parkingSpotsStore = useParkingSpotsStore()
const serviceOrdersStore = useServiceOrdersStore()

const form = ref<ServiceOrderOpenPayload>({
  vehicle_plate: '',
  customer_id: null,
  spot_id: '',
})

const errors = ref<ServiceOrderOpenErrors>({})

const customerOptions = [
  { label: 'Cliente rotativo', value: null },
  ...customersStore.sortedCustomers.map((customer) => ({
    label: getFullName(customer.first_name, customer.last_name),
    value: customer.id,
  })),
]

const spotOptions = computed(() =>
  parkingSpotsStore.sortedSpots
    .filter((spot) => spot.status !== 'occupied')
    .map((spot) => ({
      label: spot.code,
      value: spot.id,
    })),
)

function fillValidPlate(): void {
  form.value.vehicle_plate = generateValidLicensePlate()
  errors.value = {
    ...errors.value,
    vehicle_plate: undefined,
  }
}

async function submitForm(): Promise<void> {
  const result = await serviceOrdersStore.openOrder(form.value)

  if (!result.success) {
    errors.value = result.errors
    return
  }

  form.value = {
    vehicle_plate: '',
    customer_id: null,
    spot_id: '',
  }
  errors.value = {}
  emit('opened', result.order.id)
}
</script>

<template>
  <form class="space-y-4 rounded-lg border border-surface-200 bg-surface-0 p-4" @submit.prevent="submitForm">
    <h2 class="text-base font-semibold text-surface-900">Abrir ticket</h2>

    <div class="flex flex-col gap-1">
      <label for="ticket-spot" class="text-sm font-medium text-surface-700">Vaga</label>
      <Select
        input-id="ticket-spot"
        v-model="form.spot_id"
        :options="spotOptions"
        option-label="label"
        option-value="value"
        placeholder="Selecione a vaga"
        class="w-full"
        :invalid="Boolean(errors.spot_id || errors.api)"
      />
      <small v-if="errors.spot_id" class="text-red-500">{{ errors.spot_id }}</small>
      <small v-else-if="errors.api" class="text-red-500">{{ errors.api }}</small>
    </div>

    <div class="flex flex-col gap-1">
      <label for="ticket-plate" class="text-sm font-medium text-surface-700">Placa</label>
      <div class="flex gap-2">
        <InputText
          id="ticket-plate"
          v-model="form.vehicle_plate"
          class="w-full flex-1 uppercase"
          placeholder="ABC-1234 ou ABC1D23"
          :invalid="Boolean(errors.vehicle_plate)"
        />
        <Button
          type="button"
          label="Placa válida"
          icon="pi pi-car"
          size="small"
          outlined
          @click="fillValidPlate"
        />
      </div>
      <small v-if="errors.vehicle_plate" class="text-red-500">{{ errors.vehicle_plate }}</small>
    </div>

    <div class="flex flex-col gap-1">
      <label for="ticket-customer" class="text-sm font-medium text-surface-700">Cliente</label>
      <Select
        input-id="ticket-customer"
        v-model="form.customer_id"
        :options="customerOptions"
        option-label="label"
        option-value="value"
        class="w-full"
      />
    </div>

    <Button type="submit" label="Abrir ticket" icon="pi pi-ticket" class="w-full" />
  </form>
</template>
