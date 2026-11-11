<template>
  <div ref="container" class="radial-nav-wrapper"></div>
</template>

<script setup>
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { CircularRadialNavbar } from './CircularRadialNavbar';

const props = defineProps({
  activeItem: { type: String, default: 'email' },
  className: { type: String, default: '' },
});

const emit = defineEmits(['select']);

const container = ref(null);
let root = null;

function render() {
  if (!container.value) return;
  if (!root) root = createRoot(container.value);
  root.render(React.createElement(CircularRadialNavbar, {
    ...props,
    onSelect: (key) => emit('select', key),
  }));
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
.radial-nav-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
