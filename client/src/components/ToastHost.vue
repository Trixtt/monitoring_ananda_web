<template>
  <div class="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end max-w-sm">
    <transition-group name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lift-md text-pure-white text-sm font-label-md"
        :class="{
          'bg-gradient-to-r from-status-aman to-emerald-500': t.type === 'success',
          'bg-gradient-to-r from-status-berisiko to-orange-500': t.type === 'error',
          'bg-gradient-to-r from-dark-teal to-light-teal': t.type === 'info'
        }"
      >
        <span class="material-symbols-outlined text-[18px] mt-0.5" data-fill="true">
          {{ t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info' }}
        </span>
        <span class="leading-snug">{{ t.message }}</span>
        <button class="ml-1 opacity-70 hover:opacity-100" @click="toast.dismiss(t.id)" aria-label="Tutup">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'
const toast = useToastStore()
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
</style>
