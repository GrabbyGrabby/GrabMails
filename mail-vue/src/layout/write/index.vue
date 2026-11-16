<template>
  <div
    class="send"
    v-show="show"
    :class="{
      'is-modal': composerMode === 'modal',
      'is-minimized': composerMode === 'minimized',
      'is-floating': composerMode === 'normal',
    }"
  >
    <!-- Modal Backdrop (only in full modal mode) -->
    <div
      v-if="composerMode === 'modal'"
      class="mf-modal-backdrop"
      @click="toggleModal"
    />

    <div
      class="write-box"
      :class="{
        'box-modal': composerMode === 'modal',
        'box-minimized': composerMode === 'minimized',
        'box-normal': composerMode === 'normal',
        'is-dragging': isDraggingFiles && composerMode !== 'minimized',
      }"
      @dragenter.capture="composerMode !== 'minimized' && onFileDragEnter($event)"
      @dragover.capture="composerMode !== 'minimized' && onFileDragOver($event)"
      @dragleave.capture="composerMode !== 'minimized' && onFileDragLeave($event)"
      @drop.capture="composerMode !== 'minimized' && onFileDrop($event)"
    >
      <!-- Drag & Drop Overlay -->
      <div v-if="isDraggingFiles && composerMode !== 'minimized'" class="mf-drag-overlay">
        <Icon icon="hugeicons:file-attachment" width="36" height="36" />
        <span class="mf-drag-text">Drop files here to attach</span>
      </div>

      <!-- Hidden file input for attachment button -->
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden-file-input"
        @change="handleFileInputChange"
      />

      <!-- Mailflare Dark Composer Header -->
      <div class="mf-compose-header" @click="composerMode === 'minimized' && toggleMinimize()">
        <div class="header-left">
          <Icon
            v-if="form.sendType === 'reply'"
            icon="hugeicons:reply"
            width="16"
            height="16"
            class="header-type-icon"
          />
          <Icon
            v-else-if="form.sendType === 'forward'"
            icon="hugeicons:reply-all"
            width="16"
            height="16"
            class="header-type-icon"
          />
          <Icon
            v-else
            icon="hugeicons:quill-write-01"
            width="16"
            height="16"
            class="header-type-icon"
          />
          <span class="header-title">{{ headerTitle }}</span>
        </div>

        <div class="header-right" @click.stop>
          <!-- Minimize / Restore -->
          <button
            type="button"
            class="mf-hdr-btn"
            :title="composerMode === 'minimized' ? 'Restore composer' : 'Minimize'"
            @click="toggleMinimize"
          >
            <Icon
              :icon="composerMode === 'minimized' ? 'hugeicons:arrow-up-01' : 'hugeicons:minus'"
              width="15"
              height="15"
            />
          </button>

          <!-- Maximize / Restore floating -->
          <button
            type="button"
            class="mf-hdr-btn"
            :title="composerMode === 'modal' ? 'Restore floating' : 'Maximize'"
            @click="toggleModal"
          >
            <Icon
              :icon="composerMode === 'modal' ? 'hugeicons:contract' : 'hugeicons:expand'"
              width="14"
              height="14"
            />
          </button>

          <!-- Close -->
          <button
            type="button"
            class="mf-hdr-btn mf-close-btn"
            title="Close"
            @click="close"
          >
            <Icon icon="material-symbols-light:close-rounded" width="18" height="18" />
          </button>
        </div>
      </div>

      <!-- Composer Form Body (Hidden when minimized) -->
      <div v-show="composerMode !== 'minimized'" class="mf-compose-body">
        <!-- From Field -->
        <div class="mf-form-row">
          <span class="mf-field-label">{{ $t('from') }}</span>
          <div class="mf-sender-wrapper">
            <span class="mf-sender-name">{{ form.name || 'Account' }}</span>
            <span class="mf-sender-email">&lt;{{ form.sendEmail }}&gt;</span>
          </div>
        </div>

        <!-- To Field -->
        <div class="mf-form-row mf-recipient-row" @click="focusToInput">
          <span class="mf-field-label">{{ $t('recipient') }}</span>
          <div class="mf-chips-container">
            <span
              v-for="(email, idx) in form.receiveEmail"
              :key="email"
              class="mf-chip"
              :class="{ 'is-invalid': !isEmail(email) }"
            >
              <span class="mf-chip-text">{{ email }}</span>
              <button
                type="button"
                class="mf-chip-del"
                @click.stop="delRecipient(idx)"
              >
                ✕
              </button>
            </span>

            <input
              ref="toInputRef"
              v-model="toDraftText"
              type="text"
              class="mf-clean-input"
              :placeholder="form.receiveEmail.length === 0 ? 'Type email and press Enter...' : ''"
              @keydown="handleToKeyDown"
              @blur="commitToDraft"
              @input="onToInput"
            />

            <!-- Autocomplete suggestions dropdown -->
            <div
              v-if="autocompleteSuggestions.length > 0"
              class="mf-autocomplete-dropdown"
              @click.stop
            >
              <div
                v-for="item in autocompleteSuggestions"
                :key="item"
                class="mf-autocomplete-item"
                @mousedown.prevent="pickContact(item)"
              >
                <Icon icon="hugeicons:mail" width="14" height="14" />
                <span class="mf-ac-email">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- Trailing Buttons (Cc, Bcc, Contacts) -->
          <div class="mf-row-trailing">
            <button
              v-if="!showCc"
              type="button"
              class="mf-pill-btn"
              @click.stop="showCc = true"
            >
              Cc
            </button>
            <button
              v-if="!showBcc"
              type="button"
              class="mf-pill-btn"
              @click.stop="showBcc = true"
            >
              Bcc
            </button>
            <button
              type="button"
              class="mf-icon-pill"
              title="Recent Contacts"
              @click.stop="openContacts"
            >
              <Icon icon="hugeicons:users" width="16" height="16" />
            </button>
          </div>
        </div>

        <!-- Optional Cc Field -->
        <div v-if="showCc" class="mf-form-row mf-recipient-row" @click="focusCcInput">
          <span class="mf-field-label">Cc</span>
          <div class="mf-chips-container">
            <span
              v-for="(email, idx) in ccList"
              :key="email"
              class="mf-chip"
              :class="{ 'is-invalid': !isEmail(email) }"
            >
              <span class="mf-chip-text">{{ email }}</span>
              <button
                type="button"
                class="mf-chip-del"
                @click.stop="ccList.splice(idx, 1)"
              >
                ✕
              </button>
            </span>
            <input
              ref="ccInputRef"
              v-model="ccDraftText"
              type="text"
              class="mf-clean-input"
              placeholder="Cc recipients..."
              @keydown="handleCcKeyDown"
              @blur="commitCcDraft"
            />
          </div>
          <button
            type="button"
            class="mf-row-close"
            title="Hide Cc"
            @click.stop="showCc = false; ccList = []"
          >
            ✕
          </button>
        </div>

        <!-- Optional Bcc Field -->
        <div v-if="showBcc" class="mf-form-row mf-recipient-row" @click="focusBccInput">
          <span class="mf-field-label">Bcc</span>
          <div class="mf-chips-container">
            <span
              v-for="(email, idx) in bccList"
              :key="email"
              class="mf-chip"
              :class="{ 'is-invalid': !isEmail(email) }"
            >
              <span class="mf-chip-text">{{ email }}</span>
              <button
                type="button"
                class="mf-chip-del"
                @click.stop="bccList.splice(idx, 1)"
              >
                ✕
              </button>
            </span>
            <input
              ref="bccInputRef"
              v-model="bccDraftText"
              type="text"
              class="mf-clean-input"
              placeholder="Bcc recipients..."
              @keydown="handleBccKeyDown"
              @blur="commitBccDraft"
            />
          </div>
          <button
            type="button"
            class="mf-row-close"
            title="Hide Bcc"
            @click.stop="showBcc = false; bccList = []"
          >
            ✕
          </button>
        </div>

        <!-- Subject Field -->
        <div class="mf-form-row">
          <input
            v-model="form.subject"
            type="text"
            class="mf-subject-input"
            :placeholder="t('subject') || 'Subject'"
          />
        </div>

        <!-- Mailflare Native Rich Text Editor Engine -->
        <tinyEditor
          ref="editor"
          :def-value="defValue"
          @change="change"
          @focus="focusChange"
        >
          <!-- Attachments List Slot (Above Toolbar) -->
          <template #attachments>
            <div v-if="form.attachments.length > 0" class="mf-att-drawer">
              <div class="mf-att-chips-list">
                <div
                  v-for="(item, index) in form.attachments"
                  :key="index"
                  class="mf-att-chip"
                >
                  <Icon v-bind="getIconByName(item.filename)" width="15" height="15" />
                  <span class="mf-att-name" :title="item.filename">{{ item.filename }}</span>
                  <span class="mf-att-size">{{ formatBytes(item.size) }}</span>
                  <button
                    type="button"
                    class="mf-att-remove"
                    title="Remove file"
                    @click="delAtt(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- Toolbar Start Slot: Mailflare Send Split Button -->
          <template #toolbarStart>
            <div class="mf-send-split-group">
              <button
                type="button"
                class="mf-primary-send-btn"
                :disabled="sending"
                @click="sendEmail"
              >
                <Icon
                  v-if="!sending"
                  icon="hugeicons:mail-send-01"
                  width="15"
                  height="15"
                />
                <Icon
                  v-else
                  icon="hugeicons:refresh-cw"
                  width="15"
                  height="15"
                  class="animate-spin"
                />
                <span>{{ isScheduled ? 'Schedule Send' : sendButtonLabel }}</span>
              </button>

              <el-dropdown trigger="click" @command="handleSendDropdownCommand">
                <button
                  type="button"
                  class="mf-send-arrow-btn"
                  title="Schedule & options"
                  :disabled="sending"
                >
                  <Icon icon="hugeicons:chevron-down" width="13" height="13" />
                </button>
                <template #dropdown>
                  <el-dropdown-menu class="mf-dropdown-menu">
                    <el-dropdown-item command="together">
                      <Icon icon="hugeicons:mail-send-01" width="14" height="14" style="margin-right: 6px;" />
                      Send Now
                    </el-dropdown-item>
                    <el-dropdown-item command="divide">
                      <Icon icon="hugeicons:users" width="14" height="14" style="margin-right: 6px;" />
                      {{ separateSendLabel }}
                    </el-dropdown-item>
                    <el-dropdown-item divided command="schedule-tomorrow-morning">
                      <Icon icon="hugeicons:clock-01" width="14" height="14" style="margin-right: 6px;" />
                      Tomorrow Morning (8:00 AM)
                    </el-dropdown-item>
                    <el-dropdown-item command="schedule-tomorrow-afternoon">
                      <Icon icon="hugeicons:clock-01" width="14" height="14" style="margin-right: 6px;" />
                      Tomorrow Afternoon (1:00 PM)
                    </el-dropdown-item>
                    <el-dropdown-item command="schedule-monday">
                      <Icon icon="hugeicons:calendar-clock" width="14" height="14" style="margin-right: 6px;" />
                      Monday Morning (8:00 AM)
                    </el-dropdown-item>
                    <el-dropdown-item command="schedule-custom">
                      <Icon icon="hugeicons:calendar-clock" width="14" height="14" style="margin-right: 6px;" />
                      Custom Date & Time...
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="isScheduled"
                      command="cancel-schedule"
                      style="color: #ef4444;"
                    >
                      <Icon icon="hugeicons:delete-02" width="14" height="14" style="margin-right: 6px;" />
                      Cancel Schedule
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- Scheduled Pill Indicator -->
            <span
              v-if="isScheduled"
              class="mf-scheduled-pill"
              title="Click to cancel schedule"
              @click="scheduledTime = null"
            >
              <Icon icon="hugeicons:clock-01" width="13" height="13" />
              <span>{{ scheduledLabel }}</span>
              <span class="mf-pill-cancel">✕</span>
            </span>
          </template>

          <!-- Toolbar End Slot: Attach, Track Opens, Follow-up, Templates, Discard -->
          <template #toolbarEnd>
            <!-- Attach File -->
            <button
              type="button"
              class="mf-tool-btn"
              title="Attach Files"
              @click="chooseFile"
            >
              <Icon icon="hugeicons:paperclip" width="16" height="16" />
            </button>

            <!-- Track Opens (Eye Toggle) -->
            <button
              type="button"
              class="mf-tool-btn"
              :class="{ 'is-active-blue': trackOpens }"
              :title="trackOpens ? 'Open tracking ON' : 'Open tracking OFF'"
              @click="trackOpens = !trackOpens"
            >
              <Icon :icon="trackOpens ? 'hugeicons:view' : 'hugeicons:view-off'" width="16" height="16" />
            </button>

            <!-- Follow-Up Reminder (Bell Menu) -->
            <el-dropdown trigger="click" @command="handleFollowUpCommand">
              <button
                type="button"
                class="mf-tool-btn"
                :class="{ 'is-active-amber': followUpDays !== null }"
                :title="followUpDays ? `Reminder set: ${followUpDays} days if no reply` : 'Set Follow-up Reminder'"
              >
                <Icon icon="hugeicons:bell-ring" width="16" height="16" />
              </button>
              <template #dropdown>
                <el-dropdown-menu class="mf-dropdown-menu">
                  <el-dropdown-item disabled style="font-weight: 600; font-size: 11px;">
                    FOLLOW-UP REMINDER
                  </el-dropdown-item>
                  <el-dropdown-item command="1">
                    <Icon icon="hugeicons:clock-01" width="14" height="14" style="margin-right: 6px;" />
                    In 1 day if no reply
                  </el-dropdown-item>
                  <el-dropdown-item command="3">
                    <Icon icon="hugeicons:clock-01" width="14" height="14" style="margin-right: 6px;" />
                    In 3 days if no reply
                  </el-dropdown-item>
                  <el-dropdown-item command="7">
                    <Icon icon="hugeicons:calendar-clock" width="14" height="14" style="margin-right: 6px;" />
                    In 1 week if no reply
                  </el-dropdown-item>
                  <el-dropdown-item v-if="followUpDays" divided command="clear" style="color: #ef4444;">
                    <Icon icon="hugeicons:delete-02" width="14" height="14" style="margin-right: 6px;" />
                    No reminder
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- Email Templates & Snippets Menu -->
            <el-dropdown trigger="click" @command="handleTemplateCommand">
              <button
                type="button"
                class="mf-tool-btn"
                title="Email Templates & Snippets"
              >
                <Icon icon="hugeicons:file-text" width="16" height="16" />
              </button>
              <template #dropdown>
                <el-dropdown-menu class="mf-dropdown-menu">
                  <el-dropdown-item disabled style="font-weight: 600; font-size: 11px;">
                    EMAIL TEMPLATES
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-for="tpl in templateList"
                    :key="tpl.id"
                    :command="'apply:' + tpl.id"
                  >
                    <div class="mf-tpl-item-content">
                      <span class="mf-tpl-title">{{ tpl.title }}</span>
                      <span class="mf-tpl-preview">{{ tpl.preview }}</span>
                    </div>
                  </el-dropdown-item>
                  <el-dropdown-item divided command="save-template">
                    <Icon icon="hugeicons:note-01" width="14" height="14" style="margin-right: 6px;" />
                    Save Draft as Template...
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- Discard Draft (Trash) -->
            <button
              type="button"
              class="mf-tool-btn mf-trash-btn"
              title="Discard draft"
              @click="clearContent"
            >
              <Icon icon="hugeicons:delete-02" width="16" height="16" />
            </button>
          </template>
        </tinyEditor>
      </div>
    </div>

    <!-- Contacts Dialog -->
    <el-dialog
      top="10vh"
      v-model="showContacts"
      @closed="clearSelectContact"
      :title="t('recentContacts')"
    >
      <el-table ref="contactsTabRef" row-key="email" :data="contacts" style="height: 445px">
        <el-table-column type="selection" width="32" />
        <el-table-column property="email" :label="t('emailAccount')">
          <template #default="props">
            <div class="email-row">{{ props.row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column width="55" label="">
          <template #default>
            <div style="display: flex;">
              <Icon icon="hugeicons:users" style="color: var(--el-text-color-primary)" width="20" height="20" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="contacts-bottom">
        <el-button type="default" @click="deleteContact">{{ t('clear') }}</el-button>
        <el-button type="primary" @click="chooseContact">{{ t('selectContacts') }}</el-button>
      </div>
    </el-dialog>

    <!-- Custom Schedule Dialog -->
    <el-dialog
      v-model="customScheduleDialogVisible"
      title="Schedule Send"
      width="380px"
      append-to-body
    >
      <div style="padding: 12px 0; display: flex; flex-direction: column; gap: 14px;">
        <div style="font-size: 13.5px; color: var(--el-text-color-regular);">
          Select when you want this message delivered:
        </div>
        <el-date-picker
          v-model="customScheduleDateTime"
          type="datetime"
          placeholder="Pick date and time"
          style="width: 100%"
          :disabled-date="(d) => d.getTime() < Date.now() - 8.64e7"
        />
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <el-button @click="customScheduleDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="applyCustomSchedule">Set Schedule</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import { h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useUserStore } from "@/store/user.js";
import { emailSend } from "@/request/email.js";
import { isEmail } from "@/utils/verify-utils.js";
import { useAccountStore } from "@/store/account.js";
import { useEmailStore } from "@/store/email.js";
import { fileToBase64, formatBytes } from "@/utils/file-utils.js";
import { getIconByName } from "@/utils/icon-utils.js";
import sendPercent from "@/components/send-percent/index.vue"
import { toOssDomain } from "@/utils/convert.js";
import { formatDetailDate } from "@/utils/day.js";
import { useSettingStore } from "@/store/setting.js";
import { userDraftStore } from "@/store/draft.js";
import { useWriterStore } from "@/store/writer.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import { useI18n } from "vue-i18n";
import router from "@/router/index.js";
import { ElMessageBox, ElMessage, ElNotification } from "element-plus";

defineExpose({
  open,
  openReply,
  openForward,
  openDraft
})

const { t } = useI18n()
const writerStore = useWriterStore();
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref(null)
const userStore = useUserStore();
const show = ref(false);
const percent = ref(0)
let percentMessage = null
let sending = ref(false)
const defValue = ref('')
const contactsTabRef = ref({})
const showContacts = ref(false)

// ── Mailflare Window Controls (normal, minimized, modal) ──
const composerMode = ref('normal') // 'normal' | 'minimized' | 'modal'

function toggleMinimize() {
  composerMode.value = composerMode.value === 'minimized' ? 'normal' : 'minimized'
}

function toggleModal() {
  if (composerMode.value === 'minimized') {
    composerMode.value = 'normal'
  }
  composerMode.value = composerMode.value === 'modal' ? 'normal' : 'modal'
}

// ── Header Title Computed ──
const headerTitle = computed(() => {
  if (form.sendType === 'reply') return t('reply') || 'Reply'
  if (form.sendType === 'forward') return t('forward') || 'Forward'
  if (form.draftId) return 'Draft saved'
  return 'New Message'
})

// ── Recipient & Cc / Bcc State ──
const toInputRef = ref(null)
const ccInputRef = ref(null)
const bccInputRef = ref(null)
const toDraftText = ref('')
const ccDraftText = ref('')
const bccDraftText = ref('')
const showCc = ref(false)
const showBcc = ref(false)
const ccList = ref([])
const bccList = ref([])

function focusToInput() {
  toInputRef.value?.focus()
}

function focusCcInput() {
  ccInputRef.value?.focus()
}

function focusBccInput() {
  bccInputRef.value?.focus()
}

// Contacts autocomplete filtering
const autocompleteSuggestions = ref([])

function onToInput() {
  const query = toDraftText.value.trim().toLowerCase()
  if (!query) {
    autocompleteSuggestions.value = []
    return
  }
  autocompleteSuggestions.value = (writerStore.sendRecipientRecord || [])
    .filter(email => email.toLowerCase().includes(query) && !form.receiveEmail.includes(email))
    .slice(0, 6)
}

function pickContact(email) {
  if (!form.receiveEmail.includes(email)) {
    form.receiveEmail.push(email)
  }
  toDraftText.value = ''
  autocompleteSuggestions.value = []
  focusToInput()
}

function commitToDraft() {
  const raw = toDraftText.value.trim()
  if (!raw) return
  const parts = raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean)
  parts.forEach(p => {
    if (!form.receiveEmail.includes(p)) {
      form.receiveEmail.push(p)
    }
  })
  toDraftText.value = ''
  autocompleteSuggestions.value = []
}

function handleToKeyDown(e) {
  if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
    if (toDraftText.value.trim()) {
      e.preventDefault()
      commitToDraft()
    }
  } else if (e.key === 'Backspace' && !toDraftText.value && form.receiveEmail.length > 0) {
    e.preventDefault()
    const last = form.receiveEmail.pop()
    toDraftText.value = last
  }
}

