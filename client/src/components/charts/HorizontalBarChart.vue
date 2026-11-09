<template>
  <div v-if="rows.length" class="space-y-4">
    <div v-for="row in rows" :key="row.key">
      <div class="flex items-center gap-3">
        <span class="w-16 sm:w-20 shrink-0 text-right font-label-md text-deep-navy dark:text-ice-white truncate">{{ row.label }}</span>
        <div class="flex-1 h-7 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden">
          <div
            class="h-full flex rounded-full overflow-hidden transition-all duration-500"
            :style="{ width: barWidth(row.total) }"
          >
            <div
              v-for="seg in row.segments"
              :key="seg.key"
              class="h-full"
              :style="{ width: porsi(seg.value, row.total), backgroundColor: seg.color }"
              :title="`${seg.label}: ${seg.value}`"
            ></div>
          </div>
        </div>
        <span class="w-8 shrink-0 text-right font-label-md text-deep-navy dark:text-ice-white tabular-nums">{{ row.total }}</span>
      </div>
    </div>
  </div>
  <p v-else class="font-body-md text-on-surface-variant dark:text-ice-white/60">Belum ada data kelas.</p>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] }
})

const maxTotal = computed(() => Math.max(...props.rows.map((row) => Number(row.total) || 0), 1))

function barWidth(total) {
  return `${(Number(total || 0) / maxTotal.value) * 100}%`
}

function porsi(value, total) {
  return total ? `${(Number(value || 0) / Number(total)) * 100}%` : '0%'
}
</script>
