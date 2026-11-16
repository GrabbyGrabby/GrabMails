<template>
  <div class="mailflare-composer-body" :class="{ 'is-dark': uiStore.dark }">
    <!-- Main ContentEditable Body -->
    <div class="editor-scroll-area">
      <div
        ref="editorRef"
        :id="editorId"
        class="mailflare-editable-area"
        contenteditable="true"
        spellcheck="true"
        :data-placeholder="placeholder || t('writeContent') || 'Write your email here...'"
        @input="emitChange"
        @blur="emitChange"
        @focus="handleFocus"
        @paste="onPaste"
        @keydown="onKeyDown"
      />

      <!-- Mailflare Quoted Reply Thread (Foldable •••) -->
      <div v-if="quotedHtml" class="quoted-thread-wrapper">
        <button
          type="button"
          class="quoted-toggle-btn"
          :title="showQuoted ? 'Hide quoted text' : 'Show quoted text'"
          @click="showQuoted = !showQuoted"
        >
          •••
        </button>
        <div v-if="showQuoted" class="quoted-content-view" v-html="quotedHtml" />
      </div>
    </div>

    <!-- Attachments Area Slot -->
    <slot name="attachments" />

    <!-- Mailflare Floating Link Popover -->
    <div v-if="linkOpen" class="mailflare-link-popover" @click.stop>
      <input
        ref="linkInputRef"
        v-model="linkUrl"
        type="text"
        placeholder="https://example.com"
        class="link-input"
        @keydown.enter.prevent="applyLink"
        @keydown.esc.prevent="linkOpen = false"
      />
      <button type="button" class="link-apply-btn" @click="applyLink">
        Apply
      </button>
      <button type="button" class="link-cancel-btn" @click="linkOpen = false">
        ✕
      </button>
    </div>

    <!-- Dedicated Full-Width Formatting Toolbar (Always visible & fully accessible on web & mobile) -->
    <div v-show="showFormattingBar" class="mailflare-formatting-row" data-testid="formatting-toolbar">
      <div class="format-buttons-cluster">
        <!-- Bold -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.bold }"
          @mousedown.prevent
          @click="run('bold')"
          title="Bold (Ctrl+B)"
        >
          <Icon icon="hugeicons:bold" width="16" height="16" />
        </button>

        <!-- Italic -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.italic }"
          @mousedown.prevent
          @click="run('italic')"
          title="Italic (Ctrl+I)"
        >
          <Icon icon="hugeicons:italic" width="16" height="16" />
        </button>

        <!-- Underline -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.underline }"
          @mousedown.prevent
          @click="run('underline')"
          title="Underline (Ctrl+U)"
        >
          <Icon icon="hugeicons:underline" width="16" height="16" />
        </button>

        <!-- Strikethrough -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.strikeThrough }"
          @mousedown.prevent
          @click="run('strikeThrough')"
          title="Strikethrough"
        >
          <Icon icon="hugeicons:strikethrough" width="16" height="16" />
        </button>

        <span class="mf-tool-sep" />

        <!-- Bullet List -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.insertUnorderedList }"
          @mousedown.prevent
          @click="run('insertUnorderedList')"
          title="Bulleted List"
        >
          <Icon icon="hugeicons:bullet-list" width="16" height="16" />
        </button>

        <!-- Numbered List -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.insertOrderedList }"
          @mousedown.prevent
          @click="run('insertOrderedList')"
          title="Numbered List"
        >
          <Icon icon="hugeicons:number-list" width="16" height="16" />
        </button>

        <!-- Blockquote -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.blockquote }"
          @mousedown.prevent
          @click="toggleBlockquote"
          title="Quote"
        >
          <Icon icon="hugeicons:quote" width="16" height="16" />
        </button>

        <!-- Code Block -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': activeStates.code }"
          @mousedown.prevent
          @click="toggleCode"
          title="Code Block"
        >
          <Icon icon="hugeicons:code" width="16" height="16" />
        </button>

        <span class="mf-tool-sep" />

        <!-- Insert Link (Pop-up above) -->
        <button
          type="button"
          class="mf-tool-btn"
          :class="{ 'is-active': linkOpen }"
          @mousedown.prevent
          @click="openLink"
          title="Insert Link (Ctrl+K)"
        >
          <Icon icon="hugeicons:link" width="16" height="16" />
        </button>

        <!-- Clear Formatting -->
        <button
          type="button"
          class="mf-tool-btn"
          @mousedown.prevent
          @click="run('removeFormat')"
          title="Clear formatting"
        >
          <Icon icon="hugeicons:delete-02" width="15" height="15" />
        </button>
      </div>
    </div>

    <!-- Mailflare Bottom Action Toolbar -->
    <div class="mailflare-bottom-toolbar">
      <!-- Toolbar Start (Send button & schedule options) -->
      <div class="mf-toolbar-start">
        <slot name="toolbarStart" />
        <!-- Formatting bar toggle button -->
        <button
          type="button"
          class="mf-tool-btn mf-format-toggle-btn"
          :class="{ 'is-active': showFormattingBar }"
          title="Formatting options"
          @click="showFormattingBar = !showFormattingBar"
        >
          <Icon icon="hugeicons:text" width="16" height="16" />
        </button>
      </div>

      <!-- Toolbar End (Attachments, open tracking, follow-up, templates, discard) -->
      <div class="mf-toolbar-end">
        <slot name="toolbarEnd" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, shallowReactive } from 'vue';
