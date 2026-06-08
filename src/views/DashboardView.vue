<script setup lang="ts">
import { computed, onMounted } from 'vue'
import DashboardActiveSubscriptions from '@/components/dashboard/DashboardActiveSubscriptions.vue'
import DashboardQuickLinks from '@/components/dashboard/DashboardQuickLinks.vue'
import DashboardRecentOrders from '@/components/dashboard/DashboardRecentOrders.vue'
import DashboardRevenueBreakdown from '@/components/dashboard/DashboardRevenueBreakdown.vue'
import DashboardSpotOverview from '@/components/dashboard/DashboardSpotOverview.vue'
import DashboardStatCard from '@/components/dashboard/DashboardStatCard.vue'
import { useDashboardMetrics } from '@/composables/useDashboardMetrics'
import { useServiceOrdersStore } from '@/stores/serviceOrders'

const serviceOrdersStore = useServiceOrdersStore()

const {
  totalCustomers,
  totalVehicles,
  activeSubscriptionsCount,
  monthlyRecurringRevenue,
  spotStats,
  openOrdersCount,
  todayPaidOrders,
  todayRevenue,
  totalRevenue,
  revenueByService,
  recentOrders,
  activeSubscriptionRows,
  loadError,
  formatCurrency,
} = useDashboardMetrics()

const todayLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date()),
)

onMounted(async () => {
  await serviceOrdersStore.fetchServiceOrders()
})
</script>

<template>
  <section aria-labelledby="dashboard-title" class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="dashboard-title" class="text-2xl font-semibold text-surface-900">Dashboard</h1>
        <p class="mt-1 text-sm text-surface-600">Visão 360 da operação — clientes, vagas, mensalidades e caixa.</p>
      </div>
      <p class="text-sm text-surface-500">{{ todayLabel }}</p>
    </header>

    <p
      v-if="loadError"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ loadError }}
    </p>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        label="Clientes cadastrados"
        :value="String(totalCustomers)"
        :hint="`${totalVehicles} veículo(s) vinculado(s)`"
        icon="pi pi-users"
        tone="info"
      />
      <DashboardStatCard
        label="Mensalistas ativos"
        :value="String(activeSubscriptionsCount)"
        :hint="`${formatCurrency(monthlyRecurringRevenue)}/mês recorrente`"
        icon="pi pi-calendar"
        tone="warn"
      />
      <DashboardStatCard
        label="Tickets abertos"
        :value="String(openOrdersCount)"
        :hint="`${spotStats.occupancyRate}% de ocupação das vagas`"
        icon="pi pi-ticket"
        :tone="openOrdersCount > 0 ? 'danger' : 'success'"
      />
      <DashboardStatCard
        label="Receita de hoje"
        :value="formatCurrency(todayRevenue)"
        :hint="`${todayPaidOrders.length} ticket(s) faturado(s) hoje`"
        icon="pi pi-wallet"
        tone="success"
      />
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <DashboardSpotOverview :stats="spotStats" />
      <DashboardRevenueBreakdown :items="revenueByService" :total-revenue="totalRevenue" />
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <DashboardRecentOrders :orders="recentOrders" />
      <DashboardActiveSubscriptions :subscriptions="activeSubscriptionRows" />
    </div>

    <DashboardQuickLinks />
  </section>
</template>
