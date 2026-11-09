import {createApp} from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import { init } from '@/init/init.js';
import { createPinia } from 'pinia';
import piniaPersistedState from 'pinia-plugin-persistedstate';
import 'element-plus/theme-chalk/dark/css-vars.css';
import 'nprogress/nprogress.css';
import perm from "@/perm/perm.js";
import i18n from "@/i18n/index.js";
import Lenis from 'lenis';

const pinia = createPinia().use(piniaPersistedState)
const app = createApp(App).use(pinia)

// Initialize Lenis 60fps smooth scrolling
if (typeof window !== 'undefined') {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  window.__lenis = lenis;
}

await init()
app.use(router).use(i18n).directive('perm', perm)
app.config.devtools = true;

app.mount('#app');
