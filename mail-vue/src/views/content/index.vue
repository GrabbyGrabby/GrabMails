<template>
  <div class="box">
    <div class="header-actions">
      <Icon class="icon" icon="hugeicons:chevron-left" width="20" height="20" @click="handleBack"/>
      <Icon v-perm="'email:delete'" class="icon" icon="hugeicons:delete-02" width="18" height="18" @click="handleDelete"/>
      <span class="star" v-if="emailStore.contentData.showStar">
        <Icon class="icon" @click="changeStar" v-if="email.isStar" icon="fluent-color:star-16" width="20" height="20"/>
        <Icon class="icon" @click="changeStar" v-else icon="hugeicons:star" width="18.5" height="18.5"/>
      </span>
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'"  @click="openReply" icon="hugeicons:reply" width="19" height="19" />
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'"  @click="openForward" icon="hugeicons:reply-all" width="20" height="20" />

      <!-- Mailflare Feature: Snooze Email -->
      <el-dropdown trigger="click" @command="handleSnoozeCommand">
        <span class="icon-wrap" title="Snooze email">
          <Icon class="icon" icon="hugeicons:clock-01" width="18.5" height="18.5" />
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled style="font-weight: 600; font-size: 11px;">SNOOZE EMAIL</el-dropdown-item>
            <el-dropdown-item command="later-today">Later Today (6:00 PM)</el-dropdown-item>
            <el-dropdown-item command="tomorrow-morning">Tomorrow Morning (8:00 AM)</el-dropdown-item>
            <el-dropdown-item command="this-weekend">This Weekend (Sat 9:00 AM)</el-dropdown-item>
            <el-dropdown-item command="next-week">Next Week (Mon 8:00 AM)</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- Mailflare Feature: Print Clean View -->
      <Icon class="icon" icon="hugeicons:printer" width="19" height="19" title="Print email" @click="handlePrintEmail" />

      <!-- Mailflare Feature: Private Thread Note -->
      <Icon
        class="icon"
        :class="{ 'has-note': hasPrivateNote }"
        icon="hugeicons:note-01"
        width="18.5"
        height="18.5"
        title="Add or view private note"
        @click="showNoteEditor = !showNoteEditor"
      />
    </div>
    <div></div>
    <el-scrollbar class="scrollbar">
      <div class="container">
        <div class="email-title">
          {{ email.subject }}
        </div>

        <!-- Mailflare Feature: 1-Click Unsubscribe Banner -->
        <div v-if="detectedUnsubscribeUrl" class="mf-unsub-banner">
          <div class="mf-unsub-info">
            <Icon icon="hugeicons:mail" width="15" height="15" />
            <span>This is a newsletter or mailing list message.</span>
          </div>
          <a :href="detectedUnsubscribeUrl" target="_blank" rel="noopener noreferrer" class="mf-unsub-link">
            Unsubscribe
          </a>
        </div>

        <!-- Mailflare Feature: Private Thread Note Card -->
        <div v-if="showNoteEditor || currentNoteText" class="mf-note-card">
          <div class="mf-note-top">
            <div class="mf-note-label">
              <Icon icon="hugeicons:note-01" width="14" height="14" />
              <span>Private Thread Note (only visible to you)</span>
            </div>
            <button type="button" class="mf-note-close-btn" @click="showNoteEditor = false">✕</button>
          </div>
          <textarea
            v-model="currentNoteText"
            rows="2"
            class="mf-note-textarea"
            placeholder="Write a private note about this email, deal, or client..."
            @input="savePrivateNote"
          />
        </div>
        <div class="content">
          <div class="email-info">
            <div>
              <div class="send"><span class="send-source">{{$t('from')}}</span>
                <div class="send-name" ref="sendNameRef" :class="{ 'is-wrapped': senderWrapped }">
                  <span class="send-name-title">{{ email.name }}</span>
                  <span class="send-email"><{{ email.sendEmail }}></span>
                  <span class="sent-via" v-if="sentViaEmail">
                    <el-tooltip effect="dark" :content="$t('sentVia', { email: sentViaEmail })">
                      <span>
                        <el-tag size="small" disable-transitions>{{ $t('sentViaTag') }}</el-tag>
                      </span>
                    </el-tooltip>
                  </span>
                </div>
              </div>
              <div class="receive"><span class="source">{{$t('recipient')}}</span><span class="receive-email">{{  formateReceive(email.recipient) }}</span></div>
              <div class="date">
                <div>{{ formatDetailDate(email.createTime) }}</div>
              </div>
            </div>
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
          </div>
          <el-scrollbar class="htm-scrollbar" :class="!email.attList?.length ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
            <pre v-else class="email-text" >{{email.text}}</pre>
          </el-scrollbar>
          <div class="att" v-if="email.attList?.length > 0">
            <div class="att-title">
              <span>{{$t('attachments')}}</span>
              <span>{{$t('attCount',{total: email.attList.length})}}</span>
            </div>
            <div class="att-box">

              <div class="att-item" v-for="att in email.attList" :key="att.attId">
                <div class="att-icon" @click="showImage(att.key)">
                  <Icon v-bind="getIconByName(att.filename)" />
                </div>
                <div class="att-name" @click="showImage(att.key)">
                  {{ att.filename }}
                </div>
                <div class="att-size">{{ formatBytes(att.size) }}</div>
                <div class="opt-icon att-icon">
                  <Icon v-if="isImage(att.filename)" icon="hugeicons:view" width="22" height="22" @click="showImage(att.key)"/>
                  <a :href="cvtR2Url(att.key)" download>
                    <Icon icon="hugeicons:download" width="20" height="20"/>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import {computed, reactive, ref, watch, onMounted, onUnmounted, nextTick} from "vue";
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {emailDelete, emailRead} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url,toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
const { t } = useI18n()

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()
const sendNameRef = ref(null)
const senderWrapped = ref(false)
let senderResizeObserver = null

