<template>
  <div class="min-h-screen bg-background dark:bg-deep-navy">
    <!-- Sidebar (desktop) -->
    <aside
      class="hidden lg:flex fixed inset-y-0 left-0 bg-deep-navy dark:bg-[#051238] flex-col z-40 transition-[width] duration-300 ease-in-out"
      :class="ui.collapsed ? 'w-sidebar-collapsed-width' : 'w-sidebar-width'"
    >
      <div class="h-16 flex items-center shrink-0 border-b border-white/10" :class="ui.collapsed ? 'justify-center' : 'gap-2.5 px-5'">
        <img src="/logo.svg" alt="SD Negeri 4 Keling" width="36" height="36" class="w-9 h-9 shrink-0 drop-shadow" />
        <div v-if="!ui.collapsed">
          <p class="font-headline-md text-white text-sm leading-tight">SD Negeri 4 Keling</p>
          <p class="text-[11px] text-ice-white/60">Monitoring Siswa</p>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4">
        <template v-for="group in menuGroups" :key="group.label || group.items[0].to">
          <p v-if="group.label && !ui.collapsed" class="px-3 pt-4 pb-2 font-label-sm uppercase tracking-wider text-ice-white/40 text-[11px]">
            {{ group.label }}
          </p>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-label-md transition-all"
            :class="[
              isActive(item)
                ? 'bg-gradient-to-r from-dark-teal to-light-teal text-white shadow-card'
                : 'text-ice-white/70 hover:bg-white/5 hover:text-white',
              ui.collapsed && 'justify-center px-0 mb-1'
            ]"
            @mouseenter="showTip($event, item)"
            @mouseleave="hideTip"
          >
            <span class="material-symbols-outlined text-[20px]">{{ item.icon }}</span>
            <span v-if="!ui.collapsed">{{ item.label }}</span>
          </router-link>
        </template>
      </nav>

      <div class="p-4 border-t border-white/10 space-y-1">
        <button
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-label-sm text-ice-white/70 hover:bg-white/5 hover:text-white transition-colors"
          :aria-label="ui.collapsed ? 'Perbesar menu' : 'Perkecil menu'"
          @click="toggleCollapse"
        >
          <span class="material-symbols-outlined text-[18px]">{{ ui.collapsed ? 'chevron_right' : 'chevron_left' }}</span>
          <span v-if="!ui.collapsed">Perkecil</span>
        </button>
        <button
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-label-sm text-ice-white/70 hover:bg-white/5 hover:text-white transition-colors"
          @click="logout"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span v-if="!ui.collapsed">Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Drawer (mobile) -->
    <transition name="fade">
      <div v-if="drawer" class="lg:hidden fixed inset-0 z-50 bg-deep-navy/50 backdrop-blur-sm" @click="drawer = false">
        <div class="absolute inset-y-0 left-0 w-72 bg-deep-navy dark:bg-[#051238] text-white flex flex-col shadow-lift-md" @click.stop>
          <div class="h-16 flex items-center justify-between px-5 border-b border-white/10">
            <div class="flex items-center gap-2.5">
              <img src="/logo.svg" alt="SD Negeri 4 Keling" width="32" height="32" class="w-8 h-8 shrink-0" />
              <p class="font-headline-md text-sm">SD Negeri 4 Keling</p>
            </div>
            <button class="p-2 rounded-lg hover:bg-white/10" @click="drawer = false" aria-label="Tutup menu">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
      <nav class="flex-1 overflow-y-auto hide-scrollbar px-3 py-4">
            <template v-for="group in menuGroups" :key="group.label || group.items[0].to">
              <p v-if="group.label" class="px-3 pt-4 pb-2 font-label-sm uppercase tracking-wider text-ice-white/40 text-[11px]">
                {{ group.label }}
              </p>
              <router-link
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-3 px-3 py-3 rounded-xl font-label-md transition-colors"
                :class="isActive(item)
                  ? 'bg-gradient-to-r from-dark-teal to-light-teal text-white'
                  : 'text-ice-white/70 hover:bg-white/5 hover:text-white'"
                @click="drawer = false"
              >
                <span class="material-symbols-outlined text-[20px]">{{ item.icon }}</span>
                {{ item.label }}
              </router-link>
            </template>
          </nav>
          <div class="p-4 border-t border-white/10">
            <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-label-sm text-ice-white/70 hover:bg-white/5 hover:text-white" @click="logout">
              <span class="material-symbols-outlined text-[18px]">logout</span>
              Keluar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Kolom utama -->
    <div class="transition-[padding] duration-300 ease-in-out" :class="ui.collapsed ? 'lg:pl-sidebar-collapsed-width' : 'lg:pl-sidebar-width'">
      <!-- Navbar -->
      <header
        class="fixed top-0 right-0 left-0 z-30 h-16 bg-white/85 dark:bg-[#0a1a4a]/85 backdrop-blur-md border-b border-surface-variant/70 dark:border-white/10 transition-[left] duration-300 ease-in-out"
        :class="ui.collapsed ? 'lg:left-sidebar-collapsed-width' : 'lg:left-sidebar-width'"
      >
        <div class="flex items-center justify-between h-full px-4 lg:px-8 gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <button class="lg:hidden p-2 -ml-2 rounded-lg text-deep-navy dark:text-ice-white hover:bg-surface-container-low dark:hover:bg-white/10" @click="drawer = true" aria-label="Buka menu">
              <span class="material-symbols-outlined">menu</span>
            </button>
            <div class="min-w-0">
              <p class="font-title-lg text-deep-navy dark:text-ice-white truncate leading-tight">{{ pageTitle }}</p>
              <p class="hidden sm:block text-[12px] text-on-surface-variant dark:text-ice-white/60 leading-tight">{{ pageSubtitle }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 lg:gap-2 shrink-0">
            <button
              class="p-2.5 rounded-full text-on-surface-variant dark:text-ice-white/80 hover:bg-surface-container-low dark:hover:bg-white/10 transition-colors"
              @click="toggleTheme"
              :aria-label="theme.dark ? 'Mode terang' : 'Mode gelap'"
            >
              <span class="material-symbols-outlined text-[22px]" data-fill="true">{{ theme.dark ? 'light_mode' : 'dark_mode' }}</span>
            </button>
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <!-- Konten -->
      <main class="pt-16">
        <div class="mx-auto w-full max-w-container-max px-4 py-6 lg:px-8">
          <transition name="page" mode="out-in">
            <router-view />
          </transition>
        </div>
      </main>
    </div>

    <!-- Tombol kembali ke atas -->
    <transition name="float">
      <button
        v-if="showScrollTop"
        class="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-gradient-to-br from-dark-teal to-light-teal text-white shadow-lift-md flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Kembali ke atas"
        @click="scrollTop"
      >
        <span class="material-symbols-outlined">keyboard_arrow_up</span>
      </button>
    </transition>

    <!-- Tooltip menu saat sidebar dikecilkan -->
    <transition name="fade">
      <div
        v-if="tip.show"
        class="fixed z-[70] pointer-events-none -translate-y-1/2 px-3 py-1.5 rounded-lg bg-deep-navy dark:bg-black/90 text-ice-white text-xs font-label-sm shadow-lift-md whitespace-nowrap border border-white/10"
        :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
      >
        {{ tip.text }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotifStore } from '../stores/notifikasi'
import { useThemeStore } from '../stores/theme'
import { useUiStore } from '../stores/ui'
import NotificationBell from '../components/NotificationBell.vue'
import UserMenu from '../components/UserMenu.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notif = useNotifStore()
const theme = useThemeStore()
const ui = useUiStore()
const drawer = ref(false)
const showScrollTop = ref(false)
const tip = ref({ show: false, text: '', x: 0, y: 0 })

function showTip(event, item) {
  if (!ui.collapsed) return
  const rect = event.currentTarget.getBoundingClientRect()
  tip.value = { show: true, text: item.label, x: rect.right + 12, y: rect.top + rect.height / 2 }
}

function hideTip() {
  tip.value.show = false
}

function toggleCollapse() {
  hideTip()
  ui.toggleSidebar()
}

function onScroll() {
  showScrollTop.value = window.scrollY > 300
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

watch(
  () => route.fullPath,
  () => {
    drawer.value = false
  }
)

const menuGroups = computed(() => {
  const profil = [{ to: '/profile', label: 'Profil & Kata Sandi', icon: 'person' }]
  const map = {
    admin: [
      { label: 'Menu Utama', items: [{ to: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true }] },
      {
        label: 'Data Master',
        items: [
          { to: '/admin/siswa', label: 'Data Siswa', icon: 'groups' },
          { to: '/admin/kelas', label: 'Kelas', icon: 'door_sliding' },
          { to: '/admin/mapel', label: 'Mata Pelajaran', icon: 'menu_book' },
          { to: '/admin/tahun-ajaran', label: 'Tahun Ajaran', icon: 'calendar_month' }
        ]
      },
      {
        label: 'Manajemen',
        items: [
          { to: '/admin/akun', label: 'Manajemen Akun', icon: 'manage_accounts' },
          { to: '/admin/spk', label: 'Konfigurasi SPK', icon: 'tune' },
          { to: '/admin/artikel', label: 'Artikel & Berita', icon: 'article' }
        ]
      },
      {
        label: 'Akses Operasional',
        items: [
          { to: '/admin/guru', label: 'Masuk sebagai Guru', icon: 'supervisor_account' },
          { to: '/guru/nilai/riwayat', label: 'Riwayat Nilai', icon: 'history' },
          { to: '/kepsek', label: 'Dashboard Kepala Sekolah', icon: 'school' }
        ]
      },
      { label: 'Akun', items: profil }
    ],
    wali_kelas: [
      {
        label: 'Menu Utama',
        items: [
          { to: '/guru', label: 'Dashboard', icon: 'dashboard', exact: true },
          { to: '/guru/siswa', label: 'Data Siswa', icon: 'groups' },
          { to: '/guru/monitoring', label: 'Monitoring Perkembangan', icon: 'monitoring' }
        ]
      },
      {
        label: 'Input Nilai',
        items: [
          { to: '/guru/nilai', label: 'Input Nilai', icon: 'edit_note', exact: true },
          { to: '/guru/nilai/riwayat', label: 'Riwayat Nilai', icon: 'history' },
          { to: '/guru/kehadiran', label: 'Input Kehadiran', icon: 'how_to_reg' },
          { to: '/guru/kehadiran/kalender', label: 'Kalender Kehadiran', icon: 'calendar_month' },
          { to: '/guru/sikap', label: 'Penilaian Sikap', icon: 'favorite' }
        ]
      },
      { label: 'Akun', items: profil }
    ],
    kepala_sekolah: [
      { label: 'Menu Utama', items: [{ to: '/kepsek', label: 'Dashboard', icon: 'dashboard', exact: true }] },
      {
        label: 'Rekap & Laporan',
        items: [
          { to: '/kepsek/rekap', label: 'Rekap per Kelas', icon: 'door_sliding' },
          { to: '/kepsek/laporan', label: 'Laporan & Riwayat', icon: 'summarize' }
        ]
      },
      { label: 'Akun', items: profil }
    ],
    orang_tua: [
      { label: 'Menu Utama', items: [{ to: '/orangtua', label: 'Perkembangan Anak', icon: 'dashboard', exact: true }] },
      {
        label: 'Pemantauan',
        items: [
          { to: '/orangtua/nilai', label: 'Nilai Akademik', icon: 'menu_book' },
          { to: '/orangtua/monitoring', label: 'Monitor Anak', icon: 'how_to_reg' },
          { to: '/orangtua/rekap', label: 'Rekap & Rapor', icon: 'assessment' }
        ]
      },
      { label: 'Akun', items: profil }
    ]
  }
  return map[auth.role] || [{ label: 'Akun', items: profil }]
})

function isActive(item) {
  const path = route.path
  if (item.exact) return path === item.to
  return path === item.to || path.startsWith(item.to + '/')
}

function toggleTheme() {
  theme.toggleTheme()
}

function logout() {
  notif.disconnect()
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.float-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.float-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.page-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-active {
  transition: opacity 0.15s ease;
}
.page-leave-to {
  opacity: 0;
}
</style>
