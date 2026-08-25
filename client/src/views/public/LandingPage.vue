<template>
  <div ref="scrollRoot" class="h-svh overflow-y-auto scrollbar-thin snap-y snap-proximity bg-background dark:bg-deep-navy overscroll-contain">
    <!-- Navbar -->
    <header class="sticky top-0 z-40 bg-deep-navy/90 backdrop-blur-md border-b border-white/10">
      <div class="container-site flex items-center justify-between h-16 relative">
        <button class="flex items-center gap-2.5" @click="scrollTo('beranda')" aria-label="Beranda">
              <img src="/logo.svg" alt="SD Negeri 4 Keling" width="36" height="36" class="w-9 h-9 shrink-0 drop-shadow" />
          <span class="font-headline-md text-sm text-white">SD Negeri 4 Keling</span>
        </button>

        <nav class="hidden md:flex items-center gap-1">
          <button
            v-for="item in navLinks"
            :key="item.id"
            @click="scrollTo(item.id)"
            class="px-3 py-2 rounded-lg font-label-md transition-colors"
            :class="active === item.id ? 'text-white bg-white/10' : 'text-ice-white/75 hover:text-white hover:bg-white/5'"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="flex items-center gap-1.5">
          <button
            class="p-2.5 rounded-full text-ice-white/80 hover:text-white hover:bg-white/10 transition-colors"
            @click="theme.toggleTheme()"
            :aria-label="theme.dark ? 'Mode terang' : 'Mode gelap'"
          >
            <span class="material-symbols-outlined text-[22px]" data-fill="true">{{ theme.dark ? 'light_mode' : 'dark_mode' }}</span>
          </button>

          <router-link v-if="!auth.isAuthenticated" to="/login" class="btn-primary !px-3.5">
            <span class="material-symbols-outlined text-[18px]">login</span>
            <span class="hidden sm:inline">Masuk</span>
          </router-link>
          <router-link v-else :to="auth.homePath" class="btn-primary !px-3.5">
            <span class="material-symbols-outlined text-[18px]">dashboard</span>
            <span class="hidden sm:inline">Dashboard</span>
          </router-link>

          <button class="md:hidden p-2 rounded-lg text-ice-white/80 hover:bg-white/10" @click="mobileOpen = !mobileOpen" :aria-label="mobileOpen ? 'Tutup menu' : 'Buka menu'">
            <span class="material-symbols-outlined text-[22px]">{{ mobileOpen ? 'close' : 'menu' }}</span>
          </button>
        </div>

        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-light-teal to-dark-teal origin-left transition-transform duration-150 ease-out"
          :style="{ transform: 'scaleX(' + scrollProgress + ')' }"
        ></div>
      </div>

      <transition name="drop">
        <nav v-if="mobileOpen" class="md:hidden border-t border-white/10 bg-deep-navy px-4 py-3 space-y-1">
          <button
            v-for="item in navLinks"
            :key="item.id"
            @click="scrollTo(item.id)"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-label-md transition-colors"
            :class="active === item.id ? 'text-white bg-white/10' : 'text-ice-white/75 hover:text-white hover:bg-white/5'"
          >
            {{ item.label }}
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </nav>
      </transition>
    </header>

    <!-- Hero / Beranda -->
    <section id="beranda" @mousemove="onHeroMove" class="snap-start scroll-mt-16 min-h-[calc(100svh-4rem)] flex items-center relative overflow-hidden bg-gradient-to-br from-deep-navy via-[#06306a] to-dark-teal text-white">
      <div class="blob-parallax absolute -top-24 -left-24 w-96 h-96 rounded-full bg-light-teal/20 blur-3xl pointer-events-none" data-speed="0.25" data-cursor="1"></div>
      <div class="blob-parallax absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-light-teal/15 blur-3xl pointer-events-none" data-speed="0.4" data-cursor="1"></div>
      <div class="blob-parallax absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" data-speed="0.55" data-cursor="1"></div>
      <div class="absolute inset-0 pointer-events-none opacity-[0.07]" style="background-image: linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 48px 48px;"></div>

      <div class="container-site relative py-20 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div class="animate-fade-up">
          <h1 class="font-headline-lg text-[34px] sm:text-[42px] lg:text-[52px] leading-[1.1] mb-6">
            Pantau Perkembangan
            <span class="text-gradient typewriter-text" :style="{ minWidth: typeMinWidth }">{{ typed }}<span class="type-cursor">|</span></span>
            Ananda dalam Satu Genggaman
          </h1>
          <p class="font-body-lg text-ice-white/80 mb-9 max-w-lg">
            Sistem informasi monitoring perkembangan siswa berbasis sistem pendukung keputusan. Guru, wali kelas, dan orang tua dapat memantau nilai akademik, kehadiran, dan sikap siswa secara transparan.
          </p>
          <div class="flex flex-wrap gap-3">
            <button v-magnet @click="scrollTo('fitur')" class="btn bg-gradient-to-r from-dark-teal to-light-teal text-white hover:brightness-110 shadow-card">
              <span class="material-symbols-outlined text-[18px]">school</span>
              Kenali Sistemnya
            </button>
            <router-link v-magnet to="/login" class="btn bg-white/10 border border-white/15 text-white hover:bg-white/20 backdrop-blur-sm">
              <span class="material-symbols-outlined text-[18px]">login</span>
              Pantau Perkembangan
            </router-link>
          </div>
        </div>

        <div class="hidden md:block animate-fade-up" style="animation-delay: 150ms">
          <div class="relative">
            <div
              ref="tiltCard"
              class="tilt-card bg-white/5 backdrop-blur-md rounded-2xl border border-white/15 p-6 shadow-lift-md"
              @mousemove="onTilt"
              @mouseleave="resetTilt"
            >
              <div class="flex items-center justify-between mb-5">
                <p class="font-label-md text-ice-white/70">Indikator Perkembangan</p>
                <span class="badge bg-status-aman/20 text-status-aman border border-status-aman/30">Contoh</span>
              </div>
              <div v-for="(b, i) in bars" :key="b.label" class="space-y-1.5 mb-4 last:mb-0">
                <div class="flex justify-between text-sm">
                  <span class="text-ice-white/80">{{ b.label }}</span>
                  <span class="font-label-md" :class="b.color">{{ b.value }}</span>
                </div>
                <div class="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full grow-bar" :class="b.bar" :style="{ width: b.percent, animationDelay: (0.15 * (i + 1)) + 's' }"></div>
                </div>
              </div>
              <div class="flex items-center justify-between pt-4 mt-5 border-t border-white/10">
                <div class="flex items-center gap-2 text-[11px] text-ice-white/60">
                  <span class="material-symbols-outlined text-[18px]">fact_check</span>
                  Skor &amp; klasifikasi otomatis
                </div>
                <span class="font-label-sm text-ice-white/70">Skor SAW &middot; {{ skorText }}</span>
              </div>
            </div>

            <div class="absolute -right-4 -top-5 flex items-center gap-2 rounded-xl bg-white/95 text-deep-navy px-3 py-2 shadow-lift-md float">
              <span class="material-symbols-outlined text-[18px] text-status-aman" data-fill="true">notifications_active</span>
              <span class="font-label-sm">Nilai terkirim</span>
            </div>
            <div class="absolute -left-6 -bottom-5 flex items-center gap-2 rounded-xl bg-white/95 text-deep-navy px-3 py-2 shadow-lift-md float" style="animation-delay: 1.2s">
              <span class="material-symbols-outlined text-[18px] text-dark-teal" data-fill="true">trending_up</span>
              <span class="font-label-sm">Kehadiran 96%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Statistik -->
    <section class="py-14 md:py-16 bg-background dark:bg-deep-navy">
      <div class="container-site">
        <div ref="statsBand" class="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div v-for="(s, i) in stats" :key="s.label" class="stat-item card card-hover p-6 text-center" :style="{ transitionDelay: i * 80 + 'ms' }">
            <span class="material-symbols-outlined text-[28px] text-dark-teal dark:text-light-teal mb-2 block">{{ s.icon }}</span>
            <p class="font-headline-lg text-deep-navy dark:text-ice-white leading-none">
              {{ statsNums[i] }}<span class="text-dark-teal dark:text-light-teal">{{ s.suffix }}</span>
            </p>
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1.5">{{ s.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tentang (Profil Sekolah) -->
    <section id="tentang" class="snap-start scroll-mt-16 min-h-[calc(100svh-4rem)] flex items-center py-20 bg-pure-white dark:bg-[#0a1a4a] relative overflow-hidden">
      <div class="blob-parallax absolute -top-20 -right-24 w-96 h-96 rounded-full bg-light-teal/10 blur-3xl pointer-events-none" data-speed="0.3"></div>
      <div class="blob-parallax absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-dark-teal/10 blur-3xl pointer-events-none" data-speed="0.45"></div>
      <div class="container-site relative">
        <div class="reveal text-center mb-12">
          <p class="font-label-md text-dark-teal dark:text-light-teal mb-2">TENTANG</p>
          <h2 class="font-headline-lg text-deep-navy dark:text-ice-white">Profil Sekolah</h2>
        </div>

        <div class="grid lg:grid-cols-2 gap-6 items-start">
          <div class="card p-6 md:p-8 reveal">
            <div class="flex items-center gap-3 mb-5">
              <img src="/logo.svg" alt="Logo SD Negeri 4 Keling" width="48" height="48" class="w-12 h-12 shrink-0 drop-shadow" />
              <div>
                <h3 class="font-title-lg text-deep-navy dark:text-ice-white leading-tight">SD Negeri 4 Keling</h3>
                <p class="font-label-sm text-on-surface-variant dark:text-ice-white/50">Kec. Keling, Kab. Jepara, Jawa Tengah</p>
              </div>
            </div>
            <p class="font-body-md text-on-surface-variant dark:text-ice-white/70 mb-6">{{ profil.deskripsi }}</p>
            <div class="grid sm:grid-cols-2 gap-3">
              <div v-for="info in profil.info" :key="info.label" class="flex items-start gap-2.5 rounded-xl bg-surface-container-low dark:bg-white/5 px-3.5 py-3">
                <span class="material-symbols-outlined text-[20px] text-dark-teal dark:text-light-teal">{{ info.icon }}</span>
                <div class="min-w-0">
                  <p class="text-[11px] text-on-surface-variant dark:text-ice-white/50">{{ info.label }}</p>
                  <p class="font-label-md text-deep-navy dark:text-ice-white leading-tight mt-0.5">{{ info.value }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-6 md:p-8 reveal" style="transition-delay: 100ms">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-[22px] text-dark-teal dark:text-light-teal" data-fill="true">flag</span>
              <h3 class="font-title-lg text-deep-navy dark:text-ice-white">Visi Sekolah</h3>
            </div>
            <p class="font-body-md text-on-surface-variant dark:text-ice-white/70 italic border-l-4 border-light-teal pl-4 mb-8">{{ profil.visi }}</p>

            <div class="flex items-center gap-2 mb-4">
              <span class="material-symbols-outlined text-[22px] text-dark-teal dark:text-light-teal" data-fill="true">checklist</span>
              <h3 class="font-title-lg text-deep-navy dark:text-ice-white">Misi Sekolah</h3>
            </div>
            <ul class="space-y-2.5">
              <li v-for="m in profil.misi" :key="m" class="flex items-start gap-2.5 font-body-md text-on-surface-variant dark:text-ice-white/70">
                <span class="material-symbols-outlined text-[18px] text-dark-teal dark:text-light-teal mt-0.5">check_circle</span>
                {{ m }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Fitur -->
    <section id="fitur" class="snap-start scroll-mt-16 min-h-[calc(100svh-4rem)] flex items-center py-20 relative overflow-hidden">
      <div class="blob-parallax absolute top-10 -left-24 w-80 h-80 rounded-full bg-light-teal/10 blur-3xl pointer-events-none" data-speed="0.3"></div>
      <div class="blob-parallax absolute bottom-10 -right-24 w-96 h-96 rounded-full bg-dark-teal/10 blur-3xl pointer-events-none" data-speed="0.5"></div>
      <div class="container-site relative">
        <div class="reveal text-center mb-12">
          <p class="font-label-md text-dark-teal dark:text-light-teal mb-2">FITUR</p>
          <h2 class="font-headline-lg text-deep-navy dark:text-ice-white">Sistem Monitoring Perkembangan Siswa</h2>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mt-3 max-w-2xl mx-auto">
            Pantau nilai akademik, kehadiran, dan sikap siswa secara transparan berbasis sistem pendukung keputusan metode SAW.
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          <div class="reveal">
            <p class="font-body-lg text-on-surface-variant dark:text-ice-white/70 mb-6">
              Sistem ini membantu sekolah menerapkan deteksi dini terhadap kesulitan belajar melalui metode SAW. Setiap siswa diklasifikasikan ke dalam kondisi Baik/Aman, Perlu Perhatian, atau Berisiko berdasarkan tiga aspek utama berikut, dengan penanganan khusus untuk siswa berkebutuhan khusus.
            </p>
            <div class="grid sm:grid-cols-3 gap-3">
              <div v-for="a in aspek" :key="a.label" class="flex items-center gap-2 rounded-xl bg-ice-white dark:bg-white/5 border border-light-teal/30 dark:border-white/10 px-3 py-2.5">
                <span class="material-symbols-outlined text-[20px] text-dark-teal dark:text-light-teal">{{ a.icon }}</span>
                <span class="font-label-md text-deep-navy dark:text-ice-white">{{ a.label }}</span>
              </div>
            </div>
          </div>

          <div class="reveal" style="transition-delay: 100ms">
            <div class="relative">
              <div
                class="bg-white dark:bg-[#0d2357] rounded-2xl border border-surface-variant dark:border-white/10 shadow-lift-md p-6"
                @mouseenter="pauseAlur"
                @mouseleave="resumeAlur"
              >
                <div class="flex items-center gap-2 mb-5">
                  <span class="material-symbols-outlined text-[20px] text-dark-teal dark:text-light-teal" data-fill="true">functions</span>
                  <p class="font-label-md text-deep-navy dark:text-ice-white">Alur penilaian</p>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-4">
                  <button
                    v-for="(st, i) in alur"
                    :key="st.label"
                    class="flex items-center gap-2 px-3 py-2.5 rounded-xl font-label-sm transition-all active:scale-[0.98]"
                    :class="alurIdx === i
                      ? 'bg-gradient-to-r from-dark-teal to-light-teal text-white shadow-card'
                      : 'bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-ice-white/70 hover:bg-surface-variant dark:hover:bg-white/10'"
                    @click="setAlur(i)"
                  >
                    <span class="material-symbols-outlined text-[18px]">{{ st.icon }}</span>
                    <span class="truncate">{{ st.label }}</span>
                  </button>
                </div>

                <div class="relative h-1 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden mb-4">
                  <div
                    :key="alurIdx"
                    class="alur-progress absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-dark-teal to-light-teal"
                    :style="{ animationPlayState: alurPaused ? 'paused' : 'running' }"
                  ></div>
                </div>

                <transition name="swap" mode="out-in">
                  <div :key="alurIdx" class="rounded-xl bg-surface-container-low dark:bg-white/5 p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="w-9 h-9 rounded-lg bg-gradient-to-br from-dark-teal to-light-teal text-white flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[18px]">{{ alur[alurIdx].icon }}</span>
                      </span>
                      <div>
                        <p class="font-label-md text-deep-navy dark:text-ice-white">{{ alur[alurIdx].label }}</p>
                        <p class="text-[11px] text-on-surface-variant dark:text-ice-white/50">{{ alur[alurIdx].step }} dari 4</p>
                      </div>
                    </div>
                    <p class="font-body-md text-on-surface-variant dark:text-ice-white/70 text-sm">{{ alur[alurIdx].desc }}</p>
                    <div v-if="alur[alurIdx].preview.length" class="flex flex-wrap gap-1.5 mt-3">
                      <span v-for="p in alur[alurIdx].preview" :key="p.label" class="badge border" :class="p.cls">{{ p.label }}</span>
                    </div>
                  </div>
                </transition>
              </div>
              <div class="absolute -right-3 -bottom-4 hidden md:flex items-center gap-2 rounded-xl bg-white/95 dark:bg-[#0d2357] text-deep-navy dark:text-ice-white px-3 py-2 shadow-lift-md border border-surface-variant dark:border-white/10 float">
                <span class="material-symbols-outlined text-[18px] text-dark-teal" data-fill="true">verified</span>
                <span class="font-label-sm">Hasil langsung terlihat</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-6 mb-12">
          <div v-for="(f, i) in fitur" :key="f.title" class="card card-hover p-6 reveal" :style="{ transitionDelay: i * 90 + 'ms' }">
            <span class="w-11 h-11 rounded-xl bg-gradient-to-br from-dark-teal to-light-teal text-white flex items-center justify-center mb-4 shadow-card">
              <span class="material-symbols-outlined">{{ f.icon }}</span>
            </span>
            <h3 class="font-title-lg text-deep-navy dark:text-ice-white mb-2">{{ f.title }}</h3>
            <p class="font-body-md text-on-surface-variant dark:text-ice-white/60">{{ f.desc }}</p>
          </div>
        </div>

        <div class="reveal">
          <div class="card p-5 md:p-6">
            <p class="font-label-md text-deep-navy dark:text-ice-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px] text-dark-teal dark:text-light-teal">grade</span>
              Empat kondisi hasil penilaian
            </p>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div v-for="s in status" :key="s.label" class="flex items-start gap-2.5 rounded-xl border px-3.5 py-3" :class="s.cls">
                <span class="w-2.5 h-2.5 rounded-full mt-1 shrink-0" :class="s.dot"></span>
                <div class="min-w-0">
                  <p class="font-label-md text-deep-navy dark:text-ice-white leading-tight">{{ s.label }}</p>
                  <p class="text-[11px] leading-tight text-on-surface-variant dark:text-ice-white/50 mt-0.5">{{ s.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Berita -->
    <section id="berita" class="snap-start scroll-mt-16 min-h-[calc(100svh-4rem)] flex items-center py-20 bg-pure-white dark:bg-[#0a1a4a] relative overflow-hidden">
      <div class="blob-parallax absolute -top-24 right-10 w-80 h-80 rounded-full bg-light-teal/10 blur-3xl pointer-events-none" data-speed="0.35"></div>
      <div class="blob-parallax absolute -bottom-24 -left-10 w-80 h-80 rounded-full bg-dark-teal/10 blur-3xl pointer-events-none" data-speed="0.5"></div>
      <div class="container-site relative">
        <div class="reveal flex items-end justify-between mb-8 gap-4">
          <div>
            <p class="font-label-md text-dark-teal dark:text-light-teal mb-2">BERITA</p>
            <h2 class="font-headline-lg text-deep-navy dark:text-ice-white">Kabar Sekolah</h2>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="artikels.length" class="btn-secondary !px-2.5" aria-label="Geser ke kiri" @click="scrollNews(-1)">
              <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button v-if="artikels.length" class="btn-secondary !px-2.5" aria-label="Geser ke kanan" @click="scrollNews(1)">
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <router-link to="/artikel" class="btn-secondary shrink-0">
              Lihat Semua
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </router-link>
          </div>
        </div>

        <div v-if="loading" class="flex gap-6 overflow-hidden">
          <div v-for="i in 3" :key="i" class="card h-72 w-[min(320px,82vw)] shrink-0 animate-pulse bg-surface-container-low dark:bg-white/5"></div>
        </div>

        <div v-else-if="artikels.length" ref="newsScroller" class="flex gap-6 overflow-x-auto snap-x snap-proximity pb-4 hide-scrollbar -mx-4 px-4">
          <router-link
            v-for="(a, i) in artikels"
            :key="a.id"
            :to="`/artikel/${a.id}`"
            class="card card-hover overflow-hidden group w-[min(320px,82vw)] shrink-0 snap-start reveal"
            :style="{ transitionDelay: i * 60 + 'ms' }"
          >
            <div class="h-40 overflow-hidden bg-gradient-to-br from-light-teal/25 via-ice-white to-dark-teal/15 dark:from-light-teal/10 dark:via-white/5 dark:to-dark-teal/15" :class="!a.gambar && 'flex items-center justify-center'">
              <img
                v-if="a.gambar" :src="a.gambar" :alt="a.judul" width="400" height="240" loading="lazy" decoding="async"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span v-else class="material-symbols-outlined text-6xl text-dark-teal/40 dark:text-light-teal/30">newspaper</span>
            </div>
            <div class="p-5">
              <div class="flex items-center gap-2 mb-2">
                <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ a.kategori }}</span>
                <span class="font-label-sm text-outline dark:text-ice-white/40">{{ tgl(a.publishedAt) }}</span>
              </div>
              <h3 class="font-title-lg text-deep-navy dark:text-ice-white line-clamp-2 mb-2 group-hover:text-dark-teal dark:group-hover:text-light-teal transition-colors">{{ a.judul }}</h3>
              <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm line-clamp-2">{{ a.isi }}</p>
            </div>
          </router-link>
        </div>

        <div v-else class="reveal text-center py-14 text-on-surface-variant dark:text-ice-white/60">
          <span class="material-symbols-outlined text-5xl text-outline-variant dark:text-white/20 block mb-2">newspaper</span>
          Belum ada berita yang diterbitkan.
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 md:py-20 bg-background dark:bg-deep-navy">
      <div class="container-site max-w-3xl">
        <div class="reveal text-center mb-10">
          <p class="font-label-md text-dark-teal dark:text-light-teal mb-2">FAQ</p>
          <h2 class="font-headline-lg text-deep-navy dark:text-ice-white">Pertanyaan yang Sering Diajukan</h2>
        </div>
        <div class="space-y-3">
          <div v-for="(q, i) in faqs" :key="i" class="card overflow-hidden">
            <button
              class="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors"
              :class="faqOpen === i ? 'bg-surface-container-low/60 dark:bg-white/5' : 'hover:bg-surface-container-low/60 dark:hover:bg-white/5'"
              @click="toggleFaq(i)"
              :aria-expanded="faqOpen === i"
            >
              <span class="font-title-lg text-[15px] text-deep-navy dark:text-ice-white">{{ q.q }}</span>
              <span
                class="material-symbols-outlined shrink-0 transition-transform duration-300"
                :class="faqOpen === i ? 'rotate-180 text-dark-teal dark:text-light-teal' : 'text-on-surface-variant dark:text-ice-white/60'"
              >expand_more</span>
            </button>
            <transition name="faq">
              <div v-if="faqOpen === i" class="px-5 pb-4">
                <p class="font-body-md text-on-surface-variant dark:text-ice-white/70">{{ q.a }}</p>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 md:py-20">
      <div class="container-site">
        <div class="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-deep-navy via-[#06306a] to-dark-teal text-white px-6 py-14 md:px-14 text-center">
          <div class="blob-parallax absolute -top-16 -right-16 w-64 h-64 rounded-full bg-light-teal/20 blur-3xl pointer-events-none" data-speed="0.3"></div>
          <div class="blob-parallax absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-light-teal/15 blur-3xl pointer-events-none" data-speed="0.45"></div>
          <div class="relative">
            <h2 class="font-headline-lg mb-4">Siap Memantau Perkembangan Ananda?</h2>
            <p class="font-body-lg text-ice-white/80 mb-8 max-w-2xl mx-auto">
              Orang tua dapat melihat nilai, kehadiran, dan rekomendasi pengembangan anak melalui akun yang dibagikan oleh pihak sekolah.
            </p>
            <router-link v-magnet to="/login" class="btn bg-gradient-to-r from-light-teal to-dark-teal text-white hover:brightness-110 font-bold shadow-card">
              <span class="material-symbols-outlined text-[18px]">login</span>
              Masuk Sekarang
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-deep-navy text-ice-white/60 py-12">
      <div class="container-site">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div class="flex items-center gap-2.5">
          <img src="/logo.svg" alt="SD Negeri 4 Keling" width="36" height="36" class="w-9 h-9 shrink-0 drop-shadow" />
            <div>
              <p class="font-headline-md text-white text-sm leading-tight">SD Negeri 4 Keling</p>
              <p class="text-[11px]">Monitoring Perkembangan Siswa</p>
            </div>
          </div>
          <nav class="flex flex-wrap gap-x-6 gap-y-2">
            <button v-for="item in navLinks" :key="item.id" @click="scrollTo(item.id)" class="font-label-sm hover:text-white transition-colors">{{ item.label }}</button>
          </nav>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-between gap-2 pt-6 text-sm">
          <p>&copy; {{ new Date().getFullYear() }} SD Negeri 4 Keling. Seluruh hak cipta.</p>
          <p class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">school</span>
            Sistem Monitoring Perkembangan Siswa
          </p>
        </div>
      </div>
    </footer>

    <!-- Kembali ke atas -->
    <transition name="float">
      <button
        v-if="showTop"
        class="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-dark-teal to-light-teal text-white shadow-lift-md flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Kembali ke atas"
        @click="scrollRoot?.scrollTo({ top: 0, behavior: 'smooth' })"
      >
        <span class="material-symbols-outlined">keyboard_arrow_up</span>
      </button>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'

const auth = useAuthStore()
const theme = useThemeStore()

const scrollRoot = ref(null)
const mobileOpen = ref(false)
const active = ref('beranda')
const artikels = ref([])
const loading = ref(true)
const scrollProgress = ref(0)
const showTop = ref(false)
const tiltCard = ref(null)
const newsScroller = ref(null)
const skor = ref(0)
const allowTilt = ref(true)
const typed = ref('')
const statsNums = ref([0, 0, 0, 0])
const statsBand = ref(null)
const faqOpen = ref(-1)
const alurIdx = ref(0)
const alurPaused = ref(false)

let sectionObserver = null
let revealObserver = null
let statsObserver = null
let skorRaf = 0
let statsRaf = 0
let twTimer = null
let alurTimer = null
let blobs = []
let parallaxRaf = 0
let reducedMotion = false

const words = ['Nilai Akademik', 'Kehadiran', 'Sikap']

const typeMinWidth = computed(() => Math.max(...words.map((w) => w.length)) + 'ch')

const skorText = computed(() => skor.value.toFixed(1).replace('.', ','))

const parallaxMouse = ref({ x: 0, y: 0 })

function onRootScroll() {
  const el = scrollRoot.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  scrollProgress.value = max > 0 ? Math.min(el.scrollTop / max, 1) : 0
  showTop.value = el.scrollTop > 320
  requestParallax()
}

function scrollNews(dir) {
  newsScroller.value?.scrollBy({ left: dir * 340, behavior: 'smooth' })
}

function onTilt(e) {
  if (!allowTilt.value || !tiltCard.value) return
  const rect = tiltCard.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  tiltCard.value.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`
}

function resetTilt() {
  if (tiltCard.value) tiltCard.value.style.transform = ''
}

function animateSkor() {
  const target = 87.5
  const start = performance.now()
  const dur = 900
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    skor.value = target * eased
    if (p < 1) skorRaf = requestAnimationFrame(step)
  }
  skorRaf = requestAnimationFrame(step)
}

function startTypewriter() {
  let wi = 0
  let ci = 0
  let deleting = false
  const tick = () => {
    twTimer = null
    const w = words[wi]
    if (!deleting) {
      ci++
      typed.value = w.slice(0, ci)
      twTimer = setTimeout(tick, ci >= w.length ? 1700 : 70)
      if (ci >= w.length) deleting = true
    } else {
      ci--
      typed.value = w.slice(0, ci)
      if (ci <= 0) {
        deleting = false
        ci = 0
        wi = (wi + 1) % words.length
        twTimer = setTimeout(tick, 350)
      } else {
        twTimer = setTimeout(tick, 35)
      }
    }
  }
  tick()
}

function collectBlobs() {
  blobs = Array.from(scrollRoot.value?.querySelectorAll('.blob-parallax') || [])
}

function applyParallax() {
  parallaxRaf = 0
  if (reducedMotion || !scrollRoot.value) return
  const st = scrollRoot.value.scrollTop
  for (const b of blobs) {
    const speed = parseFloat(b.dataset.speed || '0.3')
    const depth = b.dataset.cursor === '1' ? 1 : 0
    const tx = parallaxMouse.value.x * 24 * depth
    const ty = st * speed - parallaxMouse.value.y * 24 * depth
    b.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`
  }
}

function requestParallax() {
  if (reducedMotion || parallaxRaf) return
  parallaxRaf = requestAnimationFrame(applyParallax)
}

function onHeroMove(e) {
  if (reducedMotion) return
  const r = e.currentTarget.getBoundingClientRect()
  parallaxMouse.value.x = (e.clientX - r.left) / r.width - 0.5
  parallaxMouse.value.y = (e.clientY - r.top) / r.height - 0.5
  requestParallax()
}

function animateStats() {
  const start = performance.now()
  const dur = 900
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    statsNums.value = stats.map((s) => Math.round(s.value * eased))
    if (p < 1) statsRaf = requestAnimationFrame(step)
  }
  statsRaf = requestAnimationFrame(step)
}

