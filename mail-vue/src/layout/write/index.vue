<template>
  <div class="send" v-show="show">
    <div class="write-box">
      <div class="title">
        <div class="title-left">
          <span class="title-text">
            <Icon icon="hugeicons:quill-write-01" width="28" height="28"/>
          </span>
          <span class="sender">{{ $t('sender') }}:</span>
          <span class="sender-name">{{ form.name }}</span>
          <span class="send-email"><{{ form.sendEmail }}></span>
        </div>
        <div class="title-right" style="display: flex; align-items: center; gap: 10px;">
          <el-button
            class="ai-compose-pill-btn"
            type="primary"
            size="small"
            @click="openAiComposeDialog"
          >
            <Icon icon="fluent:sparkle-24-filled" width="15" height="15" style="margin-right: 4px;" />
            Compose with AI
          </el-button>
          <div @click="close" style="cursor: pointer; display: flex; align-items: center;">
            <Icon icon="material-symbols-light:close-rounded" width="22" height="22"/>
          </div>
        </div>
      </div>
      <div class="container">
        <el-input-tag  @add-tag="addTagChange" tag-type="primary" @input="inputChange" size="default" v-model="form.receiveEmail" >
          <template #prefix>
            <div class="item-title" >{{ $t('recipient') }}</div>
            <el-select
                ref="mySelect"
                class="write-select"
                popper-class="write-select"
                :show-arrow="false"
                :no-match-text="' '"
                :no-data-text="' '"
                @visible-change="selectStatusChange"
                @change="selectChange"
            >
              <el-option
                  v-for="item in selectRecipientList"
                  :key="item"
                  :label="item"
                  :value="item"
                  style="color: #999896;"
              />
            </el-select>
          </template>
          <template #suffix>
            <div style="display: flex;margin-right: 3px;">
              <Icon icon="fa7-solid:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts" />
            </div>
          </template>
        </el-input-tag>
        <div class="subject-row" style="display: flex; gap: 8px; align-items: center;">
          <el-input v-model="form.subject" :placeholder="t('subject')" style="flex: 1;" />
          <el-dropdown trigger="click" @command="applyAiSubject">
            <el-button
              type="primary"
              plain
              :loading="aiSubjectLoading"
              @click.stop="fetchAiSubjects"
              size="default"
              class="ai-subject-btn"
            >
              <Icon icon="fluent:sparkle-24-filled" width="15" height="15" style="margin-right: 4px; color: #8b5cf6;" />
              <span>AI Subject</span>
              <Icon icon="ep:arrow-down" width="12" height="12" style="margin-left: 4px;" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="aiSubjectList.length === 0" disabled>
                  {{ aiSubjectLoading ? 'Generating AI subject suggestions...' : 'Click "AI Subject" to generate suggestions' }}
                </el-dropdown-item>
                <el-dropdown-item v-for="(sub, idx) in aiSubjectList" :key="idx" :command="sub">
                  ✨ {{ sub }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
        <div class="button-item">
          <div class="btn-left-actions" style="display: flex; align-items: center; gap: 10px;">
            <div class="att-add" @click="chooseFile" title="Add attachment">
              <Icon icon="iconamoon:attachment-fill" width="24" height="24"/>
            </div>
            <div class="att-clear" @click="clearContent" title="Clear formatting">
              <Icon icon="icon-park-outline:clear-format" width="24" height="24"/>
            </div>
            <el-dropdown trigger="click" @command="handleAiAssistCommand">
              <el-button
                type="primary"
                size="small"
                plain
                :loading="aiAssistLoading"
                class="ai-assist-toolbar-btn"
              >
                <Icon icon="fluent:sparkle-24-filled" width="15" height="15" style="margin-right: 4px; color: #8b5cf6;" />
                <span>AI Assist</span>
                <Icon icon="ep:arrow-down" width="12" height="12" style="margin-left: 4px;" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="compose">
                    <Icon icon="solar:pen-new-square-linear" width="16" height="16" style="margin-right: 6px; color: #8b5cf6;" />
                    Compose from Prompt...
                  </el-dropdown-item>
                  <el-dropdown-item divided command="polish">
                    <Icon icon="solar:magic-stick-3-linear" width="16" height="16" style="margin-right: 6px; color: #10b981;" />
                    Polish & Fix Grammar
                  </el-dropdown-item>
                  <el-dropdown-item command="professional">
                    <Icon icon="solar:case-minimalistic-linear" width="16" height="16" style="margin-right: 6px; color: #3b82f6;" />
                    Make Professional Tone
                  </el-dropdown-item>
                  <el-dropdown-item command="shorten">
                    <Icon icon="solar:minimize-square-3-linear" width="16" height="16" style="margin-right: 6px; color: #f59e0b;" />
                    Make Shorter & Concise
                  </el-dropdown-item>
                  <el-dropdown-item command="expand">
                    <Icon icon="solar:maximize-square-3-linear" width="16" height="16" style="margin-right: 6px; color: #6366f1;" />
                    Expand with Details
                  </el-dropdown-item>
                  <el-dropdown-item command="summarize">
                    <Icon icon="solar:document-text-linear" width="16" height="16" style="margin-right: 6px; color: #06b6d4;" />
                    Summarize Key Points
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="att-list">
            <div class="att-item" v-for="(item,index) in form.attachments" :key="index">
              <Icon v-bind="getIconByName(item.filename)"/>
              <span class="att-filename">{{ item.filename }}</span>
              <span class="att-size">{{ formatBytes(item.size) }}</span>
              <Icon style="cursor: pointer;" icon="material-symbols-light:close-rounded" @click="delAtt(index)"
                    width="22" height="22"/>
            </div>
          </div>
          <div class="btn-right-actions" style="display: flex; align-items: center; gap: 12px; margin-left: auto;">
            <el-tooltip effect="dark" placement="top" :content="emailSizeTooltip">
              <div class="deliverability-gauge" :class="emailSizeStatusClass">
                <span class="gauge-dot"></span>
                <span class="gauge-text">{{ emailSizeFormatted }}</span>
                <span v-if="isGmailClippingRisk" class="gauge-clip-alert">⚠️ Clips in Gmail</span>
              </div>
            </el-tooltip>
            <el-dropdown split-button type="primary" trigger="click" @click="sendEmail" @command="selectSendMode">
              {{ sendButtonLabel }}
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="together">
                    {{ $t(form.sendType === 'forward' ? 'forward' : 'send') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="divide">
                    {{ separateSendLabel }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
    <el-dialog top="10vh" v-model="showContacts" @closed="clearSelectContact" :title="t('recentContacts')">
      <el-table ref="contactsTabRef" row-key="email" :data="contacts" style="height: 445px">
        <el-table-column type="selection" width="32" />
        <el-table-column property="email" :label="t('emailAccount')" >
          <template #default="props">
            <div class="email-row">{{ props.row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column width="55" label="" >
          <template #default>
            <div style="display: flex;">
              <Icon icon="mage:user" style="color: var(--el-text-color-primary)" width="22" height="22" color="#606266" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="contacts-bottom">
        <el-button type="default" @click="deleteContact">{{t('clear')}}</el-button>
        <el-button type="primary" @click="chooseContact">{{t('selectContacts')}}</el-button>
      </div>
    </el-dialog>
    <!-- AI Compose Dialog -->
    <el-dialog
      v-model="showAiComposeModal"
      title="✨ Compose with Cloudflare Workers AI"
      width="540px"
      append-to-body
      class="ai-compose-dialog"
    >
      <div class="ai-compose-body">
        <p class="ai-compose-desc">
          Describe the email you want to send. Cloudflare Workers AI will generate an engaging subject line and deliverability-optimized email body.
        </p>
        <el-input
          v-model="aiComposePrompt"
          type="textarea"
          :rows="4"
          placeholder="e.g. Write a friendly follow-up email to a prospective client asking for feedback on our newsletter software proposal..."
          style="margin-top: 10px; margin-bottom: 14px;"
        />
        <div class="ai-tone-row">
          <span class="ai-tone-label">Tone:</span>
          <el-radio-group v-model="aiComposeTone" size="small">
            <el-radio-button :value="'professional'" label="Professional" />
            <el-radio-button :value="'friendly'" label="Friendly" />
            <el-radio-button :value="'direct'" label="Direct" />
            <el-radio-button :value="'persuasive'" label="Persuasive" />
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAiComposeModal = false">Cancel</el-button>
          <el-button type="primary" :loading="aiComposeLoading" @click="executeAiCompose">
            <Icon icon="fluent:sparkle-24-filled" width="16" height="16" style="margin-right: 4px;" />
            Generate Email
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import {h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailSend} from "@/request/email.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {fileToBase64, formatBytes} from "@/utils/file-utils.js";
import {getIconByName} from "@/utils/icon-utils.js";
import sendPercent from "@/components/send-percent/index.vue"
import {toOssDomain} from "@/utils/convert.js";
import {formatDetailDate} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {userDraftStore} from "@/store/draft.js";
import {useWriterStore} from "@/store/writer.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import {ElMessageBox, ElMessage} from "element-plus";
import { aiSubjectLines, aiAssist, aiCompose } from "@/request/ai.js";

defineExpose({
  open,
  openReply,
  openForward,
  openDraft,
  openAiCompose
})

const {t} = useI18n()
const writerStore = useWriterStore();
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref({})
const userStore = useUserStore();
const show = ref(false);
const percent = ref(0)
let percentMessage = null
let sending = false
const defValue = ref('')
const contactsTabRef = ref({})
const showContacts = ref(false)
const mySelect = ref()
let selectStatus = false
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

const selectRecipientList = ref([])

// Email byte size calculation & Gmail clipping alert
const emailByteSize = computed(() => {
  const c = form.content || '';
  const s = form.subject || '';
  try {
    return new Blob([c, s]).size;
  } catch (e) {
    return (c + s).length;
  }
});

const isGmailClippingRisk = computed(() => emailByteSize.value > 102400); // 100 KB threshold (Gmail clips at 102 KB)

const emailSizeFormatted = computed(() => {
  const kb = (emailByteSize.value / 1024).toFixed(1);
  return `${kb} KB / 102 KB`;
});

const emailSizeStatusClass = computed(() => {
  if (isGmailClippingRisk.value) return 'gauge-danger';
  if (emailByteSize.value > 81920) return 'gauge-warning';
  return 'gauge-safe';
});

const emailSizeTooltip = computed(() => {
  if (isGmailClippingRisk.value) {
    return 'Warning: Message exceeds 102KB. Gmail will clip this email with a "[Message clipped] View entire message" link!';
  }
  return 'Real-time email HTML byte size. Keep under 102KB to prevent Gmail message clipping.';
});

// AI Writing & Subject Assistance
const aiSubjectLoading = ref(false);
const aiSubjectList = ref([]);

async function fetchAiSubjects() {
  const content = form.content || form.text || '';
  const topic = form.subject || '';
  if (!content && !topic) {
    ElMessage.warning('Please enter some email content or a topic first so AI can suggest subjects.');
    return;
  }
  aiSubjectLoading.value = true;
  try {
    const res = await aiSubjectLines(content, topic);
    const list = Array.isArray(res) ? res : (res?.data || []);
    if (list.length > 0) {
      aiSubjectList.value = list;
      ElMessage.success('Generated AI subject suggestions!');
    }
  } catch (e) {
    ElMessage.error(e.message || 'Failed to generate AI subjects');
  } finally {
    aiSubjectLoading.value = false;
  }
}

function applyAiSubject(subject) {
  form.subject = subject;
  ElMessage.success('Subject line applied!');
}

const showAiComposeModal = ref(false);
const aiComposePrompt = ref('');
const aiComposeTone = ref('professional');
const aiComposeLoading = ref(false);

function openAiComposeDialog() {
  showAiComposeModal.value = true;
}

function openAiCompose() {
  show.value = true;
  initAccount();
  openAiComposeDialog();
}

async function executeAiCompose() {
  if (!aiComposePrompt.value || !aiComposePrompt.value.trim()) {
    ElMessage.warning('Please enter a description for the email.');
    return;
  }
  aiComposeLoading.value = true;
  try {
    const res = await aiCompose(aiComposePrompt.value.trim(), aiComposeTone.value, form.content || form.text || '');
    const data = res?.data || res;
    if (data?.subject) {
      form.subject = data.subject;
    }
    if (data?.body) {
      form.content = data.body;
      if (editor.value?.setContent) {
        editor.value.setContent(data.body);
      }
    }
    showAiComposeModal.value = false;
    ElMessage.success('Email generated with Cloudflare Workers AI!');
  } catch (err) {
    ElMessage.error(err.message || 'Failed to generate email');
  } finally {
    aiComposeLoading.value = false;
  }
}

const aiAssistLoading = ref(false);

async function handleAiAssistCommand(action) {
  if (action === 'compose') {
    openAiComposeDialog();
    return;
  }

  const currentText = form.content || form.text || '';
  if (!currentText || currentText.trim().length < 5) {
    ElMessage.warning('Please enter some email content first to assist.');
    return;
  }

  aiAssistLoading.value = true;
  try {
    const res = await aiAssist(currentText, action);
    const text = res?.text || res?.data?.text;
    if (text) {
      form.content = text;
      if (editor.value?.setContent) {
        editor.value.setContent(text);
      }
      ElMessage.success(`Content updated (${action})!`);
    }
  } catch (err) {
    ElMessage.error(err.message || 'Failed to process with AI');
  } finally {
    aiAssistLoading.value = false;
  }
}

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({email: item})))
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

function openContacts() {
  showContacts.value = true
  nextTick(() => {
    form.receiveEmail.forEach(item => {
      if (writerStore.sendRecipientRecord.includes(item)) {
        contactsTabRef.value.toggleRowSelection({email: item});
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
  contactsTabRef.value.clearSelection();
}

function selectChange(value) {
  form.receiveEmail.push(value)
}

function selectStatusChange(status) {
  selectStatus = status
}

const openSelect = () => {
  mySelect.value.toggleMenu()
}

function inputChange(value) {

  selectRecipientList.value = writerStore.sendRecipientRecord.filter(item => value && !form.receiveEmail.includes(item) && item.startsWith(value)).slice(0, 10);

  if (!selectStatus && selectRecipientList.value.length > 0) {
    openSelect()
  }

  if (selectStatus && selectRecipientList.value.length === 0) {
    openSelect()
  }

}

function addTagChange(val) {

  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  form.receiveEmail.splice(form.receiveEmail.length - 1, 1)

  let has = false
  emails.forEach(email => {
    if (isEmail(email) && !form.receiveEmail.includes(email)) {
      form.receiveEmail.push(email)
      has = true
    }
  })
  if (selectStatus && has) openSelect()
}

function clearContent() {
  ElMessageBox.confirm(t('clearContentConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    resetForm()
  })

}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = async (e) => {

    const fileList = e.target.files;

    for (const file of fileList) {

      const size = file.size
      const filename = file.name
      const contentType = file.type

      const content = await fileToBase64(file)
      form.attachments.push({content, filename, size, contentType})

    }

  }
}

async function sendEmail() {

  if (form.receiveEmail.length === 0) {
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

  if (!form.content) {
    ElMessage({
      message: t('emptyContentMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (sending) {
    ElMessage({
      message: t('sendingErrorMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, {value: percent.value, desc: t('sending')}),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending = true

  show.value = false

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(result => {
    const emailList = Array.isArray(result) ? result : result.emails
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })

    userStore.refreshUserInfo();
    addRecipientRecord();

    if (result.failedRecipients?.length) {
      form.receiveEmail = result.failedRecipients
      show.value = true
      ElNotification({
        title: t('partialSendMsg', {count: emailList.length, failed: result.failedRecipients.length}),
        type: 'warning',
        message: result.error,
        position: 'bottom-right'
      })
      return
    }

    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', {style: 'color: teal'}, email.subject),
      position: 'bottom-right'
    })

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      draftStore.setDraft = {...toRaw(form)}
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', {style: 'color: teal'}, e.message),
      position: 'bottom-right'
    })
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percentMessage.close()
    percent.value = 0
    sending = false
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
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
  editor.value.clearEditor()
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {
  if (selectStatus) openSelect()
}

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
      backReply.content = editor.value.getContent()
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
        ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
      <articl>
          ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
      </article>
    </blockquote>`
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
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

function open() {
  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  editor.value.focus()
}

function openDraft(draft) {
  Object.assign(form, {...draft, manyType: draft.manyType || 'together'})
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  editor.value.focus()
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    close()
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function close() {

  if (selectStatus) openSelect();

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
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
    let contentFlag = editor.value.getContent() === backReply.content
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
    const formData = {...toRaw(form)};
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const draftId = await db.value.draft.add({...formData})
    db.value.att.add({draftId, attachments: toRaw(form.attachments)})
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
<style>
.write-select .el-select-dropdown__list {
  padding: 4px 4px !important;
}
.write-select .el-select-dropdown__item {
  padding: 0 10px 0 10px;
}

.write-select .el-select-dropdown {
  min-width: 0 !important;
}
</style>
<style scoped lang="scss">
.send {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .write-box {
    background: var(--el-bg-color);
    width: min(1367px, calc(100% - 80px));
    box-shadow: var(--el-box-shadow-light);
    border: 1px solid var(--el-border-color-light);
    transition: var(--el-transition-duration);
    padding: 15px;
    border-radius: 8px;
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    @media (max-width: 1024px) {
      width: 100%;
      height: 100%;
      border-radius: 0;
      border: 0;
      padding-top: 10px;
    }

    @media (min-width: 1025px) {
      height: min(800px, calc(100vh - 60px));
    }

    .title {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      .title-left {
        align-items: center;
        display: grid;
        grid-template-columns: auto auto auto 1fr;
      }

      .title-text {
      }

      .sender {
        margin-left: 8px;
      }

      .sender-name {
        margin-left: 8px;
        font-weight: bold;
      }

      .send-email {
        color: #999896;
        margin-left: 5px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }


      div {
        display: flex;
        align-items: center;
      }
    }

    .container {
      height: 100%;
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 15px;

      .item-title {
      }

      .button-item {
        display: grid;
        grid-template-columns: auto auto 1fr auto;

        .att-add {
          cursor: pointer;
        }

        .att-clear {
          cursor: pointer;
          margin-left: 10px;
        }

        .att-list {
          display: grid;
          gap: 5px;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          padding-left: 10px;
          padding-right: 10px;
          max-height: 110px;
          overflow-y: auto;
          @media (max-width: 450px) {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .att-item {
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            gap: 5px;
            height: 32px;
            font-size: 14px;
            padding: 4px 5px;
            background: var(--light-ill);
            border-radius: 4px;
            .att-filename {
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }
          }
        }
      }
    }
  }

}

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-dialog) {
  width: 420px !important;
  @media (max-width: 460px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.contacts-bottom {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.add-contact {
  color: var(--regular-text-color)
}

.write-select {
  position: absolute;
  width: 300px;
  left: 60px;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-input-tag__suffix) {
  padding-right: 4px;
}

.icon {
  cursor: pointer;
}
</style>
