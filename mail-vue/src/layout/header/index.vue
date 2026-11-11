<template>
  <div class="header">
    <div class="header-btn">
      <hanburger @click="changeAside"></hanburger>
      <span class="breadcrumb-item">{{ $t(route.meta.title) }}</span>
    </div>
    <div v-perm="'email:send'" class="writer-box">
      <el-button
        class="writer"
        size="default"
        :aria-label="$t('compose')"
        @click="openSend"
      >
        <el-icon :size="21">
          <Icon icon="material-symbols:edit-outline-sharp"/>
        </el-icon>
      </el-button>
    </div>
    <email-search
      v-if="showInboxSearch"
      :store="emailStore"
      :search-options="inboxSearchOptions"
      :class="{ 'account-show': accountPanelShow }"
      @search="returnToList('email')"
      @reset="returnToList('email')"
    />
    <email-search
      v-else-if="showSentSearch"
      :store="sendStore"
      :search-options="sentSearchOptions"
      :class="{ 'account-show': accountPanelShow }"
      @search="returnToList('send')"
      @reset="returnToList('send')"
    />
    <div class="toolbar">
      <el-dropdown
        ref="userDropdownRef"
        trigger="click"
        :teleported="true"
        popper-class="detail-dropdown"
        @visible-change="userCardVisible = $event"
      >
        <div class="avatar">
          <div class="avatar-mascot-pill">
            <EyeTrackerVue :size="24" shape="Cube" eyes="Slant" :follow="50" :bounce="20" />
          </div>
          <Icon class="setting-icon" icon="mingcute:down-small-fill" width="18" height="18"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-mascot">
              <EyeTrackerVue :size="44" shape="Cube" eyes="Slant" :follow="65" :bounce="25" />
            </div>
            <div class="user-identity">
              <div class="user-name">
                {{ userStore.user.name }}
              </div>
              <div class="detail-email" @click="copyEmail(userStore.user.email)" :title="userStore.user.email">
                <span>{{ userStore.user.email }}</span>
                <Icon icon="solar:copy-linear" width="13" height="13" class="copy-hint-icon" />
              </div>
              <div class="detail-user-type">
                <span class="modern-role-badge">{{ userStore.user.role?.name }}</span>
              </div>
            </div>
            <div class="action-info">
              <div class="action-row">
                <span class="action-label">{{ $t('sendCount') }}</span>
                <div class="action-value">
                  <span v-if="sendCount" class="action-count-text">{{ sendCount }}</span>
                  <span class="modern-stat-badge">{{ sendType }}</span>
                </div>
              </div>
              <div class="action-row">
                <span class="action-label">{{ $t('accountCount') }}</span>
                <div class="action-value">
                  <span class="modern-stat-badge" v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">
                    {{ $t('disabled') }}
                  </span>
                  <span class="modern-stat-badge" v-else-if="accountCount && hasPerm('account:add')">
                    {{ $t('totalUserAccount', {msg: accountCount}) }}
                  </span>
                  <span class="modern-stat-badge" v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</span>
                  <span class="modern-stat-badge" v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</span>
                </div>
              </div>
            </div>
            <div class="logout">
              <button class="modern-logout-btn" :disabled="logoutLoading" @click="clickLogout">
                <Icon icon="solar:logout-2-linear" width="16" height="16" />
                <span>{{ logoutLoading ? 'Signing out...' : $t('logOut') }}</span>
              </button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useRoute} from "vue-router";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"