const showPreview = ref(false)
const srcList = reactive([])


const email = computed(() => emailStore.contentData.email || {
  emailId: 0,
  attList: [],
  content: '',
  text: '',
  recipient: '[]',
})

const sentViaEmail = computed(() => {
  const raw = String(email.value.senderEmail || '').trim()
  if (!raw) return ''
  const matched = raw.match(/<([^>]+)>/)
  const address = (matched ? matched[1] : raw).trim()
  if (!address || address.toLowerCase() === String(email.value.sendEmail || '').trim().toLowerCase()) return ''
  return address
})

watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

let readRequesting = false

function contentWidth(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const width = range.getBoundingClientRect().width
  range.detach()
  return width
}

function updateSenderWrap() {
  const root = sendNameRef.value
  if (!root) return
  const name = root.querySelector('.send-name-title')
  const mail = root.querySelector('.send-email')
  const tag = root.querySelector('.sent-via')
  if (!name || !mail) {
    senderWrapped.value = false
    return
  }
  const gap = 6
  let need = contentWidth(name) + gap + contentWidth(mail)
  if (tag) need += gap + contentWidth(tag)
  senderWrapped.value = need > root.clientWidth + 0.5
}


function tryMarkRead() {
  if (!emailStore.contentData.showUnread || readRequesting) return
  const current = email.value
  if (!current?.emailId || current.unread !== EmailUnreadEnum.UNREAD) return

  // 等详情数据就绪（detailMap 已写入，或正文已有内容）再标已读
  const full = emailStore.detailMap[current.emailId]
  const detailReady = !!full || !!(current.content || current.text)
  if (!detailReady) return

  readRequesting = true
  const emailId = current.emailId
  current.unread = EmailUnreadEnum.READ
  if (emailStore.detailMap[emailId]) {
    emailStore.detailMap[emailId].unread = EmailUnreadEnum.READ
  }
  emailStore.markListRead(emailId)
  emailRead([emailId]).finally(() => {
    readRequesting = false
  })
}

watch(
  () => [
    email.value?.emailId,
    email.value?.content,
    email.value?.text,
    emailStore.detailMap[email.value?.emailId]
  ],
  () => tryMarkRead(),
  { flush: 'post' }
)

watch(
  () => [email.value?.name, email.value?.sendEmail, sentViaEmail.value],
  () => nextTick(updateSenderWrap)
)

onMounted(() => {
  tryMarkRead()
  window.addEventListener('keydown', handleKeyDown);
  senderResizeObserver = new ResizeObserver(() => updateSenderWrap())
  if (sendNameRef.value) senderResizeObserver.observe(sendNameRef.value)
  nextTick(updateSenderWrap)
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
  readRequesting = false
  window.removeEventListener('keydown', handleKeyDown);
  senderResizeObserver?.disconnect()
})

function handleKeyDown(event) {
  if (event.key !== 'Escape') return;
  if (showPreview.value) return;
  if (document.querySelector('.el-message-box')) return;
  const writeBox = document.querySelector('.write-box');
  if (writeBox && writeBox.offsetParent !== null) return;
  handleBack();
}

function openReply() {
  uiStore.writerRef.openReply(email.value)
}

function openForward() {
  uiStore.writerRef.openForward(email.value)
}

function toMessage(message) {
  if (!message) return ''
  try {
    return JSON.parse(message).message || ''
  } catch {
    return String(message)
  }
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return  content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  if (!recipient) return ''
  try {
    const list = JSON.parse(recipient)
    return Array.isArray(list) ? list.map(item => item.address).join(', ') : String(recipient)
  } catch {
    return String(recipient)
  }
}

