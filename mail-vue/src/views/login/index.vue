<template>
  <div id="login-box" :class="{ 'has-custom-bg': !!settingStore.settings.background }" :style="backgroundStyle" v-loading="oauthLoading" element-loading-text="Logging in...">
    <!-- Ambient dot-matrix & smooth cloud backdrop -->
    <div class="dots-backdrop" aria-hidden="true"></div>

    <div id="background-wrap" v-if="!settingStore.settings.background" aria-hidden="true">
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>
      <div class="x1 cloud"></div>
      <div class="x2 cloud"></div>
      <div class="x3 cloud"></div>
      <div class="x4 cloud"></div>
      <div class="x5 cloud"></div>
    </div>
    <div v-else :style="background" class="custom-bg-cover" aria-hidden="true"></div>

    <!-- Centered Login Stage -->
    <main class="login-stage">
      <!-- 1. Avatar placed at the centre right above the login card -->
      <div class="avatar-hero" role="region" aria-label="Interactive Mascot">
        <EyeTrackerVue
          :size="isMobile ? 84 : 100"
          shape="Cube"
          eyes="Slant"
          :follow="68"
          :bounce="28"
          within="#login-box"
        />
      </div>

      <!-- 2. Premium Modern Curved Login Card -->
      <section class="modern-login-card" aria-labelledby="card-title">
        <!-- Top branding pill & tab switcher -->
        <header class="card-header">
          <div class="brand-row">
            <div class="brand-badge">
              <span class="brand-icon">✉</span>
              <span class="brand-name">{{ settingStore.settings.title || 'GrabMail' }}</span>
            </div>
            <span class="security-chip">
              <Icon icon="solar:shield-check-bold" width="13" height="13" />
              <span>Zero-Log</span>
            </span>
          </div>

          <!-- Segmented Tab Switcher (Image 4 & 5 inspired) -->
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

          <h1 id="card-title" class="form-title">
            {{ show === 'login' ? $t('loginTitle') : $t('regTitle') }}
          </h1>
          <p class="form-subtitle">
            {{ show === 'login' ? 'Access your private end-to-end encrypted inbox' : 'Claim your secure custom mailbox in seconds' }}
          </p>
        </header>

        <!-- Form Body: Login -->
        <form v-show="show === 'login'" @submit.prevent="submit" class="form-body">
          <div class="input-group">
            <label class="field-label">{{ $t('emailAccount') }}</label>
            <el-input
              :class="['curved-input', !hideLoginDomain ? 'has-domain-append' : '']"
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
              class="curved-input"
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

          <!-- Slide to Confirm Enter Button -->
          <div class="slide-button-slot">
            <SlideToConfirmVue
              :width="slideWidth"
              :speed="52"
              @confirm="submit"
            />
            <div class="slide-subtext">
              <span>{{ $t('loginBtn') }} &bull; Slide handle or press ↵</span>
            </div>
          </div>

          <!-- Social OAuth Row (Image 4 & 5) -->
          <div v-if="oauthProviders.length > 0" class="oauth-section">
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
              :class="['curved-input', !hideLoginDomain ? 'has-domain-append' : '']"
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
              class="curved-input"
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
              class="curved-input"
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

          <!-- Slide to Confirm Enter Button for Register -->
          <div class="slide-button-slot">
            <SlideToConfirmVue
              :width="slideWidth"
              :speed="52"
              @confirm="submitRegister"
            />
            <div class="slide-subtext">
              <span>{{ $t('regBtn') }} &bull; Slide to create mailbox</span>
            </div>
          </div>

          <!-- Social OAuth Row for Register -->
          <div v-if="oauthProviders.length > 0" class="oauth-section">
            <div class="divider">
              <span>or sign up with</span>
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

        <!-- Footer terms / copyright -->
        <footer class="card-footer">
          <p class="terms-note">
            By continuing, you agree to our <a href="#" @click.prevent>{{ $t('terms') || 'Terms of Service' }}</a> &amp; <a href="#" @click.prevent>{{ $t('privacy') || 'Privacy Policy' }}</a>.
          </p>
        </footer>
      </section>
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
const isMobile = computed(() => windowWidth.value < 640)
const slideWidth = computed(() => {
  if (windowWidth.value < 360) return 240
  if (windowWidth.value < 480) return 270
  return 320
})

const handleWindowResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
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
  code: ''
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
  code: null
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
const turnstileContainer = ref(null)
const turnstileContainerKey = ref(0)

