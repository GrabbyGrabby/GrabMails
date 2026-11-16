<template>
  <div class="contacts-page">
    <div class="contacts-layout">
      <!-- Left Sidebar: Contact List & Search -->
      <div class="contacts-sidebar" :class="{ 'hide-mobile': isMobile && showMobileDetail }">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="header-title-row">
            <div class="title-wrap">
              <Icon icon="hugeicons:user-group" width="22" height="22" class="title-icon" />
              <h2 class="title-text">{{ $t('contacts') || 'Contacts' }}</h2>
            </div>
            <span class="count-badge">{{ filteredContacts.length }}</span>
          </div>

          <div class="search-and-action">
            <el-input
              v-model="searchQuery"
              :placeholder="$t('search') || 'Search contacts...'"
              clearable
              class="contact-search-input"
              data-testid="contact-search"
            >
              <template #prefix>
                <Icon icon="hugeicons:search-01" width="16" height="16" class="search-icon" />
              </template>
            </el-input>
            <el-button type="primary" class="add-btn" @click="openCreateDialog" data-testid="add-contact-btn">
              <Icon icon="hugeicons:plus-sign" width="16" height="16" />
              <span class="btn-text">New</span>
            </el-button>
          </div>
        </div>

        <!-- Contact List Scroll -->
        <el-scrollbar class="contact-list-scroll">
          <div v-if="filteredContacts.length === 0" class="empty-list">
            <Icon icon="hugeicons:user-group" width="36" height="36" class="empty-icon" />
            <p class="empty-text">No contacts found</p>
          </div>

          <div
            v-for="contact in filteredContacts"
            :key="contact.contact_id || contact.email"
            class="contact-item"
            :class="{ 'is-selected': selectedContact && selectedContact.email === contact.email }"
            @click="selectContact(contact)"
            data-testid="contact-row"
          >
            <!-- Avatar -->
            <div class="contact-avatar" :style="{ backgroundColor: getAvatarColor(contact.email) }">
              {{ getInitials(contact.display_name || contact.email) }}
            </div>

            <!-- Info -->
            <div class="contact-info">
              <div class="contact-name-row">
                <span class="contact-name">{{ contact.display_name || contact.email.split('@')[0] }}</span>
                <span v-if="contact.blocked" class="blocked-tag">Blocked</span>
              </div>
              <span class="contact-email clickable" title="Click to send email" @click.stop="quickOutreach(contact)">{{ contact.email }}</span>
            </div>

            <!-- Quick Action: Email Outreach -->
            <el-tooltip content="Send Email" placement="top" :show-after="300">
              <button
                type="button"
                class="quick-outreach-btn"
                @click.stop="quickOutreach(contact)"
                aria-label="Send email"
                data-testid="contact-quick-outreach"
              >
                <Icon icon="hugeicons:mail-send-01" width="16" height="16" />
              </button>
            </el-tooltip>
          </div>
        </el-scrollbar>
      </div>

      <!-- Right Main: Contact Details Card -->
      <div class="contacts-detail-pane" :class="{ 'hide-mobile': isMobile && !showMobileDetail }">
        <!-- Mobile Back Button -->
        <div v-if="isMobile && showMobileDetail" class="mobile-nav-bar">
          <button type="button" class="mobile-back-btn" @click="showMobileDetail = false">
            <Icon icon="hugeicons:arrow-left-01" width="18" height="18" />
            <span>All Contacts</span>
          </button>
        </div>

        <template v-if="selectedContact">
          <!-- Banner Card -->
          <div class="contact-card-banner">
            <div class="banner-top">
              <div class="banner-avatar" :style="{ backgroundColor: getAvatarColor(selectedContact.email) }">
                {{ getInitials(selectedContact.display_name || selectedContact.email) }}
              </div>
              <div class="banner-meta">
                <h1 class="banner-name">{{ selectedContact.display_name || selectedContact.email.split('@')[0] }}</h1>
                <p class="banner-email">{{ selectedContact.email }}</p>
                <div class="banner-tags">
                  <span class="tag source-tag">{{ selectedContact.source || 'manual' }}</span>
                  <span v-if="selectedContact.blocked" class="tag blocked-badge">Blocked</span>
                  <span v-else class="tag active-badge">Active</span>
                </div>
              </div>
            </div>

            <!-- Action Toolbar -->
            <div class="banner-actions">
              <el-button type="primary" class="primary-action-btn" @click="quickOutreach(selectedContact)" data-testid="outreach-btn">
                <Icon icon="hugeicons:mail-send-01" width="18" height="18" class="mr-1.5" />
                <span>Send Email</span>
              </el-button>

              <el-button class="action-btn" @click="openEditDialog(selectedContact)">
                <Icon icon="hugeicons:edit-02" width="16" height="16" class="mr-1.5" />
                <span>Edit</span>
              </el-button>

              <el-button
                :type="selectedContact.blocked ? 'success' : 'warning'"
                plain
                class="action-btn"
                @click="toggleBlock(selectedContact)"
              >
                <span>{{ selectedContact.blocked ? 'Unblock' : 'Block' }}</span>
              </el-button>

              <el-button type="danger" plain class="action-btn" @click="confirmDelete(selectedContact)">
                <Icon icon="hugeicons:delete-02" width="16" height="16" />
              </el-button>
            </div>
          </div>

          <!-- Details Grid -->
          <div class="contact-card-body">
            <div class="detail-section">
              <h3 class="section-title">Contact Information</h3>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">Email</span>
                  <span class="cell-value clickable-email" @click="quickOutreach(selectedContact)">
                    {{ selectedContact.email }}
                  </span>
                </div>

                <div class="detail-cell">
                  <span class="cell-label">Full Name</span>
                  <span class="cell-value">{{ selectedContact.display_name || '—' }}</span>
                </div>

                <div class="detail-cell">
                  <span class="cell-label">Created Date</span>
                  <span class="cell-value">{{ formatDate(selectedContact.create_time) }}</span>
                </div>

                <div class="detail-cell">
                  <span class="cell-label">Status</span>
                  <span class="cell-value">{{ selectedContact.blocked ? 'Blocked' : 'Active' }}</span>
                </div>
              </div>
            </div>

            <!-- Notes Section -->
            <div class="detail-section">
              <div class="section-header-row">
                <h3 class="section-title">Notes</h3>
                <el-button size="small" text type="primary" @click="saveNotes">Save Notes</el-button>
              </div>
              <el-input
                v-model="selectedContact.notes"
                type="textarea"
                :rows="4"
                placeholder="Add private notes about this contact..."
                class="contact-notes-input"
              />
            </div>
          </div>
        </template>

        <!-- No Contact Selected -->
        <div v-else class="no-selection-pane">
          <Icon icon="hugeicons:user-group" width="48" height="48" class="no-selection-icon" />
          <h3 class="no-selection-title">Select a Contact</h3>
          <p class="no-selection-desc">Choose a contact from the list or create a new one to view details.</p>
          <el-button type="primary" class="mt-4" @click="openCreateDialog">
            <Icon icon="hugeicons:plus-sign" width="16" height="16" class="mr-1" />
            <span>Create Contact</span>
          </el-button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Contact Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? 'Edit Contact' : 'New Contact'"
      :width="isMobile ? '92%' : '440px'"
      append-to-body
      destroy-on-close
      class="contact-form-dialog"
    >
      <el-form :model="form" label-position="top" class="contact-dialog-form">
        <el-form-item label="Display Name">
          <el-input v-model="form.display_name" placeholder="e.g. John Doe" />
        </el-form-item>

        <el-form-item label="Email Address" required>
          <el-input v-model="form.email" placeholder="name@domain.com" />
        </el-form-item>

        <el-form-item label="Notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="Optional notes..." />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.blocked" label="Block this contact" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleSaveContact">Save</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUiStore } from '@/store/ui.js'
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'

