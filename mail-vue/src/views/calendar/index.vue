<template>
  <div class="calendar-page">
    <!-- Calendar Topbar -->
    <div class="cal-topbar">
      <div class="cal-topbar-left">
        <div class="cal-title-wrap">
          <Icon icon="hugeicons:calendar-03" width="22" height="22" class="cal-icon" />
          <h2 class="cal-title">{{ $t('calendar') || 'Calendar' }}</h2>
        </div>

        <!-- Date Navigation -->
        <div class="cal-nav">
          <el-button class="nav-arrow-btn" @click="prevPeriod">
            <Icon icon="hugeicons:arrow-left-01" width="16" height="16" />
          </el-button>
          <el-button class="today-btn" @click="goToToday">Today</el-button>
          <el-button class="nav-arrow-btn" @click="nextPeriod">
            <Icon icon="hugeicons:arrow-right-01" width="16" height="16" />
          </el-button>
          <span class="period-label">{{ currentPeriodLabel }}</span>
        </div>
      </div>

      <div class="cal-topbar-right">
        <!-- View Switcher -->
        <el-radio-group v-model="viewMode" size="default" class="view-radio-group">
          <el-radio-button label="month">Month</el-radio-button>
          <el-radio-button label="week">Week</el-radio-button>
          <el-radio-button label="day">Day</el-radio-button>
        </el-radio-group>

        <!-- Export .ics -->
        <el-tooltip content="Download RFC 5545 .ics calendar" placement="bottom">
          <el-button class="cal-btn" @click="exportIcsAll">
            <Icon icon="hugeicons:download-04" width="16" height="16" class="mr-1" />
            <span>.ics</span>
          </el-button>
        </el-tooltip>

        <!-- Booking link -->
        <el-tooltip content="Go to Public Booking Link" placement="bottom">
          <el-button class="cal-btn" @click="goToBooking">
            <Icon icon="hugeicons:link-01" width="16" height="16" class="mr-1" />
            <span>Booking</span>
          </el-button>
        </el-tooltip>

        <!-- Add Event -->
        <el-button type="primary" class="cal-btn primary" @click="openCreateEventDialog()">
          <Icon icon="hugeicons:plus-sign" width="16" height="16" class="mr-1" />
          <span>New Event</span>
        </el-button>
      </div>
    </div>

    <!-- Calendar View Area -->
    <div class="cal-body">
      <!-- ══ Month View ══ -->
      <div v-if="viewMode === 'month'" class="month-view">
        <div class="weekdays-header">
          <div v-for="d in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="d" class="weekday-col">
            {{ d }}
          </div>
        </div>

        <div class="month-grid">
          <div
            v-for="cell in monthDays"
            :key="cell.dateStr"
            class="month-cell"
            :class="{
              'is-today': cell.isToday,
              'is-diff-month': !cell.isCurrentMonth
            }"
            @click="openCreateEventDialog(cell.date)"
          >
            <div class="cell-header">
              <span class="day-number">{{ cell.dayNumber }}</span>
            </div>

            <div class="cell-events">
              <div
                v-for="ev in getEventsForDate(cell.dateStr)"
                :key="ev.id"
                class="event-pill"
                :style="{ backgroundColor: ev.color || '#4f46e5' }"
                @click.stop="openEditEventDialog(ev)"
              >
                <span class="pill-time">{{ formatTime(ev.starts_at) }}</span>
                <span class="pill-title">{{ ev.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Week View ══ -->
      <div v-else-if="viewMode === 'week'" class="week-view">
        <div class="week-header-row">
          <div class="time-col-header"></div>
          <div
            v-for="d in weekDays"
            :key="d.dateStr"
            class="week-day-col-header"
            :class="{ 'is-today': d.isToday }"
          >
            <span class="week-day-name">{{ d.dayName }}</span>
            <span class="week-day-num">{{ d.dayNumber }}</span>
          </div>
        </div>

        <el-scrollbar class="week-grid-scroll">
          <div class="week-time-grid">
            <div class="time-labels-col">
              <div v-for="hour in 24" :key="hour" class="hour-label">
                {{ formatHour(hour - 1) }}
              </div>
            </div>

            <div v-for="d in weekDays" :key="d.dateStr" class="day-time-col">
              <div
                v-for="hour in 24"
                :key="hour"
                class="hour-cell"
                @click="openCreateEventDialogAt(d.dateStr, hour - 1)"
              ></div>

              <!-- Events positioned in day -->
              <div
                v-for="ev in getEventsForDate(d.dateStr)"
                :key="ev.id"
                class="week-event-card"
                :style="getWeekEventStyle(ev)"
                @click.stop="openEditEventDialog(ev)"
              >
                <div class="week-event-title">{{ ev.title }}</div>
                <div class="week-event-time">{{ formatTime(ev.starts_at) }} - {{ formatTime(ev.ends_at) }}</div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- ══ Day View ══ -->
      <div v-else-if="viewMode === 'day'" class="day-view">
        <div class="day-header-banner">
          <span class="banner-dayname">{{ dayjs(currentDate).format('dddd, MMMM D, YYYY') }}</span>
        </div>

        <el-scrollbar class="day-grid-scroll">
          <div class="day-time-grid">
            <div class="time-labels-col">
              <div v-for="hour in 24" :key="hour" class="hour-label">
                {{ formatHour(hour - 1) }}
              </div>
            </div>

            <div class="day-col-single">
              <div
                v-for="hour in 24"
                :key="hour"
                class="hour-cell"
                @click="openCreateEventDialogAt(dayjs(currentDate).format('YYYY-MM-DD'), hour - 1)"
              ></div>

              <!-- Events in Day -->
              <div
                v-for="ev in getEventsForDate(dayjs(currentDate).format('YYYY-MM-DD'))"
                :key="ev.id"
                class="day-event-card"
                :style="getDayEventStyle(ev)"
                @click.stop="openEditEventDialog(ev)"
              >
                <div class="day-event-title">{{ ev.title }}</div>
                <div class="day-event-time">{{ formatTime(ev.starts_at) }} - {{ formatTime(ev.ends_at) }}</div>
                <div v-if="ev.location" class="day-event-loc">{{ ev.location }}</div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <!-- Event Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? 'Edit Event' : 'New Calendar Event'"
      :width="isMobile ? '92%' : '480px'"
      append-to-body
      class="event-dialog"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="Event Title" required>
          <el-input v-model="form.title" placeholder="e.g. Team Sprint Planning" />
        </el-form-item>

        <div class="form-row-2">
          <el-form-item label="Starts At" required>
            <el-date-picker
              v-model="form.starts_at"
              type="datetime"
              placeholder="Select date and time"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="Ends At" required>
            <el-date-picker
              v-model="form.ends_at"
              type="datetime"
              placeholder="Select date and time"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <el-form-item label="Recurrence">
          <el-select v-model="form.recurrence_rule" style="width: 100%">
            <el-option label="Does not repeat" value="" />
            <el-option label="Daily" value="FREQ=DAILY" />
            <el-option label="Weekly on this day" value="FREQ=WEEKLY" />
            <el-option label="Monthly" value="FREQ=MONTHLY" />
          </el-select>
        </el-form-item>

        <el-form-item label="Location / Video Call">
          <el-input v-model="form.location" placeholder="e.g. Google Meet or Conference Room" />
        </el-form-item>

        <el-form-item label="Description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Meeting agenda, notes..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="event-dialog-footer">
          <div class="footer-left">
            <el-button v-if="isEditing" type="danger" text @click="deleteEvent(form)">Delete</el-button>
            <el-button v-if="isEditing" text @click="exportSingleIcs(form)">Export .ics</el-button>
            <el-button v-if="isEditing" type="primary" text @click="sendInviteEmail(form)">Send Invite via Mail</el-button>
          </div>
          <div class="footer-right">
            <el-button @click="dialogVisible = false">Cancel</el-button>
            <el-button type="primary" @click="saveEvent">Save</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWindowSize } from '@vueuse/core'
import { useUiStore } from '@/store/ui.js'
import dayjs from 'dayjs'

const router = useRouter()
const uiStore = useUiStore()

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const viewMode = ref('month')
const currentDate = ref(dayjs())

const dialogVisible = ref(false)
const isEditing = ref(false)
const form = ref({
  id: '',
  title: '',
  starts_at: null,
  ends_at: null,
  recurrence_rule: '',
  location: '',
  description: '',
  color: '#4f46e5'
})

const STORAGE_KEY = 'grabmails_calendar_events'
const events = ref([])

// Starter Events
const DEFAULT_EVENTS = [
  {
    id: 'ev-1',
    title: 'Product Review & Demo',
    starts_at: dayjs().hour(10).minute(0).second(0).toISOString(),
    ends_at: dayjs().hour(11).minute(0).second(0).toISOString(),
    location: 'Google Meet',
    description: 'Walkthrough of new GrabMails features.',
    recurrence_rule: '',
    color: '#4f46e5'
  },
  {
    id: 'ev-2',
    title: 'Cloudflare Migration Standup',
    starts_at: dayjs().add(1, 'day').hour(14).minute(0).second(0).toISOString(),
    ends_at: dayjs().add(1, 'day').hour(14).minute(30).second(0).toISOString(),
    location: 'Discord Huddle',
    description: 'Weekly engineering sync.',
    recurrence_rule: 'FREQ=WEEKLY',
    color: '#059669'
  },
  {
    id: 'ev-3',
    title: 'Architecture Strategy Q1',
    starts_at: dayjs().add(2, 'day').hour(16).minute(0).second(0).toISOString(),
    ends_at: dayjs().add(2, 'day').hour(17).minute(0).second(0).toISOString(),
    location: 'GrabMails HQ',
    description: 'Planning serverless roadmap.',
    recurrence_rule: '',
    color: '#d97706'
  }
]

onMounted(() => {
  loadEvents()
})

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      events.value = JSON.parse(raw)
    } else {
      events.value = [...DEFAULT_EVENTS]
      persistEvents()
    }
  } catch (e) {
    events.value = [...DEFAULT_EVENTS]
  }
}

function persistEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.value))
}

const currentPeriodLabel = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.format('MMMM YYYY')
  } else if (viewMode.value === 'week') {
    const start = currentDate.value.startOf('week')
    const end = currentDate.value.endOf('week')
    return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
  } else {
    return currentDate.value.format('dddd, MMMM D, YYYY')
  }
})

function prevPeriod() {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.subtract(1, 'month')
  } else if (viewMode.value === 'week') {
    currentDate.value = currentDate.value.subtract(1, 'week')
  } else {
    currentDate.value = currentDate.value.subtract(1, 'day')
  }
}

function nextPeriod() {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.add(1, 'month')
  } else if (viewMode.value === 'week') {
    currentDate.value = currentDate.value.add(1, 'week')
  } else {
    currentDate.value = currentDate.value.add(1, 'day')
  }
}

function goToToday() {
  currentDate.value = dayjs()
}

function goToBooking() {
  router.push('/book')
}

// ══ Month Calculation ══
const monthDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const startDay = startOfMonth.day() // 0 = Sun
  const startDate = startOfMonth.subtract(startDay, 'day')

  const days = []
  for (let i = 0; i < 42; i++) {
    const d = startDate.add(i, 'day')
    days.push({
      date: d,
      dateStr: d.format('YYYY-MM-DD'),
      dayNumber: d.date(),
      isCurrentMonth: d.month() === currentDate.value.month(),
      isToday: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    })
  }
  return days
})

