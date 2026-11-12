<template>
  <div id="login-box" :class="{ 'has-custom-bg': !!settingStore.settings.background }" :style="backgroundStyle" v-loading="oauthLoading" element-loading-text="Logging in...">
    <!-- Gradient Forms WebGL 1 Background with 5 Morphing masses & film grain -->
    <GradientFormsBackground v-if="!settingStore.settings.background" />
    <div v-else :style="background" class="custom-bg-cover" aria-hidden="true"></div>

    <!-- Split Layout Stage for Desktop & Stacked for Mobile -->
    <main class="login-stage">
      <div class="login-viewport-wrapper">
        <!-- 1. Hero Section (Both on Desktop and Phone View) -->
        <aside class="hero-left-col">
          <!-- Mascot cleanly positioned in the middle above the text (NO card, NO 'ready to send and receive') -->
          <div class="hero-mascot-center" aria-label="Interactive Mascot">
            <EyeTrackerVue
              :size="isMobile ? 86 : 108"
              shape="Cube"
              eyes="Slant"
              :follow="70"
              :bounce="26"
              within="#login-box"
            />
          </div>

          <!-- Hero Text Group -->
          <div class="hero-text-block">
            <div class="hero-subhead">Serverless email service</div>
            <div class="hero-cloudflare">powered by Cloudflare</div>
            <h1 class="hero-brand-big">{{ settingStore.settings.title || 'GrabMails' }}</h1>
          </div>
        </aside>

        <!-- 2. Modern Login Card (Middle-Right on Desktop, Bottom on Mobile) -->
        <section class="modern-login-card" :class="{ 'is-mobile-card': isMobile }" aria-labelledby="card-brand-label">
          <!-- Top branding label & tab switcher -->
          <header class="card-header">
            <!-- Label only (no mail icon, no zero lag) -->
            <div class="brand-row" v-if="!isMobile">
              <div id="card-brand-label" class="brand-name">
                {{ settingStore.settings.title || 'GrabMails' }}
              </div>
            </div>

            <!-- Segmented Tab Switcher (Sign In / Sign Up) -->
            <div class="tab-switcher" role="tablist">
              <button
                type="button"
                role="tab"
                :aria-selected="show === 'login'"
                :class="['tab-pill', { active: show === 'login' }]"
                @click="show = 'login'"
              >
                {{ $t('loginBtn') }}
              </button>
              <button
                v-if="settingStore.settings.register === 0"
                type="button"
                role="tab"
                :aria-selected="show === 'register'"
                :class="['tab-pill', { active: show === 'register' }]"
                @click="show = 'register'"
              >
                {{ $t('regBtn') }}
              </button>
            </div>

            <!-- Title only on Desktop (Hidden on Mobile) -->
            <template v-if="!isMobile">
              <h2 class="form-title">
                {{ show === 'login' ? $t('loginTitle') : $t('regTitle') }}
              </h2>
              <p class="form-subtitle" v-if="show === 'login'">
                Access your private end-to-end encrypted inbox
              </p>
            </template>
          </header>

          <!-- Form Body: Login -->
          <form v-show="show === 'login'" @submit.prevent="submit" class="form-body">
            <div class="input-group">
              <label class="field-label">{{ $t('emailAccount') }}</label>
              <el-input
                :class="['curved-input', 'email-field', !hideLoginDomain ? 'has-domain-append' : '']"
                v-model="form.email"
                type="text"
                :placeholder="$t('emailAccount')"
                autocomplete="username"
                @keyup.enter="submit"
              >
                <template #prefix>
                  <Icon icon="solar:letter-linear" width="18" height="18" class="field-prefix-icon" />
                </template>
                <template #append v-if="!hideLoginDomain">
                  <div class="domain-picker" @click.stop="openSelect">
                    <el-select
                      v-if="show === 'login'"
                      ref="mySelect"
                      v-model="suffix"
                      :placeholder="$t('select')"
                      class="select"
                    >
                      <el-option
                        v-for="item in domainList"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                    <div class="domain-trigger">
                      <span>{{ suffix }}</span>
                      <Icon class="setting-icon" icon="mingcute:down-small-fill" width="18" height="18"/>
                    </div>
                  </div>
                </template>
              </el-input>
            </div>

            <div class="input-group">
              <label class="field-label">{{ $t('password') }}</label>
              <el-input
                class="curved-input password-field"
                v-model="form.password"
                :placeholder="$t('password')"
                type="password"
                show-password
                autocomplete="current-password"
                @keyup.enter="submit"
              >
                <template #prefix>
                  <Icon icon="solar:lock-keyhole-minimalistic-linear" width="18" height="18" class="field-prefix-icon" />
                </template>
              </el-input>
            </div>

            <!-- Slide to Confirm Button -->
            <div class="slide-button-slot">
              <SlideToConfirmVue
                :width="slideWidth"
                :speed="52"
                @confirm="submit"
              />
              <div class="slide-subtext" v-if="!isMobile">
                <span>{{ $t('loginBtn') }} &bull; Slide handle or press ↵</span>
              </div>
            </div>

            <!-- Social OAuth Row (Desktop only) -->
            <div v-if="oauthProviders.length > 0 && !isMobile" class="oauth-section">
              <div class="divider">
                <span>or continue with</span>
              </div>
              <div class="oauth-grid">
                <button
                  v-for="p in oauthProviders"
                  :key="p.key"
                  type="button"
                  class="oauth-btn"
                  @click="oauthLogin(p.key)"
                  :title="p.label"
                >
                  <el-avatar v-if="p.iconType === 'image'" :src="p.icon" :size="20" />
                  <Icon v-else :icon="p.icon" width="20" height="20" />
                  <span class="oauth-name">{{ p.label }}</span>
                </button>
              </div>
            </div>
          </form>

          <!-- Form Body: Register -->
          <form v-show="show !== 'login'" @submit.prevent="submitRegister" class="form-body">
            <div class="input-group">
              <label class="field-label">{{ $t('emailAccount') }}</label>
              <el-input
                :class="['curved-input', 'email-field', !hideLoginDomain ? 'has-domain-append' : '']"
                v-model="registerForm.email"
                type="text"
                :placeholder="$t('emailAccount')"
                autocomplete="off"
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:letter-linear" width="18" height="18" class="field-prefix-icon" />
                </template>
                <template #append v-if="!hideLoginDomain">
                  <div class="domain-picker" @click.stop="openSelect">
                    <el-select
                      v-if="show !== 'login'"
                      ref="mySelect"
                      v-model="suffix"
                      :placeholder="$t('select')"
                      class="select"
                    >
                      <el-option
                        v-for="item in domainList"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                    <div class="domain-trigger">
                      <span>{{ suffix }}</span>
                      <Icon class="setting-icon" icon="mingcute:down-small-fill" width="18" height="18"/>
                    </div>
                  </div>
                </template>
              </el-input>
            </div>

            <div class="input-group">
              <label class="field-label">{{ $t('password') }}</label>
              <el-input
                class="curved-input password-field"
                v-model="registerForm.password"
                :placeholder="$t('password')"
                type="password"
                show-password
                autocomplete="new-password"
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:lock-keyhole-minimalistic-linear" width="18" height="18" class="field-prefix-icon" />
                </template>
              </el-input>
            </div>

            <div class="input-group">
              <label class="field-label">{{ $t('confirmPwd') }}</label>
              <el-input
                class="curved-input password-field"
                v-model="registerForm.confirmPassword"
                :placeholder="$t('confirmPwd')"
                type="password"
                show-password
                autocomplete="new-password"
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:shield-keyhole-linear" width="18" height="18" class="field-prefix-icon" />
                </template>
              </el-input>
            </div>

            <div class="input-group" v-if="settingStore.settings.regKey === 0">
              <label class="field-label">{{ $t('regKey') }}</label>
              <el-input
                class="curved-input"
                v-model="registerForm.code"
                :placeholder="$t('regKey')"
                type="text"
                autocomplete="off"
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:key-linear" width="18" height="18" class="field-prefix-icon" />
                </template>
              </el-input>
            </div>

            <div class="input-group" v-if="settingStore.settings.regKey === 2">
              <label class="field-label">{{ $t('regKeyOptional') }}</label>
              <el-input
                class="curved-input"
                v-model="registerForm.code"
                :placeholder="$t('regKeyOptional')"
                type="text"
                autocomplete="off"
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:key-linear" width="18" height="18" class="field-prefix-icon" />
                </template>
              </el-input>
            </div>

            <div
              v-if="hasTurnstile"
              v-show="verifyShow"
              ref="turnstileContainer"
              :key="turnstileContainerKey"
              class="register-turnstile"
              :data-sitekey="settingStore.settings.siteKey"
              data-callback="onTurnstileSuccess"
              data-error-callback="onTurnstileError"
              data-after-interactive-callback="loadAfter"
              data-before-interactive-callback="loadBefore"
            >
              <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed', {action: $t('regBtn')}) }}</span>
            </div>

            <!-- Slide to Confirm Button for Register -->
            <div class="slide-button-slot">
              <SlideToConfirmVue
                :width="slideWidth"
                :speed="52"
                @confirm="submitRegister"
              />
            </div>
          </form>
        </section>
      </div>
    </main>

    <!-- OAuth Bind Dialog -->
    <el-dialog class="bind-dialog" v-model="showBindForm" title="注册绑定邮箱">
      <div class="bind-container">
        <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="bindForm.email" type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="bind">
          <template #append v-if="!hideLoginDomain">
            <div @click.stop="openSelect">
              <el-select
                ref="mySelect"
                v-model="suffix"
                :placeholder="$t('select')"
                class="select"
              >
                <el-option
                  v-for="item in domainList"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
              <div>
                <span>{{ suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-input v-if="settingStore.settings.regKey === 0" v-model="bindForm.code" :placeholder="$t('regKey')"
                  type="text" autocomplete="off" @keyup.enter="bind"/>
        <el-input v-if="settingStore.settings.regKey === 2" v-model="bindForm.code"
                  :placeholder="$t('regKeyOptional')" type="text" autocomplete="off" @keyup.enter="bind"/>
        <el-button class="btn" type="primary" @click="bind" :loading="bindLoading">
          绑定
        </el-button>
      </div>
    </el-dialog>

    <a v-show="settingStore.settings.projectLink" class="github-pill" href="https://github.com/GrabbyGrabby/GrabMails" target="_blank" rel="noopener">
      <Icon icon="mingcute:github-line" width="20" height="20" />
    </a>
  </div>
</template>

<script setup>
import router from "@/router";
import {useRoute} from "vue-router";
import {computed, nextTick, onMounted, onBeforeUnmount, reactive, ref} from "vue";
import {login, register} from "@/request/login.js";
import {websiteConfig} from "@/request/setting.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import {useUiStore} from "@/store/ui.js";
import {Icon} from "@iconify/vue";
import {cvtR2Url} from "@/utils/convert.js";
import {loginUserInfo} from "@/request/my.js";
import {permsToRouter} from "@/perm/perm.js";
import {useI18n} from "vue-i18n";
import {oauthBindUser, oauthLinuxDoLogin, oauthGithubLogin, oauthGoogleLogin} from "@/request/ouath.js";
import {reloadTurnstileScript} from "@/utils/turnstile-script.js";
import EyeTrackerVue from "@/components/EyeTrackerVue.vue";
import SlideToConfirmVue from "@/components/SlideToConfirmVue.vue";
import GradientFormsBackground from "@/components/GradientFormsBackground.vue";

const {t} = useI18n();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const route = useRoute();
const loginLoading = ref(false)
const bindLoading = ref(false)
const oauthLoading = ref(false);
const showBindForm = ref(false);
const show = ref('login')

// Responsive Window Tracker
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const isMobile = computed(() => windowWidth.value < 768)
const slideWidth = computed(() => {
  if (windowWidth.value < 360) return 260
  if (windowWidth.value < 480) return 290
  if (windowWidth.value < 768) return 320
  return 340
})

const handleWindowResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  window.onTurnstileSuccess = handleTurnstileSuccess
  window.onTurnstileError = handleTurnstileError
  if (route.query?.code) {
    registerForm.code = String(route.query.code)
    bindForm.code = String(route.query.code)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  clearTimeout(turnstileRetryTimer)
  if (window.onTurnstileSuccess === handleTurnstileSuccess) {
    delete window.onTurnstileSuccess
  }
  if (window.onTurnstileError === handleTurnstileError) {
    delete window.onTurnstileError
  }
})

const oauthKeys = ['linuxdo', 'github', 'google']

const oauthProvider = computed(() => {
  const fromState = route.query.state
  if (oauthKeys.includes(fromState)) return fromState
  const fromStore = sessionStorage.getItem('oauthProvider')
  return oauthKeys.includes(fromStore) ? fromStore : null
})

const oauthProviders = computed(() => {
  const allProviders = [
    { key: 'google', label: 'Google', icon: 'devicon:google', iconType: 'iconify' },
    { key: 'github', label: 'GitHub', icon: 'codicon:github-inverted', iconType: 'iconify' },
    { key: 'linuxdo', label: 'LinuxDo', icon: '/image/linuxdo.webp', iconType: 'image' },
  ]
  return allProviders.filter(p => settingStore.settings[p.key + 'Switch'] === 0)
})

const bindForm = reactive({
  email: '',
  oauthUserId: '',
  bindToken: '',
  code: 'grx66y'
})

const form = reactive({
  email: '',
  password: '',
});
const mySelect = ref()
const suffix = ref('')
const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  code: 'grx66y'
})
const domainList = settingStore.domainList;
const registerLoading = ref(false)
suffix.value = domainList[0]
const verifyShow = ref(false)
let verifyToken = ''
let turnstileId = null
let botJsError = ref(false)
let verifyErrorCount = 0
let turnstileRecoveryAttempted = false
let turnstileRetryTimer = null
const turnstileContainer = ref(null)
const turnstileContainerKey = ref(0)

