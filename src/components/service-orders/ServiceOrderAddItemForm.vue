<script setup lang="ts">
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { computed, ref, watch } from 'vue'
import type { ParkingFeeResult, ServiceItemFormErrors, ServiceItemFormPayload } from '@/types/service-order'
import { useServicesStore } from '@/stores/services'
import { useServiceOrdersStore } from '@/stores/serviceOrders'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const props = defineProps<{
  orderId: string | null
}>()

const emit = defineEmits<{
  itemAdded: []
  parkingCalculated: [result: ParkingFeeResult]
}>()

const servicesStore = useServicesStore()
const serviceOrdersStore = useServiceOrdersStore()

const form = ref<ServiceItemFormPayload>(createEmptyForm())
const errors = ref<ServiceItemFormErrors>({})
const parkingPreview = ref<ParkingFeeResult | null>(null)

const serviceOptions = computed(() =>
  servicesStore.categories
    .filter((category) => category.type !== 'parking')
    .map((category) => ({
      label: category.name,
      value: category.type,
    })),
)

const selectedCategory = computed(() => servicesStore.getCategoryByType(form.value.type))

const unitPrice = computed(() => selectedCategory.value?.base_price ?? 0)

function createEmptyForm(): ServiceItemFormPayload {
  const defaultCategory = servicesStore.categories.find((category) => category.type === 'washing')

  return {
    type: defaultCategory?.type ?? 'washing',
    quantity: 1,
  }
}

watch(
  () => props.orderId,
  () => {
    resetForm()
    parkingPreview.value = null
  },
)

function resetForm(): void {
  form.value = createEmptyForm()
  errors.value = {}
}

async function submitForm(): Promise<void> {
  if (!props.orderId) {
    return
  }

  const result = await serviceOrdersStore.addItem(props.orderId, form.value)

  if (!result.success) {
    errors.value = result.errors
    return
  }

  resetForm()
  emit('itemAdded')
}

async function calculateParking(): Promise<void> {
  if (!props.orderId) {
    return
  }

  const result = await serviceOrdersStore.calculateParkingFee(props.orderId)

  if (!result.success) {
    errors.value = result.errors
    return
  }

  errors.value = {}
  parkingPreview.value = result.result
  emit('parkingCalculated', result.result)
  emit('itemAdded')
}
</script>

<template>
  <div class="space-y-4 rounded-lg border border-surface-200 bg-surface-0 p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-base font-semibold text-surface-900">Adicionar serviço</h2>
      <Button
        type="button"
        label="Calcular estacionamento"
        icon="pi pi-clock"
        size="small"
        outlined
        :disabled="!orderId"
        @click="calculateParking"
      />
    </div>

    <div
      v-if="parkingPreview"
      class="rounded-lg border border-primary-200 bg-primary-50 p-4"
    >
      <p class="text-sm font-medium text-surface-900">Estacionamento calculado</p>
      <p class="mt-1 text-sm text-surface-700">
        Saída: {{ formatDateTime(parkingPreview.exit_at) }}
      </p>
      <p class="text-sm text-surface-700">
        Permanência: {{ parkingPreview.hours }} h × {{ formatCurrency(parkingPreview.base_price) }}
      </p>
      <p class="mt-2 text-xl font-bold text-surface-900">
        Total: {{ formatCurrency(parkingPreview.total) }}
      </p>
    </div>

    <form class="grid gap-4 md:grid-cols-4" @submit.prevent="submitForm">
      <div class="flex flex-col gap-1 md:col-span-2">
        <label for="service-type" class="text-sm font-medium text-surface-700">Serviço</label>
        <Select
          input-id="service-type"
          v-model="form.type"
          :options="serviceOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          :disabled="!orderId"
          :invalid="Boolean(errors.type)"
        />
        <small v-if="errors.type" class="text-red-500">{{ errors.type }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="service-quantity" class="text-sm font-medium text-surface-700">Quantidade</label>
        <InputNumber
          input-id="service-quantity"
          v-model="form.quantity"
          :min="1"
          class="w-full"
          :disabled="!orderId"
          :invalid="Boolean(errors.quantity)"
        />
        <small v-if="errors.quantity" class="text-red-500">{{ errors.quantity }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="service-price" class="text-sm font-medium text-surface-700">Valor unitário</label>
        <InputNumber
          input-id="service-price"
          :model-value="unitPrice"
          mode="currency"
          currency="BRL"
          locale="pt-BR"
          class="w-full"
          readonly
          :disabled="!orderId"
        />
      </div>

      <div class="md:col-span-4">
        <Button
          type="submit"
          label="Adicionar item"
          icon="pi pi-plus"
          :disabled="!orderId"
        />
      </div>
    </form>

    <p v-if="!orderId" class="text-sm text-surface-500">Selecione ou abra um ticket para adicionar itens.</p>
  </div>
</template>