function toggleFaq(i) {
  faqOpen.value = faqOpen.value === i ? -1 : i
}

function restartAlur() {
  clearTimeout(alurTimer)
  if (reducedMotion) return
  alurTimer = setTimeout(() => {
    if (!alurPaused.value) {
      alurIdx.value = (alurIdx.value + 1) % alur.value.length
    }
    restartAlur()
  }, 4000)
}

function setAlur(i) {
  alurIdx.value = i
  restartAlur()
}

function pauseAlur() {
  alurPaused.value = true
}

function resumeAlur() {
  alurPaused.value = false
}

const vMagnet = {
  mounted(el) {
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    el.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left - r.width / 2) * 0.18
      const y = (e.clientY - r.top - r.height / 2) * 0.18
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    }
    const onLeave = () => {
      el.style.transform = ''
    }
    el.__magnetMove = onMove
    el.__magnetLeave = onLeave
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
  },
  unmounted(el) {
    el.removeEventListener('mousemove', el.__magnetMove)
    el.removeEventListener('mouseleave', el.__magnetLeave)
  }
}

const navLinks = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tentang', label: 'Tentang' },
  { id: 'fitur', label: 'Fitur' },
  { id: 'berita', label: 'Berita' }
]

const bars = [
  { label: 'Nilai Akademik', value: '85', color: 'text-light-teal', bar: 'bg-light-teal', percent: '85%' },
  { label: 'Kehadiran', value: '96%', color: 'text-light-teal', bar: 'bg-light-teal', percent: '96%' },
  { label: 'Sikap', value: 'Baik', color: 'text-status-aman', bar: 'bg-status-aman', percent: '75%' }
]

