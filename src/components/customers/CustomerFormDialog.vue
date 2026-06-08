<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputMask from 'primevue/inputmask'
import InputText from 'primevue/inputtext'
import { computed, ref, watch } from 'vue'
import CustomerVehicleFields from '@/components/customers/CustomerVehicleFields.vue'
import type { Customer, CustomerFormErrors, CustomerFormPayload } from '@/types/customer'
import { useCustomersStore } from '@/stores/customers'
import { formatCpf, formatPhone, generateValidCpf } from '@/utils/formatters'

const visible = defineModel<boolean>('visible', { required: true })

const props = defineProps<{
  customer: Customer | null
}>()

const emit = defineEmits<{
  saved: [customer: Customer]
}>()

const customersStore = useCustomersStore()

const form = ref<CustomerFormPayload>(createEmptyForm())
const errors = ref<CustomerFormErrors>({})

const isEditing = computed(() => props.customer !== null)

const dialogTitle = computed(() => (isEditing.value ? 'Editar cliente' : 'Novo cliente'))

function createEmptyForm(): CustomerFormPayload {
  return {
    first_name: '',
    last_name: '',
    cpf: '',
    phone: '',
    email: '',
    vehicles: [],
  }
}

function mapCustomerToForm(customer: Customer): CustomerFormPayload {
  return {
    first_name: customer.first_name,
    last_name: customer.last_name,
    cpf: formatCpf(customer.cpf),
    phone: formatPhone(customer.phone),
    email: customer.email,
    vehicles: customer.vehicles.map((vehicle) => ({
      id: vehicle.id,
      license_plate: vehicle.license_plate,
      model: vehicle.model,
      color: vehicle.color,
    })),
  }
}

function resetForm(): void {
  form.value = props.customer ? mapCustomerToForm(props.customer) : createEmptyForm()
  errors.value = {}
}

watch(
  () => [visible.value, props.customer] as const,
  ([isVisible]) => {
    if (isVisible) {
      resetForm()
    }
  },
)

function updateField<K extends keyof CustomerFormPayload>(field: K, value: CustomerFormPayload[K]): void {
  form.value = {
    ...form.value,
    [field]: value,
  }
}

function fillValidCpf(): void {
  form.value.cpf = generateValidCpf()
  errors.value = {
    ...errors.value,
    cpf: undefined,
  }
}

async function submitForm(): Promise<void> {
  const result = isEditing.value && props.customer
    ? await customersStore.updateCustomer(props.customer.id, form.value)
    : await customersStore.createCustomer(form.value)

  if (!result.success) {
    errors.value = result.errors
    return
  }

  emit('saved', result.customer)
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogTitle"
    :style="{ width: 'min(960px, 95vw)' }"
    :draggable="false"
  >
    <form class="space-y-6" @submit.prevent="submitForm">
      <p v-if="errors.api" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errors.api }}
      </p>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label for="first-name" class="text-sm font-medium text-surface-700">Nome</label>
          <InputText
            id="first-name"
            :model-value="form.first_name"
            class="w-full"
            :invalid="Boolean(errors.first_name)"
            @update:model-value="updateField('first_name', String($event ?? ''))"
          />
          <small v-if="errors.first_name" class="text-red-500">{{ errors.first_name }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="last-name" class="text-sm font-medium text-surface-700">Sobrenome</label>
          <InputText
            id="last-name"
            :model-value="form.last_name"
            class="w-full"
            :invalid="Boolean(errors.last_name)"
            @update:model-value="updateField('last_name', String($event ?? ''))"
          />
          <small v-if="errors.last_name" class="text-red-500">{{ errors.last_name }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="cpf" class="text-sm font-medium text-surface-700">CPF</label>
          <div class="flex gap-2">
            <InputMask
              id="cpf"
              v-model="form.cpf"
              mask="999.999.999-99"
              class="w-full flex-1"
              :invalid="Boolean(errors.cpf)"
            />
            <Button
              type="button"
              label="CPF válido"
              icon="pi pi-id-card"
              size="small"
              outlined
              @click="fillValidCpf"
            />
          </div>
          <small v-if="errors.cpf" class="text-red-500">{{ errors.cpf }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="phone" class="text-sm font-medium text-surface-700">Telefone</label>
          <InputMask
            id="phone"
            v-model="form.phone"
            mask="(99) 99999-9999"
            class="w-full"
            :invalid="Boolean(errors.phone)"
          />
          <small v-if="errors.phone" class="text-red-500">{{ errors.phone }}</small>
        </div>

        <div class="flex flex-col gap-1 md:col-span-2">
          <label for="email" class="text-sm font-medium text-surface-700">E-mail</label>
          <InputText
            id="email"
            type="email"
            :model-value="form.email"
            class="w-full"
            :invalid="Boolean(errors.email)"
            @update:model-value="updateField('email', String($event ?? ''))"
          />
          <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
        </div>
      </div>

      <CustomerVehicleFields v-model:vehicles="form.vehicles" :errors="errors.vehicles" />

      <div class="flex justify-end gap-2">
        <Button type="button" label="Cancelar" severity="secondary" text @click="visible = false" />
        <Button type="submit" :label="isEditing ? 'Salvar alterações' : 'Cadastrar cliente'" icon="pi pi-check" />
      </div>
    </form>
  </Dialog>
</template>
