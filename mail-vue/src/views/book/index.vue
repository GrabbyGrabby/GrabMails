<template>
  <div class="booking-page">
    <div class="booking-container">
      <!-- Confirmation State -->
      <div v-if="bookedState" class="booking-confirmed-card">
        <div class="success-icon-wrap">
          <Icon icon="hugeicons:checkmark-circle-02" width="64" height="64" class="success-icon" />
        </div>
        <h1 class="confirmed-title">Meeting Scheduled!</h1>
        <p class="confirmed-desc">
          Booked for <strong>{{ form.guestName }}</strong> ({{ form.guestEmail }}). Your meeting link is ready below and saved to your Calendar.
        </p>

        <div class="confirmed-details-box">
          <div class="detail-row">
            <Icon icon="hugeicons:calendar-03" width="18" height="18" class="detail-icon" />
            <span>{{ dayjs(selectedSlot.startsAt).format('dddd, MMMM D, YYYY') }}</span>
          </div>
          <div class="detail-row">
            <Icon icon="hugeicons:clock-01" width="18" height="18" class="detail-icon" />
            <span>{{ dayjs(selectedSlot.startsAt).format('h:mm A') }} - {{ dayjs(selectedSlot.endsAt).format('h:mm A') }} ({{ selectedTimezone }})</span>
          </div>
          <div class="detail-row">
            <Icon icon="hugeicons:video-01" width="18" height="18" class="detail-icon" />
            <span>GrabMails Video Meeting</span>
          </div>

          <!-- Direct Meeting Invitation Link Box -->
          <div class="meeting-link-box">
            <span class="meeting-link-label">Meeting Invitation Link</span>
            <a
              :href="meetingLink"
              target="_blank"
              rel="noopener noreferrer"
              class="meeting-link-url"
            >
              {{ meetingLink }}
            </a>
            <div class="meeting-link-btns">
              <button type="button" class="link-copy-btn" @click="copyMeetingLink">
                <Icon icon="hugeicons:copy" width="14" height="14" />
                <span>{{ linkCopied ? 'Copied!' : 'Copy Link' }}</span>
              </button>
              <a
                :href="meetingLink"
                target="_blank"
                rel="noopener noreferrer"
                class="link-join-btn"
              >
                <Icon icon="hugeicons:video-01" width="14" height="14" />
                <span>Join Meeting</span>
              </a>
            </div>
          </div>
        </div>

        <div class="confirmed-actions">
          <el-button type="primary" size="large" class="action-btn" @click="downloadBookingIcs">
            <Icon icon="hugeicons:download-04" width="18" height="18" class="mr-2" />
            <span>Add to Calendar (.ics)</span>
          </el-button>
          <el-button size="large" class="action-btn" @click="goToCalendar">
            <Icon icon="hugeicons:calendar-03" width="18" height="18" class="mr-2" />
            <span>View in Calendar</span>
          </el-button>
          <el-button size="large" class="action-btn" @click="resetBooking">
            <span>Book Another Meeting</span>
          </el-button>
        </div>
      </div>

      <!-- Booking Flow -->
      <div v-else class="booking-card">
        <!-- Left Panel: Event Info -->
        <div class="booking-info-pane">
          <div class="host-avatar">
            <Icon icon="hugeicons:mail-01" width="28" height="28" class="host-icon" />
          </div>
          <span class="host-name">GrabMails Teams</span>
          <h1 class="event-title">30 Min Consultation</h1>

          <div class="meta-item">
            <Icon icon="hugeicons:clock-01" width="16" height="16" class="meta-icon" />
            <span>30 minutes</span>
          </div>
          <div class="meta-item">
            <Icon icon="hugeicons:video-01" width="16" height="16" class="meta-icon" />
            <span>Video call link generated on booking</span>
          </div>

          <p class="event-desc">
            Book a dedicated consultation session with our engineering and product team. We'll discuss email workflows, custom domains, and platform capabilities.
          </p>

          <div class="timezone-picker-wrap">
            <label class="tz-label">Time zone</label>
            <el-select v-model="selectedTimezone" size="small" class="tz-select">
              <el-option label="UTC" value="UTC" />
              <el-option label="America/New_York (EST)" value="America/New_York" />
              <el-option label="America/Los_Angeles (PST)" value="America/Los_Angeles" />
              <el-option label="Europe/London (GMT)" value="Europe/London" />
              <el-option label="Europe/Paris (CET)" value="Europe/Paris" />
              <el-option label="Asia/Kolkata (IST)" value="Asia/Kolkata" />
              <el-option label="Asia/Tokyo (JST)" value="Asia/Tokyo" />
            </el-select>
          </div>
        </div>

        <!-- Middle Panel: Date Picker -->
        <div class="booking-date-pane">
          <h2 class="pane-title">Select a Date</h2>
          <div class="calendar-widget">
            <div class="cal-widget-header">
              <span class="widget-month-label">{{ calMonth.format('MMMM YYYY') }}</span>
              <div class="cal-nav-buttons">
                <button type="button" class="widget-arrow" @click="calMonth = calMonth.subtract(1, 'month')">‹</button>
                <button type="button" class="widget-arrow" @click="calMonth = calMonth.add(1, 'month')">›</button>
              </div>
            </div>

            <div class="widget-weekdays">
              <span v-for="d in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="d" class="widget-wd">{{ d }}</span>
            </div>

            <div class="widget-days-grid">
              <button
                v-for="d in calendarDays"
                :key="d.dateStr"
                type="button"
                class="widget-day-btn"
                :class="{
                  'is-selected': selectedDateStr === d.dateStr,
                  'is-today': d.isToday,
                  'is-disabled': d.isDisabled,
                  'is-other-month': !d.isCurrentMonth
                }"
                :disabled="d.isDisabled"
                @click="selectDate(d.dateStr)"
              >
                {{ d.dayNum }}
              </button>
            </div>
          </div>
        </div>

        <!-- Right Panel: Time Slots & Booking Form -->
        <div class="booking-slots-pane">
          <!-- Step 1: Select Slot -->
          <div v-if="!showFormStep">
            <h2 class="pane-title">
              {{ dayjs(selectedDateStr).format('dddd, MMM D') }}
            </h2>

            <div class="slots-list">
              <button
                v-for="slot in availableSlots"
                :key="slot.startsAt"
                type="button"
                class="slot-btn"
                @click="chooseSlot(slot)"
              >
                {{ dayjs(slot.startsAt).format('h:mm A') }}
              </button>
            </div>
          </div>

          <!-- Step 2: Guest Details Form -->
          <div v-else class="booking-form-step">
            <button type="button" class="modern-back-btn" @click="showFormStep = false">
              <Icon icon="hugeicons:arrow-left-01" width="16" height="16" />
              <span>Back to times</span>
            </button>

            <div class="selected-time-summary">
              <strong>{{ dayjs(selectedSlot.startsAt).format('h:mm A') }} - {{ dayjs(selectedSlot.endsAt).format('h:mm A') }}</strong>
              <span>{{ dayjs(selectedDateStr).format('dddd, MMMM D, YYYY') }}</span>
            </div>

            <el-form :model="form" label-position="top" class="guest-form">
              <el-form-item label="Your Name" required>
                <el-input v-model="form.guestName" placeholder="e.g. Sarah Connor" />
              </el-form-item>

              <el-form-item label="Email Address" required>
                <el-input v-model="form.guestEmail" placeholder="you@company.com" />
              </el-form-item>

              <el-form-item label="Please share anything that will help prepare for our meeting">
                <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="Questions, goals..." />
              </el-form-item>

              <el-button type="primary" size="large" class="confirm-btn" @click="submitBooking">
                Schedule Event
              </el-button>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()

