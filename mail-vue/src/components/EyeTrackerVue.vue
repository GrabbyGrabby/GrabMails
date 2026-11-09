<template>
  <div ref="container" class="eyt-wrapper"></div>
</template>

<script setup>
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EyeTracker } from './EyeTracker';

const props = defineProps({
  follow: { type: Number, default: 60 },
  bounce: { type: Number, default: 30 },
  size: { type: Number, default: 100 },
  shape: { type: String, default: 'Cube' },
  eyes: { type: String, default: 'Slant' },
  eyeScale: { type: Number, default: 1 },
  eyeWidth: { type: Number, default: 1 },
  eyeRound: { type: Number, default: 1 },
  eyeHeight: { type: Number, default: 1 },
  idle: { type: Boolean, default: false },
  within: { type: String, default: undefined },
});

const container = ref(null);
let root = null;

function render() {
  if (!container.value) return;
  if (!root) root = createRoot(container.value);
  root.render(React.createElement(EyeTracker, { ...props }));
}

onMounted(() => render());
watch(() => ({ ...props }), () => render(), { deep: true });
onBeforeUnmount(() => {
  if (root) {
    root.unmount();
    root = null;
  }
});
</script>

<style scoped>
.eyt-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