import emailSearch from '@/components/email-search/index.vue'
import {useEmailStore} from '@/store/email.js'
import {useSendStore} from '@/store/send.js'
import EyeTrackerVue from "@/components/EyeTrackerVue.vue";

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const emailStore = useEmailStore()
const sendStore = useSendStore()
const logoutLoading = ref(false)
const userDropdownRef = ref(null)
const userCardVisible = ref(false)
const outsidePointerEvents = ['mousedown', 'pointerup', 'mouseup', 'click', 'pointercancel']
let blockOutsideClick = false
const inboxSearchOptions = computed(() => [
  {label: t('titleDesc'), type: 'subject'},
  {label: t('searchSummaryContent'), type: 'content'},
  {label: t('sender'), type: 'sender'},
  {label: t('searchSenderAddress'), type: 'senderAddress'},
])
const sentSearchOptions = computed(() => [
  {label: t('titleDesc'), type: 'subject'},
  {label: t('searchSummaryContent'), type: 'content'},
  {label: t('searchRecipientAddress'), type: 'recipientAddress'},
])
const accountPanelShow = computed(() => uiStore.accountShow && hasPerm('account:query'))
const showInboxSearch = computed(() =>
  route.meta.name === 'email' || isMailboxDetail('inbox')
)
const showSentSearch = computed(() =>
  route.meta.name === 'send' || isMailboxDetail('sent')
)

function isMailboxDetail(mailbox) {
  return route.meta.name === 'content' && route.params.mailbox === mailbox
}

function returnToList(listName) {
  if (route.meta.name !== 'content') return
  router.push({name: listName})
}

const accountCount = computed(() => {
  return userStore.user.role?.accountCount
})

const sendType = computed(() => {

  if (settingStore.settings.send === 1) {
    return t('disabled')
  }

  if (!hasPerm('email:send')) {
    return t('unauthorized')
  }

  if (userStore.user.role?.sendType === 'ban') {
    return t('sendBanned')
  }

  if (userStore.user.role?.sendType === 'internal') {
    return t('sendInternal')
  }

  if (!userStore.user.role?.sendCount) {
    return t('unlimited')
  }

  if (userStore.user.role?.sendType === 'day') {
    return t('daily')
  }

  if (userStore.user.role?.sendType === 'count') {
    return t('total')
  }
})

const sendCount = computed(() => {


  if (!hasPerm('email:send')) {
    return null
  }

  if (userStore.user.role?.sendType === 'ban') {
    return null
  }

  if (userStore.user.role?.sendType === 'internal') {
    return null
  }

  if (!userStore.user.role?.sendCount) {
    return null
  }

  if (settingStore.settings.send === 1) {
    return null
  }

  return userStore.user.sendCount + '/' + userStore.user.role?.sendCount
})

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true,
    })
  }
}

function changeLang(lang) {
  setExtend(lang === 'en' ? 'en' : 'zh-cn')
  settingStore.lang = lang
}

function openSend() {
  uiStore.writerRef.open()
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem("token")
    router.replace('/login')
  }).finally(() => {
    logoutLoading.value = false
  })
}

function isInsideUserCard(target) {
  const element = target instanceof Element ? target : target?.parentElement
  if (!(element instanceof Element)) return false
  if (userDropdownRef.value?.$el?.contains(element)) return true
  return !!element.closest('.detail-dropdown')
}

function handleUserCardPointerDown(event) {
  blockOutsideClick = userCardVisible.value && !isInsideUserCard(event.target)
  if (!blockOutsideClick) return

  event.preventDefault()
  event.stopPropagation()
  userDropdownRef.value?.handleClose()
}

function handleUserCardPointerEvent(event) {
  if (!blockOutsideClick) return
  event.preventDefault()
  event.stopPropagation()
  if (event.type === 'pointerup' || event.type === 'pointercancel') {
    setTimeout(() => {
      blockOutsideClick = false
    })
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleUserCardPointerDown, true)
  outsidePointerEvents.forEach(type => {
    document.addEventListener(type, handleUserCardPointerEvent, true)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleUserCardPointerDown, true)
  outsidePointerEvents.forEach(type => {
    document.removeEventListener(type, handleUserCardPointerEvent, true)
  })
})

</script>
<style>
.detail-dropdown {
  width: min(304px, calc(100vw - 24px)) !important;
  height: min(304px, calc(100vw - 24px)) !important;
  background: #ffffff !important;
  color: #051F20 !important;
  border-radius: 28px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 20px 48px -10px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.06) !important;
  padding: 18px !important;
  box-sizing: border-box !important;
  z-index: 999999 !important;
  overflow: hidden !important;
  opacity: 1 !important;
}

