<template>
  <AuthShell>
    <div class="mb-8 lg:hidden text-center">
      <p class="font-headline-lg text-white mb-1">Buat Password Baru</p>
      <p class="font-label-md text-ice-white/80">Sistem meminta Anda mengganti password awal sebelum digunakan.</p>
    </div>

    <div class="card p-6 md:p-8">
      <div class="text-center mb-6 lg:hidden">
        <span class="w-14 h-14 rounded-full bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-3xl">lock_reset</span>
        </span>
      </div>

      <div class="flex items-center gap-4 mb-6 hidden lg:flex">
        <span class="w-14 h-14 rounded-full bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-3xl">lock_reset</span>
        </span>
        <div>
          <h1 class="font-headline-lg text-deep-navy dark:text-ice-white">Buat Password Baru</h1>
          <p class="page-subtitle">Sistem meminta Anda mengganti password awal sebelum digunakan.</p>
        </div>
      </div>

      <div v-if="berhasil" class="text-center">
        <span class="w-16 h-16 rounded-full bg-status-aman/15 dark:bg-status-aman/20 text-status-aman flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-4xl" data-fill="true">check_circle</span>
        </span>
        <h2 class="font-headline-md text-deep-navy dark:text-ice-white mb-2">Password Berhasil Diperbarui</h2>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60">
          Anda akan dialihkan ke halaman masuk secara otomatis. Silakan masuk kembali menggunakan password baru Anda.
        </p>
      </div>

      <form v-else @submit.prevent="submit" class="space-y-4">
        <PasswordInput id="passwordLama" v-model="form.passwordLama" label="Password Lama" placeholder="Password saat ini" autocomplete="current-password" required />
        <PasswordInput id="passwordBaru" v-model="form.passwordBaru" label="Password Baru" placeholder="Minimal 6 karakter" autocomplete="new-password" required />
        <PasswordInput id="konfirmasi" v-model="form.konfirmasi" label="Konfirmasi Password Baru" placeholder="Ulangi password baru" autocomplete="new-password" required />

        <p v-if="error" class="rounded-md bg-error-container text-on-error-container px-3 py-2 font-label-md flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">error</span>
          {{ error }}
        </p>

        <button class="btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span class="material-symbols-outlined text-[18px]" v-else>check_circle</span>
          Simpan Password Baru
        </button>
      </form>
    </div>
  </AuthShell>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import AuthShell from '../../components/AuthShell.vue'
import PasswordInput from '../../components/PasswordInput.vue'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const form = ref({ passwordLama: '', passwordBaru: '', konfirmasi: '' })
const error = ref('')
const loading = ref(false)
const berhasil = ref(false)
let timer = null

onBeforeUnmount(() => clearTimeout(timer))

async function submit() {
  error.value = ''
  if (form.value.passwordBaru !== form.value.konfirmasi) {
    error.value = 'Konfirmasi password tidak cocok.'
    return
  }
  loading.value = true
  try {
    await auth.changePassword(form.value)
    await auth.logout()
    berhasil.value = true
    toast.success('Password berhasil diperbarui. Anda akan dialihkan ke halaman masuk.')
    timer = setTimeout(() => {
      router.replace('/login')
    }, 900)
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal mengganti password.'
  } finally {
    loading.value = false
  }
}
</script>