const selectedTimezone = ref(
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
)

const calMonth = ref(dayjs())
const selectedDateStr = ref(dayjs().add(1, 'day').format('YYYY-MM-DD'))
const selectedSlot = ref(null)
const showFormStep = ref(false)
const bookedState = ref(false)
const meetingLink = ref('')
const linkCopied = ref(false)

function generateMeetingLink() {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  const roomCode = Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 10)
  return `https://meet.jit.si/GrabMails-${roomCode}`
}

async function copyMeetingLink() {
  if (!meetingLink.value) return
  try {
    await navigator.clipboard.writeText(meetingLink.value)
    linkCopied.value = true
    ElMessage.success('Meeting invitation link copied!')
    setTimeout(() => { linkCopied.value = false }, 2200)
  } catch (e) {
    ElMessage.error('Failed to copy link')
  }
}

function goToCalendar() {
  router.push('/calendar')
}

const form = ref({
  guestName: '',
  guestEmail: '',
  notes: ''
})

// Calendar widget days
const calendarDays = computed(() => {
  const start = calMonth.value.startOf('month')
  const startDay = start.day()
  const first = start.subtract(startDay, 'day')
  const days = []

  for (let i = 0; i < 35; i++) {
    const d = first.add(i, 'day')
    const isPast = d.isBefore(dayjs().startOf('day'))
    const isWeekend = d.day() === 0 || d.day() === 6
    days.push({
      dateStr: d.format('YYYY-MM-DD'),
      dayNum: d.date(),
      isCurrentMonth: d.month() === calMonth.value.month(),
      isToday: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
      isDisabled: isPast || isWeekend
    })
  }
  return days
})

