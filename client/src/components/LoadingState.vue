<template>
  <!-- Skeleton: kartu statistik -->
  <div v-if="skeleton && variant === 'cards'" class="space-y-4">
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

  <!-- Skeleton: tabel -->
  <div v-else-if="skeleton && variant === 'table'" class="space-y-4">
    <div class="flex flex-wrap gap-3">
      <div class="skeleton h-10 w-64 rounded-xl"></div>
      <div class="skeleton h-10 w-28 rounded-xl ml-auto"></div>
    </div>
    <div class="card overflow-hidden">
      <div class="p-4 border-b border-surface-variant/70 dark:border-white/10 flex gap-4">
        <div v-for="i in 4" :key="i" class="skeleton h-4 rounded-full" :style="{ width: columnWidth(i) }"></div>
      </div>
      <div v-for="row in rows" :key="row" class="p-4 border-b border-surface-variant/50 dark:border-white/5 flex items-center gap-4 last:border-b-0">
        <div class="skeleton h-9 w-9 rounded-full shrink-0"></div>
        <div v-for="i in 4" :key="i" class="skeleton h-3.5 rounded-full" :style="{ width: columnWidth(i) }"></div>
        <div class="skeleton h-7 w-16 rounded-full ml-auto shrink-0"></div>
      </div>
    </div>
  </div>

  <!-- Skeleton: halaman profil -->
  <div v-else-if="skeleton && variant === 'profile'" class="space-y-4">
    <div class="card p-6 flex items-center gap-5">
      <div class="skeleton h-20 w-20 rounded-full shrink-0"></div>
      <div class="space-y-3 w-full max-w-xs">
        <div class="skeleton h-5 w-48"></div>
        <div class="skeleton h-4 w-32"></div>
        <div class="skeleton h-9 w-36 rounded-xl mt-2"></div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="card p-5 space-y-3">
        <div class="skeleton h-5 w-36"></div>
        <div v-for="j in 3" :key="j" class="flex justify-between gap-4">
          <div class="skeleton h-4 w-24"></div>
          <div class="skeleton h-4 w-40"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Skeleton: umum (kompatibel prop lama) -->
  <div v-else-if="skeleton" class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="card p-5">
        <div class="skeleton h-12 w-12 rounded-xl mb-3"></div>
        <div class="skeleton h-4 w-24 mb-2"></div>
        <div class="skeleton h-6 w-16"></div>
      </div>
    </div>
    <div class="card p-5 space-y-3">
      <div class="skeleton h-6 w-40"></div>
      <div v-for="i in rows" :key="i" class="skeleton h-8 w-full"></div>
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
  skeleton: { type: Boolean, default: false },
  variant: { type: String, default: 'default' },
  rows: { type: Number, default: 5 }
})

function columnWidth(index) {
  const widths = ['18%', '26%', '22%', '14%']
  return widths[(index - 1) % widths.length]
}
</script>