import { Icon } from '@iconify/vue';
import { useUiStore } from '@/store/ui.js';
import { useI18n } from 'vue-i18n';
import DOMPurify from 'dompurify';

const props = defineProps({
  defValue: {
    type: String,
    default: '',
  },
  editorId: {
    type: String,
    default: () => `mf-editor-${Date.now()}`,
  },
  placeholder: {
    type: String,
    default: '',
  },
  quotedHtml: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['change', 'focus']);
const { t } = useI18n();
const uiStore = useUiStore();

const editorRef = ref(null);
const linkInputRef = ref(null);
const linkOpen = ref(false);
const linkUrl = ref('');
const showQuoted = ref(false);
const showFormattingBar = ref(true);
let savedRange = null;

const activeStates = shallowReactive({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  blockquote: false,
  code: false,
});

defineExpose({
  clearEditor,
  focus,
  getContent,
  setQuoted,
});

onMounted(() => {
  if (editorRef.value) {
    setContent(props.defValue || '');
  }
  document.addEventListener('selectionchange', refreshCommandStates);
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', refreshCommandStates);
});

watch(
  () => props.defValue,
  (val) => {
    if (!editorRef.value) return;
    const current = editorRef.value.innerHTML;
    if (val !== current && (val || current)) {
      setContent(val || '');
    }
  }
);

function setContent(html) {
  if (!editorRef.value) return;
  const sanitized = DOMPurify.sanitize(html || '', {
    ADD_ATTR: ['target', 'class', 'style'],
  });
  editorRef.value.innerHTML = sanitized;
  emitChange();
}

function getContent() {
  if (!editorRef.value) return '';
  return editorRef.value.innerHTML;
}

function clearEditor() {
  if (!editorRef.value) return;
  editorRef.value.innerHTML = '';
  emitChange();
}

function setQuoted(html) {
  showQuoted.value = !!html;
}

function focus() {
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.focus();
    }
  });
}

function handleFocus() {
  emit('focus', focus);
  refreshCommandStates();
}

function emitChange() {
  if (!editorRef.value) return;
  const html = editorRef.value.innerHTML;
  const text = (editorRef.value.innerText || '').trim();
  emit('change', html, text);
}

function run(command, commandValue = null) {
  if (!editorRef.value) return;
  editorRef.value.focus();
  document.execCommand(command, false, commandValue);
  refreshCommandStates();
  emitChange();
}

function toggleBlockquote() {
  if (!editorRef.value) return;
  editorRef.value.focus();
  const isBlockquote = document.queryCommandValue('formatBlock').toLowerCase() === 'blockquote';
  document.execCommand('formatBlock', false, isBlockquote ? 'div' : 'blockquote');
  refreshCommandStates();
  emitChange();
}

function toggleCode() {
  if (!editorRef.value) return;
  editorRef.value.focus();
  const isPre = document.queryCommandValue('formatBlock').toLowerCase() === 'pre';
  document.execCommand('formatBlock', false, isPre ? 'div' : 'pre');
  refreshCommandStates();
  emitChange();
}

function refreshCommandStates() {
  if (!editorRef.value || !document.activeElement || !editorRef.value.contains(document.activeElement)) {
    return;
  }
  try {
    activeStates.bold = document.queryCommandState('bold');
    activeStates.italic = document.queryCommandState('italic');
    activeStates.underline = document.queryCommandState('underline');
    activeStates.strikeThrough = document.queryCommandState('strikeThrough');
    activeStates.insertUnorderedList = document.queryCommandState('insertUnorderedList');
    activeStates.insertOrderedList = document.queryCommandState('insertOrderedList');
    const block = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    activeStates.blockquote = block === 'blockquote';
    activeStates.code = block === 'pre';
  } catch (e) {}
}

function openLink() {
  const sel = window.getSelection();
  savedRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
  linkUrl.value = '';
  linkOpen.value = true;
  nextTick(() => {
    linkInputRef.value?.focus();
  });
}