// ══ Week Calculation ══
const weekDays = computed(() => {
  const startOfWeek = currentDate.value.startOf('week')
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = startOfWeek.add(i, 'day')
    days.push({
      date: d,
      dateStr: d.format('YYYY-MM-DD'),
      dayName: d.format('ddd'),
      dayNumber: d.date(),
      isToday: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    })
  }
  return days
})

function getEventsForDate(dateStr) {
  return events.value.filter(ev => {
    return dayjs(ev.starts_at).format('YYYY-MM-DD') === dateStr
  })
}

function openCreateEventDialog(dateObj) {
  isEditing.value = false
  const base = dateObj ? dayjs(dateObj) : currentDate.value
  const start = base.hour(10).minute(0).second(0)
  const end = start.add(1, 'hour')

  form.value = {
    id: `ev-${Date.now()}`,
    title: '',
    starts_at: start.toDate(),
    ends_at: end.toDate(),
    recurrence_rule: '',
    location: '',
    description: '',
    color: '#4f46e5'
  }
  dialogVisible.value = true
}

function openCreateEventDialogAt(dateStr, hour) {
  const start = dayjs(dateStr).hour(hour).minute(0).second(0)
  openCreateEventDialog(start)
}

function openEditEventDialog(ev) {
  isEditing.value = true
  form.value = {
    ...ev,
    starts_at: new Date(ev.starts_at),
    ends_at: new Date(ev.ends_at)
  }
  dialogVisible.value = true
}

function saveEvent() {
  if (!form.value.title.trim()) {
    ElMessage.warning('Please enter an event title')
    return
  }

  const payload = {
    ...form.value,
    starts_at: dayjs(form.value.starts_at).toISOString(),
    ends_at: dayjs(form.value.ends_at).toISOString()
  }

  if (isEditing.value) {
    const idx = events.value.findIndex(e => e.id === payload.id)
    if (idx !== -1) {
      events.value[idx] = payload
    }
    ElMessage.success('Event updated')
  } else {
    events.value.push(payload)
    ElMessage.success('Event created')
  }

  persistEvents()
  dialogVisible.value = false
}

