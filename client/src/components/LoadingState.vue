<template>
  <div v-if="skeleton" class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="card p-5">
        <div class="skeleton h-12 w-12 rounded-xl mb-3"></div>
        <div class="skeleton h-4 w-24 mb-2"></div>
        <div class="skeleton h-6 w-16"></div>
      </div>
    </div>
    <div class="card p-5 space-y-3">
      <div class="skeleton h-6 w-40"></div>
      <div v-for="i in 5" :key="i" class="skeleton h-8 w-full"></div>
    </div>
  </div>
  <div v-else class="flex flex-col items-center justify-center py-16">
    <div class="relative w-10 h-10 mb-4">
      <span class="absolute inset-0 rounded-full border-[3px] border-dark-teal/20"></span>
      <span class="absolute inset-0 rounded-full border-[3px] border-dark-teal border-t-transparent animate-spin"></span>
    </div>
    <p class="font-body-md text-on-surface-variant dark:text-ice-white/60">Memuat data...</p>
  </div>
</template>

<script setup>
defineProps({
  skeleton: { type: Boolean, default: false }
})
</script>
