<script setup lang="ts">
import { RouterLink } from 'vue-router'

const links = [
  {
    label: 'Clientes',
    description: 'Cadastros e veículos',
    to: '/clientes',
    icon: 'pi pi-users',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  {
    label: 'Vagas',
    description: 'Mapa e status',
    to: '/vagas',
    icon: 'pi pi-briefcase',
    className: 'border-green-200 bg-green-50 text-green-700',
  },
  {
    label: 'Mensalidades',
    description: 'Assinaturas ativas',
    to: '/mensalidades',
    icon: 'pi pi-calendar',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    label: 'Caixa',
    description: 'Tickets e faturamento',
    to: '/caixa',
    icon: 'pi pi-wallet',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
  },
]
</script>

<template>
  <section class="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-sm">
    <h2 class="text-base font-semibold text-surface-900">Acesso rápido</h2>
    <p class="mt-1 text-sm text-surface-600">Navegue para os módulos principais do sistema.</p>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 rounded-lg border border-surface-200 px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
          :class="link.className"
        >
          <i :class="link.icon" aria-hidden="true" />
        </span>
        <span>
          <span class="block text-sm font-semibold text-surface-900">{{ link.label }}</span>
          <span class="block text-xs text-surface-600">{{ link.description }}</span>
        </span>
      </RouterLink>
    </div>
  </section>
</template>