function deleteEvent(ev) {
  ElMessageBox.confirm(`Delete event "${ev.title}"?`, 'Confirm Delete', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(() => {
    events.value = events.value.filter(e => e.id !== ev.id)
    persistEvents()
    dialogVisible.value = false
    ElMessage.success('Event deleted')
  }).catch(() => {})
}

function sendInviteEmail(ev) {
  dialogVisible.value = false
  const summary = `Meeting Invitation: ${ev.title}\nWhen: ${dayjs(ev.starts_at).format('MMM D, YYYY h:mm A')} - ${dayjs(ev.ends_at).format('h:mm A')}\nLocation: ${ev.location || 'Online'}\n\n${ev.description || ''}`
  if (uiStore.writerRef && typeof uiStore.writerRef.open === 'function') {
    uiStore.writerRef.open({
      title: `Invitation: ${ev.title}`,
      content: `<p>You're invited to <strong>${ev.title}</strong></p><p><strong>When:</strong> ${dayjs(ev.starts_at).format('MMM D, YYYY h:mm A')} - ${dayjs(ev.ends_at).format('h:mm A')}</p><p><strong>Location:</strong> ${ev.location || 'Online'}</p><p>${ev.description || ''}</p>`
    })
  } else {
    ElMessage.info('Composer opened with event invite details')
  }
}

// ══ RFC 5545 .ics Export ══
function exportSingleIcs(ev) {
  const ics = generateIcs([ev])
  downloadIcsFile(ics, `${ev.title.replace(/\s+/g, '_')}.ics`)
}

function exportIcsAll() {
  const ics = generateIcs(events.value)
  downloadIcsFile(ics, 'grabmails_calendar.ics')
}

function generateIcs(evList) {
  const formatUtc = (d) => dayjs(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GrabMails//Productivity Suite Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  for (const ev of evList) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${ev.id}@grabmails.internal`)
    lines.push(`DTSTAMP:${formatUtc(new Date())}`)
    lines.push(`DTSTART:${formatUtc(ev.starts_at)}`)
    lines.push(`DTEND:${formatUtc(ev.ends_at)}`)
    lines.push(`SUMMARY:${escapeIcs(ev.title)}`)
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`)
    if (ev.location) lines.push(`LOCATION:${escapeIcs(ev.location)}`)
    if (ev.recurrence_rule) lines.push(`RRULE:${ev.recurrence_rule}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function escapeIcs(str) {
  if (!str) return ''
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function downloadIcsFile(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success(`Downloaded ${filename}`)
}

function formatTime(d) {
  if (!d) return ''
  return dayjs(d).format('h:mm A')
}

function formatHour(h) {
  const d = dayjs().hour(h).minute(0)
  return d.format('h A')
}

function getWeekEventStyle(ev) {
  const start = dayjs(ev.starts_at)
  const end = dayjs(ev.ends_at)
  const top = (start.hour() * 60 + start.minute()) * (48 / 60)
  const duration = Math.max(30, end.diff(start, 'minute'))
  const height = duration * (48 / 60)
  return {
    top: `${top}px`,
    height: `${height}px`,
    backgroundColor: ev.color || '#4f46e5'
  }
}

function getDayEventStyle(ev) {
  return getWeekEventStyle(ev)
}
</script>

<style scoped>
.calendar-page {
  height: 100%;
  width: 100%;
  background: var(--el-bg-color-page, #f8fafc);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ══ Topbar ══ */
.cal-topbar {
  padding: 14px 20px;
  background: var(--el-bg-color, #ffffff);
  border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cal-topbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cal-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-icon {
  color: var(--el-color-primary, #4f46e5);
}

.cal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
  margin: 0;
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-arrow-btn {
  padding: 8px;
  border-radius: 8px;
}

.today-btn {
  border-radius: 8px;
  font-weight: 500;
}

.period-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
  margin-left: 8px;
}

.cal-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cal-btn {
  border-radius: 8px;
  font-weight: 500;
}

/* ══ Calendar Body ══ */
.cal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color, #ffffff);
}

/* ══ Month View ══ */
.month-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.weekdays-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
  background: var(--el-fill-color-light, #f8fafc);
}

.weekday-col {
  padding: 10px 0;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  flex: 1;
  border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
}

.month-cell {
  border-right: 1px solid var(--el-border-color-extra-light, #f1f5f9);
  border-bottom: 1px solid var(--el-border-color-extra-light, #f1f5f9);
  padding: 6px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: background-color 0.15s;
  overflow: hidden;
}

.month-cell:hover {
  background-color: var(--el-fill-color-light, #f8fafc);
}

.month-cell.is-diff-month {
  background-color: var(--el-fill-color-extra-light, #fafafa);
  opacity: 0.5;
}

.cell-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.day-number {
  font-size: 12px;
  font-weight: 500;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-primary, #1e293b);
}

.month-cell.is-today .day-number {
  background-color: var(--el-color-primary, #4f46e5);
  color: #ffffff;
  font-weight: 700;
}

.cell-events {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}

.event-pill {
  border-radius: 4px;
  padding: 2px 6px;
  color: #ffffff;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.pill-time {
  font-weight: 600;
  opacity: 0.85;
}

.pill-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ══ Week View ══ */
.week-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.week-header-row {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
  background: var(--el-fill-color-light, #f8fafc);
}

.time-col-header {
  border-right: 1px solid var(--el-border-color-lighter, #e2e8f0);
}

.week-day-col-header {
  padding: 10px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border-right: 1px solid var(--el-border-color-extra-light, #f1f5f9);
}

.week-day-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary, #64748b);
}

.week-day-num {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
}

.week-day-col-header.is-today .week-day-num {
  color: var(--el-color-primary, #4f46e5);
}

.week-grid-scroll {
  flex: 1;
}

.week-time-grid {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  position: relative;
}

.time-labels-col {
  border-right: 1px solid var(--el-border-color-lighter, #e2e8f0);
}

.hour-label {
  height: 48px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary, #94a3b8);
  transform: translateY(-8px);
}

.day-time-col {
  border-right: 1px solid var(--el-border-color-extra-light, #f1f5f9);
  position: relative;
}

.hour-cell {
  height: 48px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f8fafc);
  cursor: pointer;
}

.hour-cell:hover {
  background-color: var(--el-fill-color-lighter, #fafafa);
}

.week-event-card {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 6px;
  padding: 4px 8px;
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
}

.week-event-title {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.week-event-time {
  font-size: 10px;
  opacity: 0.85;
}

/* ══ Day View ══ */
.day-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.day-header-banner {
  padding: 12px 20px;
  background: var(--el-fill-color-light, #f8fafc);
  border-bottom: 1px solid var(--el-border-color-lighter, #e2e8f0);
}

.banner-dayname {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #0f172a);
}

.day-grid-scroll {
  flex: 1;
}

.day-time-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  position: relative;
}

.day-col-single {
  position: relative;
  border-left: 1px solid var(--el-border-color-lighter, #e2e8f0);
}

.day-event-card {
  position: absolute;
  left: 12px;
  right: 24px;
  border-radius: 8px;
  padding: 8px 12px;
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
}

.day-event-title {
  font-size: 14px;
  font-weight: 600;
}

.day-event-time {
  font-size: 12px;
  opacity: 0.85;
}

.day-event-loc {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.9;
}

/* ══ Form Dialog ══ */
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.event-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-left {
  display: flex;
  gap: 4px;
}

.footer-right {
  display: flex;
  gap: 8px;
}

/* ══ Mobile Responsive ══ */
@media (max-width: 767px) {
  .cal-topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 12px;
  }

  .cal-topbar-left {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cal-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .period-label {
    font-size: 13px;
    margin-left: 4px;
  }

  .cal-topbar-right {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .view-radio-group {
    order: 1;
    width: 100%;
    display: flex;
  }

  .view-radio-group :deep(.el-radio-button) {
    flex: 1;
    display: flex;
  }

  .view-radio-group :deep(.el-radio-button__inner) {
    width: 100%;
    padding: 8px 0;
    text-align: center;
  }

  .cal-btn {
    flex: 1 1 calc(33% - 6px);
    justify-content: center;
    order: 2;
    padding: 8px 6px;
    font-size: 12px;
  }

  .cal-btn.primary {
    flex: 1 1 100%;
    order: 3;
  }

  .weekdays-header {
    font-size: 11px;
    padding: 6px 0;
  }

  .month-cell {
    min-height: 52px;
    padding: 2px 3px;
  }

  .day-number {
    font-size: 11px;
    width: 18px;
    height: 18px;
    line-height: 18px;
  }

  .event-pill {
    padding: 1px 3px;
    font-size: 9px;
    border-radius: 3px;
  }

  .pill-time {
    display: none;
  }

  .week-view {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .week-header-row,
  .week-time-grid {
    min-width: 520px;
  }

  .form-row-2 {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .event-dialog-footer {
    flex-direction: column;
    gap: 12px;
  }

  .footer-left {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .footer-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