const hasTurnstile = computed(() => {
  const k = settingStore.settings.siteKey;
  return typeof k === 'string' && k.trim().length > 0;
});

function handleTurnstileSuccess(token) {
  verifyToken = token;
  verifyErrorCount = 0;
  botJsError.value = false;
}

function renderRegisterTurnstile(api = window.turnstile) {
  if (!turnstileContainer.value) return null;
  return api.render(turnstileContainer.value, {
    sitekey: settingStore.settings.siteKey,
    callback: handleTurnstileSuccess,
    'error-callback': handleTurnstileError
  });
}

async function recoverTurnstile() {
  if (!hasTurnstile.value || turnstileRecoveryAttempted) return;
  turnstileRecoveryAttempted = true;
  clearTimeout(turnstileRetryTimer);
  botJsError.value = false;
  verifyToken = '';
  verifyErrorCount = 0;
  turnstileId = null;
  turnstileContainerKey.value++;
  try {
    const api = await reloadTurnstileScript();
    await nextTick();
    if (show.value === 'login' || !turnstileContainer.value) return;
    turnstileId = renderRegisterTurnstile(api);
  } catch (error) {
    botJsError.value = true;
    console.warn('Turnstile recovery failed', error);
  } finally {
    turnstileRecoveryAttempted = false;
  }
}

