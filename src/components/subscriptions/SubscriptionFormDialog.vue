<script setup lang="ts">
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { computed, ref, watch } from 'vue'
import type { Subscription, SubscriptionFormErrors, SubscriptionFormPayload } from '@/types/subscription'
import { useCustomersStore } from '@/stores/customers'
import { useParkingSpotsStore } from '@/stores/parkingSpots'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { getFullName } from '@/utils/formatters'

const visible = defineModel<boolean>('visible', { required: true })

const props = defineProps<{
  subscription: Subscription | null
}>()

const emit = defineEmits<{
  saved: [subscription: Subscription]
}>()

const customersStore = useCustomersStore()
const parkingSpotsStore = useParkingSpotsStore()
const subscriptionsStore = useSubscriptionsStore()

const form = ref<SubscriptionFormPayload>(createEmptyForm())
const errors = ref<SubscriptionFormErrors>({})
const startDate = ref<Date | null>(new Date())

const isEditing = computed(() => props.subscription !== null)

const dialogTitle = computed(() => (isEditing.value ? 'Editar assinatura' : 'Nova assinatura'))

const customerOptions = computed(() =>
  customersStore.sortedCustomers.map((customer) => ({
    label: getFullName(customer.first_name, customer.last_name),
    value: customer.id,
  })),
)

const selectedCustomer = computed(() =>
  customersStore.getCustomerById(form.value.customer_id),
)

const vehicleOptions = computed(() =>
  (selectedCustomer.value?.vehicles ?? []).map((vehicle) => ({
    label: `${vehicle.license_plate} - ${vehicle.model}`,
    value: vehicle.id,
  })),
)

const spotOptions = computed(() => {
  const currentSpotId = props.subscription?.spot_id

  return parkingSpotsStore.sortedSpots
    .filter((spot) => {
      if (spot.id === currentSpotId) {
        return true
      }

      return parkingSpotsStore.isSpotAvailableForSubscription(spot.id)
    })
    .map((spot) => ({
      label: spot.code,
      value: spot.id,
    }))
})

function createEmptyForm(): SubscriptionFormPayload {
  return {
    customer_id: '',
    spot_id: '',
    vehicle_id: '',
    monthly_fee: 0,
    start_date: new Date().toISOString().slice(0, 10),
  }
}

function mapSubscriptionToForm(subscription: Subscription): SubscriptionFormPayload {
  return {
    customer_id: subscription.customer_id,
    spot_id: subscription.spot_id,
    vehicle_id: subscription.vehicle_id,
    monthly_fee: subscription.monthly_fee,
    start_date: subscription.start_date,
  }
}

function resetForm(): void {
  form.value = props.subscription ? mapSubscriptionToForm(props.subscription) : createEmptyForm()
  startDate.value = form.value.start_date ? new Date(`${form.value.start_date}T00:00:00`) : new Date()
  errors.value = {}
}

watch(
  () => [visible.value, props.subscription] as const,
  ([isVisible]) => {
    if (isVisible) {
      resetForm()
    }
  },
)

watch(startDate, (value) => {
  if (!value) {
    form.value.start_date = ''
    return
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  form.value.start_date = `${year}-${month}-${day}`
})

watch(
  () => form.value.customer_id,
  () => {
    if (!selectedCustomer.value?.vehicles.some((vehicle) => vehicle.id === form.value.vehicle_id)) {
      form.value.vehicle_id = ''
    }
  },
)

function updateField<K extends keyof SubscriptionFormPayload>(
  field: K,
  value: SubscriptionFormPayload[K],
): void {
  form.value = {
    ...form.value,
    [field]: value,
  }
}

async function submitForm(): Promise<void> {
  const result = isEditing.value && props.subscription
    ? await subscriptionsStore.updateSubscription(props.subscription.id, form.value)
    : await subscriptionsStore.createSubscription(form.value)

  if (!result.success) {
    errors.value = result.errors
    return
  }

  emit('saved', result.subscription)
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogTitle"
    :style="{ width: 'min(640px, 95vw)' }"
    :draggable="false"
  >
    <form class="space-y-4" @submit.prevent="submitForm">
      <p v-if="errors.api" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errors.api }}
      </p>

      <div class="flex flex-col gap-1">
        <label for="subscription-customer" class="text-sm font-medium text-surface-700">Cliente</label>
        <Select
          input-id="subscription-customer"
          :model-value="form.customer_id"
          :options="customerOptions"
          option-label="label"
          option-value="value"
          placeholder="Selecione o cliente"
          class="w-full"
          :invalid="Boolean(errors.customer_id)"
          @update:model-value="updateField('customer_id', String($event ?? ''))"
        />
        <small v-if="errors.customer_id" class="text-red-500">{{ errors.customer_id }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="subscription-vehicle" class="text-sm font-medium text-surface-700">Veículo</label>
        <Select
          input-id="subscription-vehicle"
          :model-value="form.vehicle_id"
          :options="vehicleOptions"
          option-label="label"
          option-value="value"
          placeholder="Selecione o veículo"
          class="w-full"
          :disabled="!form.customer_id"
          :invalid="Boolean(errors.vehicle_id)"
          @update:model-value="updateField('vehicle_id', String($event ?? ''))"
        />
        <small v-if="errors.vehicle_id" class="text-red-500">{{ errors.vehicle_id }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="subscription-spot" class="text-sm font-medium text-surface-700">Vaga fixa</label>
        <Select
          input-id="subscription-spot"
          :model-value="form.spot_id"
          :options="spotOptions"
          option-label="label"
          option-value="value"
          placeholder="Selecione a vaga"
          class="w-full"
          :invalid="Boolean(errors.spot_id)"
          @update:model-value="updateField('spot_id', String($event ?? ''))"
        />
        <small v-if="errors.spot_id" class="text-red-500">{{ errors.spot_id }}</small>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label for="subscription-fee" class="text-sm font-medium text-surface-700">Valor mensal</label>
          <InputNumber
            input-id="subscription-fee"
            :model-value="form.monthly_fee"
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            class="w-full"
            :invalid="Boolean(errors.monthly_fee)"
            @update:model-value="updateField('monthly_fee', Number($event ?? 0))"
          />
          <small v-if="errors.monthly_fee" class="text-red-500">{{ errors.monthly_fee }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="subscription-start-date" class="text-sm font-medium text-surface-700">Data de início</label>
          <DatePicker
            input-id="subscription-start-date"
            v-model="startDate"
            date-format="dd/mm/yy"
            show-icon
            class="w-full"
            :invalid="Boolean(errors.start_date)"
          />
          <small v-if="errors.start_date" class="text-red-500">{{ errors.start_date }}</small>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button type="button" label="Cancelar" severity="secondary" text @click="visible = false" />
        <Button type="submit" :label="isEditing ? 'Salvar alterações' : 'Cadastrar assinatura'" icon="pi pi-check" />
      </div>
    </form>
  </Dialog>
</template>
