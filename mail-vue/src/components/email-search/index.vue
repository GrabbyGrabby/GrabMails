<template>
  <div ref="searchRef" class="email-search">
    <div class="search-placeholder" @click="openSearch">
      <Icon icon="akar-icons:search" width="20" height="20"/>
      <span class="search-placeholder-text" :class="{ 'has-search-text': savedSearchSummary }" :title="savedSearchSummary">
        {{ savedSearchSummary || t('searchMail') }}
      </span>
    </div>
    <el-button
      class="mobile-search-button"
      size="default"
      :aria-label="t('searchMail')"
      :aria-expanded="visible"
      @click="openSearch"
    >
      <el-icon :size="20">
        <Icon icon="akar-icons:search"/>
      </el-icon>
    </el-button>
    <Transition name="search-panel-fade" @after-enter="focusInputOnDesktop">
      <div v-if="visible" class="search-panel-shell" @click.stop>
        <el-card class="search-panel" shadow="always">
          <div class="search-input">
            <el-input
              ref="inputRef"
              v-model="searchText"
              autocomplete="off"
              :placeholder="searchPlaceholder"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="search-content">
            <div class="search-content-title">{{ t('searchType') }}</div>
            <div class="search-type-grid" role="radiogroup" :aria-label="t('searchType')">
              <button
                v-for="option in searchOptions"
                :key="option.type"
                type="button"
                role="radio"
                :aria-checked="searchType === option.type"
                :class="['search-type-pill', { active: searchType === option.type }]"
                @click="searchType = option.type"
              >
                {{ option.label }}
              </button>
            </div>
            <div class="search-date-range">
              <div class="search-date-field">
                <div class="search-date-label">{{ t('searchDateFrom') }}</div>
                <el-date-picker
                  v-model="startDate"
                  type="date"
                  :editable="false"
                  value-format="YYYY-MM-DD"
                  :placeholder="t('searchStartDate')"
                />
              </div>
              <div class="search-date-field">
                <div class="search-date-label">{{ t('searchDateTo') }}</div>
                <el-date-picker
                  v-model="endDate"
                  type="date"
                  :editable="false"
                  value-format="YYYY-MM-DD"
                  :placeholder="t('searchEndDate')"
                  :disabled-date="disableEndDate"
                />
              </div>
            </div>
          </div>
          <div class="search-actions">
            <button type="button" class="search-btn search-reset-btn" @click="handleReset">{{ t('reset') }}</button>
            <button type="button" class="search-btn search-submit-btn" @click="handleSearch">{{ t('search') }}</button>
          </div>
        </el-card>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {Icon} from '@iconify/vue'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const emit = defineEmits(['search', 'reset'])
const props = defineProps({
  store: {
    type: Object,
    required: true,
  },
  searchOptions: {
    type: Array,
    required: true,
  },
})

const searchRef = ref(null)
const inputRef = ref(null)
const searchText = ref('')
const searchType = ref('subject')
const startDate = ref('')
const endDate = ref('')
const visible = ref(false)
const selectedSearchOption = computed(() =>
  props.searchOptions.find(option => option.type === searchType.value)
)
const savedSearchSummary = computed(() => {
  const params = props.store.searchParams
  const parts = []
  const text = params.text?.trim()
  const fieldKeys = {
    subject: 'searchSummarySubject',
    content: 'searchSummaryContent',
    sender: 'searchSummarySender',
    senderAddress: 'searchSummarySenderAddress',
    recipientAddress: 'searchSummaryRecipientAddress',
  }

  if (text) {
    parts.push(`${t(fieldKeys[params.type] || fieldKeys.subject)}:${text}`)
  }
  if (params.startDate && params.endDate) {
    parts.push(`${formatSummaryDate(params.startDate)} ${t('searchSummaryRange')} ${formatSummaryDate(params.endDate)}`)
  } else if (params.startDate) {
    parts.push(`${t('searchSummaryAfter')}:${formatSummaryDate(params.startDate)}`)
  } else if (params.endDate) {
    parts.push(`${t('searchSummaryBefore')}:${formatSummaryDate(params.endDate)}`)
  }
  return parts.join('\u00a0\u00a0')
})
const searchPlaceholder = computed(() =>
  t('searchMailBy', {field: selectedSearchOption.value?.label || t('titleDesc')})
)

