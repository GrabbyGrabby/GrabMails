<template>
  <div ref="menuWrapperRef" class="apps-menu-wrapper">
    <!-- Trigger Button (9-dot launcher) -->
    <button
      type="button"
      class="apps-menu-btn apps-trigger-btn"
      :class="{ 'is-active': visible }"
      :title="t('apps') || 'GrabMails Suite'"
      :aria-label="t('apps') || 'Apps Launcher'"
      :aria-expanded="visible"
      data-testid="apps-menu-trigger"
      @click.stop="toggleMenu"
    >
      <Icon icon="hugeicons:dot-grid-fill" width="18" height="18" class="dots-icon" />
    </button>

    <!-- Popover Content Dropdown -->
    <transition name="el-zoom-in-top">
      <div
        v-if="visible"
        class="apps-menu-popover apps-menu-dropdown"
        data-testid="apps-menu-popover"
        @click.stop
      >
        <div class="apps-popover-content">
          <!-- Header Bar -->
          <div class="apps-popover-header">
            <div class="apps-header-left">
              <span class="apps-brand-title">GrabMails</span>
            </div>
            <span class="apps-header-badge">
              <span class="badge-dot" />
              Productivity
            </span>
          </div>

          <!-- Apps 2x2 Grid -->
          <div class="apps-grid" role="menu" aria-label="GrabMails Apps">
            <button
              v-for="app in appsList"
              :key="app.path"
              type="button"
              class="app-card"
              :class="[`app-${app.id}`, { 'is-active': isAppActive(app.path) }]"
              :data-testid="`app-link-${app.id}`"
              role="menuitem"
              :aria-label="app.label"
              @click="navigateTo(app.path)"
            >
              <div class="app-icon-squircle">
                <!-- Inbox / Mail -->
                <Icon
                  v-if="app.id === 'mail'"
                  icon="hugeicons:inbox"
                  width="22"
                  height="22"
                  class="app-hugeicon"
                />

                <!-- Calendar -->
                <Icon
                  v-else-if="app.id === 'calendar'"
                  icon="hugeicons:calendar-03"
                  width="22"
                  height="22"
                  class="app-hugeicon"
                />

                <!-- Drive -->
                <Icon
                  v-else-if="app.id === 'drive'"
                  icon="hugeicons:folder-01"
                  width="22"
                  height="22"
                  class="app-hugeicon"
                />

                <!-- Contacts -->
                <Icon
                  v-else-if="app.id === 'contacts'"
                  icon="hugeicons:user-group"
                  width="22"
                  height="22"
                  class="app-hugeicon"
                />

                <!-- AI Agents -->
                <Icon
                  v-else-if="app.id === 'agent'"
                  icon="hugeicons:ai-brain-01"
                  width="22"
                  height="22"
                  class="app-hugeicon"
                />

                <!-- Booking -->
                <Icon
                  v-else-if="app.id === 'booking'"
                  icon="hugeicons:clock-01"
                  width="22"
                  height="22"
                  class="app-hugeicon"
                />
              </div>

              <div class="app-text-block">
                <span class="app-title">{{ app.label }}</span>
                <span class="app-subtitle">{{ app.subtitle }}</span>
              </div>

              <div v-if="isAppActive(app.path)" class="app-active-indicator" />
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { onClickOutside } from '@vueuse/core'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const visible = ref(false)
const menuWrapperRef = ref(null)

onClickOutside(menuWrapperRef, () => {
  visible.value = false
})

function toggleMenu() {
  visible.value = !visible.value
}

const appsList = computed(() => [
  {
    id: 'mail',
    path: '/inbox',
    label: t('inbox') || 'Inbox',
    subtitle: 'Mail & Threads',
  },
  {
    id: 'calendar',
    path: '/calendar',
    label: t('calendar') || 'Calendar',
    subtitle: 'Events & Plans',
  },
  {
    id: 'drive',
    path: '/drive',
    label: t('drive') || 'Drive',
    subtitle: 'Cloud Storage',
  },
  {
    id: 'contacts',
    path: '/contacts',
    label: t('contacts') || 'Contacts',
    subtitle: 'People & CRM',
  },
  {
    id: 'agent',
    path: '/agent',
    label: t('aiAgents') || 'AI Agents',
    subtitle: 'Copilot & MCP',
  },
  {
    id: 'booking',
    path: '/book',
    label: t('booking') || 'Booking',
    subtitle: 'Public Scheduling',
  },
])

const isAppActive = (path) => {
  if (path === '/inbox') {
    return route.path === '/inbox' || route.path.startsWith('/inbox/') || route.meta?.name === 'email'
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}

const navigateTo = (path) => {
  visible.value = false
  if (route.path !== path) {
    router.push(path)
  }
}
</script>

<style scoped>
.apps-menu-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.apps-menu-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: var(--el-text-color-primary, #000000);
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0;
  outline: none;
}

.apps-menu-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  transform: scale(1.05);
}

.apps-menu-btn.is-active {
  background: rgba(0, 0, 0, 0.09);
}

.dark .apps-menu-btn,
[data-theme="dark"] .apps-menu-btn {
  color: #e5e7eb;
}