const aspek = [
  { label: 'Nilai Akademik', icon: 'menu_book' },
  { label: 'Kehadiran', icon: 'how_to_reg' },
  { label: 'Sikap', icon: 'favorite' }
]

const status = [
  { label: 'Baik / Aman', desc: 'Perkembangan berjalan lancar', dot: 'bg-status-aman', cls: 'bg-status-aman/10 border-status-aman/30' },
  { label: 'Perlu Perhatian', desc: 'Hambatan kecil, perlu pendampingan', dot: 'bg-status-perhatian', cls: 'bg-status-perhatian/10 border-status-perhatian/30' },
  { label: 'Berisiko', desc: 'Hambatan cukup besar, butuh intervensi', dot: 'bg-status-berisiko', cls: 'bg-status-berisiko/10 border-status-berisiko/30' },
  { label: 'ABK', desc: 'Siswa berkebutuhan khusus', dot: 'bg-status-abk', cls: 'bg-status-abk/10 border-status-abk/30' }
]

const fitur = [
  { icon: 'monitor_heart', title: 'Deteksi Dini', desc: 'Identifikasi siswa berisiko sejak awal melalui skoring otomatis dengan metode SAW.' },
  { icon: 'campaign', title: 'Notifikasi Orang Tua', desc: 'Nilai baru langsung diteruskan ke orang tua melalui notifikasi aplikasi dan WhatsApp.' },
  { icon: 'insights', title: 'Rekomendasi Tindak Lanjut', desc: 'Setiap klasifikasi disertai rekomendasi tindakan konkret bagi guru dan orang tua.' }
]

