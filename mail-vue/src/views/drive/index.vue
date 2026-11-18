<template>
  <div class="drive-page">
    <!-- Drive Topbar -->
    <div class="drive-topbar">
      <div class="topbar-left">
        <div class="drive-title-wrap">
          <Icon icon="hugeicons:folder-01" width="22" height="22" class="drive-icon" />
          <h2 class="drive-title">{{ $t('drive') || 'Drive' }}</h2>
        </div>

        <!-- Breadcrumbs -->
        <div v-if="activeTab === 'files'" class="drive-breadcrumbs">
          <span class="crumb-item" :class="{ 'is-root': currentFolderId === null }" @click="goToFolder(null)">
            Root
          </span>
          <template v-for="(folder, idx) in folderTrail" :key="folder.id">
            <span class="crumb-separator">/</span>
            <span
              class="crumb-item"
              :class="{ 'is-current': idx === folderTrail.length - 1 }"
              @click="goToFolder(folder.id)"
            >
              {{ folder.name }}
            </span>
          </template>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Search -->
        <el-input
          v-model="searchQuery"
          placeholder="Search files..."
          clearable
          class="drive-search"
        >
          <template #prefix>
            <Icon icon="hugeicons:search-01" width="16" height="16" class="search-icon" />
          </template>
        </el-input>

        <!-- New Folder -->
        <el-button class="drive-btn" @click="openNewFolderDialog">
          <Icon icon="hugeicons:folder-01" width="16" height="16" class="mr-1" />
          <span>New Folder</span>
        </el-button>

        <!-- Upload File -->
        <el-button type="primary" class="drive-btn" @click="triggerUpload">
          <Icon icon="hugeicons:upload-04" width="16" height="16" class="mr-1" />
          <span>Upload</span>
        </el-button>
        <input ref="fileInputRef" type="file" multiple class="hidden-file-input" @change="handleFileUpload" />
      </div>
    </div>

    <!-- Drive Content Area with Left Nav Tabs -->
    <div class="drive-body">
      <!-- Left Subnav -->
      <div class="drive-nav">
        <button
          type="button"
          class="nav-tab-btn"
          :class="{ 'is-active': activeTab === 'files' }"
          @click="activeTab = 'files'"
        >
          <Icon icon="hugeicons:folder-01" width="18" height="18" />
          <span>All Files</span>
          <span class="tab-count">{{ itemsInCurrentFolder.length }}</span>
        </button>

        <button
          type="button"
          class="nav-tab-btn"
          :class="{ 'is-active': activeTab === 'attachments' }"
          @click="activeTab = 'attachments'"
        >
          <Icon icon="hugeicons:mail-01" width="18" height="18" />
          <span>Email Attachments</span>
          <span class="tab-count">{{ emailAttachments.length }}</span>
        </button>

        <button
          type="button"
          class="nav-tab-btn"
          :class="{ 'is-active': activeTab === 'trash' }"
          @click="activeTab = 'trash'"
        >
          <Icon icon="hugeicons:delete-02" width="18" height="18" />
          <span>Trash</span>
          <span class="tab-count">{{ trashedItems.length }}</span>
        </button>

        <!-- Storage Usage Card -->
        <div class="storage-card">
          <div class="storage-label-row">
            <span class="storage-label">Cloudflare R2</span>
            <span class="storage-text">{{ formatSize(totalStorageUsed) }} / 10 GB</span>
          </div>
          <el-progress
            :percentage="storagePercentage"
            :show-text="false"
            :stroke-width="6"
            color="#4f46e5"
            class="storage-bar"
          />
        </div>
      </div>

      <!-- Main File Browser -->
      <div class="drive-main">
        <!-- Tab 1: All Files & Folders -->
        <div v-if="activeTab === 'files'" class="files-view">
          <div v-if="itemsInCurrentFolder.length === 0" class="empty-drive">
            <Icon icon="hugeicons:folder-01" width="56" height="56" class="empty-icon" />
            <h3 class="empty-title">This folder is empty</h3>
            <p class="empty-desc">Upload files or create subfolders to get started.</p>
            <div class="empty-actions">
              <el-button type="primary" @click="triggerUpload">Upload File</el-button>
              <el-button @click="openNewFolderDialog">Create Folder</el-button>
            </div>
          </div>

          <div v-else class="drive-sections-stack">
            <!-- Folders Section -->
            <div v-if="filteredFolders.length > 0" class="drive-section">
              <div class="section-label-row">
                <span class="section-title">Folders</span>
                <span class="section-badge">{{ filteredFolders.length }}</span>
              </div>
              <div class="folders-grid">
                <div
                  v-for="folder in filteredFolders"
                  :key="folder.id"
                  class="folder-card"
                  @click="goToFolder(folder.id)"
                >
                  <div class="folder-icon-wrap">
                    <Icon icon="hugeicons:folder-01" width="22" height="22" class="folder-svg" />
                  </div>
                  <div class="folder-meta">
                    <span class="folder-name" :title="folder.name">{{ folder.name }}</span>
                    <span class="folder-sub">{{ getSubItemCount(folder.id) }} items</span>
                  </div>
                  <div class="folder-actions" @click.stop>
                    <button type="button" class="mini-action-btn" @click.stop="confirmDelete(folder)" title="Delete">
                      <Icon icon="hugeicons:delete-02" width="14" height="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Files Section -->
            <div v-if="filteredFiles.length > 0" class="drive-section">
              <div class="section-label-row">
                <span class="section-title">Files</span>
                <span class="section-badge">{{ filteredFiles.length }}</span>
              </div>
              <div class="files-grid">
                <div
                  v-for="file in filteredFiles"
                  :key="file.id"
                  class="file-card"
                  @click="previewFile(file)"
                >
                  <div class="file-thumb" :style="{ backgroundColor: getFileBg(file.name) }">
                    <Icon :icon="getFileIcon(file.name)" width="32" height="32" class="file-type-icon" />
                  </div>
                  <div class="file-meta">
                    <span class="file-name" :title="file.name">{{ file.name }}</span>
                    <div class="file-sub-row">
                      <span class="file-size">{{ formatSize(file.size) }}</span>
                      <span class="file-date">{{ formatDate(file.created_at) }}</span>
                    </div>
                  </div>
                  <div class="file-actions" @click.stop>
                    <button type="button" class="mini-action-btn" @click.stop="previewFile(file)" title="Preview">
                      <Icon icon="hugeicons:search-01" width="14" height="14" />
                    </button>
                    <button type="button" class="mini-action-btn" @click.stop="copyShareLink(file)" title="Share Link">
                      <Icon icon="hugeicons:link-01" width="14" height="14" />
                    </button>
                    <button type="button" class="mini-action-btn" @click.stop="downloadFile(file)" title="Download">
                      <Icon icon="hugeicons:download-04" width="14" height="14" />
                    </button>
                    <button type="button" class="mini-action-btn danger" @click.stop="confirmDelete(file)" title="Delete">
                      <Icon icon="hugeicons:delete-02" width="14" height="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Unified Email Attachments Explorer -->
        <div v-else-if="activeTab === 'attachments'" class="attachments-view">
          <div class="section-subhead">
            <h3>Email Attachment Explorer</h3>
            <p>Automatically indexed attachments extracted from your incoming and sent mail.</p>
          </div>

          <div v-if="emailAttachments.length === 0" class="empty-drive">
            <Icon icon="hugeicons:mail-01" width="56" height="56" class="empty-icon" />
            <h3 class="empty-title">No email attachments found</h3>
            <p class="empty-desc">Attachments sent or received in emails will appear here automatically.</p>
          </div>

          <div v-else class="attachments-content-wrap">
            <!-- Desktop Table View -->
            <div class="attachments-table-wrap desktop-attachments-table">
              <el-table :data="emailAttachments" style="width: 100%" class="attachments-table">
                <el-table-column label="File Name" min-width="220">
                  <template #default="{ row }">
                    <div class="table-file-cell">
                      <Icon :icon="getFileIcon(row.name)" width="20" height="20" class="mr-2" />
                      <span class="file-table-name" :title="row.name">{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="emailSubject" label="Email Subject" min-width="200" />
                <el-table-column prop="sender" label="From / To" min-width="160" />
                <el-table-column label="Size" width="110">
                  <template #default="{ row }">
                    {{ formatSize(row.size) }}
                  </template>
                </el-table-column>
                <el-table-column label="Date" width="120">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="200" align="right">
                  <template #default="{ row }">
                    <div class="att-table-actions">
                      <button type="button" class="att-theme-btn" @click="previewFile(row)">
                        <Icon icon="hugeicons:view" width="14" height="14" />
                        <span>Preview</span>
                      </button>
                      <button type="button" class="att-theme-btn" @click="downloadFile(row)">
                        <Icon icon="hugeicons:download-04" width="14" height="14" />
                        <span>Download</span>
                      </button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- Mobile Card List View (100% visible, zero horizontal cutoff) -->
            <div class="mobile-attachments-list">
              <div v-for="row in emailAttachments" :key="row.id" class="mobile-att-card">
                <div class="m-att-header">
                  <div class="m-att-icon-wrap" :style="{ backgroundColor: getFileBg(row.name) }">
                    <Icon :icon="getFileIcon(row.name)" width="20" height="20" />
                  </div>
                  <div class="m-att-title-col">
                    <div class="m-att-filename" :title="row.name">{{ row.name }}</div>
                    <div class="m-att-meta-row">
                      <span>{{ formatSize(row.size) }}</span>
                      <span>&bull;</span>
                      <span>{{ formatDate(row.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <div class="m-att-email-info">
                  <div v-if="row.emailSubject" class="m-att-subject">
                    <Icon icon="hugeicons:mail-01" width="13" height="13" class="m-att-meta-icon" />
                    <span>{{ row.emailSubject }}</span>
                  </div>
                  <div v-if="row.sender" class="m-att-sender">
                    <Icon icon="hugeicons:user" width="13" height="13" class="m-att-meta-icon" />
                    <span>{{ row.sender }}</span>
                  </div>
                </div>

                <div class="m-att-actions">
                  <button type="button" class="att-theme-btn" @click="previewFile(row)">
                    <Icon icon="hugeicons:view" width="14" height="14" />
                    <span>Preview</span>
                  </button>
                  <button type="button" class="att-theme-btn" @click="downloadFile(row)">
                    <Icon icon="hugeicons:download-04" width="14" height="14" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Trash -->
        <div v-else-if="activeTab === 'trash'" class="trash-view">
          <div class="section-subhead">
            <h3>Trash</h3>
            <p>Items in trash are permanently deleted after 30 days.</p>
          </div>

          <div v-if="trashedItems.length === 0" class="empty-drive">
            <Icon icon="hugeicons:delete-02" width="56" height="56" class="empty-icon" />
            <h3 class="empty-title">Trash is empty</h3>
          </div>

          <div v-else class="items-grid">
            <div v-for="item in trashedItems" :key="item.id" class="grid-item file-card">
              <div class="file-thumb" :style="{ backgroundColor: getFileBg(item.name) }">
                <Icon :icon="getFileIcon(item.name)" width="32" height="32" />
              </div>
              <div class="file-meta">
                <span class="file-name">{{ item.name }}</span>
                <span class="file-size">{{ formatSize(item.size) }}</span>
              </div>
              <div class="file-actions">
                <el-button size="small" text type="success" @click="restoreItem(item)">Restore</el-button>
                <el-button size="small" text type="danger" @click="permanentDelete(item)">Delete Forever</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Folder Dialog -->
    <el-dialog v-model="newFolderDialogVisible" title="New Folder" :width="isMobile ? '92%' : '360px'" append-to-body>
      <el-input v-model="newFolderName" placeholder="Folder name" @keyup.enter="handleCreateFolder" />
      <template #footer>
        <el-button @click="newFolderDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleCreateFolder">Create</el-button>
      </template>
    </el-dialog>

    <!-- Preview Modal -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="previewItem ? previewItem.name : 'Preview'"
      :width="isMobile ? '92%' : '640px'"
      append-to-body
      class="drive-preview-dialog"
    >
      <div v-if="previewItem" class="preview-content">
        <!-- Image Preview -->
        <div v-if="isImage(previewItem.name)" class="preview-img-wrap">
          <img :src="previewItem.url || 'https://picsum.photos/600/400'" alt="Preview" class="preview-img" />
        </div>

        <!-- Text / Code Preview -->
        <div v-else-if="isText(previewItem.name)" class="preview-text-wrap">
          <pre class="preview-pre">{{ previewItem.content || '// Content of ' + previewItem.name + '\nHello from GrabMails Drive!\nStorage backed by Cloudflare R2.' }}</pre>
        </div>

        <!-- Generic Binary Fallback -->
        <div v-else class="preview-generic-wrap">
          <Icon :icon="getFileIcon(previewItem.name)" width="64" height="64" class="preview-generic-icon" />
          <h4 class="preview-generic-name">{{ previewItem.name }}</h4>
          <p class="preview-generic-meta">{{ formatSize(previewItem.size) }} • {{ formatDate(previewItem.created_at) }}</p>
          <el-button type="primary" @click="downloadFile(previewItem)">
            <Icon icon="hugeicons:download-04" width="16" height="16" class="mr-1" />
            <span>Download to view</span>
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const activeTab = ref('files')
const searchQuery = ref('')
const currentFolderId = ref(null)

const newFolderDialogVisible = ref(false)
const newFolderName = ref('')
const fileInputRef = ref(null)

const previewDialogVisible = ref(false)
const previewItem = ref(null)

const STORAGE_KEY = 'grabmails_drive_items'

const items = ref([])

// Starter Items
const DEFAULT_ITEMS = [
  { id: 'f-1', parent_id: null, kind: 'folder', name: 'Work Documents', created_at: new Date('2026-11-10').toISOString() },
  { id: 'f-2', parent_id: null, kind: 'folder', name: 'Invoices & Receipts', created_at: new Date('2026-11-12').toISOString() },
  { id: 'file-1', parent_id: null, kind: 'file', name: 'Product_Roadmap_2027.pdf', size: 2450000, created_at: new Date('2026-11-14').toISOString(), link_token: 'pub_roadmap_q1' },
  { id: 'file-2', parent_id: null, kind: 'file', name: 'Cloudflare_Architecture.png', size: 1250000, created_at: new Date('2026-11-15').toISOString(), link_token: 'pub_arch_cf' },
  { id: 'file-3', parent_id: 'f-1', kind: 'file', name: 'GrabMails_Pitch.pdf', size: 3100000, created_at: new Date('2026-11-13').toISOString(), link_token: 'pub_pitch' },
  // Email Attachment examples
  { id: 'att-1', parent_id: null, kind: 'file', source: 'attachment', emailSubject: 'Welcome to GrabMails SaaS', sender: 'team@grabmails.com', name: 'Welcome_Kit.pdf', size: 850000, created_at: new Date('2026-11-15').toISOString() },
  { id: 'att-2', parent_id: null, kind: 'file', source: 'attachment', emailSubject: 'Cloudflare Workers Invoice #8492', sender: 'billing@cloudflare.com', name: 'Invoice_8492.pdf', size: 320000, created_at: new Date('2026-11-11').toISOString() }
]

onMounted(() => {
  loadItems()
})

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      items.value = JSON.parse(raw)
    } else {
      items.value = [...DEFAULT_ITEMS]
      persistItems()
    }
  } catch (e) {
    items.value = [...DEFAULT_ITEMS]
  }
}

function persistItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

const itemsInCurrentFolder = computed(() => {
  return items.value.filter(i => !i.trashed && i.parent_id === currentFolderId.value)
})

const filteredFolders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return itemsInCurrentFolder.value
    .filter(i => i.kind === 'folder')
    .filter(f => !q || f.name.toLowerCase().includes(q))
})