function delRecipient(idx) {
  form.receiveEmail.splice(idx, 1)
}

function commitCcDraft() {
  const raw = ccDraftText.value.trim()
  if (!raw) return
  const parts = raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean)
  parts.forEach(p => {
    if (!ccList.value.includes(p)) {
      ccList.value.push(p)
    }
  })
  ccDraftText.value = ''
}

function handleCcKeyDown(e) {
  if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
    if (ccDraftText.value.trim()) {
      e.preventDefault()
      commitCcDraft()
    }
  } else if (e.key === 'Backspace' && !ccDraftText.value && ccList.value.length > 0) {
    e.preventDefault()
    const last = ccList.value.pop()
    ccDraftText.value = last
  }
}

function commitBccDraft() {
  const raw = bccDraftText.value.trim()
  if (!raw) return
  const parts = raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean)
  parts.forEach(p => {
    if (!bccList.value.includes(p)) {
      bccList.value.push(p)
    }
  })
  bccDraftText.value = ''
}

function handleBccKeyDown(e) {
  if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
    if (bccDraftText.value.trim()) {
      e.preventDefault()
      commitBccDraft()
    }
  } else if (e.key === 'Backspace' && !bccDraftText.value && bccList.value.length > 0) {
    e.preventDefault()
    const last = bccList.value.pop()
    bccDraftText.value = last
  }
}

