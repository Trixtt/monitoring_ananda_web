<template>
  <div class="flex flex-col items-center gap-5">
    <div class="relative w-40 h-40 sm:w-44 sm:h-44 shrink-0">
      <svg
        viewBox="0 0 180 180"
        class="w-full h-full -rotate-90"
        role="img"
        :aria-label="ariaLabel"
      >
        <title>{{ ariaLabel }}</title>
        <circle
          cx="90"
          cy="90"
          :r="radius"
          fill="none"
          stroke="currentColor"
          class="text-surface-variant dark:text-white/10"
          :stroke-width="strokeWidth"
        />
        <circle
          v-for="seg in arcs"
          :key="seg.key"
          cx="90"
          cy="90"
          :r="radius"
          fill="none"
          :stroke="seg.color"
          :stroke-width="strokeWidth"
          stroke-linecap="butt"
          :stroke-dasharray="`${seg.dash} ${circumference - seg.dash}`"
          :stroke-dashoffset="-seg.offset"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="font-headline-md text-deep-navy dark:text-ice-white leading-none">{{ total }}</span>
        <span class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">{{ centerLabel }}</span>
      </div>
    </div>

    <ul class="w-full space-y-2.5">
      <li v-for="seg in segments" :key="seg.key" class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }"></span>
        <span class="font-body-md text-on-surface-variant dark:text-ice-white/60 flex-1 min-w-0 truncate">{{ seg.label }}</span>
        <span class="font-label-md text-deep-navy dark:text-ice-white tabular-nums">{{ seg.value }}</span>
        <span class="font-label-sm text-outline dark:text-ice-white/40 w-10 text-right tabular-nums">{{ persen(seg.value) }}%</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  segments: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  centerLabel: { type: String, default: 'Siswa' }
})

const radius = 68
const strokeWidth = 18
const circumference = 2 * Math.PI * radius

const persen = (value) => (props.total ? Math.round((Number(value || 0) / props.total) * 100) : 0)

const arcs = computed(() => {
  const gap = props.segments.length > 1 ? 2 : 0
  let accumulated = 0
  return props.segments
    .filter((seg) => Number(seg.value) > 0)
    .map((seg) => {
      const pct = props.total ? Number(seg.value) / props.total : 0
      const dash = Math.max(pct * circumference - gap, 0.01)
      const arc = {
        key: seg.key,
        color: seg.color,
        dash,
        offset: accumulated * circumference
      }
      accumulated += pct
      return arc
    })
})

const ariaLabel = computed(
  () => `Distribusi ${props.centerLabel.toLowerCase()}: ${props.segments.map((s) => `${s.label} ${s.value}`).join(', ')}`
)
</script>
