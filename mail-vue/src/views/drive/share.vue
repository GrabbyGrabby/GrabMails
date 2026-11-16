<template>
  <div class="share-page">
    <div class="share-card">
      <div class="share-header">
        <div class="logo-wrap">
          <Icon icon="hugeicons:folder-01" width="28" height="28" class="logo-icon" />
          <span class="brand-text">GrabMails Drive</span>
        </div>
        <span class="public-badge">Shared File</span>
      </div>

      <div class="share-body">
        <div class="file-icon-box">
          <Icon icon="hugeicons:document-01" width="48" height="48" class="file-icon" />
        </div>
        <h2 class="file-name">{{ fileData.name }}</h2>
        <p class="file-meta">{{ fileData.size }} • Uploaded via Cloudflare R2</p>

        <div class="share-actions">
          <el-button type="primary" size="large" class="download-btn" @click="handleDownload">
            <Icon icon="hugeicons:download-04" width="18" height="18" class="mr-2" />
            <span>Download File</span>
          </el-button>
        </div>
      </div>

      <div class="share-footer">
        <router-link to="/login" class="back-link">Go to GrabMails</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const token = ref(route.params.token || '')

const fileData = ref({
  name: 'Shared_Document.pdf',
  size: '2.4 MB'
})

onMounted(() => {
  // Check local items for token
  try {
    const raw = localStorage.getItem('grabmails_drive_items')
    if (raw) {
      const items = JSON.parse(raw)
      const found = items.find(i => i.link_token === token.value)
      if (found) {
        fileData.value = {
          name: found.name,
          size: `${(found.size / (1024 * 1024)).toFixed(1)} MB`
        }
      }
    }
  } catch (e) {}
})

function handleDownload() {
  ElMessage.success(`Downloading ${fileData.value.name}`)
}
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  width: 100vw;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.share-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.share-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  color: #4f46e5;
}

.brand-text {
  font-weight: 600;
  color: #0f172a;
  font-size: 15px;
}

.public-badge {
  font-size: 11px;
  font-weight: 500;
  background: #eef2ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 10px;
}

.share-body {
  padding: 36px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-icon-box {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.file-icon {
  color: #4f46e5;
}

.file-name {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px 0;
  word-break: break-word;
}

.file-meta {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 24px 0;
}

.download-btn {
  border-radius: 10px;
  width: 220px;
}

.share-footer {
  padding: 14px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

.back-link {
  font-size: 13px;
  color: #64748b;
  text-decoration: none;
}

.back-link:hover {
  color: #4f46e5;
}
</style>
