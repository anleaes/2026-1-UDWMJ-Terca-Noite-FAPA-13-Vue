<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import type { Subscription } from '@/types/subscription'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface SubscriptionRow extends Subscription {
  customerName: string
  spotCode: string
  vehiclePlate: string
}

defineProps<{
  subscriptions: SubscriptionRow[]
}>()

const emit = defineEmits<{
  create: []
  edit: [subscription: Subscription]
  deactivate: [subscription: Subscription]
}>()
</script>

<template>
  <DataTable
    :value="subscriptions"
    striped-rows
    paginator
    :rows="10"
    :rows-per-page-options="[10, 20, 50]"
    data-key="id"
    empty-message="Nenhuma assinatura ativa."
    class="overflow-hidden rounded-xl border border-surface-200 bg-surface-0 shadow-sm"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-surface-600">{{ subscriptions.length }} assinatura(s) ativa(s)</p>
        <Button label="Nova assinatura" icon="pi pi-plus" @click="emit('create')" />
      </div>
    </template>

    <Column header="Cliente">
      <template #body="{ data }: { data: SubscriptionRow }">
        {{ data.customerName }}
      </template>
    </Column>

    <Column header="Vaga">
      <template #body="{ data }: { data: SubscriptionRow }">
        {{ data.spotCode }}
      </template>
    </Column>

    <Column header="Veículo">
      <template #body="{ data }: { data: SubscriptionRow }">
        {{ data.vehiclePlate }}
      </template>
    </Column>

    <Column header="Mensalidade">
      <template #body="{ data }: { data: SubscriptionRow }">
        {{ formatCurrency(data.monthly_fee) }}
      </template>
    </Column>

    <Column header="Início">
      <template #body="{ data }: { data: SubscriptionRow }">
        {{ formatDate(data.start_date) }}
      </template>
    </Column>

    <Column header="Status">
      <template #body>
        <Tag value="Ativa" severity="success" />
      </template>
    </Column>

    <Column header="Ações" :exportable="false" style="width: 8rem">
      <template #body="{ data }: { data: SubscriptionRow }">
        <div class="flex gap-1">
          <Button
            icon="pi pi-pencil"
            rounded
            text
            aria-label="Editar assinatura"
            @click="emit('edit', data)"
          />
          <Button
            icon="pi pi-ban"
            rounded
            text
            severity="danger"
            aria-label="Encerrar assinatura"
            @click="emit('deactivate', data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