function handleTurnstileError(e) {
  if (verifyErrorCount >= 4) {
    botJsError.value = true
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  clearTimeout(turnstileRetryTimer)
  turnstileRetryTimer = setTimeout(() => {
    nextTick(() => {
      if (show.value === 'login' || !turnstileContainer.value) return
      if (!window.turnstile?.render) {
        recoverTurnstile()
        return
      }
      if (!turnstileId) {
        turnstileId = renderRegisterTurnstile(window.turnstile)
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
}

window.loadAfter = (e) => {
  console.log('loadAfter')
}

window.loadBefore = (e) => {
  console.log('loadBefore')
}

const hideLoginDomain = computed(() => settingStore.settings.loginDomain === 1)

const background = computed(() => {
  return settingStore.settings.background ? {
    'background-image': `url(${cvtR2Url(settingStore.settings.background)})`,
    'background-repeat': 'no-repeat',
    'background-size': 'cover',
    'background-position': 'center'
  } : ''
})

const backgroundStyle = computed(() => {
  return settingStore.settings.background ? 'background: var(--el-bg-color)' : ''
})

const openSelect = () => {
  mySelect.value.toggleMenu()
}

const getFullEmail = (email) => {
  return hideLoginDomain.value ? email : email + suffix.value
}

const getEmailName = (email) => {
  return email.split('@')[0]
}

function oauthLogin(provider) {
  const clientId = settingStore.settings[provider + 'ClientId']
  const redirectUri = encodeURIComponent(window.location.origin + '/login')
  sessionStorage.setItem('oauthProvider', provider)
  const authorizeUrls = {
    linuxdo: `https://connect.linux.do/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
    github: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${provider}`,
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
  }
  window.location.href = authorizeUrls[provider]
}

const loginFns = {
  linuxdo: oauthLinuxDoLogin,
  github: oauthGithubLogin,
  google: oauthGoogleLogin,
}

oauthGetUser();

async function oauthGetUser() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code || !oauthProvider.value) return

  const provider = oauthProvider.value
  oauthLoading.value = true
  sessionStorage.removeItem('oauthProvider')
  window.history.replaceState({}, '', window.location.origin + window.location.pathname)

  loginFns[provider](code, window.location.origin + '/login').then(data => {
    bindForm.oauthUserId = data.userInfo.oauthUserId;
    bindForm.bindToken = data.bindToken || '';
    if (!data.token) {
      showBindForm.value = true
      oauthLoading.value = false
      ElMessage({
        message: '请注册绑定一个邮箱',
        type: 'warning',
        duration: 4000,
        plain: true,
      })
      return;
    }
    saveToken(data.token);
  }).catch(() => {
    oauthLoading.value = false
  })
}

function bind() {
  if (bindLoading.value) return
  if (!bindForm.email) {
    ElMessage({ message: t('emptyEmailMsg'), type: 'error', plain: true })
    return
  }
  if (getEmailName(bindForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({ message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}), type: 'error', plain: true })
    return
  }
  let email = getFullEmail(bindForm.email);
  if (!isEmail(email)) {
    ElMessage({ message: t('notEmailMsg'), type: 'error', plain: true })
    return
  }
  if (settingStore.settings.regKey === 0 && !bindForm.code) {
    ElMessage({ message: t('emptyRegKeyMsg'), type: 'error', plain: true })
    return
  }
  const formPayload = {email, oauthUserId: bindForm.oauthUserId, bindToken: bindForm.bindToken, code: bindForm.code}
  bindLoading.value = true
  oauthBindUser(formPayload).then(data => {
    saveToken(data.token)
  }).catch(() => {
    bindLoading.value = false
  })
}

const submit = () => {
  if (loginLoading.value) return
  if (!form.email) {
    ElMessage({ message: t('emptyEmailMsg'), type: 'error', plain: true })
    return
  }
  let email = getFullEmail(form.email);
  if (!isEmail(email)) {
    ElMessage({ message: t('notEmailMsg'), type: 'error', plain: true })
    return
  }
  if (!form.password) {
    ElMessage({ message: t('emptyPwdMsg'), type: 'error', plain: true })
    return
  }

  loginLoading.value = true
  login(email, form.password).then(async data => {
    await saveToken(data.token)
  }).finally(() => {
    loginLoading.value = false
  })
}

async function saveToken(token) {
  localStorage.setItem('token', token)
  refreshWebsiteConfig()
  const user = await loginUserInfo();
  accountStore.currentAccountId = user.account.accountId;
  accountStore.currentAccount = user.account;
  userStore.user = user;
  const routers = permsToRouter(user.permKeys);
  routers.forEach(routerData => {
    router.addRoute('layout', routerData);
  });
  await router.replace({name: 'layout'})
  uiStore.showNotice()
  oauthLoading.value = false;
  bindLoading.value = false;
}

function refreshWebsiteConfig() {
  websiteConfig().then(setting => {
    settingStore.settings = setting
    settingStore.domainList = setting.domainList
    if (!suffix.value && setting.domainList.length > 0) {
      suffix.value = setting.domainList[0]
    }
    document.title = setting.title
  }).catch(e => {
    console.error(e)
  })
}

function submitRegister() {
  if (registerLoading.value) return
  if (!registerForm.email) {
    ElMessage({ message: t('emptyEmailMsg'), type: 'error', plain: true })
    return
  }
  if (getEmailName(registerForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({ message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}), type: 'error', plain: true })
    return
  }
  const email = getFullEmail(registerForm.email);
  if (!isEmail(email)) {
    ElMessage({ message: t('notEmailMsg'), type: 'error', plain: true })
    return
  }
  if (!registerForm.password) {
    ElMessage({ message: t('emptyPwdMsg'), type: 'error', plain: true })
    return
  }
  if (registerForm.password.length < 6) {
    ElMessage({ message: t('pwdLengthMsg'), type: 'error', plain: true })
    return
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage({ message: t('confirmPwdFailMsg'), type: 'error', plain: true })
    return
  }
  if (settingStore.settings.regKey === 0 && !registerForm.code) {
    ElMessage({ message: t('emptyRegKeyMsg'), type: 'error', plain: true })
    return
  }

  if (hasTurnstile.value && !verifyToken && (settingStore.settings.registerVerify === 0 || (settingStore.settings.registerVerify === 2 && settingStore.settings.regVerifyOpen))) {
    if (turnstileRecoveryAttempted) return
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = renderRegisterTurnstile(window.turnstile)
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
            recoverTurnstile()
          }
        } else {
          window.turnstile.reset(turnstileId)
        }
      })
    } else if (botJsError.value) {
      recoverTurnstile()
    } else {
      ElMessage({ message: t('botVerifyMsg'), type: "error", plain: true })
    }
    return;
  }

  registerLoading.value = true
  const regPayload = {
    email,
    password: registerForm.password,
    token: verifyToken,
    code: registerForm.code
  }

  register(regPayload).then(({regVerifyOpen}) => {
    show.value = 'login'
    registerForm.email = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.code = 'grx66y'
    registerLoading.value = false
    verifyToken = ''
    settingStore.settings.regVerifyOpen = regVerifyOpen
    verifyShow.value = false
    ElMessage({ message: t('regSuccessMsg'), type: 'success', plain: true })
  }).catch(res => {
    registerLoading.value = false
    if (res.code === 400 && hasTurnstile.value) {
      verifyToken = ''
      settingStore.settings.regVerifyOpen = true
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          if (!window.turnstile?.render) {
            recoverTurnstile()
            return
          }
          turnstileId = renderRegisterTurnstile(window.turnstile)
        })
      }
      verifyShow.value = true
    }
  });
}
</script>

