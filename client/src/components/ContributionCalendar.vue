<template>
  <div class="card p-6">
    <div class="flex items-center justify-between gap-3 mb-4">
      <h2 class="font-title-lg text-deep-navy dark:text-ice-white">{{ title }}</h2>
      <div class="flex items-center gap-1">
        <button class="icon-btn" @click="shift(-1)" aria-label="Bulan sebelumnya">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="font-label-md text-deep-navy dark:text-ice-white px-3 min-w-[120px] text-center">{{ bulanNama[bulan] }} {{ tahun }}</span>
        <button class="icon-btn" @click="shift(1)" aria-label="Bulan berikutnya">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">
      <div v-for="d in hariSingkat" :key="d">{{ d }}</div>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="slot in grid"
        :key="slot.key"
        class="aspect-square min-h-[34px] rounded-md flex items-center justify-center cursor-default transition-colors"
        :class="slot.cell ? slot.cell.cls + ' cursor-pointer hover:brightness-110' : 'bg-surface-variant/60 dark:bg-white/5'"
        :title="slot.cell?.tip || ''"
        @click="slot.cell && $emit('click-day', slot.date, slot.cell.info)"
      >
        <span
          v-if="slot.date"
          class="font-label-sm"
          :class="slot.cell ? (slot.cell.textCls || 'text-white') : 'text-on-surface-variant/50 dark:text-ice-white/30'"
        >{{ slot.date.getDate() }}</span>
      </div>
    </div>

    <div v-if="legend.length" class="flex flex-wrap gap-4 mt-4">
      <div v-for="l in legend" :key="l.label" class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-sm" :class="l.cls"></span>
        <span class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ l.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  tahun: { type: Number, required: true },
  bulan: { type: Number, default: () => new Date().getMonth() },
  cells: { type: Object, default: () => ({}) },
  legend: { type: Array, default: () => [] }
})

const emit = defineEmits(['click-day', 'change-bulan'])

const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const hariSingkat = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function iso(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

function dayOffset(year, month) {
  return (new Date(year, month, 1).getDay() + 6) % 7
}

const grid = computed(() => {
  const year = props.tahun
  const month = props.bulan
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = dayOffset(year, month)
  const slots = []
  for (let i = 0; i < offset; i++) slots.push({ key: `pre-${i}`, date: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const key = iso(date)
    slots.push({ key, date, cell: props.cells[key] || null })
  }
  const trailing = (7 - (slots.length % 7)) % 7
  for (let i = 0; i < trailing; i++) slots.push({ key: `post-${i}`, date: null })
  return slots
})

function shift(delta) {
  let m = props.bulan + delta
  let y = props.tahun
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  emit('change-bulan', y, m)
}
</script>