function applyLink() {
  linkOpen.value = false;
  const url = linkUrl.value.trim();
  if (!url) return;
  const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;

  editorRef.value?.focus();
  const sel = window.getSelection();
  if (savedRange && sel) {
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  if (sel && sel.isCollapsed) {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);
    anchor.setAttribute('target', '_blank');
    anchor.textContent = href;
    document.execCommand('insertHTML', false, anchor.outerHTML);
  } else {
    document.execCommand('createLink', false, href);
  }
  emitChange();
}

function onPaste(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
  emitChange();
}

function onKeyDown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openLink();
  }
}
</script>

<style lang="scss" scoped>
.mailflare-composer-body {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: transparent;
}

.editor-scroll-area {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Mailflare Borderless Clean Text Area */
.mailflare-editable-area {
  flex: 1;
  padding: 12px 14px;
  outline: none;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
  word-break: break-word;

  &:empty:before {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
  }

  :deep(p) {
    margin: 0 0 8px 0;
  }

  :deep(blockquote) {
    margin: 8px 0;
    padding: 6px 12px;
    border-left: 3px solid #3b82f6;
    background: rgba(59, 130, 246, 0.05);
    border-radius: 0 6px 6px 0;
    color: #4b5563;
    font-style: italic;
  }

  :deep(pre) {
    margin: 8px 0;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.05);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    overflow-x: auto;
  }

  :deep(ul), :deep(ol) {
    margin: 6px 0;
    padding-left: 24px;
  }

  :deep(a) {
    color: #2563eb;
    text-decoration: underline;
  }
}

.is-dark .mailflare-editable-area {
  color: #f3f4f6;

  &:empty:before {
    color: #6b7280;
  }

  :deep(blockquote) {
    background: rgba(59, 130, 246, 0.1);
    color: #9ca3af;
  }

  :deep(pre) {
    background: rgba(255, 255, 255, 0.06);
  }

  :deep(a) {
    color: #60a5fa;
  }
}

/* Mailflare Quoted Reply Thread Button (•••) */
.quoted-thread-wrapper {
  padding: 0 14px 10px 14px;
}

.quoted-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 9999px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.04);
  color: #6b7280;
  font-size: 11px;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #111827;
  }
}

.is-dark .quoted-toggle-btn {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #9ca3af;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }
}

.quoted-content-view {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid rgba(0, 0, 0, 0.12);
  opacity: 0.8;
  font-size: 13px;
}

.is-dark .quoted-content-view {
  border-left-color: rgba(255, 255, 255, 0.15);
}

/* Full-Width Formatting Row */
.mailflare-formatting-row {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.015);
  box-sizing: border-box;
}

.is-dark .mailflare-formatting-row {
  border-top-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.format-buttons-cluster {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  width: 100%;
}

/* Mailflare Bottom Integrated Action Toolbar */
.mailflare-bottom-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
  gap: 6px;
  user-select: none;
  min-height: 44px;
  flex-shrink: 0;
}

.is-dark .mailflare-bottom-toolbar {
  border-top-color: rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.mf-toolbar-start {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.mf-toolbar-end {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .mailflare-formatting-row {
    padding: 6px 8px;
  }

  .format-buttons-cluster {
    gap: 3px;
  }

  .mf-tool-btn {
    width: 26px;
    height: 26px;
  }

  .mailflare-bottom-toolbar {
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px));
  }
}

.mf-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 120ms ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111827;
  }

  &.is-active {
    background: rgba(0, 0, 0, 0.1) !important;
    color: #111827 !important;
    font-weight: 600;
  }
}

.is-dark .mf-tool-btn {
  color: #9ca3af;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  &.is-active {
    background: rgba(255, 255, 255, 0.16) !important;
    color: #ffffff !important;
  }
}

.mf-tool-sep {
  display: inline-block;
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(0, 0, 0, 0.1);
}

.is-dark .mf-tool-sep {
  background: rgba(255, 255, 255, 0.12);
}

/* Mailflare Link Popover (Floats right above toolbar) */
.mailflare-link-popover {
  position: absolute;
  bottom: 42px;
  left: 12px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.is-dark .mailflare-link-popover {
  background: #222428;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.link-input {
  width: 220px;
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  font-size: 13px;
  outline: none;
  background: transparent;
  color: inherit;

  &:focus {
    border-color: #3b82f6;
  }
}

.is-dark .link-input {
  border-color: rgba(255, 255, 255, 0.18);
}

.link-apply-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #1d4ed8;
  }
}

.link-cancel-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;

  &:hover {
    color: #111827;
  }
}

.is-dark .link-cancel-btn:hover {
  color: #ffffff;
}
</style>