const filteredFiles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return itemsInCurrentFolder.value
    .filter(i => i.kind === 'file' && i.source !== 'attachment')
    .filter(f => !q || f.name.toLowerCase().includes(q))
})

const emailAttachments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return items.value
    .filter(i => !i.trashed && i.source === 'attachment')
    .filter(f => !q || f.name.toLowerCase().includes(q) || (f.emailSubject && f.emailSubject.toLowerCase().includes(q)))
})

const trashedItems = computed(() => {
  return items.value.filter(i => i.trashed)
})

const totalStorageUsed = computed(() => {
  return items.value
    .filter(i => !i.trashed && i.kind === 'file')
    .reduce((acc, f) => acc + (f.size || 0), 0)
})

const storagePercentage = computed(() => {
  const max = 10 * 1024 * 1024 * 1024 // 10 GB
  return Math.min(100, Math.round((totalStorageUsed.value / max) * 100))
})

const folderTrail = computed(() => {
  const trail = []
  let curr = currentFolderId.value
  while (curr) {
    const f = items.value.find(i => i.id === curr)
    if (f) {
      trail.unshift(f)
      curr = f.parent_id
    } else {
      break
    }
  }
  return trail
})

function goToFolder(folderId) {
  currentFolderId.value = folderId
}

function getSubItemCount(folderId) {
  return items.value.filter(i => !i.trashed && i.parent_id === folderId).length
}

