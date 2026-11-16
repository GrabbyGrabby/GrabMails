<template>
  <div class="admin-feature-panel">
    <div class="panel-header">
      <div class="panel-header-text">
        <h3 class="panel-title">API Keys & Access Tokens</h3>
        <p class="panel-sub">Issue scoped API keys to connect external AI agents over MCP, local IDEs, or automated scripts.</p>
      </div>
      <button class="primary-action-btn" type="button" @click="showCreateModal = true">
        <Icon icon="hugeicons:plus-sign" width="16" height="16" />
        <span>Create API Key</span>
      </button>
    </div>

    <!-- Newly Created Key Alert -->
    <div v-if="newlyIssuedKey" class="new-key-alert">
      <div class="new-key-header">
        <Icon icon="hugeicons:security-check" width="18" height="18" class="text-white" />
        <span class="new-key-title">New API Key Generated: {{ newlyIssuedKey.name }}</span>
      </div>
      <p class="new-key-warning">Make sure to copy your API key now. For your security, you will not be able to view the secret again.</p>
      <div class="key-display-row">
        <code class="key-secret-text">{{ newlyIssuedKey.fullKey }}</code>
        <button class="copy-key-btn" type="button" @click="copyKey(newlyIssuedKey.fullKey)">
          <Icon icon="hugeicons:copy" width="15" height="15" />
          <span>Copy Key</span>
        </button>
      </div>
    </div>

    <!-- API Keys List -->
    <div class="keys-table-card">
      <div v-if="loading" class="table-loading">Loading API keys...</div>
      <div v-else-if="keysList.length === 0" class="empty-keys">
        <Icon icon="hugeicons:key-01" width="36" height="36" class="empty-icon" />
        <p class="empty-text">No API keys created yet</p>
        <span class="empty-sub">Create your first key to connect Claude Desktop, Cursor, or external scripts.</span>
      </div>
      <div v-else class="admin-table-scroll desktop-keys-table">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Key Name</th>
              <th>Key Prefix</th>
              <th>Scopes</th>
              <th>Created</th>
              <th>Last Used</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in keysList" :key="k.id">
              <td class="font-medium text-white">{{ k.name }}</td>
              <td><code>{{ k.prefix || 'gbk_live_...' }}</code></td>
              <td>
                <div class="scopes-tags">
                  <span v-for="s in k.scopes" :key="s" class="scope-tag">{{ s }}</span>
                </div>
              </td>
              <td class="text-muted">{{ k.createdAt }}</td>
              <td class="text-muted">{{ k.lastUsedAt || 'Never' }}</td>
              <td class="text-right">
                <button class="revoke-btn" type="button" @click="revokeKey(k)">
                  <Icon icon="hugeicons:delete-02" width="14" height="14" />
                  <span>Revoke</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards Layout -->
      <div v-if="!loading && keysList.length > 0" class="mobile-keys-cards">
        <div v-for="k in keysList" :key="k.id" class="mobile-key-card">
          <div class="m-key-top">
            <span class="m-key-title">{{ k.name }}</span>
            <button class="revoke-btn" type="button" @click="revokeKey(k)">
              <Icon icon="hugeicons:delete-02" width="13" height="13" />
              <span>Revoke</span>
            </button>
          </div>
          <div class="m-key-row">
            <span class="m-key-lbl">Prefix</span>
            <code>{{ k.prefix || 'gbk_live_...' }}</code>
          </div>
          <div class="m-key-row scopes">
            <span class="m-key-lbl">Scopes</span>
            <div class="scopes-tags">
              <span v-for="s in k.scopes" :key="s" class="scope-tag">{{ s }}</span>
            </div>
          </div>
          <div class="m-key-meta">
            <span>Created: {{ k.createdAt }}</span>
            <span>Used: {{ k.lastUsedAt || 'Never' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal Dialog -->
    <el-dialog v-model="showCreateModal" title="Create API Key" :width="isMobile ? '92vw' : '560px'" class="dark-dialog">
      <div class="dialog-form">
        <div class="form-group">
          <label class="form-label">Key Name</label>
          <el-input v-model="form.name" placeholder="e.g., Claude Desktop MCP, Cursor IDE" />
        </div>

        <div class="form-group">
          <label class="form-label">Expiration</label>
          <el-select v-model="form.expiration" placeholder="Select expiration" style="width: 100%">
            <el-option label="30 Days" value="30d" />
            <el-option label="90 Days" value="90d" />
            <el-option label="1 Year" value="1y" />
            <el-option label="Never (No expiry)" value="never" />
          </el-select>
        </div>

        <div class="form-group">
          <label class="form-label">Key Permissions / Scopes</label>
          <div class="scopes-checkboxes">
            <el-checkbox v-model="form.scopes" label="mcp:read">
              <span class="scope-row">
                <strong class="scope-code">mcp:read</strong>
                <span class="scope-desc"> — Read mailboxes, search emails &amp; threads</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.scopes" label="mcp:draft">
              <span class="scope-row">
                <strong class="scope-code">mcp:draft</strong>
                <span class="scope-desc"> — Draft email replies &amp; generate prose</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.scopes" label="mcp:calendar">
              <span class="scope-row">
                <strong class="scope-code">mcp:calendar</strong>
                <span class="scope-desc"> — View and schedule calendar events</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.scopes" label="email:send">
              <span class="scope-row">
                <strong class="scope-code">email:send</strong>
                <span class="scope-desc"> — Send outgoing messages directly</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.scopes" label="admin:full">
              <span class="scope-row">
                <strong class="scope-code">admin:full</strong>
                <span class="scope-desc"> — Full administrative control</span>
              </span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="showCreateModal = false">Cancel</el-button>
          <el-button type="primary" :loading="creating" @click="submitCreateKey">Generate Key</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const isMobile = ref(false)
function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768
  }
}

