<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import SubscriptionFormDialog from '@/components/subscriptions/SubscriptionFormDialog.vue'
import SubscriptionTable from '@/components/subscriptions/SubscriptionTable.vue'
import type { Subscription } from '@/types/subscription'
import { useSubscriptionsStore } from '@/stores/subscriptions'

const subscriptionsStore = useSubscriptionsStore()
const confirm = useConfirm()
const toast = useToast()

const isDialogVisible = ref(false)
const selectedSubscription = ref<Subscription | null>(null)

const subscriptionRows = computed(() =>
  subscriptionsStore.sortedActiveSubscriptions.map((subscription) => ({
    ...subscription,
    ...subscriptionsStore.getSubscriptionDetails(subscription),
  })),
)

function openCreateDialog(): void {
  selectedSubscription.value = null
  isDialogVisible.value = true
}

function openEditDialog(subscription: Subscription): void {
  selectedSubscription.value = subscription
  isDialogVisible.value = true
}

function handleSaved(subscription: Subscription): void {
  const details = subscriptionsStore.getSubscriptionDetails(subscription)

  toast.add({
    severity: 'success',
    summary: selectedSubscription.value ? 'Assinatura atualizada' : 'Assinatura cadastrada',
    detail: `${details.customerName} - ${details.spotCode}`,
    life: 3000,
  })
}

function confirmDeactivate(subscription: Subscription): void {
  const details = subscriptionsStore.getSubscriptionDetails(subscription)

  confirm.require({
    header: 'Encerrar assinatura',
    message: `Deseja encerrar a assinatura de ${details.customerName} na vaga ${details.spotCode}?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Encerrar',
    rejectClass: 'p-button-secondary p-button-text',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const deactivated = await subscriptionsStore.deactivateSubscription(subscription.id)

      if (!deactivated) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao encerrar assinatura',
          detail: subscriptionsStore.apiError ?? 'Não foi possível encerrar a assinatura.',
          life: 4000,
        })
        return
      }

      toast.add({
        severity: 'success',
        summary: 'Assinatura encerrada',
        detail: `${details.customerName} - ${details.spotCode}`,
        life: 3000,
      })
    },
  })
}
</script>

<template>
  <section aria-labelledby="mensalidades-title" class="space-y-6">
    <header>
      <h1 id="mensalidades-title" class="text-2xl font-semibold text-surface-900">Mensalidades</h1>
      <p class="mt-1 text-sm text-surface-600">Gerencie assinaturas ativas e vagas fixas dos mensalistas.</p>
    </header>

    <p
      v-if="subscriptionsStore.apiError"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ subscriptionsStore.apiError }}
    </p>

    <SubscriptionTable
      :subscriptions="subscriptionRows"
      @create="openCreateDialog"
      @edit="openEditDialog"
      @deactivate="confirmDeactivate"
    />

    <SubscriptionFormDialog
      v-model:visible="isDialogVisible"
      :subscription="selectedSubscription"
      @saved="handleSaved"
    />

    <ConfirmDialog />
    <Toast />
  </section>
</template>
