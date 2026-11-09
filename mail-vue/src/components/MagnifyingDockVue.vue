<template>
  <div ref="container" class="dock-wrapper"></div>
</template>

<script setup>
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { MagnifyingDock } from './MagnifyingDock';

const props = defineProps({
  magnify: { type: Number, default: 1.32 },
  spread: { type: Number, default: 2 },
  lift: { type: Number, default: 8 },
  labels: { type: Boolean, default: true },
  items: { type: Array, default: undefined },
  activeItem: { type: String, default: undefined },
});

const emit = defineEmits(['select']);

const container = ref(null);
let root = null;

function render() {
  if (!container.value) return;
  if (!root) root = createRoot(container.value);
  root.render(React.createElement(MagnifyingDock, {
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
.dock-wrapper {
  display: inline-flex;
  justify-content: center;
}
</style>
