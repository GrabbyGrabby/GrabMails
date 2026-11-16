<template>
  <div v-if="isOpen" class="cmd-palette-overlay" @click.self="close">
    <div class="cmd-palette-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
      <!-- Search Input -->
      <div class="cmd-search-header">
        <Icon icon="hugeicons:search" width="20" height="20" class="cmd-search-icon" />
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Type a command or search... (Esc to close)"
          class="cmd-search-input"
          @keydown="handleKeyDown"
        />
        <kbd class="cmd-badge">ESC</kbd>
      </div>

      <!-- Command List -->
      <div class="cmd-list" ref="listRef">
        <div v-if="filteredCommands.length === 0" class="cmd-empty">
          <Icon icon="hugeicons:search" width="28" height="28" style="opacity: 0.4; margin-bottom: 6px;" />
          <div>No matching commands found</div>
        </div>

        <div
          v-for="(item, idx) in filteredCommands"
          :key="item.id"
          class="cmd-item"
          :class="{ 'is-selected': idx === selectedIndex }"
          @click="execute(item)"
          @mouseenter="selectedIndex = idx"
        >
          <div class="cmd-item-left">
            <div class="cmd-icon-box">
              <Icon :icon="item.icon" width="18" height="18" />
            </div>
            <div class="cmd-text">
              <span class="cmd-title">{{ item.title }}</span>
              <span v-if="item.subtitle" class="cmd-subtitle">{{ item.subtitle }}</span>
            </div>
          </div>
          <div class="cmd-item-right">
            <kbd v-if="item.shortcut" class="cmd-shortcut">{{ item.shortcut }}</kbd>
          </div>
        </div>
      </div>

      <!-- Palette Footer -->
      <div class="cmd-footer">
        <div class="cmd-hint">
          <kbd>↑</kbd><kbd>↓</kbd> <span>Navigate</span>
        </div>
        <div class="cmd-hint">
          <kbd>↵</kbd> <span>Select</span>
        </div>
        <div class="cmd-hint">
          <kbd>ESC</kbd> <span>Close</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useUiStore } from '@/store/ui.js';
import { useUserStore } from '@/store/user.js';
import { useSettingStore } from '@/store/setting.js';
import { ElMessage } from 'element-plus';

const router = useRouter();
const uiStore = useUiStore();
const userStore = useUserStore();
const settingStore = useSettingStore();

const isOpen = ref(false);
const searchQuery = ref('');
const selectedIndex = ref(0);
const inputRef = ref(null);
const listRef = ref(null);

const allCommands = computed(() => [
  {
    id: 'compose',
    title: 'Compose Email',
    subtitle: 'Write a new message',
    icon: 'hugeicons:quill-write',
    shortcut: 'C',
    category: 'Actions',
    perform: () => {
      uiStore.writerRef?.open?.();
    },
  },
  {
    id: 'nav-inbox',
    title: 'Go to Inbox',
    subtitle: 'View received messages',
    icon: 'hugeicons:inbox',
    shortcut: 'G I',
    category: 'Navigation',
    perform: () => router.push({ name: 'email' }),
  },
  {
    id: 'nav-sent',
    title: 'Go to Sent',
    subtitle: 'View sent messages',
    icon: 'hugeicons:mail-send-01',
    shortcut: 'G S',
    category: 'Navigation',
    perform: () => router.push({ name: 'send' }),
  },
  {
    id: 'nav-draft',
    title: 'Go to Drafts',
    subtitle: 'View saved drafts',
    icon: 'hugeicons:note-01',
    shortcut: 'G D',
    category: 'Navigation',
    perform: () => router.push({ name: 'draft' }),
  },
  {
    id: 'nav-star',
    title: 'Go to Starred',
    subtitle: 'View starred messages',
    icon: 'hugeicons:star',
    category: 'Navigation',
    perform: () => router.push({ name: 'star' }),
  },
  {
    id: 'nav-settings',
    title: 'Mail Settings',
    subtitle: 'Configure account and email settings',
    icon: 'hugeicons:settings-02',
    category: 'Navigation',
    perform: () => router.push({ name: 'setting' }),
  },
  {
    id: 'nav-analytics',
    title: 'Analytics Dashboard',
    subtitle: 'System traffic and email stats',
    icon: 'hugeicons:activity',
    category: 'Navigation',
    perform: () => router.push({ name: 'analysis' }),
  },
  {
    id: 'nav-users',
    title: 'Manage Users',
    subtitle: 'User accounts and quotas',
    icon: 'hugeicons:users',
    category: 'Navigation',
    perform: () => router.push({ name: 'user' }),
  },
  {
    id: 'nav-all-email',
    title: 'All System Mails',
    subtitle: 'Global audit logs',
    icon: 'hugeicons:archive-03',
    category: 'Navigation',
    perform: () => router.push({ name: 'all-email' }),
  },
  {
    id: 'toggle-theme',
    title: 'Toggle Dark / Light Mode',
    subtitle: uiStore.dark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
    icon: uiStore.dark ? 'hugeicons:sparkles' : 'hugeicons:activity',
    category: 'Preferences',
    perform: () => {
      uiStore.changeTheme();
    },
  },
  {
    id: 'copy-email',
    title: 'Copy Email Address',
    subtitle: userStore.user?.email || 'Current mailbox address',
    icon: 'hugeicons:copy',
    category: 'Actions',
    perform: () => {
      const email = userStore.user?.email;
      if (email) {
        navigator.clipboard.writeText(email);
        ElMessage.success(`Copied: ${email}`);
      }
    },
  },
  {
    id: 'open-shortcuts',
    title: 'Keyboard Shortcuts Guide',
    subtitle: 'View all keyboard hotkeys',
    icon: 'hugeicons:help-circle',
    shortcut: '?',
    category: 'Help',
    perform: () => {
      window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'));
    },
  },
]);