function selectDate(dateStr) {
  selectedDateStr.value = dateStr
  showFormStep.value = false
}

// Available Slots calculation
const availableSlots = computed(() => {
  const baseDate = dayjs(selectedDateStr.value)
  const slots = []
  const hours = [9, 10, 11, 13, 14, 15, 16] // 9am to 4pm

  // Check existing events in localStorage
  let existingEvents = []
  try {
    const raw = localStorage.getItem('grabmails_calendar_events')
    if (raw) existingEvents = JSON.parse(raw)
  } catch (e) {}

  for (const h of hours) {
    for (const m of [0, 30]) {
      const startsAt = baseDate.hour(h).minute(m).second(0).toISOString()
      const endsAt = baseDate.hour(h).minute(m + 30).second(0).toISOString()

      // Exclude conflict with existing calendar events
      const isConflict = existingEvents.some(ev => {
        const evStart = dayjs(ev.starts_at)
        const evEnd = dayjs(ev.ends_at)
        const slotStart = dayjs(startsAt)
        const slotEnd = dayjs(endsAt)
        return slotStart.isBefore(evEnd) && slotEnd.isAfter(evStart)
      })

      if (!isConflict) {
        slots.push({ startsAt, endsAt })
      }
    }
  }

  return slots
})

function chooseSlot(slot) {
  selectedSlot.value = slot
  showFormStep.value = true
}

function submitBooking() {
  if (!form.value.guestName.trim()) {
    ElMessage.warning('Please enter your name')
    return
  }
  if (!form.value.guestEmail.trim() || !form.value.guestEmail.includes('@')) {
    ElMessage.warning('Please enter a valid email address')
    return
  }

  const generatedLink = generateMeetingLink()
  meetingLink.value = generatedLink

  // Insert into calendar events
  try {
    const raw = localStorage.getItem('grabmails_calendar_events')
    const events = raw ? JSON.parse(raw) : []
    const newEvent = {
      id: `book-${Date.now()}`,
      title: `Consultation: ${form.value.guestName}`,
      starts_at: selectedSlot.value.startsAt,
      ends_at: selectedSlot.value.endsAt,
      location: generatedLink,
      meetingLink: generatedLink,
      guestEmail: form.value.guestEmail,
      description: `Meeting with ${form.value.guestName} (${form.value.guestEmail})\nJoin Link: ${generatedLink}${form.value.notes ? `\nNotes: ${form.value.notes}` : ''}`,
      color: '#18181b'
    }
    events.push(newEvent)
    localStorage.setItem('grabmails_calendar_events', JSON.stringify(events))
  } catch (e) {}

  bookedState.value = true
  ElMessage.success('Appointment confirmed!')
}

