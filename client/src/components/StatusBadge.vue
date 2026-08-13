<template>
  <span class="badge" :class="info.bg + ' ' + info.text">
    <span class="w-1.5 h-1.5 rounded-full" :class="info.dot"></span>
    {{ info.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { kategoriInfo } from '../utils/format'

const props = defineProps({
  kode: { type: String, default: 'aman' }
})

const info = computed(() => kategoriInfo(props.kode))
</script>
