<template>
  <Popover class="relative">
    <PopoverButton
      class="relative p-2.5 rounded-full text-on-surface-variant dark:text-ice-white/80 hover:bg-surface-container-low dark:hover:bg-white/10 transition-colors focus:outline-none"
      aria-label="Notifikasi"
    >
      <span class="material-symbols-outlined text-[22px]">notifications</span>
      <span
        v-if="notif.unread > 0"
        class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-status-berisiko to-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-card"
      >
        {{ notif.unread > 9 ? '9+' : notif.unread }}
      </span>
    </PopoverButton>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <PopoverPanel v-slot="{ close }" class="absolute right-0 mt-2 w-[320px] sm:w-[380px] origin-top-right z-50">
        <div class="card p-0 overflow-hidden shadow-lift-md">
          <div class="px-4 pt-3 pb-2 border-b border-surface-variant dark:border-white/10 bg-surface-container-low/50 dark:bg-white/5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <p class="font-title-lg text-deep-navy dark:text-ice-white text-[16px]">Notifikasi</p>
                <span v-if="notif.connected" class="inline-flex items-center gap-1 font-label-sm text-status-aman">
                  <span class="w-1.5 h-1.5 rounded-full bg-status-aman animate-pulse"></span>
                  Live
                </span>
              </div>
              <button
                v-if="notif.unread > 0"
                class="font-label-sm text-dark-teal dark:text-light-teal hover:underline"
                @click="notif.bacaSemua()"
              >
                Tandai semua
              </button>
            </div>

            <div class="flex gap-1 mt-2">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                class="px-2.5 py-1 rounded-lg font-label-sm transition-colors"
                :class="activeTab === tab.key ? 'bg-dark-teal text-white dark:bg-light-teal dark:text-deep-navy' : 'text-on-surface-variant hover:bg-surface-container-low dark:text-ice-white/60 dark:hover:bg-white/10'"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
                <span v-if="tab.key === 'belum' && notif.unread">({{ notif.unread }})</span>
              </button>
            </div>
          </div>

          <div class="max-h-[380px] overflow-y-auto hide-scrollbar">
            <div v-if="!daftar.length" class="text-center py-12 text-on-surface-variant dark:text-ice-white/60">
              <span class="material-symbols-outlined text-5xl text-outline-variant dark:text-white/20 block mb-2">
                {{ activeTab === 'belum' ? 'mark_email_read' : 'notifications_none' }}
              </span>
              <p>{{ activeTab === 'belum' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi' }}</p>
            </div>

            <ul v-else class="p-2 space-y-1">
              <li
                v-for="n in daftar"
                :key="n.id"
                class="rounded-xl p-3 cursor-pointer transition-colors"
                :class="n.isRead ? 'hover:bg-surface-container-low dark:hover:bg-white/5' : 'bg-ice-white dark:bg-white/10 hover:bg-surface-container-low dark:hover:bg-white/15'"
                @click="buka(n, close)"
              >
                <div class="flex items-start gap-3">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="tipeClass(n.tipe)">
                    <span class="material-symbols-outlined text-[18px]">{{ iconTipe(n.tipe) }}</span>
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="font-label-md text-deep-navy dark:text-ice-white">{{ n.judul }}</p>
                    <p class="font-body-md text-on-surface-variant dark:text-ice-white/70 text-sm">{{ n.pesan }}</p>
                    <p class="font-label-sm text-outline dark:text-ice-white/40 mt-0.5">{{ waktu(n.createdAt) }}</p>
                  </div>
                  <span v-if="!n.isRead" class="w-2 h-2 rounded-full bg-light-teal shrink-0 mt-2"></span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { useNotifStore } from '../stores/notifikasi'

const notif = useNotifStore()
const router = useRouter()
const activeTab = ref('semua')

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'belum', label: 'Belum dibaca' }
]

const daftar = computed(() =>
  activeTab.value === 'belum' ? notif.list.filter((item) => !item.isRead) : notif.list
)

function iconTipe(tipe) {
  return { nilai: 'grade', kehadiran: 'how_to_reg', sikap: 'favorite', sistem: 'info' }[tipe] || 'notifications'
}

function tipeClass(tipe) {
  return {
    nilai: 'bg-status-aman/10 text-status-aman dark:bg-status-aman/15',
    kehadiran: 'bg-status-perhatian/15 text-yellow-700 dark:text-status-perhatian',
    sikap: 'bg-status-abk/10 text-status-abk dark:bg-status-abk/15',
    sistem: 'bg-dark-teal/10 text-dark-teal dark:bg-light-teal/15 dark:text-light-teal'
  }[tipe] || 'bg-dark-teal/10 text-dark-teal dark:bg-light-teal/15 dark:text-light-teal'
}

function waktu(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const selisih = Date.now() - d.getTime()
  const menit = Math.floor(selisih / 60000)
  if (menit < 1) return 'Baru saja'
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function buka(item, close) {
  notif.baca(item.id)
  if (item.link) {
    try {
      const target = new URL(item.link, window.location.origin)
      router.push(`${target.pathname}${target.search}${target.hash}`)
    } catch {
      // abaikan link tidak valid
    }
  }
  close()
}

onMounted(() => {
  notif.fetch()
})
</script>
