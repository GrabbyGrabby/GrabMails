<template>
  <div ref="container" class="sld-wrapper"></div>
</template>

<script setup>
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { SlideToConfirm } from './SlideToConfirm';

const props = defineProps({
  corner: { type: Number, default: undefined },
  speed: { type: Number, default: 50 },
  width: { type: Number, default: 280 },
});

const emit = defineEmits(['confirm']);

const container = ref(null);
let root = null;

function render() {
  if (!container.value) return;
  if (!root) root = createRoot(container.value);
  root.render(React.createElement(SlideToConfirm, {
    ...props,
    onConfirm: () => {
      emit('confirm');
    }
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
.sld-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>
