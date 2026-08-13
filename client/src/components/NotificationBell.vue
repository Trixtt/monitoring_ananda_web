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
      <PopoverPanel class="absolute right-0 mt-2 w-[320px] sm:w-[380px] origin-top-right z-50">
        <div class="card p-0 overflow-hidden shadow-lift-md">
          <div class="flex items-center justify-between px-4 py-3 border-b border-surface-variant dark:border-white/10 bg-surface-container-low/50 dark:bg-white/5">
            <p class="font-title-lg text-deep-navy dark:text-ice-white text-[16px]">Notifikasi</p>
            <button
              v-if="notif.unread > 0"
              class="font-label-sm text-dark-teal dark:text-light-teal hover:underline"
              @click="notif.bacaSemua()"
            >
              Tandai semua dibaca
            </button>
          </div>

          <div class="max-h-[380px] overflow-y-auto hide-scrollbar">
            <div v-if="!notif.list.length" class="text-center py-12 text-on-surface-variant dark:text-ice-white/60">
              <span class="material-symbols-outlined text-5xl text-outline-variant dark:text-white/20 block mb-2">notifications_none</span>
              <p>Belum ada notifikasi</p>
            </div>

            <ul v-else class="p-2 space-y-1">
              <li
                v-for="n in notif.list"
                :key="n.id"
                class="rounded-xl p-3 cursor-pointer transition-colors"
                :class="n.isRead ? 'hover:bg-surface-container-low dark:hover:bg-white/5' : 'bg-ice-white dark:bg-white/10 hover:bg-surface-container-low dark:hover:bg-white/15'"
                @click="notif.baca(n.id)"
              >
                <div class="flex items-start gap-3">
                  <span class="w-8 h-8 rounded-lg bg-dark-teal/10 dark:bg-light-teal/15 text-dark-teal dark:text-light-teal flex items-center justify-center shrink-0">
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
import { onMounted } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { useNotifStore } from '../stores/notifikasi'

const notif = useNotifStore()

function iconTipe(tipe) {
  return { nilai: 'grade', kehadiran: 'how_to_reg', sikap: 'favorite', sistem: 'info' }[tipe] || 'notifications'
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

onMounted(() => {
  notif.fetch()
})
</script>
