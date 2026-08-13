<template>
  <TransitionRoot appear as="template" :show="true">
    <Dialog as="div" class="relative z-50" @close="close">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-deep-navy/40 dark:bg-black/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 scale-95 translate-y-3"
            enter-to="opacity-100 scale-100 translate-y-0"
            leave="duration-150 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="card w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden">
              <div class="flex items-center justify-between px-5 py-4 border-b border-surface-variant dark:border-white/10">
                <DialogTitle class="font-title-lg text-deep-navy dark:text-ice-white">{{ title }}</DialogTitle>
                <button class="p-1.5 rounded-lg text-on-surface-variant dark:text-ice-white/70 hover:bg-surface-container-low dark:hover:bg-white/10" @click="close" aria-label="Tutup">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
              <div class="overflow-y-auto hide-scrollbar p-5 flex-1">
                <slot />
              </div>
              <div v-if="$slots.footer" class="px-5 py-4 border-t border-surface-variant dark:border-white/10 flex justify-end gap-3">
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'

const emit = defineEmits(['close'])
defineProps({
  title: { type: String, default: 'Dialog' }
})
function close() {
  emit('close')
}
</script>
