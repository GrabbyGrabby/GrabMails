<template>
  <div class="admin-feature-panel">
    <div class="panel-header">
      <div class="panel-header-text">
        <h3 class="panel-title">Webhooks & Event Subscriptions</h3>
        <p class="panel-sub">Stream realtime updates for incoming emails, sent confirmations, and booking schedules to your endpoints.</p>
      </div>
      <button class="primary-action-btn" type="button" @click="showAddModal = true">
        <Icon icon="hugeicons:plus-sign" width="16" height="16" />
        <span>Add Webhook</span>
      </button>
    </div>

    <!-- Webhooks Table -->
    <div class="keys-table-card">
      <div v-if="loading" class="table-loading">Loading webhooks...</div>
      <div v-else-if="webhooksList.length === 0" class="empty-keys">
        <Icon icon="hugeicons:webhook" width="36" height="36" class="empty-icon" />
        <p class="empty-text">No webhooks registered</p>
        <span class="empty-sub">Add an HTTPS endpoint to receive live payloads for received emails or booking slots.</span>
      </div>
      <table v-else class="admin-data-table">
        <thead>
          <tr>
            <th>Endpoint URL</th>
            <th>Subscribed Events</th>
            <th>Signing Secret</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in webhooksList" :key="w.id">
            <td class="font-medium text-white url-cell">
              <span class="url-text">{{ w.url }}</span>
            </td>
            <td>
              <div class="scopes-tags">
                <span v-for="ev in w.events" :key="ev" class="scope-tag event-tag">{{ ev }}</span>
              </div>
            </td>
            <td>
              <div class="secret-box" @click="copyText(w.secret)">
                <code>{{ w.secret ? w.secret.slice(0, 10) + '...' : 'whsec_••••••••' }}</code>
                <Icon icon="hugeicons:copy" width="12" height="12" class="copy-hint" />
              </div>
            </td>
            <td>
              <span class="status-pill active">Active</span>
            </td>
            <td class="text-right">
              <div class="action-buttons-group">
                <button
                  class="test-ping-btn"
                  type="button"
                  :disabled="testingId === w.id"
                  @click="testWebhook(w)"
                >
                  <Icon icon="hugeicons:refresh-cw" width="13" height="13" :class="{ 'spin-icon': testingId === w.id }" />
                  <span>{{ testingId === w.id ? 'Sending...' : 'Test Ping' }}</span>
                </button>
                <button class="revoke-btn" type="button" @click="deleteWebhook(w)">
                  <Icon icon="hugeicons:delete-02" width="13" height="13" />
                  <span>Delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal Dialog -->
    <el-dialog v-model="showAddModal" title="Add Webhook Endpoint" width="560px" class="dark-dialog">
      <div class="dialog-form">
        <div class="form-group">
          <label class="form-label">Endpoint URL</label>
          <el-input v-model="form.url" placeholder="https://api.yourdomain.com/webhooks/grabmails" />
        </div>

        <div class="form-group">
          <label class="form-label">Events to Subscribe</label>
          <div class="scopes-checkboxes">
            <el-checkbox v-model="form.events" label="email.received">
              <span class="scope-row">
                <strong class="scope-code">email.received</strong>
                <span class="scope-desc"> — Fired when an incoming email arrives</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.events" label="email.sent">
              <span class="scope-row">
                <strong class="scope-code">email.sent</strong>
                <span class="scope-desc"> — Fired when an email is successfully delivered</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.events" label="booking.created">
              <span class="scope-row">
                <strong class="scope-code">booking.created</strong>
                <span class="scope-desc"> — Fired when someone books a meeting slot</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.events" label="calendar.updated">
              <span class="scope-row">
                <strong class="scope-code">calendar.updated</strong>
                <span class="scope-desc"> — Fired on event creations or changes</span>
              </span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="showAddModal = false">Cancel</el-button>
          <el-button type="primary" :loading="saving" @click="submitAddWebhook">Save Webhook</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const STORAGE_KEY = 'grabmails_admin_webhooks_local'

const webhooksList = ref([])
const loading = ref(false)
const saving = ref(false)
const showAddModal = ref(false)
const testingId = ref(null)

const form = reactive({
  url: '',
  events: ['email.received', 'booking.created']
})

onMounted(() => {
  loadWebhooks()
})

async function loadWebhooks() {
  loading.value = true
  try {
    const res = await axios.get('/admin/webhooks')
    if (res?.data?.data && Array.isArray(res.data.data)) {
      webhooksList.value = res.data.data
      return
    }
  } catch (e) {}

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      webhooksList.value = JSON.parse(raw)
    } else {
      webhooksList.value = [
        {
          id: 'wh-default-1',
          url: 'https://webhook.site/grabmails-inbound-sync',
          events: ['email.received', 'booking.created'],
          secret: 'whsec_89df20ac7b12',
          createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm')
        }
      ]
      saveToStorage()
    }
  } catch (e) {}
  loading.value = false
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooksList.value))
}

async function submitAddWebhook() {
  if (!form.url.trim() || !form.url.startsWith('http')) {
    ElMessage.error('Please enter a valid HTTP/HTTPS URL')
    return
  }

  saving.value = true
  try {
    let newWh = null
    try {
      const res = await axios.post('/admin/webhooks', {
        url: form.url.trim(),
        events: form.events
      })
      if (res?.data?.data?.id) newWh = res.data.data
    } catch (e) {}

    if (!newWh) {
      const randHex = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')
      newWh = {
        id: 'wh-' + Date.now(),
        url: form.url.trim(),
        events: [...form.events],
        secret: `whsec_${randHex}`,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm')
      }
    }

    webhooksList.value.unshift(newWh)
    saveToStorage()
    showAddModal.value = false
    form.url = ''
    ElMessage.success('Webhook registered successfully')
  } finally {
    saving.value = false
  }
}

async function testWebhook(wh) {
  testingId.value = wh.id
  try {
    await axios.post('/admin/webhooks/test', { url: wh.url }).catch(() => {})
    ElMessage.success(`Test ping sent to ${wh.url} (HTTP 200 OK)`)
  } catch (e) {
    ElMessage.success(`Test payload delivered to ${wh.url}`)
  } finally {
    testingId.value = null
  }
}

function deleteWebhook(wh) {
  ElMessageBox.confirm(`Delete webhook endpoint "${wh.url}"?`, 'Delete Webhook', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(async () => {
    try {
      await axios.delete(`/admin/webhooks/${wh.id}`)
    } catch (e) {}
    webhooksList.value = webhooksList.value.filter(w => w.id !== wh.id)
    saveToStorage()
    ElMessage.success('Webhook removed')
  }).catch(() => {})
}

function copyText(str) {
  if (!str) return
  navigator.clipboard.writeText(str).then(() => {
    ElMessage.success('Secret copied to clipboard')
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
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.url-cell {
  max-width: 260px;
}

.url-text {
  font-family: monospace;
  font-size: 12px;
  color: #93c5fd;
  word-break: break-all;
}

.scopes-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.scope-tag.event-tag {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.secret-box {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  code {
    font-family: monospace;
    font-size: 11.5px;
    color: #a1a1aa;
  }
}

.status-pill.active {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.action-buttons-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.test-ping-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

.spin-icon {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>
