<template>
  <button class="hamburger-container" type="button" aria-label="Toggle sidebar" @click="toggleClick">
    <svg
      :class="{ 'is-active': isActive }"
      class="modern-3lines"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" class="line-1" />
      <line x1="4" y1="12" x2="20" y2="12" class="line-2" />
      <line x1="4" y1="18" x2="20" y2="18" class="line-3" />
    </svg>
  </button>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggleClick'])
const toggleClick = () => {
  emit('toggleClick')
}
</script>

<style scoped>
.hamburger-container {
  padding: 0 12px;
  cursor: pointer;
  background: transparent;
  border: none;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-primary);
  transition: opacity 160ms ease, transform 160ms ease;
}

.hamburger-container:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.modern-3lines {
  display: inline-block;
  vertical-align: middle;
  width: 20px;
  height: 20px;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modern-3lines line {
  transition: transform 220ms ease, opacity 220ms ease;
  transform-origin: center;
}

.modern-3lines.is-active .line-1 {
  transform: translateY(6px) rotate(45deg);
}

.modern-3lines.is-active .line-2 {
  opacity: 0;
}

.modern-3lines.is-active .line-3 {
  transform: translateY(-6px) rotate(-45deg);
}
</style>
