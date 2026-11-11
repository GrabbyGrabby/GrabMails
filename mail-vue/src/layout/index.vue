<template>
  <el-container class="layout">
    <el-aside
        class="aside"
        :class="[
          uiStore.asideShow ? 'aside-expanded' : 'aside-collapsed',
          isMobile ? (uiStore.asideShow ? 'mobile-open' : 'mobile-closed') : ''
        ]">
      <Aside />
    </el-aside>
    <div
        :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
        @click="uiStore.asideShow = false"
    ></div>
    <el-container class="main-container">
      <el-main>
        <el-header>
            <Header />
        </el-header>
        <Main />
      </el-main>
    </el-container>

    <!-- Modern Floating Glass Dock Navbar (Capsule & Bencho Style) -->
    <nav class="floating-dock-bar" aria-label="Floating Modern Navigation">
      <MagnifyingDockVue
        :items="dockItems"
        :activeItem="activeDockItem"
        @select="handleDockSelect"
        :magnify="1.28"
        :spread="2"
        :lift="8"
      />
    </nav>
  </el-container>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import MagnifyingDockVue from '@/components/MagnifyingDockVue.vue'
import { House, Send, Star, Settings } from 'lucide-react'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from "@/store/ui.js"
import { useRouter, useRoute } from 'vue-router'
import writer from '@/layout/write/index.vue'

const router = useRouter()
const route = useRoute()
const uiStore = useUiStore()
const writerRef = ref({})
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 1025 : false)

const dockItems = [
  { key: 'email', label: 'Inbox', Icon: House },
  { key: 'send', label: 'Sent', Icon: Send },
  { key: 'star', label: 'Starred', Icon: Star },
  { key: 'setting', label: 'Settings', Icon: Settings },
]

const activeDockItem = computed(() => {
  const name = route.name
  if (name === 'email' || name === 'content') return 'email'
  if (name === 'send') return 'send'
  if (name === 'star') return 'star'
  if (name === 'setting' || name === 'sys-setting') return 'setting'
  return 'email'
})

function handleDockSelect(key) {
  if (key && route.name !== key) {
    router.push({ name: key })
  }
}

const handleResize = () => {
  const mobile = window.innerWidth < 1025
  isMobile.value = mobile
  if (mobile) {
    uiStore.asideShow = false
  }
}

onMounted(() => {
  uiStore.writerRef = writerRef
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.aside {
  background: #000000 !important;
  border-radius: 28px;
  margin: 10px 0 10px 10px;
  height: calc(100% - 20px) !important;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  transition: width 240ms cubic-bezier(0.16, 1, 0.3, 1), transform 240ms cubic-bezier(0.16, 1, 0.3, 1), background-color 240ms ease;
  flex-shrink: 0;
  position: relative;
  z-index: 100;

  @media (min-width: 1025px) {
    &.aside-collapsed {
      width: 0px !important;
      min-width: 0px !important;
      max-width: 0px !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
      overflow: hidden !important;
    }
    &.aside-expanded {
      width: 250px !important;
      min-width: 250px !important;
      max-width: 250px !important;
      margin: 10px 0 10px 10px !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
  }

  @media (max-width: 1024px) {
    margin: 0 !important;
    height: 100% !important;
    border-radius: 0 28px 28px 0 !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 101 !important;
    width: 260px !important;
    background: #000000 !important;
    color: #ffffff !important;

    &.mobile-closed {
      transform: translateX(-100%) !important;
      pointer-events: none !important;
      opacity: 0 !important;
    }

    &.mobile-open {
      transform: translateX(0) !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
      pointer-events: auto !important;
      opacity: 1 !important;
    }
  }
}

:root:not(.dark) .aside,
html:not(.dark) .aside {
  background: #000000 !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45) !important;
}

.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  background: #000000;
}

.main-container {
  height: calc(100% - 20px);
  background: var(--el-bg-color);
  overflow-y: hidden;
  overflow-x: hidden !important;
  border-radius: 28px;
  margin: 10px;
  border: 1px solid var(--el-border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: 1025px) {
    margin: 0;
    border-radius: 0;
    border: none;
    height: 100%;
  }
}

.el-main {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.el-header {
  position: relative;
  z-index: 50;
  background: var(--el-bg-color);
  border-bottom: solid 1px var(--el-border-color);
  padding: 0;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  @media (max-width: 767px) {
    height: 52px;
  }
}

/* ══ Floating Curved Glass Dock (Bencho / Capsule modern navbar) ══ */
.floating-dock-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);
  filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.12));

  @media (max-width: 767px) {
    bottom: 14px;
    scale: 0.92;
    transform-origin: center bottom;
  }
}

.overlay-show {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 99;
  transition: all 0.3s;
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
}
</style>