// ── Drag & Drop Attachments ──
const isDraggingFiles = ref(false)
const fileDragDepth = ref(0)
const fileInputRef = ref(null)

function onFileDragEnter(e) {
  if (!e.dataTransfer?.types?.includes('Files')) return
  e.preventDefault()
  fileDragDepth.value++
  isDraggingFiles.value = true
}

function onFileDragOver(e) {
  if (!e.dataTransfer?.types?.includes('Files')) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function onFileDragLeave(e) {
  if (!e.dataTransfer?.types?.includes('Files')) return
  fileDragDepth.value = Math.max(0, fileDragDepth.value - 1)
  if (fileDragDepth.value === 0) {
    isDraggingFiles.value = false
  }
}

async function onFileDrop(e) {
  if (!e.dataTransfer?.types?.includes('Files')) return
  e.preventDefault()
  fileDragDepth.value = 0
  isDraggingFiles.value = false
  await addFiles(e.dataTransfer.files)
}

function chooseFile() {
  fileInputRef.value?.click()
}

async function handleFileInputChange(e) {
  const files = e.target.files
  if (!files || !files.length) return
  await addFiles(files)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function addFiles(fileList) {
  for (const file of fileList) {
    const size = file.size
    const filename = file.name
    const contentType = file.type || 'application/octet-stream'
    const content = await fileToBase64(file)
    form.attachments.push({ content, filename, size, contentType })
  }
}

function delAtt(index) {
  form.attachments.splice(index, 1)
}

// ── Form Model ──
const backReply = reactive({
  receiveEmail: [],
  subject: '',
  content: '',
  sendType: ''
})

const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  manyType: 'together',
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({ email: item })))
const separateSendLabel = computed(() => t(form.sendType === 'forward' ? 'separateForward' : 'separateSend'))
const sendButtonLabel = computed(() => {
  if (form.manyType === 'divide') return separateSendLabel.value
  if (form.sendType === 'reply') return t('reply')
  if (form.sendType === 'forward') return t('forward')
  return t('send')
})