<style scoped>
/* ══ Main Page Viewport & Smooth Background ══ */
#login-box {
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  box-sizing: border-box;
  background: radial-gradient(circle at 18% 18%, rgba(142, 182, 155, 0.25) 0%, transparent 45%),
              radial-gradient(circle at 82% 82%, rgba(251, 228, 219, 0.6) 0%, transparent 50%),
              linear-gradient(135deg, #FBE4DB 0%, #FFFDF9 50%, #F5EAE4 100%);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: background 300ms ease;
}

.dark #login-box {
  background: radial-gradient(circle at 20% 20%, rgba(142, 182, 155, 0.15) 0%, transparent 45%),
              radial-gradient(circle at 80% 80%, rgba(25, 0, 25, 0.85) 0%, transparent 50%),
              linear-gradient(135deg, #051F20 0%, #190019 50%, #051F20 100%);
}

#login-box.has-custom-bg {
  background: var(--el-bg-color);
}

.custom-bg-cover {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* ══ Dot Matrix Texture Overlay (Image 1 reference) ══ */
.dots-backdrop {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(15, 23, 42, 0.08) 1.2px, transparent 1.2px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 1;
}

.dark .dots-backdrop {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.07) 1.2px, transparent 1.2px);
}

/* Ambient glow orbs */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.glow-1 {
  width: 420px;
  height: 420px;
  top: 5%;
  left: 10%;
  background: rgba(251, 191, 36, 0.15);
}

