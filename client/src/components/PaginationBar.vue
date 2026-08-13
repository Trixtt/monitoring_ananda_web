<template>
  <div v-if="pages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-surface-variant dark:border-white/10">
    <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">
      Menampilkan {{ from }}&ndash;{{ to }} dari {{ total }}
    </p>
    <div class="flex items-center gap-1.5">
      <button class="btn-ghost !px-2.5" :disabled="page <= 1" @click="go(page - 1)" aria-label="Halaman sebelumnya">
        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
      </button>
      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '…'" class="px-1 font-label-sm text-on-surface-variant dark:text-ice-white/60">&hellip;</span>
        <button
          v-else
          class="min-w-[36px] h-9 px-2 rounded-lg font-label-md transition-all active:scale-[0.97]"
          :class="p === page ? 'bg-gradient-to-r from-dark-teal to-light-teal text-white shadow-card' : 'text-on-surface-variant dark:text-ice-white/70 hover:bg-surface-container-low dark:hover:bg-white/10'"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>
      <button class="btn-ghost !px-2.5" :disabled="page >= pages" @click="go(page + 1)" aria-label="Halaman berikutnya">
        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  page: { type: Number, required: true },
  perPage: { type: Number, default: 25 }
})

const emit = defineEmits(['change'])

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.perPage + 1))
const to = computed(() => Math.min(props.total, props.page * props.perPage))

const visiblePages = computed(() => {
  const current = props.page
  const last = pages.value
  const window = 2
  let start = Math.max(1, current - window)
  let end = Math.min(last, current + window)
  const out = []
  if (start > 1) {
    out.push(1)
    if (start > 2) out.push('…')
  }
  for (let p = start; p <= end; p += 1) out.push(p)
  if (end < last) {
    if (end < last - 1) out.push('…')
    out.push(last)
  }
  return out
})

function go(p) {
  if (p < 1 || p > pages.value || p === props.page) return
  emit('change', p)
}
</script>