function selectSendMode(mode) {
  form.manyType = mode
}

// ── Mailflare Feature: Open Tracking ──
const trackOpens = ref(false)

// ── Mailflare Feature: Follow-Up Reminders ──
const followUpDays = ref(null)

function handleFollowUpCommand(cmd) {
  if (cmd === 'clear') {
    followUpDays.value = null
    ElMessage.info('Follow-up reminder cleared')
  } else {
    const days = parseInt(cmd, 10)
    followUpDays.value = days
    ElMessage.success(`Reminder set: in ${days} ${days === 1 ? 'day' : 'days'} if no reply`)
  }
}

// ── Mailflare Feature: Schedule Send ──
const scheduledTime = ref(null)
const customScheduleDialogVisible = ref(false)
const customScheduleDateTime = ref(null)

const isScheduled = computed(() => !!scheduledTime.value)
const scheduledLabel = computed(() => {
  if (!scheduledTime.value) return ''
  const d = new Date(scheduledTime.value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
})

function applyCustomSchedule() {
  if (!customScheduleDateTime.value) {
    ElMessage.warning('Please select a date and time')
    return
  }
  const picked = new Date(customScheduleDateTime.value)
  if (picked.getTime() <= Date.now()) {
    ElMessage.warning('Scheduled time must be in the future')
    return
  }
  scheduledTime.value = picked.toISOString()
  customScheduleDialogVisible.value = false
  ElMessage.success(`Scheduled for ${scheduledLabel.value}`)
}

function handleSendDropdownCommand(cmd) {
  if (cmd === 'together' || cmd === 'divide') {
    selectSendMode(cmd)
    sendEmail()
  } else if (cmd === 'schedule-tomorrow-morning') {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0)
    scheduledTime.value = tomorrow.toISOString()
    ElMessage.success(`Scheduled for tomorrow at 8:00 AM`)
  } else if (cmd === 'schedule-tomorrow-afternoon') {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(13, 0, 0, 0)
    scheduledTime.value = tomorrow.toISOString()
    ElMessage.success(`Scheduled for tomorrow at 1:00 PM`)
  } else if (cmd === 'schedule-monday') {
    const d = new Date()
    const day = d.getDay()
    const diff = (8 - day) % 7 || 7
    d.setDate(d.getDate() + diff)
    d.setHours(8, 0, 0, 0)
    scheduledTime.value = d.toISOString()
    ElMessage.success(`Scheduled for Monday at 8:00 AM`)
  } else if (cmd === 'schedule-custom') {
    customScheduleDialogVisible.value = true
  } else if (cmd === 'cancel-schedule') {
    scheduledTime.value = null
    ElMessage.info('Scheduled send cancelled')
  }
}