const profil = {
  deskripsi:
    'SD Negeri 4 Keling adalah sekolah dasar negeri yang berlokasi di Kecamatan Keling, Kabupaten Jepara, Jawa Tengah. Sekolah berkomitmen memberikan pendidikan dasar yang bermutu bagi seluruh peserta didik melalui pembelajaran yang aktif, kreatif, dan menyenangkan, serta membentuk karakter siswa yang beriman, mandiri, dan berakhlak mulia.',
  info: [
    { label: 'Jenjang', value: 'Sekolah Dasar (SD)', icon: 'school' },
    { label: 'Status', value: 'Negeri', icon: 'account_balance' },
    { label: 'Alamat', value: 'Kec. Keling, Kab. Jepara', icon: 'location_on' },
    { label: 'Kurikulum', value: 'Kurikulum Merdeka', icon: 'auto_stories' }
  ],
  visi:
    'Terwujudnya peserta didik yang cerdas, berprestasi, berakhlak mulia, mandiri, serta siap menghadapi perkembangan zaman.',
  misi: [
    'Menyelenggarakan pembelajaran yang aktif, inovatif, dan menyenangkan',
    'Membiasakan ibadah serta menanamkan nilai religius dan moral kepada siswa',
    'Mengembangkan bakat dan minat siswa melalui kegiatan akademik maupun non-akademik',
    'Menghadirkan lingkungan belajar yang aman, nyaman, dan ramah anak'
  ]
}