function openNewFolderDialog() {
  newFolderName.value = ''
  newFolderDialogVisible.value = true
}

function handleCreateFolder() {
  const name = newFolderName.value.trim()
  if (!name) {
    ElMessage.warning('Please enter folder name')
    return
  }
  items.value.push({
    id: `f-${Date.now()}`,
    parent_id: currentFolderId.value,
    kind: 'folder',
    name,
    created_at: new Date().toISOString()
  })
  persistItems()
  newFolderDialogVisible.value = false
  ElMessage.success('Folder created')
}

function triggerUpload() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function handleFileUpload(e) {
  const files = e.target.files
  if (!files || files.length === 0) return

  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    const reader = new FileReader()
    reader.onload = (event) => {
      items.value.push({
        id: `file-${Date.now()}-${i}`,
        parent_id: currentFolderId.value,
        kind: 'file',
        name: f.name,
        size: f.size,
        dataUrl: event.target.result,
        link_token: `pub_${Math.random().toString(36).substring(2, 10)}`,
        created_at: new Date().toISOString()
      })
      persistItems()
    }
    reader.readAsDataURL(f)
  }

  e.target.value = ''
  ElMessage.success(`${files.length} file(s) uploaded to Cloudflare R2`)
}

function confirmDelete(item) {
  ElMessageBox.confirm(`Move ${item.name} to trash?`, 'Confirm Delete', {
    confirmButtonText: 'Move to Trash',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(() => {
    item.trashed = true
    item.trashed_at = new Date().toISOString()
    persistItems()
    ElMessage.success('Moved to trash')
  }).catch(() => {})
}

function restoreItem(item) {
  item.trashed = false
  delete item.trashed_at
  persistItems()
  ElMessage.success('Item restored')
}

function permanentDelete(item) {
  items.value = items.value.filter(i => i !== item)
  persistItems()
  ElMessage.success('Item permanently deleted')
}

function copyShareLink(file) {
  const token = file.link_token || `pub_${Math.random().toString(36).substring(2, 10)}`
  file.link_token = token
  persistItems()

  const url = `${window.location.origin}/d/${token}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
    ElMessage.success(`Share link copied: ${url}`)
  } else {
    ElMessage.info(`Share link: ${url}`)
  }
}

function previewFile(file) {
  previewItem.value = file
  previewDialogVisible.value = true
}

function triggerDirectDownload(urlOrBlob, filename) {
  try {
    const isBlob = urlOrBlob instanceof Blob
    const url = isBlob ? URL.createObjectURL(urlOrBlob) : urlOrBlob
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.setAttribute('download', filename)
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      if (isBlob) URL.revokeObjectURL(url)
    }, 1000)
    ElMessage.success(`Downloaded ${filename}`)
  } catch (e) {
    console.error('triggerDirectDownload failed:', e)
    ElMessage.error(`Download failed: ${e.message}`)
  }
}

function generateMinimalPdf(filename) {
  const content = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 75>>stream\nBT /F1 18 Tf 50 720 Td (GrabMails Cloud Drive - ${filename}) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000243 00000 n \n0000000368 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n438\n%%EOF`
  return new Blob([content], { type: 'application/pdf' })
}

function generateMinimalPng() {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, 400, 300)
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px sans-serif'
    ctx.fillText('GrabMails Cloud Drive', 40, 150)
  }
  return canvas.toDataURL('image/png')
}