const uiStore = useUiStore()
const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)
const showMobileDetail = ref(false)

const searchQuery = ref('')
const contacts = ref([])
const selectedContact = ref(null)

const dialogVisible = ref(false)
const isEditing = ref(false)
const form = ref({
  contact_id: null,
  display_name: '',
  email: '',
  notes: '',
  blocked: false,
  source: 'manual'
})

const STORAGE_KEY = 'grabmails_contacts'

// Starter Contacts for initial delight
const DEFAULT_CONTACTS = [
  {
    contact_id: 1,
    display_name: 'GrabMails Support',
    email: 'support@grabmails.com',
    source: 'system',
    blocked: 0,
    notes: 'Official GrabMails support desk.',
    create_time: new Date().toISOString()
  },
  {
    contact_id: 2,
    display_name: 'Cloudflare Team',
    email: 'noreply@notify.cloudflare.com',
    source: 'system',
    blocked: 0,
    notes: 'Cloudflare infrastructure alerts.',
    create_time: new Date().toISOString()
  }
]

onMounted(() => {
  loadContacts()
})

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      contacts.value = JSON.parse(raw)
    } else {
      contacts.value = [...DEFAULT_CONTACTS]
      persistContacts()
    }
  } catch (e) {
    contacts.value = [...DEFAULT_CONTACTS]
  }

  if (contacts.value.length > 0 && !selectedContact.value && !isMobile.value) {
    selectedContact.value = contacts.value[0]
  }
}

function persistContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts.value))
}

const filteredContacts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return contacts.value
  return contacts.value.filter(c =>
    (c.display_name && c.display_name.toLowerCase().includes(q)) ||
    (c.email && c.email.toLowerCase().includes(q))
  )
})

function selectContact(contact) {
  selectedContact.value = contact
  showMobileDetail.value = true
}

function quickOutreach(contact) {
  if (!contact || !contact.email) return
  const email = contact.email.trim()

  // 1. Direct invocation via uiStore.writerRef if available
  const writer = uiStore.writerRef?.value || uiStore.writerRef
  if (writer && typeof writer.open === 'function') {
    writer.open({
      receiveEmail: [email],
      to: [email]
    })
  }

  // 2. Broadcast decoupled global event to guarantee opening and recipient population
  window.dispatchEvent(new CustomEvent('grabmails:open-compose', {
    detail: {
      receiveEmail: [email],
      to: [email]
    }
  }))

  ElMessage.success(`Composer opened for ${email}`)
}

function openCreateDialog() {
  isEditing.value = false
  form.value = {
    contact_id: Date.now(),
    display_name: '',
    email: '',
    notes: '',
    blocked: false,
    source: 'manual',
    create_time: new Date().toISOString()
  }
  dialogVisible.value = true
}

function openEditDialog(contact) {
  isEditing.value = true
  form.value = {
    ...contact,
    blocked: Boolean(contact.blocked)
  }
  dialogVisible.value = true
}

function handleSaveContact() {
  const email = form.value.email.trim()
  if (!email || !email.includes('@')) {
    ElMessage.error('Please enter a valid email address')
    return
  }

  if (isEditing.value) {
    const idx = contacts.value.findIndex(c => (c.contact_id && c.contact_id === form.value.contact_id) || c.email === form.value.email)
    if (idx !== -1) {
      contacts.value[idx] = {
        ...contacts.value[idx],
        ...form.value,
        blocked: form.value.blocked ? 1 : 0
      }
      if (selectedContact.value && selectedContact.value.email === form.value.email) {
        selectedContact.value = contacts.value[idx]
      }
    }
    ElMessage.success('Contact updated')
  } else {
    const exists = contacts.value.some(c => c.email.toLowerCase() === email.toLowerCase())
    if (exists) {
      ElMessage.warning('A contact with this email already exists')
      return
    }
    const newContact = {
      ...form.value,
      contact_id: Date.now(),
      blocked: form.value.blocked ? 1 : 0
    }
    contacts.value.unshift(newContact)
    selectedContact.value = newContact
    showMobileDetail.value = true
    ElMessage.success('Contact created')
  }

  persistContacts()
  dialogVisible.value = false
}

function toggleBlock(contact) {
  contact.blocked = contact.blocked ? 0 : 1
  persistContacts()
  ElMessage.info(contact.blocked ? 'Contact blocked' : 'Contact unblocked')
}