const stats = [
  { icon: 'door_sliding', label: 'Kelas', value: 10, suffix: '+' },
  { icon: 'groups', label: 'Siswa Terpantau', value: 210, suffix: '+' },
  { icon: 'how_to_reg', label: 'Rata-rata Kehadiran', value: 96, suffix: '%' },
  { icon: 'assessment', label: 'Kondisi Klasifikasi', value: 3, suffix: '' }
]

const faqs = [
  { q: 'Bagaimana orang tua mendapatkan akun?', a: 'Akun orang tua dibuat oleh admin/wali kelas dan dibagikan langsung. Setelah masuk, Anda bisa melihat nilai, kehadiran, sikap, dan rekomendasi perkembangan anak.' },
  { q: 'Apa itu metode SAW?', a: 'SAW (Simple Additive Weighting) adalah metode sistem pendukung keputusan yang menghitung skor berdasarkan bobot nilai akademik, kehadiran, dan sikap, lalu mengklasifikasikan siswa ke dalam tiga kondisi.' },
  { q: 'Apakah nilai yang diinput langsung terlihat?', a: 'Ya. Setiap nilai, kehadiran, atau sikap yang diinput guru langsung diperbarui dan orang tua mendapat notifikasi ketika ada penilaian baru.' },
  { q: 'Bagaimana cara reset kata sandi?', a: 'Anda dapat memilih menu "Lupa Kata Sandi" di halaman masuk. Jika masih terkendala, hubungi admin sekolah untuk reset.' },
  { q: 'Siapa saja yang bisa melihat data siswa?', a: 'Akses dibatasi sesuai peran: wali kelas mengelola nilai kelasnya, kepala sekolah melihat laporan keseluruhan, dan orang tua hanya melihat data anaknya sendiri.' }
]

