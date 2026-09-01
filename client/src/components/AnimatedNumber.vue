<template>
  <span ref="rootRef" class="tabular-nums inline-block">{{ text }}</span>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  suffix: { type: String, default: '' },
  decimals: { type: Number, default: 0 }
})

const rootRef = ref(null)
const display = ref(0)
let raf = 0
let observer = null

const text = computed(() => display.value.toFixed(props.decimals) + props.suffix)

function animate() {
  cancelAnimationFrame(raf)
  const target = props.value
  const start = performance.now()
  const duration = 800
  function step(now) {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    display.value = target * eased
    if (p < 1) raf = requestAnimationFrame(step)
    else display.value = target
  }
  raf = requestAnimationFrame(step)
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        animate()
        observer.disconnect()
        observer = null
      }
    }
  })
  observer.observe(rootRef.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
})
</script>
