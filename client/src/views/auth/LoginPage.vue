<template>
  <AuthShell>
    <div class="mb-8 lg:hidden">
      <p class="font-headline-lg text-deep-navy dark:text-ice-white mb-1">Masuk ke Aplikasi</p>
      <p class="page-subtitle">Sistem Monitoring Perkembangan Siswa</p>
    </div>

    <div class="card p-6 md:p-8">
      <h1 class="font-headline-lg text-deep-navy dark:text-ice-white hidden lg:block">Masuk ke Aplikasi</h1>
      <p class="page-subtitle mb-6 hidden lg:block">Sistem Monitoring Perkembangan Siswa</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="label" for="username">Username</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-ice-white/50">person</span>
            <input id="username" v-model="form.username" class="input pl-11" placeholder="Masukkan username" autocomplete="username" required />
          </div>
        </div>
        <PasswordInput id="password" v-model="form.password" label="Password" placeholder="Masukkan password" autocomplete="current-password" required />

        <p v-if="error" class="rounded-lg bg-error-container dark:bg-error/20 text-on-error-container dark:text-red-200 px-3 py-2 font-label-md flex items-center gap-2 animate-fade-up">
          <span class="material-symbols-outlined text-[18px]">error</span>
          {{ error }}
        </p>

        <button class="btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <template v-else>
            <span class="material-symbols-outlined text-[18px]">login</span>
            Masuk
          </template>
        </button>
      </form>

      <div class="flex items-center justify-between mt-4 pt-4 border-t border-surface-variant dark:border-white/10">
        <router-link to="/lupa-password" class="font-label-sm text-dark-teal hover:underline dark:text-light-teal">Lupa password?</router-link>
        <router-link to="/" class="font-label-sm text-on-surface-variant dark:text-ice-white/60 hover:text-dark-teal dark:hover:text-light-teal">Beranda</router-link>
      </div>
    </div>

    <div class="mt-5 rounded-xl bg-ice-white dark:bg-white/5 border border-light-teal/40 dark:border-white/10 text-on-surface-variant dark:text-ice-white/70 p-4 text-sm">
      <p class="font-label-md text-deep-navy dark:text-ice-white mb-2">Akun percobaan</p>
      <p>Admin: <code class="text-dark-teal dark:text-light-teal">admin / admin123</code></p>
      <p>Kepala Sekolah: <code class="text-dark-teal dark:text-light-teal">kepsek / password123</code></p>
      <p>Wali Kelas: <code class="text-dark-teal dark:text-light-teal">wali1 / password123</code> (Kelas 1)</p>
      <p>Orang Tua: <code class="text-dark-teal dark:text-light-teal">2025001 / 20100112</code> (password awal wajib diganti)</p>
    </div>
  </AuthShell>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AuthShell from '../../components/AuthShell.vue'
import PasswordInput from '../../components/PasswordInput.vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const data = await auth.login(form.value.username.trim(), form.value.password)
    router.push(data.redirect || auth.homePath)
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal masuk. Periksa koneksi internet.'
  } finally {
    loading.value = false
  }
}
</script>