const alur = ref([
  {
    label: 'Nilai',
    icon: 'menu_book',
    step: 'Langkah 1',
    desc: 'Guru memasukkan nilai akademik setiap penilaian ulangan harian, UTS, dan UAS secara real-time dari dashboard wali kelas.',
    preview: []
  },
  {
    label: 'Kehadiran',
    icon: 'how_to_reg',
    step: 'Langkah 2',
    desc: 'Rekap kehadiran harian siswa dicatat oleh guru dan otomatis diakumulasi untuk dihitung sebagai salah satu komponen skor.',
    preview: []
  },
  {
    label: 'Sikap',
    icon: 'favorite',
    step: 'Langkah 3',
    desc: 'Penilaian sikap spiritual dan sosial oleh guru memberikan gambaran perilaku siswa di lingkungan kelas dan sekolah.',
    preview: []
  },
  {
    label: 'SPK · SAW',
    icon: 'hub',
    step: 'Langkah 4',
    desc: 'Semua komponen dihitung dengan metode SAW lalu diklasifikasikan otomatis ke dalam tiga kondisi bagi setiap siswa.',
    preview: [
      { label: 'Baik', cls: 'bg-status-aman/10 text-status-aman border-status-aman/30' },
      { label: 'Perhatian', cls: 'bg-status-perhatian/10 text-yellow-700 border-status-perhatian/30' },
      { label: 'Berisiko', cls: 'bg-status-berisiko/10 text-status-berisiko border-status-berisiko/30' }
    ]
  }
])