.dark .apps-menu-btn:hover,
[data-theme="dark"] .apps-menu-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dark .apps-menu-btn.is-active,
[data-theme="dark"] .apps-menu-btn.is-active {
  background: rgba(255, 255, 255, 0.14);
}

.dots-icon {
  display: block;
}

/* ══ Dropdown Popover ══ */
.apps-menu-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(320px, calc(100vw - 20px));
  background: #ffffff;
  color: #000000;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 20px 48px -10px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 16px;
  box-sizing: border-box;
  z-index: 999999;
  overflow: hidden;
}

.dark .apps-menu-dropdown,
[data-theme="dark"] .apps-menu-dropdown {
  background: #111317;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.apps-popover-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.apps-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dark .apps-popover-header,
[data-theme="dark"] .apps-popover-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.apps-brand-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #000000);
  letter-spacing: -0.01em;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
}

.apps-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
  color: #000000;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  display: inline-block;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
}

.dark .apps-header-badge,
[data-theme="dark"] .apps-header-badge {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

/* ══ Apps Grid ══ */
.apps-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: 100%;
}

.app-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 8px 12px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
  outline: none;
}

.app-card:hover {
  background: rgba(0, 0, 0, 0.035);
  transform: translateY(-2px);
}

.dark .app-card:hover,
[data-theme="dark"] .app-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.app-card.is-active {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.06);
}

.dark .app-card.is-active,
[data-theme="dark"] .app-card.is-active {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.app-icon-squircle {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.app-card:hover .app-icon-squircle {
  transform: scale(1.06);
}

.app-duotone-svg {
  display: block;
}

/* ══ Brand Color Harmonies (GrabMails Palette) ══ */
/* Mail / Inbox: GrabMails Monochrome Contrast */
.app-mail .app-icon-squircle {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.12);
  color: #18181b;
}
.dark .app-mail .app-icon-squircle,
[data-theme="dark"] .app-mail .app-icon-squircle {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

/* Calendar: Obsidian Indigo & Electric Violet */
.app-calendar .app-icon-squircle {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(49, 46, 129, 0.06) 100%);
  border: 1px solid rgba(79, 70, 229, 0.18);
  color: #4338CA;
}
.dark .app-calendar .app-icon-squircle,
[data-theme="dark"] .app-calendar .app-icon-squircle {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(30, 27, 75, 0.45) 100%);
  border: 1px solid rgba(129, 140, 248, 0.3);
  color: #818CF8;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.16);
}

/* Drive: Warm Amber Bronze & Honey Gold */
.app-drive .app-icon-squircle {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(120, 53, 15, 0.06) 100%);
  border: 1px solid rgba(217, 119, 6, 0.18);
  color: #B45309;
}
.dark .app-drive .app-icon-squircle,
[data-theme="dark"] .app-drive .app-icon-squircle {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(69, 26, 3, 0.45) 100%);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #FBBF24;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.16);
}

/* Contacts: Obsidian Amethyst & Royal Violet */
.app-contacts .app-icon-squircle {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(76, 29, 149, 0.06) 100%);
  border: 1px solid rgba(124, 58, 237, 0.18);
  color: #6D28D9;
}
.dark .app-contacts .app-icon-squircle,
[data-theme="dark"] .app-contacts .app-icon-squircle {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(59, 7, 100, 0.45) 100%);
  border: 1px solid rgba(192, 132, 252, 0.3);
  color: #C084FC;
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.16);
}

/* AI Agent: Cyan Teal & Emerald Glow */
.app-agent .app-icon-squircle {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(13, 148, 136, 0.06) 100%);
  border: 1px solid rgba(13, 148, 136, 0.2);
  color: #0d9488;
}
.dark .app-agent .app-icon-squircle,
[data-theme="dark"] .app-agent .app-icon-squircle {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(19, 78, 74, 0.45) 100%);
  border: 1px solid rgba(45, 212, 191, 0.35);
  color: #2dd4bf;
  box-shadow: 0 4px 16px rgba(45, 212, 191, 0.18);
}

/* Booking: Sky Blue & Sapphire */
.app-booking .app-icon-squircle {
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(14, 116, 144, 0.06) 100%);
  border: 1px solid rgba(2, 132, 199, 0.18);
  color: #0284c7;
}
.dark .app-booking .app-icon-squircle,
[data-theme="dark"] .app-booking .app-icon-squircle {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(12, 74, 110, 0.45) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.16);
}

.app-text-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  max-width: 100%;
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary, #000000);
  text-align: center;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.app-subtitle {
  font-size: 10px;
  font-weight: 400;
  color: var(--el-text-color-secondary, #6b7280);
  text-align: center;
  white-space: nowrap;
}

.dark .app-subtitle,
[data-theme="dark"] .app-subtitle {
  color: #9ca3af;
}

.app-active-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
}

@media (max-width: 480px) {
  .apps-menu-dropdown {
    right: -8px;
    width: min(290px, calc(100vw - 16px));
    border-radius: 20px;
    padding: 12px;
  }
}
</style>