.glow-2 {
  width: 480px;
  height: 480px;
  bottom: 8%;
  right: 12%;
  background: rgba(238, 210, 196, 0.22);
}

.dark .glow-1 {
  background: rgba(56, 189, 248, 0.12);
}

.dark .glow-2 {
  background: rgba(168, 85, 247, 0.10);
}

/* Subtle Animated Sky Clouds (Image 3 reference) */
#background-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

@keyframes animateCloud {
  0% { transform: translateX(-400px); }
  100% { transform: translateX(calc(100vw + 400px)); }
}

.cloud {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.7) 0%, rgba(240, 244, 248, 0.4) 100%);
  border-radius: 100px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  position: absolute;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.dark .cloud {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow: none;
}

.cloud:after,
.cloud:before {
  content: "";
  position: absolute;
  background: inherit;
  border-radius: 50%;
}

.cloud:after {
  height: 100px;
  width: 100px;
  left: 50px;
  top: -50px;
}

.cloud:before {
  height: 180px;
  width: 180px;
  right: 50px;
  top: -90px;
}

.x1 { height: 120px; width: 350px; top: 12%; animation: animateCloud 45s linear infinite; opacity: 0.65; }
.x2 { height: 80px; width: 240px; top: 38%; animation: animateCloud 32s linear infinite; opacity: 0.45; }
.x3 { height: 100px; width: 300px; top: 68%; animation: animateCloud 50s linear infinite; opacity: 0.55; }
.x4 { height: 70px; width: 200px; top: 22%; animation: animateCloud 28s linear infinite; opacity: 0.35; }
.x5 { height: 110px; width: 320px; top: 82%; animation: animateCloud 38s linear infinite; opacity: 0.5; }