function confirmDelete(contact) {
  ElMessageBox.confirm(`Delete ${contact.display_name || contact.email}?`, 'Confirm Deletion', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(() => {
    contacts.value = contacts.value.filter(c => c !== contact)
    if (selectedContact.value === contact) {
      selectedContact.value = contacts.value.length > 0 ? contacts.value[0] : null
      if (!selectedContact.value) {
        showMobileDetail.value = false
      }
    }
    persistContacts()
    ElMessage.success('Contact deleted')
  }).catch(() => {})
}

function saveNotes() {
  persistContacts()
  ElMessage.success('Notes saved')
}

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return '?'
  const clean = nameOrEmail.split('@')[0].trim()
  const parts = clean.split(/[\s._-]+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  '#4f46e5', '#2563eb', '#0284c7', '#0891b2', '#0d9488',
  '#059669', '#d97706', '#ea580c', '#e11d48', '#7c3aed'
]

function getAvatarColor(email) {
  if (!email) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function formatDate(d) {
  if (!d) return '—'
  return dayjs(d).format('MMM D, YYYY')
}
</script>

<style scoped>
.contacts-page {
  height: 100%;
  width: 100%;
  background: var(--el-bg-color-page, #f8fafc);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.contacts-layout {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* ══ Left Sidebar ══ */
.contacts-sidebar {
  width: 320px;
  min-width: 280px;
  max-width: 400px;
  background: var(--el-bg-color, #ffffff);
  border-right: 1px solid var(--el-border-color-lighter, #e2e8f0);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.2s ease;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--el-color-primary, #4f46e5);
}

.title-text {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
  margin: 0;
}

.count-badge {
  font-size: 12px;
  font-weight: 500;
  background: var(--el-fill-color, #f1f5f9);
  color: var(--el-text-color-secondary, #64748b);
  padding: 2px 8px;
  border-radius: 12px;
}

.search-and-action {
  display: flex;
  gap: 8px;
  align-items: center;
}

.contact-search-input {
  flex: 1;
}

.add-btn {
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 500;
}

.btn-text {
  margin-left: 4px;
}

.contact-list-scroll {
  flex: 1;
  overflow: hidden;
}

.empty-list {
  padding: 40px 16px;
  text-align: center;
  color: var(--el-text-color-secondary, #94a3b8);
}

.empty-icon {
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
  margin: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f8fafc);
  position: relative;
}

.contact-item:hover {
  background-color: var(--el-fill-color-light, #f8fafc);
}

.contact-item.is-selected {
  background-color: var(--el-color-primary-light-9, #eef2ff);
}

.contact-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary, #1e293b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.blocked-tag {
  font-size: 10px;
  background: var(--el-color-danger-light-9, #fef2f2);
  color: var(--el-color-danger, #ef4444);
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 500;
}

.contact-email {
  font-size: 12px;
  color: var(--el-text-color-secondary, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s ease;

  &.clickable:hover {
    color: var(--el-color-primary, #4f46e5);
    text-decoration: underline;
  }
}

.quick-outreach-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  color: var(--el-text-color-secondary, #64748b);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.quick-outreach-btn:hover {
  background: var(--el-fill-color, #e2e8f0);
  color: var(--el-color-primary, #4f46e5);
}

/* ══ Right Detail Pane ══ */
.contacts-detail-pane {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  background: var(--el-bg-color-page, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-card-banner {
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.banner-top {
  display: flex;
  align-items: center;
  gap: 20px;
}

.banner-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.banner-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.banner-name {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
  margin: 0;
  word-break: break-word;
}

.banner-email {
  font-size: 14px;
  color: var(--el-text-color-secondary, #64748b);
  margin: 0;
  word-break: break-word;
}

.banner-tags {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: capitalize;
}

.source-tag {
  background: var(--el-fill-color, #f1f5f9);
  color: var(--el-text-color-secondary, #475569);
}

.active-badge {
  background: var(--el-color-success-light-9, #ecfdf5);
  color: var(--el-color-success, #ffffff);
}

.blocked-badge {
  background: var(--el-color-danger-light-9, #fef2f2);
  color: var(--el-color-danger, #ef4444);
}

.banner-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.primary-action-btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 9px 18px;
}

.action-btn {
  border-radius: 8px;
}

.contact-card-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
  margin: 0 0 16px 0;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header-row .section-title {
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #64748b);
  font-weight: 500;
}

.cell-value {
  font-size: 14px;
  color: var(--el-text-color-primary, #0f172a);
  font-weight: 500;
  word-break: break-word;
}

.clickable-email {
  color: var(--el-color-primary, #4f46e5);
  cursor: pointer;
  text-decoration: underline;
}

.contact-notes-input {
  border-radius: 8px;
}

/* ══ Empty Selection State ══ */
.no-selection-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--el-text-color-secondary, #94a3b8);
  padding: 40px 20px;
}

.no-selection-icon {
  margin-bottom: 12px;
  opacity: 0.4;
}

.no-selection-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
  margin: 0 0 6px 0;
}

.no-selection-desc {
  font-size: 14px;
  margin: 0;
  max-width: 320px;
}

/* ══ Mobile Responsive Styles ══ */
.mobile-nav-bar {
  margin-bottom: 4px;
}

.mobile-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--el-fill-color, #f1f5f9);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 8px;
  color: var(--el-color-primary, #4f46e5);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 14px;
  transition: background 0.15s;
}

.mobile-back-btn:hover {
  background: var(--el-fill-color-darker, #e2e8f0);
}

@media (max-width: 767px) {
  .contacts-layout {
    flex-direction: column;
  }

  .contacts-sidebar {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    border-right: none;
  }

  .contacts-sidebar.hide-mobile {
    display: none !important;
  }

  .contacts-detail-pane {
    width: 100% !important;
    padding: 16px;
  }

  .contacts-detail-pane.hide-mobile {
    display: none !important;
  }

  .banner-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .banner-avatar {
    width: 56px;
    height: 56px;
    font-size: 20px;
  }

  .banner-actions {
    flex-direction: column;
    width: 100%;
  }

  .banner-actions .el-button {
    width: 100%;
    margin-left: 0 !important;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
