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
                Choose the exact tools each MCP agent can use. Existing unscoped keys must be replaced. Adding tools requires reauthorization and a new key.
              </p>
            </div>
          </div>
          <div class="header-actions">
            <button class="primary-action-btn" type="button" @click="openCreate">
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

          <div v-else class="table-responsive">
            <table class="keys-table">
              <thead>
                <tr>
                  <th>Key Name</th>
                  <th>Key Token</th>
                  <th>Authorized tools</th>
                  <th>Created</th>
                  <th>Expires</th>
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
                  <td class="text-muted">{{ k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never' }}</td>
                  <td class="text-right">
                    <el-button size="small" @click="reauthorizeKey(k)">Reauthorize tools</el-button>
                    <button class="revoke-btn" type="button" @click="revokeKey(k)">
                      <Icon icon="hugeicons:delete-02" width="14" height="14" />
                      <span>Revoke</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- Create Key Modal Dialog -->
    <el-dialog
      v-model="showCreateModal"
      :title="editingKey ? 'Reauthorize MCP tools' : 'Authorize MCP connection'"
      width="560px"
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
          <label class="form-label">Tools this agent may use</label>
          <div class="scopes-checkbox-group">
            <el-checkbox v-for="tool in MCP_TOOLS" :key="tool.name" v-model="form.scopes" :label="tool.name">
              <span class="scope-row"><strong class="scope-code">{{ tool.name }}</strong><span class="scope-desc"> — {{ tool.description }}</span></span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="showCreateModal = false">Cancel</el-button>
          <el-button type="primary" :loading="creating" @click="submitCreateKey">
            Authorize selected tools
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import http from '@/axios/index.js'
import { MCP_TOOLS } from '@/utils/mcp-tools.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const editingKey = ref(null)

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
  scopes: []
})

const claudeDesktopConfig = computed(() => {
  const sampleKey = newlyIssuedKey.value?.fullKey || 'YOUR_AUTHORIZED_MCP_KEY'
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
  const sampleKey = newlyIssuedKey.value?.fullKey || 'YOUR_AUTHORIZED_MCP_KEY'
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
  loadKeys()
})

async function loadKeys() {
  loading.value = true
  try { keysList.value = await http.get('/admin/api-keys') }
  catch (error) { ElMessage.error('Could not load authorized connections. Please retry.') }
  finally { loading.value = false }
}

function openCreate() {
  editingKey.value = null
  form.name = ''
  form.expiration = '90d'
  form.scopes = []
  showCreateModal.value = true
}

function reauthorizeKey(key) {
  editingKey.value = key.id
  form.name = key.name
  form.expiration = key.expiration || '90d'
  form.scopes = [...key.scopes]
  showCreateModal.value = true
}

async function submitCreateKey() {
  if (!form.name.trim() || !form.scopes.length) {
    ElMessage.error('Enter a connection name and select at least one tool.')
    return
  }
  try {
    await ElMessageBox.confirm(
      `Authorize "${form.name.trim()}" to use: ${form.scopes.join(', ')}?` +
      (editingKey.value ? ' This replaces the existing key. Update your agent with the new key.' : ''),
      'Authorize selected MCP tools', { confirmButtonText: 'Authorize', cancelButtonText: 'Cancel' }
    )
  } catch { return }
  creating.value = true
  try {
    newlyIssuedKey.value = await http.post(editingKey.value ? `/admin/api-keys/${editingKey.value}/reauthorize` : '/admin/api-keys', {
      name: form.name.trim(), scopes: [...form.scopes], expiration: form.expiration, confirmAuthorization: true
    })
    showCreateModal.value = false
    await loadKeys()
    ElMessage.success('Selected tools authorized. Copy the new key into your agent.')
  } catch (error) { ElMessage.error(error.message || 'Authorization failed. Please retry.') }
  finally { creating.value = false }
}

async function revokeKey(key) {
  try {
    await ElMessageBox.confirm(`Revoke "${key.name}"? Its agent will lose access.`, 'Revoke connection', { confirmButtonText: 'Revoke', cancelButtonText: 'Cancel' })
  } catch { return }
  try {
    await http.delete(`/admin/api-keys/${key.id}`)
    if (newlyIssuedKey.value?.id === key.id) newlyIssuedKey.value = null
    await loadKeys()
    ElMessage.success('Connection revoked')
  } catch (error) { ElMessage.error('Revocation failed. Please retry.') }
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
:deep(.el-checkbox) { height: auto; padding: 8px 0; align-items: flex-start; }
:deep(.el-checkbox__label) { white-space: normal; line-height: 1.5; }

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
</style>
