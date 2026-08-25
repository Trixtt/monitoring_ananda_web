<template>
  <div class="relative min-h-screen bg-background dark:bg-deep-navy flex flex-col items-center justify-center px-4 overflow-hidden">
    <!-- Dekorasi blob -->
    <div class="nf-blob bg-light-teal/40 w-[420px] h-[420px] -top-24 -left-24"></div>
    <div class="nf-blob nf-blob-slow bg-dark-teal/30 w-[360px] h-[360px] bottom-0 right-0"></div>
    <div class="nf-blob nf-blob-slower bg-deep-navy/20 dark:bg-primary-fixed/10 w-[280px] h-[280px] top-1/3 right-1/4"></div>

    <!-- Ikon mengambang -->
    <span class="material-symbols-outlined nf-icon nf-icon-1 !text-[64px]" data-fill>travel_explore</span>
    <span class="material-symbols-outlined nf-icon nf-icon-2 !text-[48px]" data-fill>school</span>
    <span class="material-symbols-outlined nf-icon nf-icon-3 !text-[42px]" data-fill>menu_book</span>
    <span class="material-symbols-outlined nf-icon nf-icon-4 !text-[36px]" data-fill>quiz</span>

    <!-- Konten -->
    <div class="relative z-10 flex flex-col items-center text-center animate-fade-up">
      <div class="flex items-start select-none" aria-hidden="true">
        <span class="nf-digit">4</span>
        <span class="nf-digit nf-delay-1 relative mx-1">
          0
          <span class="material-symbols-outlined nf-orbit" data-fill>explore_off</span>
        </span>
        <span class="nf-digit nf-delay-2">4</span>
      </div>

      <h1 class="mt-4 font-headline-lg text-deep-navy dark:text-ice-white">Oops! Halaman tidak ditemukan</h1>
      <p class="mt-2 max-w-md font-body-md text-on-surface-variant dark:text-ice-white/60">
        Sepertinya halaman yang Anda cari sudah dipindahkan atau tidak pernah ada. Jangan khawatir, mari kembali ke jalur yang benar.
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <router-link to="/" class="btn-primary">
          <span class="material-symbols-outlined text-[18px]">home</span>
          Kembali ke Beranda
        </router-link>
        <router-link v-if="auth.isAuthenticated" :to="auth.homePath" class="btn-secondary">
          <span class="material-symbols-outlined text-[18px]">dashboard</span>
          Ke Dashboard
        </router-link>
        <router-link v-else to="/login" class="btn-secondary">
          <span class="material-symbols-outlined text-[18px]">login</span>
          Masuk
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<style scoped>
.nf-digit {
  font-size: clamp(5rem, 18vw, 9.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #088395 0%, #37b7c3 55%, #071952 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: nf-float 3.6s ease-in-out infinite;
}

.nf-delay-1 {
  animation-delay: 0.25s;
}
.nf-delay-2 {
  animation-delay: 0.5s;
}

.nf-orbit {
  position: absolute;
  top: -18px;
  right: -34px;
  font-size: 44px;
  color: #ba1a1a;
  opacity: 0.85;
  animation: nf-wobble 4s ease-in-out infinite;
}

.nf-icon {
  position: absolute;
  z-index: 0;
  color: #088395;
  opacity: 0.32;
  animation: nf-drift 7s ease-in-out infinite;
}

.dark .nf-icon {
  color: #76d4e7;
  opacity: 0.28;
}

.nf-icon-1 {
  top: 16%;
  left: 12%;
  animation-duration: 6s;
}
.nf-icon-2 {
  bottom: 20%;
  right: 14%;
  animation-duration: 8s;
  animation-delay: 0.8s;
}
.nf-icon-3 {
  top: 24%;
  right: 22%;
  animation-duration: 7s;
  animation-delay: 1.6s;
}
.nf-icon-4 {
  bottom: 26%;
  left: 18%;
  animation-duration: 9s;
  animation-delay: 2.2s;
}

.nf-blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  animation: nf-pulse 8s ease-in-out infinite;
}

.nf-blob-slow {
  animation-duration: 11s;
  animation-delay: 1s;
}
.nf-blob-slower {
  animation-duration: 13s;
  animation-delay: 2s;
}

@keyframes nf-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16px);
  }
}

@keyframes nf-wobble {
  0%,
  100% {
    transform: rotate(-8deg) translateY(0);
  }
  50% {
    transform: rotate(10deg) translateY(-8px);
  }
}

@keyframes nf-drift {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(14px, -18px) rotate(4deg);
  }
  66% {
    transform: translate(-10px, 12px) rotate(-5deg);
  }
}

@keyframes nf-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nf-digit,
  .nf-orbit,
  .nf-icon,
  .nf-blob {
    animation: none;
  }
}
</style>