watch(
  () => props.searchOptions,
  options => {
    if (!options.some(option => option.type === searchType.value)) {
      searchType.value = options[0]?.type || 'subject'
    }
  },
  {immediate: true}
)

watch(startDate, value => {
  if (value && endDate.value && endDate.value < value) {
    endDate.value = ''
  }
})

function openSearch() {
  if (visible.value) {
    closeSearch()
    return
  }

  restoreSavedSearch()
  visible.value = true
}

function focusInput() {
  inputRef.value?.focus()
}

function focusInputOnDesktop() {
  if (!window.matchMedia('(max-width: 1024px)').matches) {
    focusInput()
  }
}

function disableEndDate(date) {
  if (!startDate.value) return false

  const start = new Date(`${startDate.value}T00:00:00`)
  return date < start
}

function closeSearch() {
  visible.value = false
  restoreSavedSearch()
}

function restoreSavedSearch() {
  const params = props.store.searchParams
  searchText.value = params.text || ''
  searchType.value = props.searchOptions.some(option => option.type === params.type)
    ? params.type
    : props.searchOptions[0]?.type || 'subject'
  startDate.value = toLocalSearchDate(params.startDate)
  endDate.value = toLocalSearchDate(params.endDate)
}

function toLocalSearchDate(dateValue) {
  if (!dateValue) return ''

  const date = new Date(`${dateValue.replace(' ', 'T')}Z`)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatSummaryDate(dateValue) {
  return toLocalSearchDate(dateValue)
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && visible.value) {
    closeSearch()
  }
}

function handleDocumentClick(event) {
  const target = event.target
  const isDatePickerPopup = target?.closest?.(
    '.el-picker__popper, .el-picker-panel'
  )

  if (
    !visible.value
    || searchRef.value?.contains(target)
    || isDatePickerPopup
  ) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  closeSearch()
}

function formatSearchDate(dateValue, endOfDay = false) {
  if (!dateValue) return ''

  const [year, month, day] = dateValue.split('-').map(Number)
  const localDate = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
  )

  return localDate.toISOString().slice(0, 19).replace('T', ' ')
}

function handleSearch() {
  props.store.setSearchParams({
    text: searchText.value.trim(),
    type: searchType.value,
    startDate: formatSearchDate(startDate.value),
    endDate: formatSearchDate(endDate.value, true),
  })
  emit('search', searchText.value.trim(), searchType.value)
  closeSearch()
}

function handleReset() {
  searchText.value = ''
  searchType.value = 'subject'
  startDate.value = ''
  endDate.value = ''
  props.store.setSearchParams({
    text: '',
    type: 'subject',
    startDate: '',
    endDate: '',
  })
  emit('reset')
  closeSearch()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true)
  document.addEventListener('keydown', handleDocumentKeydown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  document.removeEventListener('keydown', handleDocumentKeydown, true)
})
</script>

<style lang="scss" scoped>
.email-search {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: min(450px, calc(100% - 20px));
  height: 36px;
  @media (max-width: 1080px) {
    width: min(400px, calc(100% - 20px));
  }
}

@media (min-width: 768px) {
  .email-search.account-show {
    left: 259px;
  }
}

.search-placeholder {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  box-sizing: border-box;
}

.search-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  text-align: left;
  white-space: nowrap;
  cursor: text;
  position: relative;
  z-index: 0;
}

.search-placeholder-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
}

.search-placeholder-text.has-search-text {
  color: var(--el-text-color-primary);
}

.mobile-search-button {
  display: none;
}

.search-panel-shell {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 1001;
  width: min(304px, calc(100vw - 24px));
  height: min(304px, calc(100vw - 24px));
  box-sizing: border-box;
  background: transparent !important;
}

