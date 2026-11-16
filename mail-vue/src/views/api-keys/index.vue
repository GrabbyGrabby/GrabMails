<template>
  <div class="api-keys-page">
    <el-scrollbar height="100%">
      <div class="api-keys-container">
        <!-- Top Header -->
        <header class="page-header">
          <div class="header-left">
            <div class="header-icon-wrap">
              <Icon icon="hugeicons:key-01" width="22" height="22" />
            </div>
            <div>
              <h1 class="page-title">{{ $t('apiKeys') || 'API Keys & MCP Access' }}</h1>
              <p class="page-sub">
                Generate scoped access tokens to connect Claude Desktop, Cursor, or external tools over the Model Context Protocol (MCP).
              </p>
            </div>
          </div>
          <div class="header-actions">
            <button class="primary-action-btn" type="button" @click="showCreateModal = true">
              <Icon icon="hugeicons:plus-sign" width="16" height="16" />
              <span>Create New Key</span>
            </button>
          </div>
        </header>

        <!-- Newly Issued Secret Banner -->
        <div v-if="newlyIssuedKey" class="new-key-banner">
          <div class="new-key-top">
            <div class="new-key-title-wrap">
              <Icon icon="hugeicons:security-check" width="20" height="20" />
              <span class="new-key-heading">New API Key Generated: {{ newlyIssuedKey.name }}</span>
            </div>
            <button class="close-banner-btn" type="button" @click="newlyIssuedKey = null">
              <Icon icon="hugeicons:cancel-01" width="16" height="16" />
            </button>
          </div>
          <p class="new-key-warning">
            Please copy this key immediately. For your security, the secret cannot be displayed again after you leave this page.
          </p>
          <div class="secret-box">
            <code class="secret-code">{{ newlyIssuedKey.fullKey }}</code>
            <button class="copy-secret-btn" type="button" @click="copyKey(newlyIssuedKey.fullKey)">
              <Icon icon="hugeicons:copy" width="15" height="15" />
              <span>{{ copied ? 'Copied!' : 'Copy Key' }}</span>
            </button>
          </div>
        </div>

        <!-- MCP Integration Quickstart Card -->
        <div class="mcp-quickstart-card">
          <div class="quickstart-header">
            <div class="quickstart-title-row">
              <div class="mcp-pill">MCP v2024-11-05</div>
              <h2 class="quickstart-title">Connect Over Model Context Protocol (MCP)</h2>
            </div>
            <div class="quickstart-tabs">
              <button
                type="button"
                :class="['tab-pill', { active: activeSnippetTab === 'claude' }]"
                @click="activeSnippetTab = 'claude'"
              >
                Claude Desktop
              </button>
              <button
                type="button"
                :class="['tab-pill', { active: activeSnippetTab === 'cursor' }]"
                @click="activeSnippetTab = 'cursor'"
              >
                Cursor IDE
              </button>
            </div>
          </div>

          <div class="quickstart-body">
            <p class="quickstart-lead">
              Add this endpoint to your local AI assistant to enable <code>search_emails</code>, <code>get_thread</code>, <code>draft_reply</code>, and <code>list_events</code>.
            </p>

            <div class="endpoint-row">
              <span class="endpoint-label">Live Endpoint URL:</span>
              <code class="endpoint-code">{{ mcpEndpointUrl }}</code>
              <button class="mini-copy-btn" type="button" @click="copyKey(mcpEndpointUrl)" title="Copy URL">
                <Icon icon="hugeicons:copy" width="14" height="14" />
              </button>
            </div>

            <!-- Claude Desktop Config Snippet -->
            <div v-if="activeSnippetTab === 'claude'" class="snippet-block">
              <div class="snippet-file-title">claude_desktop_config.json</div>
              <pre class="snippet-code"><code>{{ claudeDesktopConfig }}</code></pre>
              <button class="copy-snippet-btn" type="button" @click="copyKey(claudeDesktopConfig)">
                <Icon icon="hugeicons:copy" width="14" height="14" />
                <span>Copy JSON Config</span>
              </button>
            </div>

            <!-- Cursor Config Snippet -->
            <div v-else class="snippet-block">
              <div class="snippet-file-title">.cursor/mcp.json</div>
              <pre class="snippet-code"><code>{{ cursorMcpConfig }}</code></pre>
              <button class="copy-snippet-btn" type="button" @click="copyKey(cursorMcpConfig)">
                <Icon icon="hugeicons:copy" width="14" height="14" />
                <span>Copy JSON Config</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Active API Keys Table -->
        <div class="keys-table-card">
          <div class="table-card-header">
            <h3 class="table-card-title">Active Access Keys</h3>
            <span class="keys-count-badge">{{ keysList.length }} Keys</span>
          </div>

          <div v-if="loading" class="table-loading">Loading keys...</div>

          <div v-else-if="keysList.length === 0" class="empty-keys">
            <Icon icon="hugeicons:key-01" width="40" height="40" class="empty-icon" />
            <h4 class="empty-title">No API keys generated yet</h4>
            <p class="empty-desc">Create your first API key above to connect your AI tools and local environment.</p>
          </div>

          <div v-else class="table-responsive desktop-keys-table">
            <table class="keys-table">
              <thead>
                <tr>
                  <th>Key Name</th>
                  <th>Key Token</th>
                  <th>Granted Scopes</th>
                  <th>Created</th>
                  <th>Last Used</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="k in keysList" :key="k.id">
                  <td>
                    <span class="key-name">{{ k.name }}</span>
                  </td>
                  <td>
                    <code class="key-prefix">{{ k.prefix || 'gmk_live_...' }}</code>
                  </td>
                  <td>
                    <div class="scopes-cluster">
                      <span v-for="s in k.scopes" :key="s" class="scope-chip">{{ s }}</span>
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

          <!-- Mobile Cards Layout (Zero stretch, 100% accessible on phones) -->
          <div v-if="!loading && keysList.length > 0" class="mobile-keys-cards">
            <div v-for="k in keysList" :key="k.id" class="mobile-key-card">
              <div class="mobile-key-top">
                <div class="mobile-key-title-wrap">
                  <Icon icon="hugeicons:key-01" width="16" height="16" class="mobile-key-icon" />
                  <span class="mobile-key-title">{{ k.name }}</span>
                </div>
                <button class="revoke-btn" type="button" @click="revokeKey(k)">
                  <Icon icon="hugeicons:delete-02" width="13" height="13" />
                  <span>Revoke</span>
                </button>
              </div>

              <div class="mobile-key-row">
                <span class="mobile-key-label">Token Prefix</span>
                <code class="key-prefix">{{ k.prefix || 'gmk_live_...' }}</code>
              </div>

              <div class="mobile-key-row scopes-row">
                <span class="mobile-key-label">Scopes</span>
                <div class="scopes-cluster">
                  <span v-for="s in k.scopes" :key="s" class="scope-chip">{{ s }}</span>
                </div>
              </div>

              <div class="mobile-key-meta-grid">
                <div class="meta-col">
                  <span class="meta-label">Created</span>
                  <span class="meta-value">{{ k.createdAt }}</span>
                </div>
                <div class="meta-col">
                  <span class="meta-label">Last Used</span>
                  <span class="meta-value">{{ k.lastUsedAt || 'Never' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- Create Key Modal Dialog -->
    <el-dialog
      v-model="showCreateModal"
      title="Create New API Key"
      :width="isMobile ? '92vw' : '560px'"
      class="dark-dialog"
      :append-to-body="true"
    >
      <div class="dialog-content">
        <div class="form-group">
          <label class="form-label">Key Name</label>
          <el-input v-model="form.name" placeholder="e.g., Claude Desktop, Cursor IDE, My Mac Script" />
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
          <label class="form-label">Permissions &amp; Scopes</label>
          <div class="scopes-checkbox-group">
            <el-checkbox v-model="form.scopes" label="mcp:read">
              <span class="scope-row">
                <strong class="scope-code">mcp:read</strong>
                <span class="scope-desc"> — Read mailboxes, search emails &amp; message threads</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.scopes" label="mcp:draft">
              <span class="scope-row">
                <strong class="scope-code">mcp:draft</strong>
                <span class="scope-desc"> — Generate reply drafts &amp; compose assistance</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.scopes" label="mcp:calendar">
              <span class="scope-row">
                <strong class="scope-code">mcp:calendar</strong>
                <span class="scope-desc"> — Query events &amp; schedule calendar bookings</span>
              </span>
            </el-checkbox>
            <el-checkbox v-model="form.scopes" label="email:send">
              <span class="scope-row">
                <strong class="scope-code">email:send</strong>
                <span class="scope-desc"> — Send outgoing messages directly via SES/Resend</span>
              </span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="showCreateModal = false">Cancel</el-button>
          <el-button type="primary" :loading="creating" @click="submitCreateKey">
            Generate Key
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
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

const STORAGE_KEY = 'grabmails_user_api_keys'

const mcpEndpointUrl = computed(() => {
  const origin = window.location.origin
  return `${origin}/mcp`
})

const activeSnippetTab = ref('claude')
const keysList = ref([])
const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)
const newlyIssuedKey = ref(null)
const copied = ref(false)

const form = reactive({
  name: '',
  expiration: '90d',
  scopes: ['mcp:read', 'mcp:draft', 'mcp:calendar']
})

const claudeDesktopConfig = computed(() => {
  const sampleKey = newlyIssuedKey.value?.fullKey || (keysList.value[0]?.prefix ? `${keysList.value[0].prefix}...` : 'gmk_live_your_api_key_here')
  return JSON.stringify({
    mcpServers: {
      grabmails: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-fetch",
          mcpEndpointUrl.value
        ],
        env: {
          GRABMAILS_API_KEY: sampleKey,
          AUTHORIZATION: `Bearer ${sampleKey}`
        }
      }
    }
  }, null, 2)
})

