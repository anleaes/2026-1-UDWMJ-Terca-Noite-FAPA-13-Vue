<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import CustomerFormDialog from '@/components/customers/CustomerFormDialog.vue'
import CustomerTable from '@/components/customers/CustomerTable.vue'
import type { Customer } from '@/types/customer'
import { useCustomersStore } from '@/stores/customers'
import { getFullName } from '@/utils/formatters'

const customersStore = useCustomersStore()
const confirm = useConfirm()
const toast = useToast()

const isDialogVisible = ref(false)
const selectedCustomer = ref<Customer | null>(null)

function openCreateDialog(): void {
  selectedCustomer.value = null
  isDialogVisible.value = true
}

function openEditDialog(customer: Customer): void {
  selectedCustomer.value = customer
  isDialogVisible.value = true
}

function handleSaved(customer: Customer): void {
  toast.add({
    severity: 'success',
    summary: selectedCustomer.value ? 'Cliente atualizado' : 'Cliente cadastrado',
    detail: getFullName(customer.first_name, customer.last_name),
    life: 3000,
  })
}

function confirmDelete(customer: Customer): void {
  confirm.require({
    header: 'Excluir cliente',
    message: `Deseja excluir ${getFullName(customer.first_name, customer.last_name)}?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    rejectClass: 'p-button-secondary p-button-text',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const deleted = await customersStore.deleteCustomer(customer.id)

      if (!deleted) {
        return
      }

      toast.add({
        severity: 'success',
        summary: 'Cliente excluído',
        detail: getFullName(customer.first_name, customer.last_name),
        life: 3000,
      })
    },
  })
}
</script>

<template>
  <section aria-labelledby="clientes-title" class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 id="clientes-title" class="text-2xl font-semibold text-surface-900">Clientes</h1>
        <p class="mt-1 text-sm text-surface-600">Gerencie clientes e veículos vinculados.</p>
      </div>
    </header>

    <CustomerTable
      :customers="customersStore.sortedCustomers"
      @create="openCreateDialog"
      @edit="openEditDialog"
      @delete="confirmDelete"
    />

    <p
      v-if="customersStore.apiError"
      class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      {{ customersStore.apiError }}
    </p>

    <CustomerFormDialog
      v-model:visible="isDialogVisible"
      :customer="selectedCustomer"
      @saved="handleSaved"
    />

    <ConfirmDialog />
    <Toast />
  </section>
</template>
