<template>
  <div ref="rootRef" class="card card-hover p-6 flex items-center gap-4">
    <span
      class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-card"
      :class="chipClass"
    >
      <span class="material-symbols-outlined text-[24px]" :class="colorClass">{{ icon }}</span>
    </span>
    <div class="min-w-0">
      <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ label }}</p>
      <p class="font-headline-md text-deep-navy dark:text-ice-white leading-tight">{{ displayValue }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: 'info' },
  iconBg: { type: String, default: '' },
  iconColor: { type: String, default: 'text-dark-teal' },
  tone: {
    type: String,
    default: '',
    validator: (v) => ['', 'teal', 'blue', 'green', 'amber', 'red', 'purple'].includes(v)
  }
})

const rootRef = ref(null)
const display = ref(0)
let raf = 0
let observer = null

function isNumeric(v) {
  return (
    typeof v === 'number' ||
    (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)))
  )
}

function animateTo(value) {
  cancelAnimationFrame(raf)
  const target = Number(value)
  const start = performance.now()
  const duration = 700
  function step(now) {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    display.value = Math.round(target * eased)
    if (p < 1) raf = requestAnimationFrame(step)
    else display.value = target
  }
  raf = requestAnimationFrame(step)
}

function watchWhenVisible() {
  if (observer || !rootRef.value) return
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        animateTo(props.value)
        observer.disconnect()
        observer = null
      }
    }
  })
  observer.observe(rootRef.value)
}

const displayValue = computed(() =>
  isNumeric(props.value) ? display.value : props.value
)

onMounted(() => {
  if (isNumeric(props.value)) watchWhenVisible()
})

watch(
  () => props.value,
  () => {
    if (!isNumeric(props.value)) return
    display.value = 0
    watchWhenVisible()
  }
)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
})

const toneMap = {
  teal: { chip: 'bg-gradient-to-br from-dark-teal to-light-teal', color: 'text-white' },
  blue: { chip: 'bg-gradient-to-br from-primary to-dark-teal', color: 'text-white' },
  green: { chip: 'bg-gradient-to-br from-status-aman to-emerald-400', color: 'text-white' },
  amber: { chip: 'bg-gradient-to-br from-amber-400 to-yellow-500', color: 'text-white' },
  red: { chip: 'bg-gradient-to-br from-status-berisiko to-orange-500', color: 'text-white' },
  purple: { chip: 'bg-gradient-to-br from-status-abk to-fuchsia-400', color: 'text-white' }
}

const chipClass = computed(() =>
  props.tone ? toneMap[props.tone].chip : props.iconBg || 'bg-ice-white dark:bg-white/10'
)

const colorClass = computed(() =>
  props.tone ? toneMap[props.tone].color : props.iconColor
)
</script>