async function recoverTurnstile() {
  if (turnstileRecoveryAttempted) return
  turnstileRecoveryAttempted = true
  botJsError.value = false
  verifyToken = ''
  turnstileId = null
  turnstileContainerKey.value++
  try {
    const api = await reloadTurnstileScript()
    await nextTick()
    if (show.value === 'login' || !turnstileContainer.value) return
    turnstileId = api.render(turnstileContainer.value)
  } catch (error) {
    botJsError.value = true
    console.warn('Turnstile recovery failed', error)
  } finally {
    turnstileRecoveryAttempted = false
  }
}

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) return
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.register-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

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
  const formPayload = {email, oauthUserId: bindForm.oauthUserId, code: bindForm.code}
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

  if (!verifyToken && (settingStore.settings.registerVerify === 0 || (settingStore.settings.registerVerify === 2 && settingStore.settings.regVerifyOpen))) {
    if (turnstileRecoveryAttempted) return
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.register-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
            recoverTurnstile()
          }
        } else {
          window.turnstile.reset('.register-turnstile')
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
    registerForm.code = ''
    registerLoading.value = false
    verifyToken = ''
    settingStore.settings.regVerifyOpen = regVerifyOpen
    verifyShow.value = false
    ElMessage({ message: t('regSuccessMsg'), type: 'success', plain: true })
  }).catch(res => {
    registerLoading.value = false
    if (res.code === 400) {
      verifyToken = ''
      settingStore.settings.regVerifyOpen = true
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.register-turnstile')
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
  background: radial-gradient(circle at 18% 18%, rgba(254, 243, 199, 0.5) 0%, transparent 45%),
              radial-gradient(circle at 82% 82%, rgba(254, 235, 226, 0.45) 0%, transparent 50%),
              linear-gradient(135deg, #FAF7F2 0%, #F5EFEB 50%, #FAF8F5 100%);
  overflow-x: hidden;
  overflow-y: auto;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: background 300ms ease;
}

.dark #login-box {
  background: radial-gradient(circle at 20% 20%, rgba(30, 41, 59, 0.7) 0%, transparent 45%),
              radial-gradient(circle at 80% 80%, rgba(49, 46, 129, 0.5) 0%, transparent 50%),
              linear-gradient(135deg, #090a0f 0%, #0d0e15 50%, #11131c 100%);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
}

/* ══ Avatar Hero Anchor (Center Above Card) ══ */
.avatar-hero {
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: -22px; /* Smoothly overlaps the top of the card */
  transition: transform 300ms ease;
}

.avatar-hero:hover {
  transform: translateY(-2px);
}

/* ══ Premium Modern Curved Login Card (Image 4 & 5 Reference) ══ */
.modern-login-card {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 253, 249, 0.92);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  backdrop-filter: blur(28px) saturate(180%);
  border-radius: 32px;
  border: 1px solid rgba(235, 226, 215, 0.85);
  box-shadow:
    0 24px 64px -12px rgba(15, 23, 42, 0.12),
    0 4px 16px -4px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  padding: 40px 32px 32px 32px;
  color: #1C1917;
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dark .modern-login-card {
  background: rgba(20, 22, 28, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 28px 72px -16px rgba(0, 0, 0, 0.7),
    0 4px 20px -2px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  color: #f8fafc;
}

/* ══ Card Header ══ */
.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 18px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.dark .brand-name {
  color: #f8fafc;
}

.security-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
}

.dark .security-chip {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

/* Segmented Tab Switcher (Image 4 & 5) */
.tab-switcher {
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.05);
  width: 100%;
  margin-bottom: 18px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.dark .tab-switcher {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.06);
}

.tab-pill {
  flex: 1;
  padding: 8px 12px;
  border-radius: 11px;
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
  background: #FFFDF9;
  color: #1C1917;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dark .tab-pill.active {
  background: #1e293b;
  color: #f8fafc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 4px 0;
  color: #1C1917;
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
  gap: 16px;
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
  color: #94a3b8;
  margin-left: 2px;
  margin-right: 6px;
}

:deep(.curved-input .el-input__wrapper) {
  border-radius: 14px !important;
  padding: 6px 14px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(232, 226, 215, 0.95) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: all 200ms ease !important;
}

.dark :deep(.curved-input .el-input__wrapper) {
  background: rgba(26, 29, 38, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25) !important;
}

:deep(.curved-input .el-input__wrapper.is-focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

:deep(.curved-input .el-input__inner) {
  font-size: 14px !important;
  color: inherit !important;
  height: 28px !important;
}

:deep(.curved-input.has-domain-append .el-input__wrapper) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

:deep(.el-input-group__append) {
  background: rgba(241, 245, 249, 0.9) !important;
  border: 1px solid rgba(15, 23, 42, 0.12) !important;
  border-left: none !important;
  border-top-right-radius: 14px !important;
  border-bottom-right-radius: 14px !important;
  padding: 0 12px !important;
}

.dark :deep(.el-input-group__append) {
  background: rgba(30, 33, 44, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

.domain-picker {
  cursor: pointer;
  user-select: none;
}

.domain-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #3b82f6;
  font-family: 'JetBrains Mono', monospace, sans-serif;
}

.select {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

/* ══ Slide to Confirm Slot (The Enter Button) ══ */
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

/* ══ OAuth Social Login (Image 4 & 5 Reference) ══ */
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
  margin-top: 20px;
  text-align: center;
}

.terms-note {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.terms-note a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.terms-note a:hover {
  text-decoration: underline;
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

/* ══ Responsive Adjustments for Mobile and PC ══ */
@media (max-width: 640px) {
  #login-box {
    padding: 32px 14px 40px 14px;
    align-items: flex-start;
  }

  .login-stage {
    max-width: 100%;
    margin-top: 8px;
  }

  .avatar-hero {
    margin-bottom: -18px;
  }

  .modern-login-card {
    border-radius: 26px;
    padding: 28px 20px 24px 20px;
  }

  .form-title {
    font-size: 20px;
  }

  .oauth-name {
    display: none;
  }

  .oauth-btn {
    padding: 8px;
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