// ── Mailflare Feature: Email Templates & Snippets ──
const defaultTemplates = [
  {
    id: 'ack',
    title: 'Acknowledgment & Received',
    subject: 'Received: Re: [Subject]',
    body: '<div>Thank you for reaching out. We have received your message and will review it promptly.<br><br>Best regards,</div>',
    preview: 'Thank you for reaching out. We have received your message...'
  },
  {
    id: 'meeting',
    title: 'Meeting Follow-up',
    subject: 'Follow-up on our conversation',
    body: '<div>Hi there,<br><br>Thank you for taking the time to speak today. Here is a brief recap of our discussion and next steps:<br><br><ul><li>Action item 1</li><li>Action item 2</li></ul><br>Looking forward to staying in touch.</div>',
    preview: 'Thank you for taking the time to speak today. Here is a brief recap...'
  },
  {
    id: 'intro',
    title: 'Quick Introduction',
    subject: 'Connecting via GrabMails',
    body: '<div>Hi,<br><br>Hope this note finds you well. I wanted to reach out and introduce myself.<br><br>Let me know if you would like to connect.<br><br>Best,</div>',
    preview: 'Hope this note finds you well. I wanted to reach out...'
  },
  {
    id: 'away',
    title: 'Out of Office / Away',
    subject: 'Automatic Reply: Out of office',
    body: '<div>Thank you for your email. I am currently out of the office with limited access to messages. I will respond as soon as I return.<br><br>Regards,</div>',
    preview: 'Thank you for your email. I am currently out of the office...'
  }
]

const customTemplates = ref([])

function loadCustomTemplates() {
  try {
    const raw = localStorage.getItem('grabmails_custom_templates')
    if (raw) customTemplates.value = JSON.parse(raw)
  } catch (e) {}
}
loadCustomTemplates()

const templateList = computed(() => [...defaultTemplates, ...customTemplates.value])