.detail-dropdown .el-scrollbar,
.detail-dropdown .el-scrollbar__wrap,
.detail-dropdown .el-scrollbar__view {
  width: 100% !important;
  height: 100% !important;
  max-height: none !important;
  padding-bottom: 0 !important;
  overflow: hidden !important;
}

.detail-dropdown .el-popper__arrow {
  display: none !important;
}

.dark .detail-dropdown,
[data-theme="dark"] .detail-dropdown {
  background: #111318 !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

.detail-dropdown .el-dropdown-menu {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}
</style>
<style lang="scss" scoped>

:deep(.el-popper.is-pure) {
  border-radius: 28px !important;
}

.user-details {
  width: 100%;
  height: 100%;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .details-mascot {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-identity {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    font-size: 14px;
    line-height: 1.25;
    width: 100%;
    padding: 0 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
  }

  .detail-email {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 2px 10px;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
    color: var(--regular-text-color);
    cursor: pointer;
    font-size: 12px;
    border-radius: 9999px;
    transition: background-color 160ms ease;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }

  .copy-hint-icon {
    opacity: 0.6;
    flex-shrink: 0;
  }

  .detail-user-type {
    margin-top: 1px;
  }

  .action-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 22px;
  }

  .action-label {
    font-size: 12px;
    color: var(--regular-text-color);
    white-space: nowrap;
  }

  .action-value {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
  }

  .action-count-text {
    font-weight: 600;
    font-size: 12px;
  }

  .modern-role-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 500;
    background: rgba(0, 0, 0, 0.06);
    color: var(--el-text-color-primary);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .modern-stat-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.05);
    color: var(--el-text-color-regular);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .logout {
    width: 100%;
    flex-shrink: 0;
  }

  .modern-logout-btn {
    width: 100%;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 9999px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: #000000;
    color: #ffffff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 180ms ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

    &:hover:not(:disabled) {
      background: #27272a;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.dark {
  .user-details .action-info {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .modern-role-badge,
  .modern-stat-badge {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #f1f5f9;
  }

  .modern-logout-btn {
    background: #ffffff;
    color: #000000;
    border-color: rgba(255, 255, 255, 0.2);

    &:hover:not(:disabled) {
      background: #e4e4e7;
    }
  }

  .detail-email:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.avatar-mascot-pill {
  display: inline-flex;
  align-items: center;
}


.header {
  text-align: right;
  font-size: 12px;
  display: grid;
  height: 100%;
  gap: 10px;
  grid-template-columns: auto 1fr;
  position: relative;
}

@media (max-width: 767px) {
  .header {
    display: flex;
    align-items: center;
  }

  .header-btn {
    flex: 1;
  }

  .toolbar {
    flex-shrink: 0;
  }
}

.writer-box {
  display: none;

  @media (max-width: 767px) {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0;
    flex-shrink: 0;

    .writer {
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      background: transparent;
      box-shadow: none;
      --el-button-bg-color: transparent;
      --el-button-border-color: transparent;
      --el-button-hover-bg-color: transparent;
      --el-button-hover-border-color: transparent;
      --el-button-active-bg-color: transparent;
      --el-button-active-border-color: transparent;
      --el-button-outline-color: transparent;
    }
  }
}

.header-btn {
  display: inline-flex;
  align-items: center;
  height: 100%;
  min-width: 0;
}

.breadcrumb-item {
  font-weight: bold;
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.toolbar {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 15px;
  @media (max-width: 767px) {
    gap: 10px;
  }

  .header-theme-toggle {
    flex-shrink: 0;
  }

  .icon-item {
    align-self: center;
    width: 30px;
    height: 30px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .icon-item:hover {
    background: var(--base-fill);
  }

  .avatar {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;

    .avatar-text {
      box-sizing: border-box;
      background: var(--el-bg-color);
      color: var(--el-text-color-primary);
      height: 32px;
      width: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8px;
      border: 1px solid var(--dark-border);
    }

    .setting-icon {
      position: relative;
      top: 0;
      margin-right: 6px;
      bottom: 0;
      color: var(--el-text-color-primary);
    }
  }

}

.el-tooltip__trigger:first-child:focus-visible {
  outline: unset;
}
</style>
