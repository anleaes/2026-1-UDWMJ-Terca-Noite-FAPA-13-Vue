<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface NavItem {
  label: string
  to: string
  icon: string
}

const route = useRoute()

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'pi pi-home' },
  { label: 'Clientes', to: '/clientes', icon: 'pi pi-users' },
  { label: 'Vagas', to: '/vagas', icon: 'pi pi-briefcase' },
  { label: 'Mensalidades', to: '/mensalidades', icon: 'pi pi-calendar' },
  { label: 'Caixa', to: '/caixa', icon: 'pi pi-wallet' },
]

const activePath = computed(() => route.path)

function isActive(path: string): boolean {
  return activePath.value === path
}
</script>

<template>
  <aside class="flex w-64 shrink-0 flex-col border-r border-surface-200 bg-surface-0">
    <header class="border-b border-surface-200 px-6 py-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-surface-500">A3</p>
      <h1 class="mt-1 text-lg font-semibold text-surface-900">Gestão</h1>
    </header>

    <nav aria-label="Navegação principal" class="flex-1 px-3 py-4">
      <ul class="space-y-1">
        <li v-for="item in navItems" :key="item.to">
          <RouterLink
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            :class="
              isActive(item.to)
                ? 'bg-primary text-primary-contrast'
                : 'text-surface-700 hover:bg-surface-100 hover:text-surface-900'
            "
          >
            <i :class="item.icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>
