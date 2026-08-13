<template>
  <div class="space-y-6 max-w-3xl">
    <div class="page-header">
      <h1 class="page-title">Profil & Kata Sandi</h1>
      <p class="page-subtitle">Kelola informasi akun Anda</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Profil -->
      <div class="card p-6">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Data Profil</h2>
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-dark-teal to-light-teal text-white flex items-center justify-center font-headline-md shadow-card">
            {{ initials }}
          </div>
          <div>
            <p class="font-title-lg text-deep-navy dark:text-ice-white">{{ auth.user?.name }}</p>
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ roleLabel }} &middot; {{ auth.user?.username }}</p>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="space-y-4">
          <div>
            <label class="label">Nama Lengkap</label>
            <input v-model="profile.name" class="input" required />
          </div>
          <div>
            <label class="label">No. WhatsApp</label>
            <input v-model="profile.phone" class="input" placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label class="label">Email</label>
            <input v-model="profile.email" type="email" class="input" placeholder="opsional" />
          </div>
          <button class="btn-primary" :disabled="loadingProfile">
            <span v-if="loadingProfile" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[18px]" v-else>save</span>
            Simpan Profil
          </button>
        </form>
      </div>

      <!-- Ganti password -->
      <div class="card p-6">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Ganti Kata Sandi</h2>
        <form @submit.prevent="savePassword" class="space-y-4">
          <PasswordInput id="pwdLama" v-model="pwd.passwordLama" label="Password Lama" autocomplete="current-password" required />
          <PasswordInput id="pwdBaru" v-model="pwd.passwordBaru" label="Password Baru" placeholder="Minimal 6 karakter" autocomplete="new-password" required />
          <PasswordInput id="pwdKonfirmasi" v-model="pwd.konfirmasi" label="Konfirmasi Password Baru" autocomplete="new-password" required />
          <button class="btn-secondary" :disabled="loadingPwd">
            <span v-if="loadingPwd" class="w-4 h-4 border-2 border-dark-teal border-t-transparent rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[18px]" v-else>lock_reset</span>
            Ubah Password
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import PasswordInput from '../../components/PasswordInput.vue'
import api from '../../services/api'

const auth = useAuthStore()
const toast = useToastStore()

const profile = ref({ name: '', phone: '', email: '' })
const pwd = ref({ passwordLama: '', passwordBaru: '', konfirmasi: '' })
const loadingProfile = ref(false)
const loadingPwd = ref(false)

const roleLabel = computed(() => {
  const map = {
    admin: 'Admin / Operator',
    wali_kelas: 'Wali Kelas',
    kepala_sekolah: 'Kepala Sekolah',
    orang_tua: 'Orang Tua'
  }
  return map[auth.role] || ''
})

const initials = computed(() =>
  (auth.user?.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
)

onMounted(() => {
  profile.value = {
    name: auth.user?.name || '',
    phone: auth.user?.phone || '',
    email: auth.user?.email || ''
  }
})

async function saveProfile() {
  loadingProfile.value = true
  try {
    const { data } = await api.put('/auth/profile', profile.value)
    auth.user = data.user
    localStorage.setItem('user', JSON.stringify(data.user))
    toast.success('Profil berhasil disimpan.')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan profil.')
  } finally {
    loadingProfile.value = false
  }
}

async function savePassword() {
  loadingPwd.value = true
  try {
    await auth.changePassword(pwd.value)
    toast.success('Password berhasil diubah.')
    pwd.value = { passwordLama: '', passwordBaru: '', konfirmasi: '' }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengubah password.')
  } finally {
    loadingPwd.value = false
  }
}
</script>
