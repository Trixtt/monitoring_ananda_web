<template>
  <div>
    <router-view />
    <ToastHost />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import ToastHost from './components/ToastHost.vue'
import { useAuthStore } from './stores/auth'
import { useNotifStore } from './stores/notifikasi'

const auth = useAuthStore()
const notif = useNotifStore()

watch(
  () => auth.isAuthenticated,
  (val) => {
    if (val) {
      notif.connect()
      notif.fetch()
    } else {
      notif.disconnect()
    }
  },
  { immediate: true }
)
</script>
