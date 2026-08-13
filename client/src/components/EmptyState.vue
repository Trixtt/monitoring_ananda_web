<template>
  <div class="flex flex-col items-center justify-center py-14 text-center px-6">
    <span class="w-16 h-16 rounded-2xl bg-ice-white dark:bg-white/10 flex items-center justify-center mb-4">
      <span class="material-symbols-outlined text-[32px] text-dark-teal dark:text-light-teal">{{ icon }}</span>
    </span>
    <h3 class="font-title-lg text-deep-navy dark:text-ice-white mb-1">{{ title }}</h3>
    <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 max-w-md">{{ message }}</p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Belum ada data' },
  message: { type: String, default: 'Data akan tampil di sini setelah tersedia.' },
  icon: { type: String, default: 'inbox' }
})
</script>
