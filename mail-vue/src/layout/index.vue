<template>
  <el-container class="layout">
    <el-aside
        class="aside"
        :class="uiStore.asideShow ? 'aside-show' : 'el-aside-hide'">
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
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024
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
.el-aside-hide {
  position: fixed;
  left: 0;
  height: 100%;
  z-index: 100;
  transform: translateX(-100%);
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.aside-show {
  -webkit-box-shadow: var(--aside-right-border);
  box-shadow: var(--aside-right-border);
  transform: translateX(0);
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 101;
  @media (max-width: 1025px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
    background: var(--el-bg-color);
  }
}

.el-aside {
  width: auto;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.main-container {
  min-height: 100%;
  background: var(--el-bg-color);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 72px; /* Space for the floating dock */
}

.el-main {
  padding: 0;
}

.el-header {
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