function downloadFile(file) {
  if (!file || !file.name) return
  try {
    // 1. Base64 dataUrl
    if (file.dataUrl) {
      triggerDirectDownload(file.dataUrl, file.name)
      return
    }

    // 2. Real remote URL
    if (file.url) {
      triggerDirectDownload(file.url, file.name)
      return
    }

    // 3. Fallback for mock starter items
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : ''
    if (ext === 'pdf') {
      const pdfBlob = generateMinimalPdf(file.name)
      triggerDirectDownload(pdfBlob, file.name)
      return
    }

    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      const pngData = generateMinimalPng()
      triggerDirectDownload(pngData, file.name)
      return
    }

    const textContent = file.content || `GrabMails Cloud Drive\n\nFilename: ${file.name}\nSize: ${formatSize(file.size)}\nCreated: ${formatDate(file.created_at)}\nStorage: Cloudflare R2 / Serverless\n\nThis file is safely stored in your GrabMails Drive.`
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    triggerDirectDownload(blob, file.name)
  } catch (err) {
    console.error('Download error:', err)
    ElMessage.error(`Failed to download ${file.name}`)
  }
}

function getFileIcon(name) {
  if (!name) return 'hugeicons:document-01'
  const ext = name.split('.').pop().toLowerCase()
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'hugeicons:image-01'
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'hugeicons:video-01'
  if (['mp3', 'wav', 'aac'].includes(ext)) return 'hugeicons:music-note-01'
  if (['pdf'].includes(ext)) return 'hugeicons:document-01'
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'hugeicons:archive'
  return 'hugeicons:file-01'
}