/* ══ Center Stage (Avatar + Login Card) ══ */
.login-stage {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ══ Viewport Split Layout (Hero Middle-Left, Card Middle-Right) ══ */
.login-viewport-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  justify-content: center;
  gap: 48px;
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 20px;
}

@media (max-width: 860px) {
  .login-viewport-wrapper {
    grid-template-columns: 1fr !important;
    gap: 28px !important;
    padding: 24px 16px 80px 16px !important;
  }
}

/* ══ Hero Section (Centered Mascot + Clean Headline & Description) ══ */
.hero-left-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  color: #ffffff;
  max-width: 540px;
  margin: 0 auto;
}

/* Mascot sits cleanly in the middle above the text (NO card, NO 'ready to send and receive') */
.hero-mascot-center {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.hero-text-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  width: 100%;
}

.hero-subhead {
  font-family: 'Poppins', sans-serif !important;
  font-size: clamp(18px, 2.4vw, 24px);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.2;
}

.hero-cloudflare {
  font-family: 'Poppins', sans-serif !important;
  font-size: clamp(16px, 2.1vw, 22px);
  font-weight: 400;
  color: #8EB69B;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

/* GrabMails written BIG */
.hero-brand-big {
  font-family: 'Poppins', sans-serif !important;
  font-size: clamp(42px, 5.8vw, 68px) !important;
  font-weight: 800 !important;
  letter-spacing: -0.035em !important;
  line-height: 1.05 !important;
  margin: 6px 0 10px 0 !important;
  background: linear-gradient(135deg, #ffffff 0%, #FBE4D8 45%, #8EB69B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  font-family: 'Poppins', sans-serif !important;
  font-size: clamp(13px, 1.5vw, 15px);
  font-weight: 400;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
  max-width: 480px;
  margin: 0 auto;
}

.mascot-tag {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: -0.01em;
}

/* Mascot Centered at Middle on Mobile */
.mobile-mascot-center {
  display: none;
}

/* ══ Modern Curved Login Card (Middle-Right on Desktop, Bottom on Mobile) ══ */
.modern-login-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  box-sizing: border-box;
  background: rgba(255, 253, 249, 0.96);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  backdrop-filter: blur(28px) saturate(180%);
  border-radius: 28px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 24px 64px -12px rgba(0, 0, 0, 0.18),
    0 4px 16px -4px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  padding: 34px 28px 28px 28px;
  color: #000000;
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
  margin: 0 auto;
}

.dark .modern-login-card {
  background: rgba(18, 19, 23, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 28px 72px -16px rgba(0, 0, 0, 0.75),
    0 4px 20px -2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

/* ══ Card Header (No mail icon, no zero lag) ══ */
.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 14px;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #000000;
}

.dark .brand-name {
  color: #ffffff;
}

/* Segmented Tab Switcher */
.tab-switcher {
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.06);
  width: 100%;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.dark .tab-switcher {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.06);
}

.tab-pill {
  flex: 1;
  padding: 8px 12px;
  border-radius: 11px;
  font-family: 'Poppins', sans-serif !important;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 180ms ease;
  user-select: none;
}

.dark .tab-pill {
  color: #94a3b8;
}

.tab-pill.active {
  background: #000000;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark .tab-pill.active {
  background: #ffffff;
  color: #000000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 4px 0;
  color: #000000;
}

.dark .form-title {
  color: #ffffff;
}

.form-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
}