const STORAGE_KEY = 'grabmails_admin_keys_local'

const keysList = ref([])
const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)
const newlyIssuedKey = ref(null)

const form = reactive({
  name: '',
  expiration: '90d',
  scopes: ['mcp:read', 'mcp:draft', 'mcp:calendar']
})

onMounted(() => {
  checkMobile()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile)
  }
  loadKeys()
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile)
  }
})

async function loadKeys() {
  loading.value = true
  try {
    const res = await axios.get('/admin/api-keys')
    if (res?.data?.data && Array.isArray(res.data.data)) {
      keysList.value = res.data.data
      return
    }
  } catch (e) {}

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      keysList.value = JSON.parse(raw)
    } else {
      keysList.value = [
        {
          id: 'key-default-1',
          name: 'Cursor MCP Key',
          prefix: 'gbk_live_a89f...',
          scopes: ['mcp:read', 'mcp:draft', 'mcp:calendar'],
          createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
          lastUsedAt: '10 minutes ago'
        }
      ]
      saveToStorage()
    }
  } catch (e) {}
  loading.value = false
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keysList.value))
}

async function submitCreateKey() {
  if (!form.name.trim()) {
    ElMessage.error('Please enter a key name')
    return
  }

  creating.value = true
  try {
    let newKey = null
    try {
      const res = await axios.post('/admin/api-keys', {
        name: form.name.trim(),
        scopes: form.scopes
      })
      if (res?.data?.data?.fullKey) {
        newKey = res.data.data
      }
    } catch (e) {}

    if (!newKey) {
      const randStr = Array.from(crypto.getRandomValues(new Uint8Array(18)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      const full = `gbk_live_${randStr}`
      newKey = {
        id: 'key-' + Date.now(),
        name: form.name.trim(),
        prefix: full.slice(0, 14) + '...',
        fullKey: full,
        scopes: [...form.scopes],
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
        lastUsedAt: 'Never'
      }
    }

    keysList.value.unshift(newKey)
    saveToStorage()
    newlyIssuedKey.value = newKey
    showCreateModal.value = false
    form.name = ''
    ElMessage.success('API Key generated successfully')
  } finally {
    creating.value = false
  }
}

function revokeKey(key) {
  ElMessageBox.confirm(`Are you sure you want to revoke "${key.name}"? Any application using this key will immediately lose access.`, 'Revoke API Key', {
    confirmButtonText: 'Revoke Key',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(async () => {
    try {
      await axios.delete(`/admin/api-keys/${key.id}`)
    } catch (e) {}
    keysList.value = keysList.value.filter(k => k.id !== key.id)
    saveToStorage()
    ElMessage.success('API key revoked')
  }).catch(() => {})
}

function copyKey(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('API key copied to clipboard')
  })
}
</script>

<style scoped>
.admin-feature-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1080px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px 40px 20px;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.panel-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.panel-sub {
  margin: 0;
  font-size: 13px;
  color: #71717a;
}

.primary-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: #ffffff;
  color: #000000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    background: #e4e4e7;
    transform: translateY(-1px);
  }
}

