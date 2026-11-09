<template>
  <div class="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end w-[calc(100vw-2.5rem)] max-w-sm" aria-live="polite">
    <transition-group name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        class="relative w-full flex items-start gap-3 px-4 py-3 rounded-xl shadow-lift-md text-pure-white text-sm font-label-md overflow-hidden"
        :class="typeClass(t.type)"
      >
        <span class="material-symbols-outlined text-[18px] mt-0.5 shrink-0" data-fill="true">{{ icon(t.type) }}</span>
        <div class="min-w-0 flex-1">
          <p v-if="t.title" class="font-label-md leading-snug">{{ t.title }}</p>
          <p class="leading-snug break-words" :class="t.title ? 'text-[13px] opacity-90 mt-0.5' : ''">{{ t.message }}</p>
        </div>
        <button class="ml-1 shrink-0 opacity-70 hover:opacity-100" @click="toast.dismiss(t.id)" aria-label="Tutup">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
        <span class="toast-progress" :style="{ animationDuration: `${t.duration}ms` }"></span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toast = useToastStore()

function typeClass(type) {
  return {
    success: 'bg-gradient-to-r from-status-aman to-emerald-500',
    error: 'bg-gradient-to-r from-status-berisiko to-orange-500',
    warning: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    info: 'bg-gradient-to-r from-dark-teal to-light-teal'
  }[type] || 'bg-gradient-to-r from-dark-teal to-light-teal'
}

function icon(type) {
  return {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }[type] || 'info'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.toast-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.55);
  transform-origin: left;
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