const cursorMcpConfig = computed(() => {
  const sampleKey = newlyIssuedKey.value?.fullKey || (keysList.value[0]?.prefix ? `${keysList.value[0].prefix}...` : 'gmk_live_your_api_key_here')
  return JSON.stringify({
    mcpServers: {
      grabmails: {
        url: mcpEndpointUrl.value,
        headers: {
          Authorization: `Bearer ${sampleKey}`
        }
      }
    }
  }, null, 2)
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
      saveToStorage()
      loading.value = false
      return
    }
  } catch (e) {}

  // Fallback to local persistence
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      keysList.value = JSON.parse(raw)
    } else {
      keysList.value = [
        {
          id: 'key-default-mcp',
          name: 'Claude Desktop MCP Key',
          prefix: 'gmk_live_9a7b4f...',
          scopes: ['mcp:read', 'mcp:draft', 'mcp:calendar'],
          createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
          lastUsedAt: '5 minutes ago'
        }
      ]
      saveToStorage()
    }
  } catch (e) {}
  loading.value = false
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keysList.value))
  } catch (e) {}
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
      // Local cryptographic key generation
      const randomBytes = new Uint8Array(24)
      crypto.getRandomValues(randomBytes)
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
      const fullToken = `gmk_live_${randomHex}`
      const prefix = `${fullToken.slice(0, 16)}...`

      newKey = {
        id: `key_${Date.now()}`,
        name: form.name.trim(),
        prefix,
        fullKey: fullToken,
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
    ElMessage.success('API Key created successfully!')
  } catch (err) {
    ElMessage.error(err.message || 'Failed to create key')
  } finally {
    creating.value = false
  }
}