.dark .form-subtitle {
  color: #94a3b8;
}

/* ══ Form Fields ══ */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  letter-spacing: -0.01em;
}

.dark .field-label {
  color: #cbd5e1;
}

.field-prefix-icon {
  color: #64748b;
  margin-left: 2px;
  margin-right: 6px;
}

:deep(.curved-input .el-input__wrapper) {
  border-radius: 14px !important;
  padding: 6px 14px !important;
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: all 200ms ease !important;
}

.dark :deep(.curved-input .el-input__wrapper) {
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

:deep(.curved-input .el-input__wrapper.is-focus) {
  border-color: rgba(0, 0, 0, 0.25) !important;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06) !important;
}

/* ══ Email typed text: STRICTLY BLACK TEXT & POPPINS ══ */
:deep(.curved-input .el-input__inner),
:deep(.curved-input input) {
  font-size: 14px !important;
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
  font-weight: 500 !important;
  height: 28px !important;
  font-family: 'Poppins', sans-serif !important;
  background: transparent !important;
}

/* ══ REMOVE BLUE AUTOFILL FADE (Email & Password) ══ */
:deep(.curved-input input:-webkit-autofill),
:deep(.curved-input input:-webkit-autofill:hover),
:deep(.curved-input input:-webkit-autofill:focus),
:deep(.curved-input input:-webkit-autofill:active),
:deep(.curved-input .el-input__inner:-webkit-autofill),
:deep(.curved-input .el-input__inner:-webkit-autofill:hover),
:deep(.curved-input .el-input__inner:-webkit-autofill:focus),
:deep(.curved-input .el-input__inner:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  box-shadow: 0 0 0 1000px #ffffff inset !important;
  -webkit-text-fill-color: #000000 !important;
  color: #000000 !important;
  caret-color: #000000 !important;
  font-family: 'Poppins', sans-serif !important;
  transition: background-color 5000000s ease-in-out 0s, color 5000000s ease-in-out 0s !important;
  background-clip: content-box !important;
}

/* ══ Email input with domain append: Seamless container, ZERO black border ══ */
:deep(.curved-input.has-domain-append) {
  display: flex !important;
  align-items: stretch !important;
  border-radius: 14px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  background: #ffffff !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  overflow: hidden !important;
  transition: all 200ms ease !important;
}

:deep(.curved-input.has-domain-append:focus-within) {
  border-color: rgba(0, 0, 0, 0.25) !important;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06) !important;
}