@media (max-width: 767px) {
  .email-search {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .search-placeholder {
    display: none;
  }

  .mobile-search-button {
    display: inline-flex;
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

  .email-search .search-panel-shell {
    top: calc(100% + 8px);
    left: auto;
    right: 0;
    width: min(304px, calc(100vw - 24px));
    height: min(304px, calc(100vw - 24px));
    translate: none;
  }
}

.search-panel-fade-enter-active,
.search-panel-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.search-panel-fade-enter-from,
.search-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.search-input :deep(.el-input__wrapper),
.search-input :deep(.el-input__wrapper.is-focus) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 2px !important;
}

.search-input :deep(.el-input__inner) {
  height: 30px;
  font-size: 13px;
}

.search-input :deep(.el-input__inner::placeholder) {
  font-size: 13px;
}

.search-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-content-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--el-text-color-primary);
  width: 100%;
  text-align: left !important;
}

.search-type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.search-date-range {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;
}

.search-date-field {
  min-width: 0;
}

.search-date-label {
  margin-bottom: 3px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--el-text-color-primary);
  text-align: left;
}

.search-date-field :deep(.el-date-editor) {
  width: 100% !important;
  --el-date-editor-width: 100%;
  height: 30px;
}

.search-date-field :deep(.el-input__wrapper) {
  padding: 0 8px !important;
  height: 30px !important;
  border-radius: 10px !important;
}

.search-date-field :deep(.el-input__inner) {
  font-size: 11px !important;
}

.search-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0;
  width: 100%;
}

.search-btn {
  width: 100%;
  height: 36px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 180ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>

<style lang="scss">
.email-search .search-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: #ffffff !important;
  color: #051F20 !important;
  border-radius: 28px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 20px 48px -10px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.06) !important;
  overflow: hidden !important;
  isolation: isolate;
  padding: 18px !important;
}

html.dark .email-search .search-panel,
.dark .email-search .search-panel,
[data-theme="dark"] .email-search .search-panel {
  background: #111318 !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

.email-search .search-panel .el-card__body {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 0 !important;
  background: transparent !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
}

.email-search .search-input {
  --el-input-bg-color: transparent;
  margin: 0;
  padding: 0 0 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

html.dark .email-search .search-input,
.dark .email-search .search-input,
[data-theme="dark"] .email-search .search-input {
  border-bottom-color: rgba(255, 255, 255, 0.12);
}

.email-search .search-type-pill {
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  border-radius: 9999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.04);
  color: var(--regular-text-color);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 160ms ease;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: #000000;
    border-color: #000000;
    color: #ffffff;
  }
}

html.dark .email-search .search-type-pill,
.dark .email-search .search-type-pill,
[data-theme="dark"] .email-search .search-type-pill {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  color: #cbd5e1;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }

  &.active {
    background: #ffffff;
    border-color: #ffffff;
    color: #000000;
  }
}

html.dark .email-search .search-date-field .el-input__wrapper,
.dark .email-search .search-date-field .el-input__wrapper,
[data-theme="dark"] .email-search .search-date-field .el-input__wrapper {
  background: rgba(255, 255, 255, 0.04) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset !important;
}

.email-search .search-reset-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #051F20;
  border: 1px solid rgba(0, 0, 0, 0.08);

  &:hover {
    background: rgba(0, 0, 0, 0.09);
  }
}

.email-search .search-submit-btn {
  background: #000000;
  color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

  &:hover {
    background: #27272a;
    transform: translateY(-1px);
  }
}

html.dark .email-search .search-reset-btn,
.dark .email-search .search-reset-btn,
[data-theme="dark"] .email-search .search-reset-btn {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
  border-color: rgba(255, 255, 255, 0.12);

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

html.dark .email-search .search-submit-btn,
.dark .email-search .search-submit-btn,
[data-theme="dark"] .email-search .search-submit-btn {
  background: #ffffff;
  color: #000000;
  border-color: rgba(255, 255, 255, 0.2);

  &:hover {
    background: #e4e4e7;
  }
}
</style>