function getFileBg(name) {
  if (!name) return 'var(--el-fill-color, rgba(0, 0, 0, 0.04))'
  const ext = name.split('.').pop().toLowerCase()
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'rgba(255, 255, 255, 0.08)'
  if (['pdf'].includes(ext)) return 'rgba(239, 68, 68, 0.12)'
  if (['zip', 'rar', 'tar'].includes(ext)) return 'rgba(245, 158, 11, 0.12)'
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'rgba(139, 92, 246, 0.12)'
  return 'var(--el-fill-color, rgba(0, 0, 0, 0.04))'
}

function isImage(name) {
  if (!name) return false
  const ext = name.split('.').pop().toLowerCase()
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)
}

function isText(name) {
  if (!name) return false
  const ext = name.split('.').pop().toLowerCase()
  return ['txt', 'md', 'js', 'json', 'vue', 'html', 'css', 'py'].includes(ext)
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(d) {
  if (!d) return '—'
  return dayjs(d).format('MMM D, YYYY')
}
</script>

<style scoped>
.drive-page {
  height: 100%;
  width: 100%;
  background: var(--el-bg-color-page, #f8fafc);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ══ Topbar ══ */
.drive-topbar {
  padding: 14px 20px;
  background: var(--el-bg-color, #ffffff);
  border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.drive-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drive-icon {
  color: var(--el-color-primary, #4f46e5);
}

.drive-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
  margin: 0;
}

.drive-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary, #64748b);
}

.crumb-item {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}

.crumb-item:hover {
  background: var(--el-fill-color, #f1f5f9);
  color: var(--el-color-primary, #4f46e5);
}

.crumb-item.is-current {
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
  cursor: default;
}

.crumb-separator {
  color: var(--el-text-color-placeholder, #cbd5e1);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drive-search {
  width: 220px;
}

.drive-btn {
  border-radius: 8px;
  font-weight: 500;
}

.hidden-file-input {
  display: none;
}

/* ══ Body Layout ══ */
.drive-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ══ Left Subnav ══ */
.drive-nav {
  width: 240px;
  background: var(--el-bg-color, #ffffff);
  border-right: 1px solid var(--el-border-color-lighter, #e2e8f0);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-tab-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--el-text-color-regular, #475569);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  text-align: left;
}

.nav-tab-btn:hover,
.nav-tab-btn:active,
.nav-tab-btn:focus-visible {
  background: #18181b !important;
  color: #ffffff !important;
}

.nav-tab-btn.is-active {
  background: #000000 !important;
  color: #ffffff !important;
  font-weight: 600;
}

.nav-tab-btn:hover span,
.nav-tab-btn:active span,
.nav-tab-btn:focus-visible span,
.nav-tab-btn.is-active span,
.nav-tab-btn:hover svg,
.nav-tab-btn:active svg,
.nav-tab-btn:focus-visible svg,
.nav-tab-btn.is-active svg {
  color: #ffffff !important;
}

.nav-tab-btn:hover .tab-count,
.nav-tab-btn:active .tab-count,
.nav-tab-btn.is-active .tab-count {
  background: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
}

:root.dark .nav-tab-btn,
.dark .nav-tab-btn,
[data-theme="dark"] .nav-tab-btn {
  color: #a1a1aa;
}

:root.dark .nav-tab-btn:hover,
:root.dark .nav-tab-btn:active,
:root.dark .nav-tab-btn:focus-visible,
.dark .nav-tab-btn:hover,
.dark .nav-tab-btn:active,
.dark .nav-tab-btn:focus-visible,
[data-theme="dark"] .nav-tab-btn:hover,
[data-theme="dark"] .nav-tab-btn:active,
[data-theme="dark"] .nav-tab-btn:focus-visible {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

:root.dark .nav-tab-btn.is-active,
.dark .nav-tab-btn.is-active,
[data-theme="dark"] .nav-tab-btn.is-active {
  background: rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
  font-weight: 600;
}

.tab-count {
  margin-left: auto;
  font-size: 11px;
  background: var(--el-fill-color, #f1f5f9);
  color: var(--el-text-color-secondary, #64748b);
  padding: 2px 7px;
  border-radius: 10px;
  transition: background 0.15s ease, color 0.15s ease;
}

.dark .tab-count,
[data-theme="dark"] .tab-count {
  background: rgba(255, 255, 255, 0.08);
  color: #a1a1aa;
}

.storage-card {
  margin-top: auto;
  padding: 14px;
  background: var(--el-fill-color-lighter, #f8fafc);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--el-text-color-secondary, #64748b);
}

.storage-label {
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
}

/* ══ Main Files View ══ */
.drive-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-drive {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--el-text-color-secondary, #94a3b8);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.4;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
  margin: 0 0 6px 0;
}

.empty-desc {
  font-size: 14px;
  margin: 0 0 16px 0;
}

.empty-actions {
  display: flex;
  gap: 10px;
}

.drive-sections-stack {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.drive-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-text-color-secondary, #64748b);
}

.section-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 9999px;
  background: var(--el-fill-color, rgba(0, 0, 0, 0.05));
  color: var(--el-text-color-secondary, #64748b);
}

/* ══ Folders Grid ══ */
.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  align-items: start;
}

.folder-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  height: 56px;
  max-height: 56px;
  box-sizing: border-box;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 14px;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  position: relative;
  user-select: none;
  overflow: hidden;
}

.dark .folder-card,
[data-theme="dark"] .folder-card {
  background: #14161b;
  border-color: rgba(255, 255, 255, 0.08);
}

.folder-card:hover {
  transform: translateY(-2px);
  border-color: rgba(245, 158, 11, 0.35);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.folder-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.06) 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.folder-svg {
  color: #D97706;
}

.dark .folder-icon-wrap,
[data-theme="dark"] .folder-icon-wrap {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(69, 26, 3, 0.35) 100%);
  border-color: rgba(251, 191, 36, 0.28);
}

.dark .folder-svg,
[data-theme="dark"] .folder-svg {
  color: #FBBF24;
}

.folder-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.folder-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--el-text-color-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.folder-sub {
  font-size: 11.5px;
  color: var(--el-text-color-secondary, #64748b);
}

.folder-actions {
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 150ms ease;
}

.folder-card:hover .folder-actions {
  opacity: 1;
}

/* ══ Files Grid ══ */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}

.file-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 14px;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  cursor: pointer;
}

.file-card:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 70, 229, 0.3);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.file-thumb {
  height: 104px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 160ms ease;
}

.file-card:hover .file-thumb {
  transform: scale(1.02);
}

.file-type-icon {
  opacity: 0.9;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-sub-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--el-text-color-secondary, #64748b);
}

.file-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  border-top: 1px solid var(--el-border-color-extra-light, rgba(0, 0, 0, 0.05));
  padding-top: 8px;
}

.dark .file-actions,
[data-theme="dark"] .file-actions {
  border-top-color: rgba(255, 255, 255, 0.06);
}

.mini-action-btn {
  background: var(--el-fill-color-light, #f8fafc);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 6px;
  padding: 5px;
  cursor: pointer;
  color: var(--el-text-color-secondary, #64748b);
  transition: background 0.15s, color 0.15s;
}

.mini-action-btn:hover {
  background: var(--el-fill-color, #e2e8f0);
  color: var(--el-color-primary, #4f46e5);
}

.mini-action-btn.danger:hover {
  color: var(--el-color-danger, #ef4444);
}

/* ══ Attachments Table ══ */
.section-subhead {
  margin-bottom: 20px;
}

.section-subhead h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
  margin: 0 0 4px 0;
}

.section-subhead p {
  font-size: 13px;
  color: var(--el-text-color-secondary, #64748b);
  margin: 0;
}

.attachments-table-wrap {
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
}

.att-table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* Preview & Download Buttons: White bg + Black text in Light Mode, Black bg + White text in Dark Mode */
.att-theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #d4d4d8 !important;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: all 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

.att-theme-btn:hover {
  background: #f4f4f5 !important;
  background-color: #f4f4f5 !important;
  color: #000000 !important;
  border-color: #a1a1aa !important;
  transform: translateY(-1px);
}

:root.dark .att-theme-btn,
.dark .att-theme-btn,
[data-theme="dark"] .att-theme-btn {
  background: #000000 !important;
  background-color: #000000 !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

:root.dark .att-theme-btn:hover,
.dark .att-theme-btn:hover,
[data-theme="dark"] .att-theme-btn:hover {
  background: #18181b !important;
  background-color: #18181b !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.45) !important;
}

/* Mobile Attachments Cards (hidden on desktop) */
.mobile-attachments-list {
  display: none;
}

.mobile-att-card {
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e2e8f0);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.dark .mobile-att-card,
[data-theme="dark"] .mobile-att-card {
  background: #111317;
  border-color: rgba(255, 255, 255, 0.08);
}

.m-att-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.m-att-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--el-text-color-primary, #0f172a);
}

.m-att-title-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.m-att-filename {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.35;
}

.m-att-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary, #64748b);
}

.m-att-email-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light, #f8fafc);
  font-size: 12px;
  color: var(--el-text-color-secondary, #64748b);
}

.dark .m-att-email-info,
[data-theme="dark"] .m-att-email-info {
  background: rgba(255, 255, 255, 0.04);
  color: #a1a1aa;
}

.m-att-subject,
.m-att-sender {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  word-break: break-word;
  line-height: 1.35;
}

.m-att-subject {
  color: var(--el-text-color-primary, #0f172a);
  font-weight: 500;
}

.dark .m-att-subject,
[data-theme="dark"] .m-att-subject {
  color: #e4e4e7;
}

.m-att-meta-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.m-att-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.m-att-actions .att-theme-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12.5px;
}

.table-file-cell {
  display: flex;
  align-items: center;
}

.file-table-name {
  font-weight: 500;
  color: var(--el-text-color-primary, #0f172a);
}

/* ══ Preview Modal ══ */
.preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.preview-img-wrap {
  max-width: 100%;
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 480px;
  border-radius: 8px;
}

.preview-text-wrap {
  width: 100%;
  background: var(--el-fill-color-lighter, #f8fafc);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.preview-pre {
  margin: 0;
  font-family: monospace;
  font-size: 13px;
}

.preview-generic-wrap {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.preview-generic-icon {
  color: var(--el-color-primary, #4f46e5);
}

.preview-generic-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.preview-generic-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary, #64748b);
  margin: 0 0 10px 0;
}

/* ══ Mobile Responsive ══ */
@media (max-width: 767px) {
  .drive-topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 12px;
  }

  .topbar-left {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .drive-breadcrumbs {
    overflow-x: auto;
    white-space: nowrap;
    max-width: 100%;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .topbar-right {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .drive-search {
    width: 100% !important;
    order: 1;
  }

  .drive-btn {
    flex: 1 1 calc(50% - 4px);
    justify-content: center;
    order: 2;
    padding: 8px 10px;
    font-size: 12px;
  }

  .drive-body {
    flex-direction: column;
  }

  .drive-nav {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: 8px 12px;
    gap: 6px;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    flex-shrink: 0;
  }

  .nav-tab-btn {
    width: auto;
    padding: 6px 12px;
    font-size: 13px;
    flex-shrink: 0;
  }

  .storage-card {
    display: none;
  }

  .drive-main {
    padding: 12px 12px 110px;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    min-height: 0;
  }

  .folders-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .files-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .folder-card {
    padding: 8px 12px;
    gap: 10px;
    min-height: 50px;
  }

  .folder-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  .folder-name {
    font-size: 13px;
  }

  .file-card {
    padding: 10px;
    gap: 8px;
  }

  .file-thumb {
    height: 80px;
  }

  .file-name {
    font-size: 12px;
  }

  .file-actions {
    gap: 4px;
    padding-top: 6px;
  }

  .mini-action-btn {
    padding: 4px;
  }

  .desktop-attachments-table {
    display: none !important;
  }

  .mobile-attachments-list {
    display: flex !important;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    padding-bottom: 16px;
  }
}

@media (max-width: 420px) {
  .files-grid {
    grid-template-columns: 1fr;
  }

  .file-card {
    flex-direction: row;
    align-items: center;
  }

  .file-thumb {
    width: 50px;
    height: 50px;
    flex-shrink: 0;
  }

  .file-meta {
    flex: 1;
    min-width: 0;
  }

  .file-actions {
    border-top: none;
    padding-top: 0;
  }
}
</style>