:deep(.curved-input.has-domain-append .el-input__wrapper) {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  padding: 6px 8px 6px 14px !important;
}

:deep(.curved-input.has-domain-append .el-input-group__append) {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  outline: none !important;
  padding: 0 14px 0 0 !important;
  display: flex !important;
  align-items: center !important;
}

.domain-picker {
  cursor: pointer;
  user-select: none;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* ══ Domain suffix (@grabby.qzz.io): STRICTLY BLACK TEXT, NO BLACK BORDER ══ */
.domain-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
  font-family: 'Poppins', sans-serif !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.domain-trigger span {
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
  font-family: 'Poppins', sans-serif !important;
  font-weight: 500 !important;
}

.setting-icon {
  color: #000000 !important;
}

/* ══ Password input: masked dots ONLY when type="password", plaintext when revealed ══ */
:deep(.password-field input),
:deep(.curved-input input[type="password"]),
:deep(.curved-input input) {
  font-family: 'Poppins', sans-serif !important;
}

:deep(.password-field input[type="password"]),
:deep(.curved-input input[type="password"]) {
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
  -webkit-text-security: disc !important;
  letter-spacing: 0.16em !important;
  font-size: 16px !important;
  font-family: 'Poppins', sans-serif !important;
}

:deep(.password-field input[type="text"]) {
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
  -webkit-text-security: none !important;
  letter-spacing: normal !important;
  font-size: 14px !important;
  font-family: 'Poppins', sans-serif !important;
}

:deep(.password-field .el-input__password) {
  color: #475569 !important;
  cursor: pointer;
}

:deep(.password-field .el-input__password:hover) {
  color: #000000 !important;
}

:deep(.password-field input::placeholder),
:deep(.curved-input input::placeholder) {
  font-family: 'Poppins', sans-serif !important;
  letter-spacing: normal !important;
}

.select {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

/* ══ Slide to Confirm Slot ══ */
.slide-button-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  margin-bottom: 4px;
  gap: 8px;
  width: 100%;
}

.slide-subtext {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-align: center;
}

/* ══ OAuth Social Login ══ */
.oauth-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.dark .divider::before,
.dark .divider::after {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.divider span {
  padding: 0 10px;
}

.oauth-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.oauth-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.7);
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 180ms ease;
}

.dark .oauth-btn {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.oauth-btn:hover {
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .oauth-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

/* ══ Card Footer ══ */
.card-footer {
  margin-top: 18px;
  text-align: center;
}

.terms-note {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.terms-note a {
  color: inherit;
  text-decoration: underline;
  font-weight: 500;
}

/* ══ Floating GitHub Pill ══ */
.github-pill {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  color: #334155;
  text-decoration: none;
  z-index: 100;
  transition: all 200ms ease;
}

.dark .github-pill {
  background: rgba(30, 33, 44, 0.85);
  border-color: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
}

.github-pill:hover {
  transform: scale(1.08);
}

/* ══ Mobile View Responsive Architecture ══
   Clean Mobile Flow: Mascot & Brand at the Top, Full Login Card Accessible with All Required Fields */
@media (max-width: 767px) {
  #login-box {
    min-height: 100dvh !important;
    height: auto !important;
    padding: 24px 14px 40px 14px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }

  .login-stage {
    min-height: 100% !important;
    height: auto !important;
    width: 100% !important;
    max-width: 440px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .login-viewport-wrapper {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    width: 100% !important;
    padding: 0 !important;
    gap: 20px !important;
  }

  .hero-left-col {
    gap: 10px !important;
    padding: 0 !important;
  }

  .hero-mascot-center {
    margin-bottom: 2px !important;
  }

  .hero-brand-big {
    font-size: 38px !important;
    margin: 4px 0 !important;
  }

  .hero-subhead {
    font-size: 15px !important;
  }

  .hero-cloudflare {
    font-size: 14px !important;
  }

  .modern-login-card.is-mobile-card {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 24px !important;
    padding: 24px 18px calc(20px + env(safe-area-inset-bottom, 12px)) 18px !important;
    margin: 0 !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
  }

  .dark .modern-login-card.is-mobile-card {
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
  }

  .card-header {
    margin-bottom: 12px !important;
  }

  .tab-switcher {
    margin-bottom: 14px !important;
  }

  .form-body {
    gap: 12px !important;
  }

  .slide-button-slot {
    margin-top: 6px !important;
    margin-bottom: 0 !important;
  }

  .github-pill {
    display: none !important;
  }
}

:deep(.bind-dialog) {
  border-radius: 24px !important;
}

.bind-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