function handleTemplateCommand(cmd) {
  if (cmd.startsWith('apply:')) {
    const id = cmd.replace('apply:', '')
    const tpl = templateList.value.find(t => t.id === id)
    if (tpl) {
      if (!form.subject && tpl.subject) {
        form.subject = tpl.subject
      }
      defValue.value = tpl.body
      nextTick(() => {
        editor.value?.focus?.()
      })
      ElMessage.success(`Applied template: ${tpl.title}`)
    }
  } else if (cmd === 'save-template') {
    const currentHtml = editor.value?.getContent?.()
    if (!currentHtml || !currentHtml.trim()) {
      ElMessage.warning('Cannot save empty message as template')
      return
    }
    ElMessageBox.prompt('Enter a title for this template:', 'Save Template', {
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      inputValue: form.subject || 'Custom Template'
    }).then(({ value: title }) => {
      if (!title || !title.trim()) return
      const newTpl = {
        id: 'cust_' + Date.now(),
        title: title.trim(),
        subject: form.subject,
        body: currentHtml,
        preview: editor.value?.getContent?.().replace(/<[^>]+>/g, '').slice(0, 50) + '...'
      }
      customTemplates.value.push(newTpl)
      try {
        localStorage.setItem('grabmails_custom_templates', JSON.stringify(customTemplates.value))
      } catch (e) {}
      ElMessage.success('Template saved successfully!')
    }).catch(() => {})
  }
}

// ── Contacts Dialog Handlers ──
function openContacts() {
  showContacts.value = true
  nextTick(() => {
    form.receiveEmail.forEach(item => {
      if (writerStore.sendRecipientRecord.includes(item)) {
        contactsTabRef.value.toggleRowSelection({ email: item })
      }
    })
  })
}

function deleteContact() {
  ElMessageBox.confirm(t('confirmDeletionOfContacts'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
    form.receiveEmail = form.receiveEmail.filter(item => !contactList.includes(item));
    writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(item => !contactList.includes(item));
  })
}

function chooseContact() {
  const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
  contactList.forEach(item => {
    if (!form.receiveEmail.includes(item)) {
      form.receiveEmail.push(item);
    }
  })
  form.receiveEmail = form.receiveEmail.filter(item => {
    return contactList.includes(item) || !writerStore.sendRecipientRecord.includes(item);
  });
  showContacts.value = false
}

function clearSelectContact() {
  contactsTabRef.value?.clearSelection?.()
}

function clearContent() {
  ElMessageBox.confirm(t('clearContentConfirm') || 'Discard draft and reset message?', {
    confirmButtonText: t('confirm') || 'Discard',
    cancelButtonText: t('cancel') || 'Cancel',
    type: 'warning'
  }).then(() => {
    resetForm()
  })
}

