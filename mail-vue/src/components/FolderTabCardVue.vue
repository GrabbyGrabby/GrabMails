<template>
  <div ref="container" class="folder-card-wrapper"></div>
</template>

<script setup>
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { FolderTabCard } from './FolderTabCard';

const props = defineProps({
  title: { type: String, default: 'Inbox' },
  subtitle: { type: String, default: 'Zero-log Cloud Mailbox' },
  tagsCount: { type: String, default: '24' },
  tagsLabel: { type: String, default: 'Items' },
  shotsCount: { type: String, default: '100% Private' },
  className: { type: String, default: '' },
});

const emit = defineEmits(['action']);

const container = ref(null);
let root = null;

function render() {
  if (!container.value) return;
  if (!root) root = createRoot(container.value);
  root.render(React.createElement(FolderTabCard, {
    ...props,
    onAction: () => emit('action'),
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
.folder-card-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>
