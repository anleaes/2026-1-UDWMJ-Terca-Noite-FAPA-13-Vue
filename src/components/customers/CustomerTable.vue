<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import type { Customer } from '@/types/customer'
import { formatCpf, formatPhone, getFullName } from '@/utils/formatters'

defineProps<{
  customers: Customer[]
}>()

const emit = defineEmits<{
  create: []
  edit: [customer: Customer]
  delete: [customer: Customer]
}>()
</script>

<template>
  <DataTable
    :value="customers"
    striped-rows
    paginator
    :rows="10"
    :rows-per-page-options="[10, 20, 50]"
    data-key="id"
    empty-message="Nenhum cliente cadastrado."
    class="overflow-hidden rounded-xl border border-surface-200 bg-surface-0 shadow-sm"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-surface-600">{{ customers.length }} cliente(s) cadastrado(s)</p>
        <Button label="Novo cliente" icon="pi pi-plus" @click="emit('create')" />
      </div>
    </template>

    <Column header="Nome">
      <template #body="{ data }: { data: Customer }">
        {{ getFullName(data.first_name, data.last_name) }}
      </template>
    </Column>

    <Column header="CPF">
      <template #body="{ data }: { data: Customer }">
        {{ formatCpf(data.cpf) }}
      </template>
    </Column>

    <Column header="Telefone">
      <template #body="{ data }: { data: Customer }">
        {{ formatPhone(data.phone) }}
      </template>
    </Column>

    <Column field="email" header="E-mail" />

    <Column header="Veículos">
      <template #body="{ data }: { data: Customer }">
        {{ data.vehicles.length }}
      </template>
    </Column>

    <Column header="Ações" :exportable="false" style="width: 8rem">
      <template #body="{ data }: { data: Customer }">
        <div class="flex gap-1">
          <Button
            icon="pi pi-pencil"
            rounded
            text
            aria-label="Editar cliente"
            @click="emit('edit', data)"
          />
          <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            aria-label="Excluir cliente"
            @click="emit('delete', data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
