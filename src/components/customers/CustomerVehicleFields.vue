<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import type { CustomerFormErrors } from '@/types/customer'
import type { VehicleFormItem } from '@/types/vehicle'
import { formatLicensePlate } from '@/utils/license-plate'

const vehicles = defineModel<VehicleFormItem[]>('vehicles', { required: true })

defineProps<{
  errors?: CustomerFormErrors['vehicles']
}>()

function createVehicle(): VehicleFormItem {
  return {
    license_plate: '',
    model: '',
    color: '',
  }
}

function addVehicle(): void {
  vehicles.value = [...vehicles.value, createVehicle()]
}

function removeVehicle(index: number): void {
  vehicles.value = vehicles.value.filter((_, vehicleIndex) => vehicleIndex !== index)
}

function updateVehicle(index: number, field: keyof VehicleFormItem, value: string): void {
  vehicles.value = vehicles.value.map((vehicle, vehicleIndex) =>
    vehicleIndex === index ? { ...vehicle, [field]: value } : vehicle,
  )
}

function updateLicensePlate(index: number, value: string): void {
  updateVehicle(index, 'license_plate', formatLicensePlate(value))
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-surface-900">Veículos</h3>
      <Button
        type="button"
        label="Adicionar veículo"
        icon="pi pi-plus"
        size="small"
        outlined
        @click="addVehicle"
      />
    </div>

    <p v-if="vehicles.length === 0" class="rounded-lg border border-dashed border-surface-300 px-4 py-6 text-center text-sm text-surface-500">
      Nenhum veículo vinculado.
    </p>

    <div v-else class="space-y-3">
      <article
        v-for="(vehicle, index) in vehicles"
        :key="vehicle.id ?? index"
        class="rounded-lg border border-surface-200 p-4"
      >
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm font-medium text-surface-800">Veículo {{ index + 1 }}</p>
          <Button
            type="button"
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            aria-label="Remover veículo"
            @click="removeVehicle(index)"
          />
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="flex flex-col gap-1">
            <label :for="`license-plate-${index}`" class="text-sm font-medium text-surface-700">Placa</label>
            <InputText
              :id="`license-plate-${index}`"
              :model-value="vehicle.license_plate"
              class="w-full uppercase"
              maxlength="8"
              placeholder="ABC-1234 ou ABC1D23"
              :invalid="Boolean(errors?.[index]?.license_plate)"
              @update:model-value="updateLicensePlate(index, String($event ?? ''))"
            />
            <small v-if="errors?.[index]?.license_plate" class="text-red-500">{{ errors[index]?.license_plate }}</small>
          </div>

          <div class="flex flex-col gap-1">
            <label :for="`model-${index}`" class="text-sm font-medium text-surface-700">Modelo</label>
            <InputText
              :id="`model-${index}`"
              :model-value="vehicle.model"
              class="w-full"
              :invalid="Boolean(errors?.[index]?.model)"
              @update:model-value="updateVehicle(index, 'model', String($event ?? ''))"
            />
            <small v-if="errors?.[index]?.model" class="text-red-500">{{ errors[index]?.model }}</small>
          </div>

          <div class="flex flex-col gap-1">
            <label :for="`color-${index}`" class="text-sm font-medium text-surface-700">Cor</label>
            <InputText
              :id="`color-${index}`"
              :model-value="vehicle.color"
              class="w-full"
              :invalid="Boolean(errors?.[index]?.color)"
              @update:model-value="updateVehicle(index, 'color', String($event ?? ''))"
            />
            <small v-if="errors?.[index]?.color" class="text-red-500">{{ errors[index]?.color }}</small>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
