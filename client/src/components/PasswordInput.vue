<template>
  <div>
    <label class="label" :for="id">{{ label }}</label>
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-ice-white/50">lock</span>
      <input
        :id="id"
        v-model="model"
        :type="visible ? 'text' : 'password'"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        class="input pl-11 pr-11"
      />
      <button
        type="button"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-on-surface-variant dark:text-ice-white/50 hover:text-dark-teal dark:hover:text-light-teal transition-colors focus-visible:ring-2 focus-visible:ring-dark-teal"
        :aria-label="visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <span class="material-symbols-outlined text-[20px]">{{ visible ? 'visibility_off' : 'visibility' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  id: { type: String, required: true },
  label: { type: String, default: 'Password' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: '' },
  required: { type: Boolean, default: false }
})

const model = defineModel({ type: String, default: '' })
const visible = ref(false)
</script>