const filteredCommands = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allCommands.value;
  return allCommands.value.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
  );
});

function open() {
  isOpen.value = true;
  searchQuery.value = '';
  selectedIndex.value = 0;
  nextTick(() => {
    inputRef.value?.focus();
  });
}

function close() {
  isOpen.value = false;
}

function execute(item) {
  close();
  item.perform?.();
}

function handleKeyDown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (filteredCommands.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length;
      scrollToSelected();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (filteredCommands.value.length > 0) {
      selectedIndex.value =
        (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length;
      scrollToSelected();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (filteredCommands.value[selectedIndex.value]) {
      execute(filteredCommands.value[selectedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    close();
  }
}

function scrollToSelected() {
  nextTick(() => {
    const el = listRef.value?.querySelector('.is-selected');
    el?.scrollIntoView({ block: 'nearest' });
  });
}

function handleGlobalKey(e) {
  // Check if inside an editable input / textarea
  const isInput =
    ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) ||
    document.activeElement?.isContentEditable;

  // Ctrl+K or Cmd+K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (isOpen.value) close();
    else open();
    return;
  }

  // If palette is open, don't trigger other hotkeys
  if (isOpen.value) return;

  // Single-key global shortcuts (only when not typing in an input)
  if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key.toLowerCase() === 'c') {
      e.preventDefault();
      uiStore.writerRef?.open?.();
    } else if (e.key === '?') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'));
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKey);
  window.addEventListener('open-command-palette', open);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKey);
  window.removeEventListener('open-command-palette', open);
});

defineExpose({
  open,
  close,
});
</script>

<style lang="scss" scoped>
.cmd-palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  animation: fadeIn 140ms ease-out;
}

.cmd-palette-modal {
  width: 90%;
  max-width: 580px;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

:root.dark .cmd-palette-modal,
.dark .cmd-palette-modal {
  background: #18191c;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
}

.cmd-search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  .cmd-search-icon {
    color: #6b7280;
    flex-shrink: 0;
  }

  .cmd-search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    font-family: inherit;
    background: transparent;
    color: inherit;

    &::placeholder {
      color: #9ca3af;
    }
  }

  .cmd-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.06);
    color: #6b7280;
    border: 1px solid rgba(0, 0, 0, 0.1);
    font-family: monospace;
  }
}

.dark .cmd-search-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);

  .cmd-badge {
    background: rgba(255, 255, 255, 0.08);
    color: #9ca3af;
    border-color: rgba(255, 255, 255, 0.12);
  }
}

.cmd-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px;
}

.cmd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  color: #9ca3af;
  font-size: 13.5px;
}

.cmd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 120ms ease;

  &:hover,
  &.is-selected {
    background: rgba(59, 130, 246, 0.08);
  }
}

.dark .cmd-item:hover,
.dark .cmd-item.is-selected {
  background: rgba(59, 130, 246, 0.18);
}

.cmd-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cmd-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.04);
  color: #3b82f6;
}

.dark .cmd-icon-box {
  background: rgba(255, 255, 255, 0.06);
}

.cmd-text {
  display: flex;
  flex-direction: column;

  .cmd-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary, #111827);
  }

  .cmd-subtitle {
    font-size: 12px;
    color: var(--el-text-color-secondary, #6b7280);
  }
}

.cmd-shortcut {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-family: monospace;
}

.dark .cmd-shortcut {
  background: rgba(255, 255, 255, 0.08);
  color: #9ca3af;
  border-color: rgba(255, 255, 255, 0.1);
}

.cmd-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
  font-size: 11.5px;
  color: #9ca3af;

  .cmd-hint {
    display: flex;
    align-items: center;
    gap: 4px;

    kbd {
      padding: 1px 4px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.1);
      font-size: 10px;
      font-family: monospace;
    }
  }
}

.dark .cmd-footer {
  border-top-color: rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);

  .cmd-hint kbd {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    transform: translateY(-12px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
