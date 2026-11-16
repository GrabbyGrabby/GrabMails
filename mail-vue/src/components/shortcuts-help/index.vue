<template>
  <el-dialog
    v-model="visible"
    title="Keyboard Shortcuts"
    width="500px"
    class="shortcuts-dialog"
    append-to-body
  >
    <div class="shortcuts-container">
      <div v-for="section in sections" :key="section.title" class="shortcuts-section">
        <div class="shortcuts-section-title">{{ section.title }}</div>
        <div class="shortcuts-grid">
          <div v-for="sc in section.shortcuts" :key="sc.desc" class="shortcut-row">
            <span class="shortcut-desc">{{ sc.desc }}</span>
            <div class="shortcut-keys">
              <kbd v-for="k in sc.keys" :key="k">{{ k }}</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const visible = ref(false);

const sections = [
  {
    title: 'General & Navigation',
    shortcuts: [
      { desc: 'Open Command Palette', keys: ['Ctrl', 'K'] },
      { desc: 'Compose new message', keys: ['C'] },
      { desc: 'Search messages', keys: ['/'] },
      { desc: 'Show keyboard shortcuts', keys: ['?'] },
      { desc: 'Close dialog or modal', keys: ['ESC'] },
    ],
  },
  {
    title: 'Rich Text Composer',
    shortcuts: [
      { desc: 'Bold text', keys: ['Ctrl', 'B'] },
      { desc: 'Italic text', keys: ['Ctrl', 'I'] },
      { desc: 'Underline text', keys: ['Ctrl', 'U'] },
      { desc: 'Insert hyperlink', keys: ['Ctrl', 'K'] },
    ],
  },
  {
    title: 'Mail Actions',
    shortcuts: [
      { desc: 'Refresh mailbox', keys: ['R'] },
      { desc: 'Next / Previous email', keys: ['J', '/', 'K'] },
      { desc: 'Delete email', keys: ['Delete'] },
    ],
  },
];

function open() {
  visible.value = true;
}

onMounted(() => {
  window.addEventListener('open-keyboard-shortcuts', open);
});

onBeforeUnmount(() => {
  window.removeEventListener('open-keyboard-shortcuts', open);
});
</script>

<style lang="scss" scoped>
.shortcuts-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 6px;
}

.shortcuts-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcuts-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #3b82f6;
}

.shortcuts-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.03);
}

:root.dark .shortcut-row,
.dark .shortcut-row {
  background: rgba(255, 255, 255, 0.04);
}

.shortcut-desc {
  font-size: 13.5px;
  color: var(--el-text-color-regular, #374151);
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;

  kbd {
    display: inline-block;
    padding: 2px 7px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    color: #4b5563;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
    font-family: inherit;
  }
}

:root.dark .shortcut-keys kbd,
.dark .shortcut-keys kbd {
  color: #e5e7eb;
  background: #27272a;
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