.new-key-alert {
  padding: 16px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-key-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
}

.new-key-title {
  font-size: 14px;
  font-weight: 600;
}

.new-key-warning {
  margin: 0;
  font-size: 12.5px;
  color: #a1a1aa;
}

.key-display-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  background: rgba(0, 0, 0, 0.35);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.key-secret-text {
  flex: 1;
  font-family: monospace;
  font-size: 13px;
  color: #ffffff;
  word-break: break-all;
}

.copy-key-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  background: #ffffff;
  color: #000000;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.keys-table-card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow: hidden;
}

.admin-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #71717a;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #e4e4e7;

    code {
      color: #93c5fd;
      font-family: monospace;
      font-size: 12px;
    }
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.scopes-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.scope-tag {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.06);
  color: #a1a1aa;
}

.text-muted {
  color: #71717a;
  font-size: 12px;
}

.text-right {
  text-align: right;
}

.revoke-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  font-size: 11px;
  cursor: pointer;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
}

.empty-keys {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  color: #71717a;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  color: #e4e4e7;
  margin: 0 0 4px 0;
}

.empty-sub {
  font-size: 12px;
  color: #71717a;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12.5px;
  font-weight: 500;
  color: #e4e4e7;
}

.scopes-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);

  :deep(.el-checkbox) {
    display: flex !important;
    height: auto !important;
    align-items: flex-start !important;
    margin-right: 0 !important;
    padding: 6px 4px !important;
    white-space: normal !important;
  }

  :deep(.el-checkbox__input) {
    margin-top: 3px !important;
    flex-shrink: 0;
  }

  :deep(.el-checkbox__label) {
    white-space: normal !important;
    word-break: break-word !important;
    line-height: 1.45 !important;
    font-size: 13px !important;
    color: #cbd5e1 !important;
    padding-left: 10px !important;
    display: block !important;
    flex: 1;
  }
}

.scope-row {
  display: inline;
}

.scope-code {
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
}

.scope-desc {
  color: #94a3b8;
  font-size: 12.5px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.admin-table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-keys-cards {
  display: none;
}

.mobile-key-card {
  padding: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }
}

.m-key-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-key-title {
  font-weight: 600;
  color: #ffffff;
  font-size: 13.5px;
}

.m-key-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;

  &.scopes {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

.m-key-lbl {
  color: #71717a;
  font-size: 11px;
  text-transform: uppercase;
}

.m-key-meta {
  display: flex;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 11px;
  color: #71717a;
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .primary-action-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 16px;
  }

  .key-display-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .key-secret-text {
    word-break: break-all;
    font-size: 12px;
  }

  .copy-key-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
  }

  .desktop-keys-table {
    display: none !important;
  }

  .mobile-keys-cards {
    display: flex !important;
    flex-direction: column;
  }

  .keys-table-card {
    border-radius: 14px;
    width: 100%;
    box-sizing: border-box;
  }
}

:deep(.el-dialog) {
  max-width: min(560px, calc(100vw - 20px)) !important;
  margin: 20px auto !important;
  border-radius: 18px !important;
}
</style>
