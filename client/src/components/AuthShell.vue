<template>
  <div class="min-h-screen lg:grid lg:grid-cols-2">
    <!-- Panel kiri: visual -->
    <div class="relative overflow-hidden bg-gradient-to-br from-deep-navy via-[#06306a] to-dark-teal text-white flex flex-col p-6 lg:p-12">
      <div class="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-light-teal/20 blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-light-teal/15 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>

      <router-link to="/" class="relative flex items-center gap-2.5 w-fit">
        <img src="/logo.svg" alt="SD Negeri 4 Keling" width="40" height="40" class="w-10 h-10 shrink-0 drop-shadow" />
        <span class="font-headline-md">SD Negeri 4 Keling</span>
      </router-link>

      <div class="relative flex-1 hidden lg:flex flex-col items-center justify-center py-10">
        <h1 class="font-display-hero text-[40px] leading-tight text-center max-w-md">
          Pantau Tumbuh <span class="text-light-teal">Kembang Anak</span>
        </h1>
        <p class="text-center text-ice-white/75 font-body-md mt-4 max-w-md">
          Nilai, kehadiran, dan sikap dalam satu tempat. Orang tua bisa memantau perkembangan putra-putri secara real-time.
        </p>

        <div class="relative w-full max-w-md mt-10 float-in" aria-hidden="true">
          <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto drop-shadow-2xl">
            <circle cx="410" cy="40" r="90" fill="white" fill-opacity="0.06" />
            <circle cx="40" cy="290" r="110" fill="white" fill-opacity="0.05" />

            <path d="M120 260 L140 300 L340 300 L360 260 Z" fill="white" fill-opacity="0.1" />
            <rect x="130" y="150" width="220" height="110" rx="16" fill="white" fill-opacity="0.14" stroke="white" stroke-opacity="0.25" />
            <rect x="150" y="180" width="60" height="60" rx="12" fill="white" fill-opacity="0.9" />
            <rect x="215" y="190" width="10" height="50" rx="5" fill="#37B7C3" />
            <rect x="230" y="175" width="10" height="65" rx="5" fill="#37B7C3" />
            <rect x="245" y="165" width="10" height="75" rx="5" fill="#76d4e7" />
            <rect x="150" y="248" width="200" height="4" rx="2" fill="white" fill-opacity="0.3" />

            <path d="M300 60 L328 88 L300 116 L272 88 Z" fill="#37B7C3" />
            <rect x="268" y="116" width="64" height="12" rx="6" fill="#76d4e7" />

            <path d="M86 210 L106 190 L126 210 L106 230 Z" fill="white" fill-opacity="0.2" />
            <rect x="180" y="80" width="120" height="70" rx="12" fill="white" fill-opacity="0.12" stroke="white" stroke-opacity="0.2" />
            <circle cx="212" cy="102" r="8" fill="#37B7C3" />
            <circle cx="240" cy="102" r="8" fill="#76d4e7" />
            <circle cx="268" cy="102" r="8" fill="#EBF4F6" />
            <rect x="204" y="118" width="72" height="8" rx="4" fill="white" fill-opacity="0.25" />
          </svg>

          <div class="absolute -left-6 top-2 flex items-center gap-2 rounded-xl bg-white/95 text-deep-navy px-3 py-2 shadow-lift-md">
            <span class="material-symbols-outlined text-[18px] text-status-aman" data-fill="true">check_circle</span>
            <span class="font-label-sm">Nilai 90</span>
          </div>
          <div class="absolute -right-4 top-16 flex items-center gap-2 rounded-xl bg-white/95 text-deep-navy px-3 py-2 shadow-lift-md">
            <span class="material-symbols-outlined text-[18px] text-dark-teal" data-fill="true">how_to_reg</span>
            <span class="font-label-sm">Kehadiran 98%</span>
          </div>
          <div class="absolute -left-8 bottom-4 flex items-center gap-2 rounded-xl bg-white/95 text-deep-navy px-3 py-2 shadow-lift-md">
            <span class="material-symbols-outlined text-[18px] text-status-abk" data-fill="true">favorite</span>
            <span class="font-label-sm">Sikap Sangat Baik</span>
          </div>
        </div>
      </div>

      <p class="relative hidden lg:flex items-center gap-2 font-label-sm text-ice-white/60">
        <span class="material-symbols-outlined text-[18px]">verified_user</span>
        Sistem Monitoring Perkembangan Siswa &middot; SD Negeri 4 Keling
      </p>

      <p class="relative lg:hidden mt-8 font-body-lg font-semibold leading-snug">
        Pantau tumbuh kembang putra-putri Anda — nilai, kehadiran, dan sikap dalam satu tempat.
      </p>
    </div>

    <!-- Panel kanan: form -->
    <div class="flex items-center justify-center px-4 py-10 lg:px-12 bg-background dark:bg-deep-navy relative overflow-hidden">
      <div class="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none" style="background-image: radial-gradient(circle at 85% 15%, rgba(55,183,195,0.25) 0, transparent 40%), radial-gradient(circle at 10% 90%, rgba(7,25,82,0.12) 0, transparent 45%)"></div>
      <div class="relative w-full max-w-md">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.float-in {
  animation: floatIn 0.8s ease-out both;
}
@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
