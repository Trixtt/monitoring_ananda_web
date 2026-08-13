<template>
  <AuthShell>
    <div class="mb-8 lg:hidden">
      <p class="font-headline-lg text-deep-navy dark:text-ice-white mb-1">Lupa Password</p>
      <p class="page-subtitle">Hubungi admin sekolah untuk reset password</p>
    </div>

    <div class="card p-6 md:p-8">
      <h1 class="font-headline-lg text-deep-navy dark:text-ice-white hidden lg:block">Lupa Password</h1>
      <p class="page-subtitle mb-6 hidden lg:block">Hubungi admin sekolah untuk mereset password Anda</p>

      <div class="rounded-xl bg-ice-white dark:bg-white/5 border border-light-teal/40 dark:border-white/10 p-4 mb-6 space-y-3">
        <p class="font-label-md text-deep-navy dark:text-ice-white flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-dark-teal" data-fill="true">key</span>
          Langkah pemulihan
        </p>
        <ol class="space-y-2 font-body-md text-on-surface-variant dark:text-ice-white/70 text-sm">
          <li class="flex gap-2"><span class="text-dark-teal dark:text-light-teal font-bold">1.</span> Hubungi wali kelas atau admin sekolah.</li>
          <li class="flex gap-2"><span class="text-dark-teal dark:text-light-teal font-bold">2.</span> Admin akan mereset password akun Anda.</li>
          <li class="flex gap-2"><span class="text-dark-teal dark:text-light-teal font-bold">3.</span> Login kembali dan buat password baru.</li>
        </ol>
        <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 pt-2 border-t border-surface-variant dark:border-white/10">
          Password awal orang tua adalah tanggal lahir anak tanpa tanda hubung (contoh: lahir 12 Januari 2010 = <code class="text-dark-teal dark:text-light-teal">20100112</code>). Wajib diganti saat pertama kali masuk.
        </p>
      </div>

      <router-link to="/login" class="btn-secondary w-full">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Halaman Masuk
      </router-link>
    </div>

    <div class="mt-5 flex items-center justify-center">
      <router-link to="/" class="font-label-sm text-on-surface-variant dark:text-ice-white/60 hover:text-dark-teal dark:hover:text-light-teal">Beranda</router-link>
    </div>
  </AuthShell>
</template>

<script setup>
import AuthShell from '../../components/AuthShell.vue'
</script>