function resetBooking() {
  bookedState.value = false
  showFormStep.value = false
  selectedSlot.value = null
  meetingLink.value = ''
  linkCopied.value = false
  form.value = {
    guestName: '',
    guestEmail: '',
    notes: ''
  }
}

function downloadBookingIcs() {
  if (!selectedSlot.value) return
  const link = meetingLink.value || ''
  const formatUtc = (d) => dayjs(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GrabMails//Productivity Suite Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:booking-${Date.now()}@grabmails.internal`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(selectedSlot.value.startsAt)}`,
    `DTEND:${formatUtc(selectedSlot.value.endsAt)}`,
    `SUMMARY:Consultation: ${form.value.guestName}`,
    `DESCRIPTION:30 Min Meeting with GrabMails Teams\\nJoin Video Call: ${link}`,
    `LOCATION:${link}`,
    `URL:${link}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'consultation_invite.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('Downloaded calendar invite (.ics)')
}
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  width: 100vw;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
}

.booking-container {
  width: 100%;
  max-width: 960px;
}

/* ══ Main Card ══ */
.booking-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  display: flex;
  min-height: 520px;
  overflow: hidden;
}

/* ══ Left Pane ══ */
.booking-info-pane {
  width: 300px;
  padding: 32px 28px;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}

.host-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.host-icon {
  color: #4f46e5;
}

.host-name {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 6px 0 18px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  margin-bottom: 8px;
}

.meta-icon {
  color: #64748b;
}

.event-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 16px 0;
}

.timezone-picker-wrap {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tz-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.tz-select {
  width: 100%;
}

/* ══ Middle Pane: Date Picker ══ */
.booking-date-pane {
  width: 340px;
  padding: 32px 24px;
  border-right: 1px solid #f1f5f9;
}

.pane-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 20px 0;
}

.calendar-widget {
  display: flex;
  flex-direction: column;
}

.cal-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.widget-month-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.cal-nav-buttons {
  display: flex;
  gap: 4px;
}

.widget-arrow {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #64748b;
}

.widget-arrow:hover {
  background: #f8fafc;
}

.widget-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.widget-wd {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.widget-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.widget-day-btn {
  aspect-ratio: 1;
  border-radius: 50%;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.widget-day-btn:hover:not(:disabled) {
  background: #eef2ff;
  color: #4f46e5;
}

.widget-day-btn.is-selected {
  background: #4f46e5 !important;
  color: #ffffff !important;
  font-weight: 700;
}

.widget-day-btn.is-today:not(.is-selected) {
  color: #4f46e5;
  font-weight: 700;
}

.widget-day-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.widget-day-btn.is-other-month {
  opacity: 0.3;
}

/* ══ Right Pane: Slots & Form ══ */
.booking-slots-pane {
  flex: 1;
  padding: 32px 28px;
  overflow-y: auto;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 6px;
}

.slot-btn {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #4f46e5;
  background: #ffffff;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.slot-btn:hover {
  background: #4f46e5;
  color: #ffffff;
}

/* ══ Black Booking Option with White Fields and Black Text ══ */
.booking-form-step {
  background: #000000;
  border-radius: 18px;
  padding: 24px;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.modern-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #f1f5f9;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 9999px;
  cursor: pointer;
  margin-bottom: 18px;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modern-back-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  transform: translateX(-2px);
}

.selected-time-summary {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.selected-time-summary strong {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
}

.selected-time-summary span {
  font-size: 13px;
  color: #94a3b8;
}

/* Form labels on black container */
.booking-form-step :deep(.el-form-item__label) {
  color: #f8fafc !important;
  font-weight: 500 !important;
  font-size: 13.5px !important;
  margin-bottom: 6px !important;
}

/* White fields with crisp black text */
.booking-form-step :deep(.el-input__wrapper) {
  background-color: #ffffff !important;
  background: #ffffff !important;
  border-radius: 12px !important;
  box-shadow: none !important;
  border: 1px solid #e2e8f0 !important;
  padding: 4px 12px !important;
}

.booking-form-step :deep(.el-input__wrapper:hover) {
  border-color: #cbd5e1 !important;
}

.booking-form-step :deep(.el-input__wrapper.is-focus) {
  border-color: #000000 !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25) !important;
}

.booking-form-step :deep(.el-input__inner) {
  color: #000000 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}

.booking-form-step :deep(.el-input__inner::placeholder) {
  color: #64748b !important;
  font-weight: 400 !important;
}

.booking-form-step :deep(.el-textarea__inner) {
  background-color: #ffffff !important;
  background: #ffffff !important;
  color: #000000 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
  padding: 10px 12px !important;
}

.booking-form-step :deep(.el-textarea__inner::placeholder) {
  color: #64748b !important;
  font-weight: 400 !important;
}

.booking-form-step :deep(.el-textarea__inner:focus) {
  border-color: #000000 !important;
}

/* Prominent, highly visible Schedule Event button */
.booking-form-step .confirm-btn {
  width: 100%;
  height: 46px;
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #ffffff !important;
  border-radius: 12px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  margin-top: 14px !important;
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.16) !important;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.booking-form-step .confirm-btn:hover {
  background: #f4f4f5 !important;
  background-color: #f4f4f5 !important;
  color: #000000 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.28) !important;
}

/* ══ Confirmed State ══ */
.booking-confirmed-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 48px 32px;
  text-align: center;
  max-width: 520px;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.success-icon-wrap {
  margin-bottom: 16px;
}

.success-icon {
  color: #0f172a;
}

.confirmed-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.confirmed-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
}

.confirmed-details-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
  text-align: left;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.detail-icon {
  color: #09090b;
  flex-shrink: 0;
}

.meeting-link-box {
  margin-top: 6px;
  padding: 14px;
  border-radius: 12px;
  background: #000000;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meeting-link-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a1a1aa;
}

.meeting-link-url {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: #ffffff;
  text-decoration: underline;
  word-break: break-all;
  line-height: 1.4;
}

.meeting-link-btns {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.link-copy-btn,
.link-join-btn {
  flex: 1;
  min-width: 110px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 150ms ease;
}

.link-copy-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.link-copy-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.link-join-btn {
  background: #ffffff;
  color: #000000;
  border: 1px solid #ffffff;
}

.link-join-btn:hover {
  background: #f4f4f5;
  color: #000000;
}

.confirmed-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.confirmed-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.action-btn {
  border-radius: 10px;
  width: 100%;
}

/* ══ Mobile Responsive ══ */
@media (max-width: 860px) {
  .booking-page {
    padding: 12px 10px;
    align-items: flex-start;
  }

  .booking-card {
    flex-direction: column;
    min-height: auto;
    border-radius: 16px;
  }

  .booking-info-pane {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
    padding: 20px 18px;
  }

  .host-avatar {
    width: 44px;
    height: 44px;
    margin-bottom: 12px;
  }

  .event-title {
    font-size: 20px;
    margin: 4px 0 12px 0;
  }

  .timezone-picker-wrap {
    margin-top: 14px;
  }

  .booking-date-pane {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
    padding: 20px 18px;
  }

  .calendar-widget {
    max-width: 340px;
    margin: 0 auto;
  }

  .booking-slots-pane {
    width: 100%;
    padding: 20px 18px;
  }

  .slots-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
    max-height: none;
    padding-right: 0;
  }

  .booking-confirmed-card {
    padding: 32px 18px;
    border-radius: 16px;
  }

  .confirmed-title {
    font-size: 20px;
  }
}
</style>
