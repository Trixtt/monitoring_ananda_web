<template>
  <Menu as="div" class="relative">
    <MenuButton class="flex items-center gap-2.5 rounded-full p-1.5 pr-3 lg:pr-4 transition-colors hover:bg-surface-container-low dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-dark-teal">
      <span class="w-9 h-9 rounded-full bg-gradient-to-br from-dark-teal to-light-teal text-white flex items-center justify-center font-label-md shadow-card shrink-0">
        {{ initials }}
      </span>
      <span class="hidden md:block text-left leading-tight min-w-0">
        <span class="block font-label-sm text-on-surface dark:text-ice-white truncate max-w-[140px]">{{ auth.user?.name }}</span>
        <span class="block text-[11px] text-on-surface-variant dark:text-ice-white/60">{{ roleLabel }}</span>
      </span>
      <span class="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-ice-white/70">expand_more</span>
    </MenuButton>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <MenuItems
        class="absolute right-0 mt-2 w-60 origin-top-right rounded-xl bg-pure-white dark:bg-[#0d2357] border border-surface-variant dark:border-white/10 shadow-lift-md p-1.5 z-50 focus:outline-none"
      >
        <div class="px-3 py-2.5 mb-1 rounded-lg bg-surface-container-low dark:bg-white/5">
          <p class="font-label-md text-on-surface dark:text-ice-white truncate">{{ auth.user?.name }}</p>
          <p class="text-[12px] text-on-surface-variant dark:text-ice-white/60">{{ roleLabel }}</p>
        </div>

        <MenuItem v-slot="{ active }">
          <router-link
            to="/profile"
            :class="active ? 'bg-surface-container-low dark:bg-white/10' : ''"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-label-md text-on-surface dark:text-ice-white transition-colors"
          >
            <span class="material-symbols-outlined text-[20px] text-dark-teal">person</span>
            Profil & Kata Sandi
          </router-link>
        </MenuItem>

        <div class="h-px bg-surface-variant dark:bg-white/10 my-1.5" />

        <MenuItem v-slot="{ active }">
          <button
            @click="logout"
            :class="active ? 'bg-error-container/60 dark:bg-error/20' : ''"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-label-md text-error dark:text-red-300 transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">logout</span>
            Keluar
          </button>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useAuthStore } from '../stores/auth'
import { useNotifStore } from '../stores/notifikasi'

const router = useRouter()
const auth = useAuthStore()
const notif = useNotifStore()

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

function logout() {
  notif.disconnect()
  auth.logout()
  router.push('/')
}
</script>
