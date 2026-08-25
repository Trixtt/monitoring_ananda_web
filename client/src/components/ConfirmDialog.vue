<template>
  <ModalDialog :title="title" @close="$emit('cancel')">
    <div class="flex items-start gap-3 mb-4">
      <span class="w-10 h-10 rounded-full bg-error-container dark:bg-error/20 text-on-error-container dark:text-red-200 flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined" data-fill="true">warning</span>
      </span>
      <p class="font-body-md text-on-surface dark:text-ice-white">{{ message }}</p>
    </div>
    <div class="flex justify-end gap-3">
      <button class="btn-secondary" @click="$emit('cancel')">Batal</button>
      <button class="btn bg-gradient-to-r from-status-berisiko to-orange-500 text-white shadow-card hover:brightness-110" :disabled="loading" @click="$emit('confirm')">
        <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span class="material-symbols-outlined text-[18px]" v-else>delete</span>
        {{ confirmLabel }}
      </button>
    </div>
  </ModalDialog>
</template>

<script setup>
import ModalDialog from './ModalDialog.vue'
defineProps({
  title: { type: String, default: 'Konfirmasi' },
  message: { type: String, default: 'Yakin ingin menghapus data ini?' },
  confirmLabel: { type: String, default: 'Hapus' },
  loading: { type: Boolean, default: false }
})
defineEmits(['confirm', 'cancel'])
</script>