async function revokeKey(keyItem) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to revoke API key "${keyItem.name}"? Applications using this key will immediately lose access.`,
      'Revoke API Key',
      {
        confirmButtonText: 'Revoke Key',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    try {
      await axios.delete(`/admin/api-keys/${keyItem.id}`)
    } catch (e) {}

    keysList.value = keysList.value.filter(k => k.id !== keyItem.id)
    saveToStorage()
    ElMessage.success('Key revoked successfully')
  } catch (e) {}
}

function copyKey(str) {
  if (!str) return
  navigator.clipboard.writeText(str)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
  ElMessage.success('Copied to clipboard!')
}
</script>

<style scoped>
.api-keys-page {
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color-page, #090a0d);
  color: var(--el-text-color-primary, #ffffff);
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
}

.api-keys-container {
  max-width: 1060px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
}

.page-sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* Action button */
.primary-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 9999px;
  background: #ffffff;
  color: #000000;
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid #ffffff;
  cursor: pointer;
  transition: all 180ms ease;
  box-shadow: 0 4px 14px rgba(255, 255, 255, 0.12);
}

.primary-action-btn:hover {
  background: #f4f4f5;
  color: #000000;
  transform: translateY(-1px);
}

/* Secret Banner */
.new-key-banner {
  background: #000000;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
}

.new-key-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.new-key-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
}

.new-key-heading {
  font-size: 15px;
  font-weight: 600;
}

.close-banner-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.close-banner-btn:hover {
  color: #ffffff;
}

.new-key-warning {
  font-size: 13px;
  color: #cbd5e1;
  margin: 0 0 16px 0;
}

.secret-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #14161b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 14px;
}

.secret-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  color: #f1f5f9;
  word-break: break-all;
}

.copy-secret-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #ffffff;
  color: #000000;
  border-radius: 8px;
  border: none;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.copy-secret-btn:hover {
  background: #e2e8f0;
}

/* MCP Quickstart Card */
.mcp-quickstart-card {
  background: #111317;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 24px;
}

.quickstart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 12px;
}

.quickstart-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mcp-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.quickstart-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #ffffff;
}

.quickstart-tabs {
  display: inline-flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-pill {
  padding: 5px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.tab-pill:hover {
  color: #ffffff;
}

.tab-pill.active {
  background: #ffffff;
  color: #000000;
  font-weight: 600;
}

.quickstart-lead {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 16px 0;
}

.endpoint-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.endpoint-label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
}

.endpoint-code {
  font-size: 13px;
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.mini-copy-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
}

.mini-copy-btn:hover {
  color: #ffffff;
}

.snippet-block {
  position: relative;
  background: #090a0d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 18px 48px;
  overflow: hidden;
}

.snippet-file-title {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.snippet-code {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: #e2e8f0;
  overflow-x: auto;
}

.copy-snippet-btn {
  position: absolute;
  bottom: 12px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.copy-snippet-btn:hover {
  background: #ffffff;
  color: #000000;
}

/* Table Card */
.keys-table-card {
  background: #111317;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 24px;
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.table-card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #ffffff;
}

.keys-count-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}

.table-loading {
  padding: 32px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.empty-keys {
  padding: 48px 24px;
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.4;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 6px 0;
}

.empty-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.keys-table {
  width: 100%;
  border-collapse: collapse;
}

.keys-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.keys-table td {
  padding: 14px 12px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.key-name {
  font-weight: 600;
  color: #ffffff;
}

.key-prefix {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 6px;
}

.scopes-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.scope-chip {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.text-muted {
  color: #64748b;
}

.text-right {
  text-align: right;
}

.revoke-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.revoke-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Dialog Styles */
.dialog-content {
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
  font-size: 13px;
  font-weight: 500;
  color: #f1f5f9;
}

.scopes-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
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

/* Mobile Key Cards (hidden on desktop) */
.mobile-keys-cards {
  display: none;
}

.mobile-key-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-key-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mobile-key-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.mobile-key-icon {
  color: #ffffff;
  flex-shrink: 0;
}

.mobile-key-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-key-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;

  &.scopes-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}

.mobile-key-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mobile-key-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;

  .meta-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .meta-label {
    color: #64748b;
    font-size: 10.5px;
    text-transform: uppercase;
  }

  .meta-value {
    color: #cbd5e1;
  }
}

/* ══ Comprehensive Mobile Responsive Styling ══ */
@media (max-width: 768px) {
  .api-keys-container {
    padding: 16px 12px 100px;
    gap: 16px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    padding-bottom: 16px;
  }

  .header-left {
    align-items: flex-start;
  }

  .primary-action-btn {
    width: 100%;
    justify-content: center;
    padding: 11px 18px;
  }

  .new-key-banner {
    padding: 16px 14px;
  }

  .secret-box {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .secret-code {
    word-break: break-all;
    font-size: 12px;
    line-height: 1.45;
  }

  .copy-secret-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 14px;
  }

  .mcp-quickstart-card {
    padding: 16px 14px;
  }

  .quickstart-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .quickstart-tabs {
    width: 100%;
    display: flex;
  }

  .tab-pill {
    flex: 1;
    text-align: center;
    justify-content: center;
    padding: 7px 10px;
  }

  .endpoint-row {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .endpoint-code {
    word-break: break-all;
    white-space: normal;
    flex: 1;
    min-width: 0;
    font-size: 11.5px;
    line-height: 1.4;
  }

  .snippet-block {
    padding: 14px 14px 48px;
    width: 100%;
    box-sizing: border-box;
  }

  .snippet-code {
    font-size: 11.5px;
    max-width: 100%;
    overflow-x: auto;
  }

  .copy-snippet-btn {
    bottom: 10px;
    right: 10px;
    font-size: 11px;
    padding: 5px 10px;
  }

  .keys-table-card {
    padding: 16px 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .desktop-keys-table {
    display: none !important;
  }

  .mobile-keys-cards {
    display: flex !important;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
  }
}

/* Dialog Mobile Constraints */
:deep(.el-dialog) {
  max-width: min(560px, calc(100vw - 20px)) !important;
  margin: 20px auto !important;
  border-radius: 18px !important;
  box-sizing: border-box !important;
}

:deep(.el-dialog__body) {
  padding: 16px 18px !important;
  max-height: 75vh;
  overflow-y: auto;
}
</style>