// ── Email Send Action ──
async function sendEmail() {
  commitToDraft()
  commitCcDraft()
  commitBccDraft()

  // Merge To, Cc, Bcc into combined delivery list without breaking API contract
  const allRecipients = Array.from(new Set([
    ...form.receiveEmail,
    ...ccList.value,
    ...bccList.value
  ]))

  if (allRecipients.length === 0) {
    ElMessage({
      message: t('emptyRecipientMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.subject) {
    ElMessage({
      message: t('emptySubjectMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  form.content = editor.value.getContent();

  // Attach open tracker pixel if enabled
  if (trackOpens.value) {
    form.content += `<img src="https://grabby.qzz.io/api/track/open?id=${Date.now()}" width="1" height="1" style="display:none !important;" alt="" />`;
  }

  // Attach scheduled send time if set
  if (scheduledTime.value) {
    form.sendTime = scheduledTime.value;
  }

  if (!form.content) {
    ElMessage({
      message: t('emptyContentMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (sending.value) {
    ElMessage({
      message: t('sendingErrorMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, { value: percent.value, desc: t('sending') }),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending.value = true
  show.value = false

  const sendPayload = {
    ...toRaw(form),
    receiveEmail: allRecipients
  }

  emailSend(sendPayload, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(result => {
    const emailList = Array.isArray(result) ? result : result.emails
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })

    userStore.refreshUserInfo();
    addRecipientRecord();

    // Persist follow-up reminder if chosen
    if (followUpDays.value) {
      try {
        const stored = JSON.parse(localStorage.getItem('grabmails_follow_ups') || '[]')
        stored.push({
          id: 'fu_' + Date.now(),
          subject: form.subject,
          recipients: allRecipients,
          sentAt: new Date().toISOString(),
          dueAt: new Date(Date.now() + followUpDays.value * 86400000).toISOString(),
          days: followUpDays.value,
          status: 'pending'
        })
        localStorage.setItem('grabmails_follow_ups', JSON.stringify(stored))
      } catch (e) {}
    }

    if (result.failedRecipients?.length) {
      form.receiveEmail = result.failedRecipients
      show.value = true
      ElNotification({
        title: t('partialSendMsg', { count: emailList.length, failed: result.failedRecipients.length }),
        type: 'warning',
        message: result.error,
        position: 'bottom-right'
      })
      return
    }

    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', { style: 'color: teal' }, email.subject),
      position: 'bottom-right'
    })

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      draftStore.setDraft = { ...toRaw(form) }
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', { style: 'color: teal' }, e.message),
      position: 'bottom-right'
    })
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percentMessage?.close?.()
    percent.value = 0
    sending.value = false
  })
}

function addRecipientRecord() {
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(
    email => !form.receiveEmail.includes(email)
  );
  writerStore.sendRecipientRecord.unshift(...form.receiveEmail);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}

function resetForm() {
  form.receiveEmail = []
  form.subject = ''
  form.content = ''
  form.manyType = 'together'
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  ccList.value = []
  bccList.value = []
  showCc.value = false
  showBcc.value = false
  toDraftText.value = ''
  ccDraftText.value = ''
  bccDraftText.value = ''
  scheduledTime.value = null
  followUpDays.value = null
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
  composerMode.value = 'normal'
  editor.value?.clearEditor?.()
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {}

function openForward(email) {
  resetForm();
  email.subject = email.subject || ''
  form.subject = email.subject
  form.sendType = 'forward'
  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
      ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
    `
    open()
    nextTick(() => {
      backReply.content = editor.value?.getContent?.()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  });
}

function openReply(email) {
  resetForm();
  email.subject = email.subject || ''
  form.receiveEmail.push(email.sendEmail)
  form.subject = (
    email.subject.startsWith('Re:') ||
    email.subject.startsWith('Re：') ||
    email.subject.startsWith('回复：') ||
    email.subject.startsWith('回复:')) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId
  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
    <div></div>
    <div>
    <br>
        ${formatDetailDate(email.createTime)} ${email.name} &lt;${email.sendEmail}&gt; ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 2px solid #3b82f6;padding-left: 1ex;">
      <article>
          ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
      </article>
    </blockquote>`
    open()
    nextTick(() => {
      backReply.content = editor.value?.getContent?.()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  })
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function open(payload = {}) {
  // If called with email recipient data (e.g. from Contacts 1-click outreach)
  if (typeof payload === 'string' && payload.trim()) {
    resetForm();
    form.receiveEmail = [payload.trim()];
  } else if (Array.isArray(payload)) {
    resetForm();
    form.receiveEmail = payload.filter(Boolean);
  } else if (payload && typeof payload === 'object') {
    const rec = payload.receiveEmail || payload.to;
    if (rec || payload.subject || payload.content) {
      resetForm();
      if (rec) {
        form.receiveEmail = Array.isArray(rec) ? rec.filter(Boolean) : [rec.trim()];
      }
      if (payload.subject) {
        form.subject = payload.subject;
      }
      if (payload.content) {
        form.content = payload.content;
        defValue.value = payload.content;
      }
    }
  }

  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account ? userStore.user.account.accountId : 0;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  composerMode.value = 'normal'
  nextTick(() => {
    if (form.receiveEmail.length > 0) {
      editor.value?.focus?.()
    } else {
      toInputRef.value?.focus?.()
    }
  })
}

function openDraft(draft) {
  Object.assign(form, { ...draft, manyType: draft.manyType || 'together' })
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  composerMode.value = 'normal'
  nextTick(() => {
    editor.value?.focus?.()
  })
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape' && show.value && composerMode.value === 'modal') {
    event.preventDefault()
    composerMode.value = 'normal'
  }
};

const handleGlobalOpenCompose = (e) => {
  if (e?.detail) {
    open(e.detail)
  } else {
    open()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('grabmails:open-compose', handleGlobalOpenCompose);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('grabmails:open-compose', handleGlobalOpenCompose);
});

function close() {
  if (!form.content) {
    form.content = editor.value?.getContent?.();
  }

  if (form.draftId) {
    draftStore.setDraft = { ...toRaw(form) }
    show.value = false
    resetForm()
    return;
  }

  if (!(form.content || form.subject || form.receiveEmail.length > 0)) {
    show.value = false
    resetForm()
    return;
  }

  if (backReply.sendType === 'reply' || backReply.sendType === 'forward') {
    let subjectFlag = form.subject === backReply.subject
    let contentFlag = editor.value?.getContent?.() === backReply.content
    let receiveFlag = form.receiveEmail.length === 1 && form.receiveEmail[0] === backReply.receiveEmail[0]
    if (backReply.sendType === 'forward' && form.receiveEmail.length === 0) {
      receiveFlag = true;
    }
    if (subjectFlag && contentFlag && receiveFlag) {
      show.value = false
      resetForm();
      return;
    }
  }

  ElMessageBox.confirm(t('saveDraftConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning',
    distinguishCancelAndClose: true
  }).then(async () => {
    const formData = { ...toRaw(form) };
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const draftId = await db.value.draft.add({ ...formData })
    db.value.att.add({ draftId, attachments: toRaw(form.attachments) })
    draftStore.refreshList++
    show.value = false
    await nextTick(() => {
      resetForm()
    })
  }).catch((action) => {
    if (action === 'cancel') {
      show.value = false
      resetForm()
    }
  })
}
</script>

<style scoped lang="scss">
/* Composer Container Window */
.send {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;

  &.is-modal {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.mf-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1040;
}

/* Mailflare Box Frames */
.write-box {
  pointer-events: auto;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.2);
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  /* Standard Docked Floating Window (Bottom-Right) */
  &.box-normal {
    position: fixed;
    right: 24px;
    bottom: 0;
    width: min(660px, calc(100vw - 24px));
    height: min(580px, calc(100vh - 40px));
    max-width: 100vw;
    border-radius: 14px 14px 0 0;
    z-index: 1010;

    @media (max-width: 640px) {
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      border-radius: 0;
    }
  }

  /* Minimized Docked Bar (38px high) */
  &.box-minimized {
    position: fixed;
    right: 28px;
    bottom: 0;
    width: 280px;
    height: 38px;
    border-radius: 8px 8px 0 0;
    background: #1f2937;
    color: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    z-index: 1010;
    cursor: pointer;
  }

  /* Maximized Modal (Centered) */
  &.box-modal {
    position: relative;
    width: min(880px, calc(100vw - 32px));
    height: min(780px, 86vh);
    border-radius: 12px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
    z-index: 1050;
  }
}

:root.dark .write-box,
.dark .write-box {
  background: #18191c;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
}

/* Drag Overlay */
.mf-drag-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(239, 246, 255, 0.94);
  border: 2px dashed #3b82f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #1d4ed8;
  pointer-events: none;

  .mf-drag-text {
    font-size: 14px;
    font-weight: 500;
  }
}

:root.dark .mf-drag-overlay,
.dark .mf-drag-overlay {
  background: rgba(17, 24, 39, 0.94);
  border-color: #60a5fa;
  color: #93c5fd;
}

.hidden-file-input {
  display: none;
}

/* Mailflare Dark Header */
.mf-compose-header {
  height: 38px;
  background: #1f2937;
  color: #ffffff;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  user-select: none;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    overflow: hidden;

    .header-type-icon {
      color: #9ca3af;
      flex-shrink: 0;
    }

    .header-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 4px;

    .mf-hdr-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: #d1d5db;
      cursor: pointer;
      transition: all 120ms ease;

      &:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #ffffff;
      }

      &.mf-close-btn:hover {
        background: #dc2626;
        color: #ffffff;
      }
    }
  }
}

:root.dark .mf-compose-header,
.dark .mf-compose-header {
  background: #111827;
}

/* Composer Form Body */
.mf-compose-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* Mailflare Borderless Form Rows */
.mf-form-row {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 13px;
  position: relative;
  min-height: 36px;
}

:root.dark .mf-form-row,
.dark .mf-form-row {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.mf-field-label {
  width: 44px;
  flex-shrink: 0;
  color: #6b7280;
  font-size: 12.5px;
  font-weight: 500;
}

:root.dark .mf-field-label,
.dark .mf-field-label {
  color: #9ca3af;
}

.mf-sender-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  .mf-sender-name {
    font-weight: 500;
    color: #111827;
  }

  .mf-sender-email {
    color: #6b7280;
  }
}

:root.dark .mf-sender-wrapper {
  .mf-sender-name {
    color: #f3f4f6;
  }
  .mf-sender-email {
    color: #9ca3af;
  }
}

/* Recipient Chips & Input */
.mf-chips-container {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
  position: relative;
}

.mf-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 9999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  color: #1f2937;
  max-width: 100%;

  &.is-invalid {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .mf-chip-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mf-chip-del {
    border: none;
    background: transparent;
    color: #9ca3af;
    font-size: 11px;
    cursor: pointer;
    padding: 0 1px;

    &:hover {
      color: #111827;
    }
  }
}

:root.dark .mf-chip,
.dark .mf-chip {
  background: #26282e;
  border-color: #3b3d45;
  color: #f3f4f6;

  .mf-chip-del:hover {
    color: #ffffff;
  }
}

.mf-clean-input {
  flex: 1;
  min-width: 140px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: inherit;
  font-family: inherit;

  &::placeholder {
    color: #9ca3af;
  }
}

/* Trailing controls in row */
.mf-row-trailing {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.mf-pill-btn {
  border: none;
  background: transparent;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111827;
  }
}

:root.dark .mf-pill-btn,
.dark .mf-pill-btn {
  color: #9ca3af;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
}

.mf-icon-pill {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111827;
  }
}

:root.dark .mf-icon-pill,
.dark .mf-icon-pill {
  color: #9ca3af;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
}

.mf-row-close {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;

  &:hover {
    color: #dc2626;
  }
}

/* Autocomplete Dropdown */
.mf-autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 40;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  width: 280px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

:root.dark .mf-autocomplete-dropdown,
.dark .mf-autocomplete-dropdown {
  background: #222428;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.mf-autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  cursor: pointer;
  color: #374151;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #111827;
  }
}

:root.dark .mf-autocomplete-item,
.dark .mf-autocomplete-item {
  color: #d1d5db;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
}

/* Subject Input */
.mf-subject-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  font-weight: 500;
  color: inherit;
  font-family: inherit;

  &::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }
}

/* Attachments Drawer */
.mf-att-drawer {
  padding: 6px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.015);
}

:root.dark .mf-att-drawer,
.dark .mf-att-drawer {
  border-top-color: rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.mf-att-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 80px;
  overflow-y: auto;
}

.mf-att-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  color: #374151;

  .mf-att-name {
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .mf-att-size {
    color: #9ca3af;
    font-size: 11px;
  }

  .mf-att-remove {
    border: none;
    background: transparent;
    color: #9ca3af;
    font-size: 11px;
    cursor: pointer;
    padding: 0 2px;

    &:hover {
      color: #dc2626;
    }
  }
}

:root.dark .mf-att-chip,
.dark .mf-att-chip {
  background: #26282e;
  border-color: #3b3d45;
  color: #e5e7eb;
}

/* Mailflare Primary Send Split Button */
.mf-send-split-group {
  display: inline-flex;
  align-items: stretch;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

  .mf-primary-send-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #2563eb;
    color: #ffffff;
    border: none;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background 120ms ease;

    &:hover:not(:disabled) {
      background: #1d4ed8;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .mf-send-arrow-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 7px;
    background: #1d4ed8;
    color: #ffffff;
    border: none;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: background 120ms ease;

    &:hover:not(:disabled) {
      background: #1e40af;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

/* Scheduled Pill */
.mf-scheduled-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: rgba(245, 158, 11, 0.25);
  }

  .mf-pill-cancel {
    font-size: 10px;
    margin-left: 2px;
  }
}

:root.dark .mf-scheduled-pill,
.dark .mf-scheduled-pill {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.35);
}

/* Utility Tool Buttons in Bottom Bar */
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

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #111827;
  }

  &.is-active-blue {
    color: #2563eb;
    background: rgba(37, 99, 235, 0.1);
  }

  &.is-active-amber {
    color: #d97706;
    background: rgba(217, 119, 6, 0.12);
  }

  &.mf-trash-btn:hover {
    background: #fef2f2;
    color: #dc2626;
  }
}

:root.dark .mf-tool-btn,
.dark .mf-tool-btn {
  color: #9ca3af;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  &.is-active-blue {
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.18);
  }

  &.is-active-amber {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.2);
  }

  &.mf-trash-btn:hover {
    background: rgba(220, 38, 38, 0.2);
    color: #f87171;
  }
}

/* Template Item Dropdown */
.mf-tpl-item-content {
  display: flex;
  flex-direction: column;
  padding: 2px 0;

  .mf-tpl-title {
    font-size: 13px;
    font-weight: 500;
  }

  .mf-tpl-preview {
    font-size: 11px;
    opacity: 0.65;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.contacts-bottom {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 8px;
}

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