// ── Mailflare Feature: 1-Click Smart Unsubscribe Banner ──
const detectedUnsubscribeUrl = computed(() => {
  const content = email.value.content || email.value.text || ''
  if (!content) return null
  const hrefMatch = content.match(/href=["'](https?:\/\/[^"']*(?:unsubscribe|optout|opt-out|preferences|list-manage)[^"']*)["']/i)
  if (hrefMatch && hrefMatch[1]) {
    return hrefMatch[1]
  }
  return null
})

// ── Mailflare Feature: Print Clean View ──
function handlePrintEmail() {
  const em = email.value
  const printWindow = window.open('', '_blank', 'width=800,height=700')
  if (!printWindow) {
    ElMessage.warning('Popup blocker prevented print window from opening')
    return
  }
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${em.subject || 'Print Email'} - GrabMails</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #111; line-height: 1.5; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
    .subject { font-size: 22px; font-weight: 700; margin: 0 0 14px 0; color: #111827; }
    .meta-row { font-size: 13px; color: #4b5563; margin: 4px 0; }
    .meta-label { font-weight: 600; color: #111827; display: inline-block; width: 68px; }
    .body { font-size: 14px; line-height: 1.6; color: #1f2937; margin-top: 20px; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="subject">${em.subject || '(No Subject)'}</div>
    <div class="meta-row"><span class="meta-label">From:</span> ${em.name || ''} &lt;${em.sendEmail || ''}&gt;</div>
    <div class="meta-row"><span class="meta-label">To:</span> ${formateReceive(em.recipient)}</div>
    <div class="meta-row"><span class="meta-label">Date:</span> ${formatDetailDate(em.createTime)}</div>
  </div>
  <div class="body">
    ${formatImage(em.content) || `<pre style="white-space: pre-wrap; font-family: inherit;">${em.text || ''}</pre>`}
  </div>
  <div class="footer">Printed from GrabMails Cloud Email</div>
</body>
</html>`
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

// ── Mailflare Feature: Snooze Email ──
function handleSnoozeCommand(cmd) {
  let snoozedUntil = new Date()
  if (cmd === 'later-today') {
    snoozedUntil.setHours(18, 0, 0, 0)
  } else if (cmd === 'tomorrow-morning') {
    snoozedUntil.setDate(snoozedUntil.getDate() + 1)
    snoozedUntil.setHours(8, 0, 0, 0)
  } else if (cmd === 'this-weekend') {
    const day = snoozedUntil.getDay()
    const diff = (6 - day) % 7 || 7
    snoozedUntil.setDate(snoozedUntil.getDate() + diff)
    snoozedUntil.setHours(9, 0, 0, 0)
  } else if (cmd === 'next-week') {
    const day = snoozedUntil.getDay()
    const diff = (8 - day) % 7 || 7
    snoozedUntil.setDate(snoozedUntil.getDate() + diff)
    snoozedUntil.setHours(8, 0, 0, 0)
  }
  try {
    const snoozed = JSON.parse(localStorage.getItem('grabmails_snoozed_emails') || '{}')
    snoozed[email.value.emailId] = snoozedUntil.toISOString()
    localStorage.setItem('grabmails_snoozed_emails', JSON.stringify(snoozed))
    ElMessage.success(`Email snoozed until ${snoozedUntil.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`)
    handleBack()
  } catch (e) {}
}

// ── Mailflare Feature: Private Thread Notes ──
const showNoteEditor = ref(false)
const currentNoteText = ref('')
const hasPrivateNote = computed(() => !!currentNoteText.value.trim())

function loadPrivateNote(emailId) {
  if (!emailId) {
    currentNoteText.value = ''
    return
  }
  try {
    const notes = JSON.parse(localStorage.getItem('grabmails_email_notes') || '{}')
    currentNoteText.value = notes[emailId] || ''
  } catch (e) {
    currentNoteText.value = ''
  }
}

function savePrivateNote() {
  const emailId = email.value.emailId
  if (!emailId) return
  try {
    const notes = JSON.parse(localStorage.getItem('grabmails_email_notes') || '{}')
    if (currentNoteText.value.trim()) {
      notes[emailId] = currentNoteText.value.trim()
    } else {
      delete notes[emailId]
    }
    localStorage.setItem('grabmails_email_notes', JSON.stringify(notes))
  } catch (e) {}
}

watch(() => email.value.emailId, (id) => {
  loadPrivateNote(id)
}, { immediate: true })

function changeStar() {
  if (email.value.isStar) {
    email.value.isStar = 0;
    starCancel(email.value.emailId).then(() => {
      email.value.isStar = 0;
      emailStore.cancelStarEmailId = email.value.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.value.emailId])
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 1;
    })
  } else {
    email.value.isStar = 1;
    starAdd(email.value.emailId).then(() => {
      email.value.isStar = 1;
      emailStore.addStarEmailId = email.value.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email.value)
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 0;
    })
  }
}

const handleBack = () => {
  router.back()
}

const handleDelete = () => {
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    if (emailStore.contentData.delType === 'logic') {
      emailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    } else  {

      allEmailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    }

    router.back()
  })
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  overflow: hidden;
}

.header-actions {
  padding: 9px 15px 9px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--header-actions-border);
  font-size: 18px;
  .star {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 21px;
  }
  .icon {
    cursor: pointer;
  }
}


.scrollbar {
  height: calc(100% - 38px);
  width: 100%;
}

.container {
  font-size: 14px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 10px;
  @media (max-width: 1023px) {
    padding-left: 15px;
    padding-right: 15px;
  }

  .email-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .htm-scrollbar {
  }

  .content {
    display: flex;
    flex-direction: column;

    .att {
      margin-top: 30px;
      margin-bottom: 30px;
      border: 1px solid var(--light-border-color);
      padding: 14px;
      border-radius: 6px;
      width: fit-content;
      .att-box {
        min-width: min(410px,calc(100vw - 60px));
        max-width: 600px;
        display: grid;
        gap: 12px;
        grid-template-rows: 1fr;
      }

      .att-title {
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        span:first-child {
          font-weight: bold;
        }
      }

      .att-item {
        cursor: pointer;
        div {
          align-self: center;
        }
        background: var(--light-ill);
        padding: 5px 7px;
        border-radius: 4px;
        align-self: start;
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        .att-icon {
          display: grid;
        }

        .att-size {
          color: var(--secondary-text-color);
        }

        .att-name {
          margin-left: 8px;
          margin-right: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
        }

        .att-image {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }

        .opt-icon {
          padding-left: 10px;
          color: var(--secondary-text-color);
          align-items: center;
          display: flex;
          gap: 8px;
          cursor: pointer;
          a {
            color: var(--secondary-text-color);
            align-items: center;
            display: flex;
          }
        }
      }
    }

    .email-info {

      border-bottom: 1px solid var(--light-border-color);
      margin-bottom: 20px;
      padding-bottom: 8px;
      @media (max-width: 1024px) {
        margin-bottom: 15px;
      }
      .date {
        color: var(--regular-text-color);
        margin-bottom: 6px;
      }

      .email-msg {
        max-width: 400px;
        width: fit-content;
        margin-bottom: 15px;
      }

      .send {
        display: flex;
        margin-bottom: 6px;

        .send-name {
          color: var(--regular-text-color);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          column-gap: 6px;

          .send-email {
            max-width: 100%;
            overflow-wrap: anywhere;
          }

          &.is-wrapped {
            .send-name-title {
              order: 1;
            }

            .sent-via {
              order: 2;
            }

            .send-email {
              order: 3;
              flex-basis: 100%;
            }
          }
        }
      }

      .receive {
        margin-bottom: 6px;
        display: flex;
        .receive-email {
          max-width: 700px;
          word-break: break-word;
        }
        span:nth-child(2) {
          color: var(--regular-text-color);
        }
      }

      .send-source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }

      .source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }
    }
  }
}

.shadow-html::after  {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--message-block-color); /* 半透明黑色蒙层 */
  pointer-events: none; /* 不影响点击 */
}

.email-text {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.bottom-distance {
  margin-bottom: 30px;
}

.has-note {
  color: #f59e0b !important;
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.mf-unsub-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  margin-bottom: 12px;
  font-size: 13px;
  color: #1e40af;

  .mf-unsub-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mf-unsub-link {
    color: #2563eb;
    font-weight: 500;
    text-decoration: underline;
    font-size: 12.5px;
    white-space: nowrap;

    &:hover {
      color: #1d4ed8;
    }
  }
}

:root.dark .mf-unsub-banner,
.dark .mf-unsub-banner {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93c5fd;

  .mf-unsub-link {
    color: #60a5fa;
  }
}

.mf-note-card {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  display: flex;
  flex-direction: column;
  gap: 6px;

  .mf-note-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 500;
    color: #b45309;

    .mf-note-label {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mf-note-close-btn {
      border: none;
      background: transparent;
      color: #b45309;
      cursor: pointer;
      font-size: 12px;
    }
  }

  .mf-note-textarea {
    width: 100%;
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 6px;
    background: #ffffff;
    padding: 6px 10px;
    font-size: 13px;
    color: #1f2937;
    outline: none;
    resize: vertical;
    font-family: inherit;

    &:focus {
      border-color: #f59e0b;
    }
  }
}

:root.dark .mf-note-card,
.dark .mf-note-card {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);

  .mf-note-top {
    color: #fbbf24;
    .mf-note-close-btn { color: #fbbf24; }
  }

  .mf-note-textarea {
    background: #1f2228;
    color: #f3f4f6;
    border-color: rgba(245, 158, 11, 0.4);
  }
}
</style>