function scrollTo(id) {
  mobileOpen.value = false
  const el = document.getElementById(id)
  if (!el || !scrollRoot.value) return
  const top = el.getBoundingClientRect().top - scrollRoot.value.getBoundingClientRect().top + scrollRoot.value.scrollTop - 64
  scrollRoot.value.scrollTo({ top, behavior: 'smooth' })
}

function setupSectionObserver() {
  if (!scrollRoot.value) return
  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) active.value = e.target.id
      })
    },
    { root: scrollRoot.value, threshold: 0.45 }
  )
  navLinks.forEach((l) => {
    const el = document.getElementById(l.id)
    if (el) sectionObserver.observe(el)
  })
}

function setupReveal() {
  if (!scrollRoot.value) return
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible')
          revealObserver.unobserve(e.target)
        }
      })
    },
    { root: scrollRoot.value, threshold: 0.12 }
  )
  scrollRoot.value.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => revealObserver.observe(el))
}

function tgl(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) {
    allowTilt.value = false
  }
  if (reducedMotion) {
    skor.value = 87.5
    typed.value = words[0]
    statsNums.value = stats.map((s) => s.value)
  } else {
    animateSkor()
    startTypewriter()
    collectBlobs()
    restartAlur()
  }
  scrollRoot.value?.addEventListener('scroll', onRootScroll, { passive: true })
  onRootScroll()
  try {
    const { data } = await api.get('/artikel?status=publish&limit=6')
    artikels.value = data.list
  } finally {
    loading.value = false
  }
  await nextTick()
  setupSectionObserver()
  setupReveal()
  if (statsBand.value) {
    statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            if (!reducedMotion) animateStats()
            statsObserver?.disconnect()
            statsObserver = null
          }
        })
      },
      { root: scrollRoot.value, threshold: 0.3 }
    )
    statsObserver.observe(statsBand.value)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(skorRaf)
  cancelAnimationFrame(statsRaf)
  cancelAnimationFrame(parallaxRaf)
  clearTimeout(twTimer)
  clearTimeout(alurTimer)
  scrollRoot.value?.removeEventListener('scroll', onRootScroll)
  sectionObserver?.disconnect()
  revealObserver?.disconnect()
  statsObserver?.disconnect()
})
</script>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 0.65s ease, transform 0.65s ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.float {
  animation: floatY 4s ease-in-out infinite;
}
@keyframes floatY {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.grow-bar {
  animation: growBar 1s ease-out both;
}
@keyframes growBar {
  from {
    width: 0;
  }
}

.tilt-card {
  transition: transform 0.15s ease-out;
  will-change: transform;
}

.typewriter-text {
  display: inline-block;
  white-space: nowrap;
}
.type-cursor {
  display: inline-block;
  margin-left: 3px;
  font-weight: 700;
  color: #37b7c3;
  animation: blink 1s steps(2) infinite;
}
@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

.blob-parallax {
  will-change: transform;
}

.stats-grid .stat-item {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.stats-grid.is-visible .stat-item {
  opacity: 1;
  transform: none;
}

.alur-progress {
  animation: alurGrow 4s linear forwards;
  transform-origin: left;
}
@keyframes alurGrow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.swap-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.swap-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.faq-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.faq-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.faq-enter-from,
.faq-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .float {
    animation: none;
  }
  .grow-bar {
    animation: none;
  }
  .tilt-card {
    transition: none;
  }
  .type-cursor {
    animation: none;
    opacity: 0;
  }
  .blob-parallax {
    transform: none !important;
  }
  .alur-progress {
    animation: none;
  }
  .stats-grid .stat-item {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
