<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import type { ServiceItem } from '@/types/service-order'
import { formatCurrency } from '@/utils/formatters'

defineProps<{
  items: ServiceItem[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  remove: [itemId: string]
}>()
</script>

<template>
  <DataTable
    :value="items"
    striped-rows
    data-key="id"
    empty-message="Nenhum item adicionado."
    class="overflow-hidden rounded-xl border border-surface-200 bg-surface-0 shadow-sm"
  >
    <Column field="description" header="Serviço" />
    <Column header="Qtd.">
      <template #body="{ data }: { data: ServiceItem }">
        {{ data.quantity }}
      </template>
    </Column>
    <Column header="Unitário">
      <template #body="{ data }: { data: ServiceItem }">
        {{ formatCurrency(data.unit_price) }}
      </template>
    </Column>
    <Column header="Total">
      <template #body="{ data }: { data: ServiceItem }">
        {{ formatCurrency(data.total) }}
      </template>
    </Column>
    <Column v-if="!readonly" header="" style="width: 4rem">
      <template #body="{ data }: { data: ServiceItem }">
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          aria-label="Remover item"
          @click="emit('remove', data.id)"
        />
      </template>
    </Column>
  </DataTable>
</template>
