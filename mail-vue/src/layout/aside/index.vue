<template>
  <div class="sidebar-wrapper" v-if="uiStore.asideShow">
    <el-scrollbar class="expanded-scroll">
      <div class="expanded-view">
        <div class="expanded-header">
          <div class="title" :class="{ 'title-display': titleUsesDisplayFont }">
            <div class="sidebar-mascot">
              <EyeTrackerVue :size="38" shape="Cube" eyes="Slant" :follow="60" :bounce="25" />
            </div>
            <div class="brand-title">{{ settingStore.settings.title || 'GrabMails' }}</div>
          </div>
          <button class="collapse-btn" type="button" @click="toggleExpand" title="Close sidebar">
            <Icon icon="hugeicons:chevron-left" width="18" height="18" />
          </button>
        </div>

        <button v-perm="'email:send'" class="compose-bar" type="button" @click="openCompose">
          <Icon icon="hugeicons:quill-write" width="18" height="18" style="margin-right: 6px;" />
          <span>{{ $t('compose') }}</span>
        </button>

        <el-menu :collapse="false" @select="navigateMenu" text-color="#fff" active-text-color="#ffffff" style="margin-top: 6px">
          <el-menu-item @click="navigateMenu('email')" index="email"
                        :class="route.meta.name === 'email' ? 'choose-item' : ''">
            <Icon icon="hugeicons:inbox" width="20" height="20" />
            <span class="menu-name" style="margin-left: 16px">{{$t('inbox')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('send')" index="send" v-perm="'email:send'"
                        :class="route.meta.name === 'send' ? 'choose-item' : ''">
            <Icon icon="hugeicons:mail-send-01" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('sent')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('draft')" index="draft" v-perm="'email:send'"
                        :class="route.meta.name === 'draft' ? 'choose-item' : ''">
            <Icon icon="hugeicons:note-01" width="19" height="19" />
            <span class="menu-name" style="margin-left: 17px">{{$t('drafts')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('star')" index="star"
                        :class="route.meta.name === 'star' ? 'choose-item' : ''">
            <Icon icon="hugeicons:star" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('starred')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('contacts')" index="contacts"
                        :class="route.name === 'contacts' ? 'choose-item' : ''">
            <Icon icon="hugeicons:user-group" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('contacts') || 'Contacts'}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('drive')" index="drive"
                        :class="route.name === 'drive' ? 'choose-item' : ''">
            <Icon icon="hugeicons:folder-01" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('drive') || 'Drive'}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('calendar')" index="calendar"
                        :class="route.name === 'calendar' ? 'choose-item' : ''">
            <Icon icon="hugeicons:calendar-03" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('calendar') || 'Calendar'}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('agent')" index="agent"
                        :class="route.name === 'agent' ? 'choose-item' : ''">
            <Icon icon="hugeicons:ai-brain-01" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('aiAgents') || 'AI Agents'}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('api-keys')" index="api-keys"
                        :class="route.name === 'api-keys' ? 'choose-item' : ''">
            <Icon icon="hugeicons:key-01" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('apiKeys') || 'API Keys'}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('setting')" index="setting"
                        :class="route.meta.name === 'setting' ? 'choose-item' : ''">
            <Icon icon="hugeicons:settings-02" width="19" height="19" />
            <span class="menu-name" style="margin-left: 16px">{{$t('settings')}}</span>
          </el-menu-item>

          <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
            <div>{{$t('manage')}}</div>
          </div>
          <el-menu-item @click="navigateMenu('analysis')" index="analysis" v-perm="'analysis:query'"
                        :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
            <Icon icon="hugeicons:activity" width="20" height="20" />
            <span class="menu-name" style="margin-left: 15px">{{$t('analytics')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('user')" index="user" v-perm="'user:query'"
                        :class="route.meta.name === 'user' ? 'choose-item' : ''">
            <Icon icon="hugeicons:users" width="20" height="20" />
            <span class="menu-name" style="margin-left: 16px">{{$t('allUsers')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('all-email')" index="all-email" v-perm="'all-email:query'"
                        :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
            <Icon icon="hugeicons:archive-03" width="20" height="20" />
            <span class="menu-name" style="margin-left: 16px">{{$t('allMail')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('role')" index="role" v-perm="'role:query'"
                        :class="route.meta.name === 'role' ? 'choose-item' : ''">
            <Icon icon="hugeicons:lock-keyhole" width="20" height="20" />
            <span class="menu-name" style="margin-left: 16px">{{$t('permissions')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('reg-key')" index="reg-key" v-perm="'reg-key:query'"
                        :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
            <Icon icon="hugeicons:shield-check" width="20" height="20" />
            <span class="menu-name" style="margin-left: 16px">{{$t('inviteCode')}}</span>
          </el-menu-item>
          <el-menu-item @click="navigateMenu('sys-setting')" index="sys-setting" v-perm="'setting:query'"
                        :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
            <Icon icon="hugeicons:settings" width="19" height="19" style="margin-left: 2px" />
            <span class="menu-name" style="margin-left: 17px">{{$t('SystemSettings')}}</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import router from "@/router/index.js";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useSettingStore } from "@/store/setting.js";
import { useUiStore } from "@/store/ui.js";
import { useUserStore } from "@/store/user.js";
import { hasPerm } from "@/perm/perm.js";
import EyeTrackerVue from "@/components/EyeTrackerVue.vue";

const settingStore = useSettingStore();
const uiStore = useUiStore();
const userStore = useUserStore();
const route = useRoute();

const titleUsesDisplayFont = computed(() => !/\p{Script=Han}/u.test(settingStore.settings.title || ''));

function openCompose() {
  uiStore.writerRef?.open?.();
}

function navigateMenu(name) {
  if (name) {
    router.push({ name });
    if (window.innerWidth < 1025) {
      uiStore.asideShow = false;
    }
  }
}

function toggleExpand() {
  uiStore.asideShow = !uiStore.asideShow;
}
</script>

<style lang="scss" scoped>
.sidebar-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #000000 !important;
  color: #ffffff !important;
  user-select: none;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Light Mode: Sidebar strictly turns BLACK */
:root:not(.dark) .sidebar-wrapper,
html:not(.dark) .sidebar-wrapper {
  background: #000000 !important;
  color: #ffffff !important;
}

.expanded-scroll {
  height: 100%;
}

.expanded-view {
  width: 240px;
  padding-bottom: 24px;
}

.expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff !important;

  .brand-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 140px;
  }
}

.sidebar-mascot {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

/* ══ Keep EyeTracker strictly WHITE during BOTH modes in sidebar ══ */
.sidebar-mascot :deep(.eyt-body),
.sidebar-wrapper :deep(.eyt-body) {
  fill: #ffffff !important;
  stroke: rgba(255, 255, 255, 0.25) !important;
}

.sidebar-mascot :deep(.eyt-eye),
.sidebar-wrapper :deep(.eyt-eye) {
  fill: #000000 !important;
}

.sidebar-mascot :deep(.eyt-ball),
.sidebar-wrapper :deep(.eyt-ball) {
  filter: drop-shadow(0 4px 14px rgba(255, 255, 255, 0.18)) !important;
}

.collapse-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 160ms ease;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.18);
  }
}

.compose-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 24px);
  height: 40px;
  margin: 0 12px 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 9999px;
  background: #ffffff;
  color: #000000;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  transition: all 180ms ease;

  &:hover {
    background: #f4f4f5;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
  }

  &:active {
    transform: scale(0.98);
  }
}

.manage-title {
  margin-top: 14px;
  padding-left: 20px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.el-menu {
  background: transparent !important;
  border-right: none !important;
  width: 100% !important;
}

.el-menu-item {
  margin: 3px 12px !important;
  border-radius: 12px;
  height: 40px;
  padding: 0 14px !important;
  color: rgba(255, 255, 255, 0.8) !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  user-select: none !important;
  transition: all 160ms ease;

  * {
    pointer-events: none !important;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  &.choose-item {
    background: rgba(255, 255, 255, 0.16) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.28);
    font-weight: 600;
  }
}

/* Light mode overrides: Keep sidebar pure black */
:root:not(.dark) .el-menu-item,
html:not(.dark) .el-menu-item {
  color: rgba(255, 255, 255, 0.8) !important;

  &:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  &.choose-item {
    background: rgba(255, 255, 255, 0.16) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.28);
    font-weight: 600;
  }
}
</style>
