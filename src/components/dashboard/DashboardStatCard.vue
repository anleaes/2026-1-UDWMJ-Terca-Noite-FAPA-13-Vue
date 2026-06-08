<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    hint?: string
    icon: string
    tone?: 'default' | 'success' | 'warn' | 'danger' | 'info'
  }>(),
  {
    tone: 'default',
  },
)

const toneClasses = {
  default: 'border-surface-200 bg-surface-0 text-primary',
  success: 'border-green-200 bg-green-50 text-green-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
} as const
</script>

<template>
  <article class="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-surface-600">{{ label }}</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight text-surface-900">{{ value }}</p>
        <p v-if="hint" class="mt-1 text-xs text-surface-500">{{ hint }}</p>
      </div>
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
        :class="toneClasses[tone]"
      >
        <i :class="icon" class="text-lg" aria-hidden="true" />
      </div>
    </div>
  </article>
</template>
