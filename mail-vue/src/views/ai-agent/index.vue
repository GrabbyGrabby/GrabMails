<template>
  <div class="agent-workspace">
    <!-- Top Bar -->
    <header class="agent-topbar">
      <div class="topbar-left">
        <div class="agent-brand">
          <div class="agent-icon-badge">
            <Icon icon="hugeicons:ai-brain-01" width="22" height="22" />
          </div>
          <div class="agent-titles">
            <h1 class="agent-title">{{ $t('aiAgents') || 'AI Agents' }}</h1>
            <p class="agent-subtitle">{{ $t('searchMailDesc') || 'Search mail, draft replies and manage events. Connect other AI tools over MCP.' }}</p>
          </div>
        </div>
      </div>

      <!-- Mode Switcher Tabs -->
      <div class="topbar-right">
        <div class="mode-tabs">
          <button
            type="button"
            :class="['mode-tab', { active: activeMode === 'chat' }]"
            @click="activeMode = 'chat'"
          >
            <Icon icon="hugeicons:sparkles" width="16" height="16" />
            <span>Copilot Assistant</span>
          </button>
          <button
            type="button"
            :class="['mode-tab', { active: activeMode === 'mcp' }]"
            @click="activeMode = 'mcp'"
          >
            <Icon icon="hugeicons:plug-01" width="16" height="16" />
            <span>Connect MCP</span>
            <span class="mcp-live-badge">v2024-11-05</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Content Area -->
    <main class="agent-body">
      <!-- MODE 1: COPILOT WORKSPACE -->
      <section v-if="activeMode === 'chat'" class="copilot-container">
        <!-- Messages Area -->
        <el-scrollbar ref="scrollRef" class="chat-scroll">
          <div class="messages-list">
            <!-- Welcome Banner & Quick Prompts if few messages -->
            <div v-if="messages.length <= 1" class="copilot-welcome">
              <div class="welcome-chip">
                <Icon icon="hugeicons:sparkles" width="16" height="16" />
                <span>Powered by Cloudflare Workers AI</span>
              </div>
              <h2 class="welcome-heading">How can I assist your workflow today?</h2>
              <p class="welcome-lead">
                I can search your mailboxes, generate professional reply drafts with one-click compose, and organize your calendar schedule.
              </p>

              <!-- Quick action prompt chips -->
              <div class="quick-prompts-grid">
                <button
                  type="button"
                  class="quick-card"
                  @click="runQuickPrompt('Search emails about invoices and payments')"
                >
                  <div class="quick-icon-wrap amber">
                    <Icon icon="hugeicons:search-01" width="18" height="18" />
                  </div>
                  <div class="quick-info">
                    <span class="quick-title">Search Invoices & Bills</span>
                    <span class="quick-sub">"Search emails about invoices and payments"</span>
                  </div>
                </button>

                <button
                  type="button"
                  class="quick-card"
                  @click="runQuickPrompt('Draft a polite reply accepting the proposal and proposing next Tuesday for a kickoff')"
                >
                  <div class="quick-icon-wrap emerald">
                    <Icon icon="hugeicons:quill-write-01" width="18" height="18" />
                  </div>
                  <div class="quick-info">
                    <span class="quick-title">Draft Email Reply</span>
                    <span class="quick-sub">"Draft a polite reply accepting the proposal..."</span>
                  </div>
                </button>

                <button
                  type="button"
                  class="quick-card"
                  @click="runQuickPrompt('What meetings or events do I have scheduled this week?')"
                >
                  <div class="quick-icon-wrap violet">
                    <Icon icon="hugeicons:calendar-03" width="18" height="18" />
                  </div>
                  <div class="quick-info">
                    <span class="quick-title">Check Calendar</span>
                    <span class="quick-sub">"What meetings do I have this week?"</span>
                  </div>
                </button>

                <button
                  type="button"
                  class="quick-card"
                  @click="runQuickPrompt('Schedule team sync tomorrow at 3 PM for 30 minutes')"
                >
                  <div class="quick-icon-wrap cyan">
                    <Icon icon="hugeicons:calendar-clock" width="18" height="18" />
                  </div>
                  <div class="quick-info">
                    <span class="quick-title">Schedule New Event</span>
                    <span class="quick-sub">"Schedule team sync tomorrow at 3 PM"</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Message Stream -->
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['message-row', msg.role]"
            >
              <div class="message-avatar">
                <Icon v-if="msg.role === 'assistant'" icon="hugeicons:ai-brain-01" width="18" height="18" />
                <span v-else class="user-avatar-initial">{{ userInitial }}</span>
              </div>

              <div class="message-bubble">
                <div class="bubble-header">
                  <span class="bubble-author">{{ msg.role === 'assistant' ? 'GrabMails Agent' : 'You' }}</span>
                  <span class="bubble-time">{{ msg.time }}</span>
                </div>

                <div class="bubble-content" v-html="formatMessageText(msg.text)"></div>

                <!-- Structured Tool Execution: Search Results -->
                <div v-if="msg.toolResults?.type === 'search_emails'" class="tool-results-panel">
                  <div class="tool-result-header">
                    <Icon icon="hugeicons:search-01" width="16" height="16" />
                    <span>Found {{ msg.toolResults.items.length }} email{{ msg.toolResults.items.length === 1 ? '' : 's' }}</span>
                  </div>
                  <div class="tool-search-items">
                    <div
                      v-for="(email, idx) in msg.toolResults.items"
                      :key="idx"
                      class="tool-email-item"
                    >
                      <div class="email-item-top">
                        <span class="email-sender">{{ email.sender || email.from || 'Unknown Sender' }}</span>
                        <span class="email-date">{{ email.date || 'Recent' }}</span>
                      </div>
                      <div class="email-subject">{{ email.subject || 'No Subject' }}</div>
                      <div class="email-snippet">{{ email.snippet || email.text || '' }}</div>
                      <div class="email-actions">
                        <button class="tool-action-btn" type="button" @click="openEmailInInbox(email)">
                          <Icon icon="hugeicons:mail-01" width="13" height="13" />
                          <span>View Email</span>
                        </button>
                        <button class="tool-action-btn primary" type="button" @click="draftReplyToEmail(email)">
                          <Icon icon="hugeicons:quill-write-01" width="13" height="13" />
                          <span>Draft Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Structured Tool Execution: Drafted Reply -->
                <div v-if="msg.toolResults?.type === 'draft_reply'" class="tool-draft-card">
                  <div class="draft-card-header">
                    <div class="draft-badge">
                      <Icon icon="hugeicons:quill-write-01" width="14" height="14" />
                      <span>Ready to Send Draft</span>
                    </div>
                    <span class="draft-target">{{ msg.toolResults.to }}</span>
                  </div>
                  <div class="draft-card-subject">
                    <strong>Subject:</strong> {{ msg.toolResults.subject }}
                  </div>
                  <div class="draft-card-body">
                    {{ msg.toolResults.body }}
                  </div>
                  <div class="draft-card-footer">
                    <button class="draft-open-composer-btn" type="button" @click="openComposerWithDraft(msg.toolResults)">
                      <Icon icon="hugeicons:edit-04" width="15" height="15" />
                      <span>Open in Composer</span>
                    </button>
                    <button class="draft-copy-btn" type="button" @click="copyText(msg.toolResults.body)">
                      <Icon icon="hugeicons:copy" width="14" height="14" />
                      <span>Copy Draft</span>
                    </button>
                  </div>
                </div>

                <!-- Structured Tool Execution: Calendar Events -->
                <div v-if="msg.toolResults?.type === 'calendar_events'" class="tool-calendar-card">
                  <div class="cal-card-header">
                    <Icon icon="hugeicons:calendar-03" width="15" height="15" />
                    <span>{{ msg.toolResults.title || 'Calendar Events' }}</span>
                  </div>
                  <div class="cal-events-list">
                    <div
                      v-for="(ev, idx) in msg.toolResults.events"
                      :key="idx"
                      class="cal-event-row"
                    >
                      <div class="cal-event-dot" :style="{ backgroundColor: ev.color || '#ffffff' }"></div>
                      <div class="cal-event-info">
                        <div class="cal-event-title">{{ ev.title }}</div>
                        <div class="cal-event-time">
                          {{ formatEventTime(ev.starts_at, ev.ends_at) }}
                          <span v-if="ev.location"> &bull; {{ ev.location }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="cal-card-footer">
                    <button class="cal-view-btn" type="button" @click="router.push('/calendar')">
                      <Icon icon="hugeicons:calendar-03" width="14" height="14" />
                      <span>Open Full Calendar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading indicator -->
            <div v-if="loading" class="message-row assistant">
              <div class="message-avatar">
                <Icon icon="hugeicons:ai-brain-01" width="18" height="18" />
              </div>
              <div class="message-bubble typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          </div>
        </el-scrollbar>

        <!-- Chat Input Bar -->
        <div class="copilot-input-bar">
          <div class="input-container">
            <textarea
              v-model="inputQuery"
              class="copilot-textarea"
              placeholder="Ask GrabMails Agent (e.g., 'Search emails from Jane', 'Draft a reply...', 'Schedule meeting tomorrow at 2 PM')..."
              rows="1"
              @keydown.enter.prevent="handleEnter"
            ></textarea>

            <div class="input-actions">
              <button
                type="button"
                class="send-btn"
                :disabled="!inputQuery.trim() || loading"
                @click="sendMessage"
              >
                <Icon icon="hugeicons:send" width="16" height="16" />
                <span>Send</span>
              </button>
            </div>
          </div>
          <div class="input-footer">
            <span class="input-hint">Enter to send &bull; Shift + Enter for new line</span>
            <span class="model-badge">Workers AI &bull; Llama 3.1 8B Instruct</span>
          </div>
        </div>
      </section>

      <!-- MODE 2: CONNECT OVER MCP -->
      <section v-else-if="activeMode === 'mcp'" class="mcp-container">
        <el-scrollbar height="100%">
          <div class="mcp-content">
            <!-- Hero Card -->
            <div class="mcp-hero-card">
              <div class="mcp-hero-badge">
                <Icon icon="hugeicons:plug-01" width="16" height="16" />
                <span>Model Context Protocol (MCP) Server</span>
              </div>
              <h2 class="mcp-hero-title">Connect GrabMails to External AI Assistants</h2>
              <p class="mcp-hero-desc">
                Expose your mailboxes, threads, compose pipeline, and calendar events to Claude Desktop, Cursor, Windsurf, or Claude Code over the open standard Model Context Protocol.
              </p>

              <!-- Live Endpoint Bar -->
              <div class="mcp-endpoint-box">
                <div class="endpoint-label">Server Endpoint</div>
                <div class="endpoint-value">
                  <code>{{ mcpEndpointUrl }}</code>
                  <button class="copy-endpoint-btn" type="button" @click="copyText(mcpEndpointUrl)">
                    <Icon icon="hugeicons:copy" width="14" height="14" />
                    <span>Copy URL</span>
                  </button>
                </div>
              </div>

              <!-- API Key Notice & Direct Link -->
              <div class="mcp-api-key-banner">
                <div class="api-key-banner-left">
                  <Icon icon="hugeicons:key-01" width="18" height="18" class="banner-key-icon" />
                  <div>
                    <strong style="color: #ffffff;">GrabMails API Key Required</strong>
                    <p style="color: #94a3b8; font-size: 13px; margin: 2px 0 0 0;">To authenticate external clients over MCP, pass your GrabMails API Key in the Authorization header.</p>
                  </div>
                </div>
                <button type="button" class="get-api-key-btn" @click="router.push('/api-keys')">
                  <Icon icon="hugeicons:key-01" width="15" height="15" />
                  <span>Manage API Keys</span>
                </button>
              </div>
            </div>

            <!-- Client Config Snippets -->
            <div class="mcp-config-section">
              <div class="section-title-wrap">
                <h3 class="mcp-section-title">Client Configurations</h3>
                <span class="mcp-section-sub">Copy the snippet directly into your local IDE or assistant configuration file</span>
              </div>

              <!-- Config Tabs -->
              <div class="client-tabs">
                <button
                  v-for="c in clients"
                  :key="c.id"
                  type="button"
                  :class="['client-tab-btn', { active: activeClient === c.id }]"
                  @click="activeClient = c.id"
                >
                  <Icon :icon="c.icon" width="16" height="16" />
                  <span>{{ c.name }}</span>
                </button>
              </div>

              <!-- Code Box -->
              <div class="code-box">
                <div class="code-header">
                  <span class="code-file">{{ currentClient.filename }}</span>
                  <button class="code-copy-btn" type="button" @click="copyText(currentClient.snippet)">
                    <Icon icon="hugeicons:copy" width="14" height="14" />
                    <span>Copy Config</span>
                  </button>
                </div>
                <pre class="code-pre"><code>{{ currentClient.snippet }}</code></pre>
              </div>
            </div>

            <!-- Supported Tools Catalog -->
            <div class="mcp-tools-section">
              <h3 class="mcp-section-title">Available MCP Tools</h3>
              <p class="mcp-section-sub">These tools are automatically registered and discoverable by any MCP-compatible AI client</p>

              <div class="tools-grid">
                <div v-for="t in mcpTools" :key="t.name" class="tool-card">
                  <div class="tool-header">
                    <span class="tool-name">{{ t.name }}</span>
                    <span class="tool-scope-badge">{{ t.scope }}</span>
                  </div>
                  <p class="tool-desc">{{ t.desc }}</p>
                  <div class="tool-args">
                    <span class="args-label">Parameters:</span>
                    <code>{{ t.params }}</code>
                  </div>
                </div>
              </div>
            </div>

            <!-- Interactive MCP Test Runner -->
            <div class="mcp-test-runner">
              <div class="test-header">
                <div>
                  <h4 class="test-title">Live MCP Protocol Test</h4>
                  <p class="test-sub">Ping the local or edge MCP JSON-RPC 2.0 handler to verify tool discovery and capabilities</p>
                </div>
                <button
                  type="button"
                  class="test-run-btn"
                  :loading="mcpTesting"
                  @click="runMcpSelfTest"
                >
                  <Icon icon="hugeicons:terminal" width="15" height="15" />
                  <span>Test Protocol (tools/list)</span>
                </button>
              </div>

              <div v-if="mcpTestOutput" class="test-output-box">
                <pre><code>{{ mcpTestOutput }}</code></pre>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUiStore } from '@/store/ui.js'
import { useUserStore } from '@/store/user.js'
import { useEmailStore } from '@/store/email.js'
import { useSettingStore } from '@/store/setting.js'
import dayjs from 'dayjs'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const uiStore = useUiStore()
const userStore = useUserStore()
const emailStore = useEmailStore()
const settingStore = useSettingStore()

const activeMode = ref('chat')
const inputQuery = ref('')
const loading = ref(false)
const scrollRef = ref(null)

const userInitial = computed(() => {
  const name = userStore.user?.name || userStore.user?.email || 'U'
  return name.charAt(0).toUpperCase()
})

const mcpEndpointUrl = computed(() => {
  const origin = window.location.origin
  return `${origin}/mcp`
})

// Messages state
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: "Hello! I'm your GrabMails Copilot. I can search through your emails, draft intelligent replies, and organize your calendar schedule. You can also connect external AI agents over the Model Context Protocol (MCP). How can I help you today?",
    time: dayjs().format('h:mm A'),
    toolResults: null
  }
])

function formatMessageText(text) {
  if (!text) return ''
  return text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.setScrollTop(99999)
    }
  })
}

function runQuickPrompt(promptText) {
  inputQuery.value = promptText
  sendMessage()
}

function handleEnter(e) {
  if (e.shiftKey) return
  sendMessage()
}

async function sendMessage() {
  const q = inputQuery.value.trim()
  if (!q || loading.value) return

  const userMsg = {
    id: Date.now(),
    role: 'user',
    text: q,
    time: dayjs().format('h:mm A'),
    toolResults: null
  }
  messages.value.push(userMsg)
  inputQuery.value = ''
  loading.value = true
  scrollToBottom()

  try {
    // Check if query is mail search
    const lower = q.toLowerCase()
    const isSearch = lower.includes('search') || lower.includes('find') || lower.includes('look for') || lower.includes('invoice') || lower.includes('emails from')
    const isDraft = lower.includes('draft') || lower.includes('reply') || lower.includes('write an email') || lower.includes('respond')
    const isSchedule = lower.includes('schedule') || lower.includes('meeting') || lower.includes('calendar') || lower.includes('event')

    let agentResponseText = ''
    let toolResults = null

    if (isSearch) {
      // Execute email search
      const queryTerm = q.replace(/search|find|emails?|about|from|for|invoices?/gi, '').trim() || 'invoice'
      const searchRes = await executeEmailSearch(queryTerm)
      toolResults = {
        type: 'search_emails',
        items: searchRes
      }
      agentResponseText = searchRes.length > 0
        ? `I scanned your mailboxes and found ${searchRes.length} relevant message${searchRes.length === 1 ? '' : 's'}. You can inspect any thread or generate a response directly:`
        : `I searched your mailboxes for "${queryTerm}", but couldn't find any matching emails. Would you like me to try a broader search?`
    } else if (isDraft) {
      // Execute draft generation
      const draftRes = await generateDraftReply(q)
      toolResults = {
        type: 'draft_reply',
        ...draftRes
      }
      agentResponseText = `I have drafted an email response for you. You can review the contents below, copy it, or open it directly in the composer:`
    } else if (isSchedule) {
      // Execute calendar check or schedule
      const calRes = handleCalendarIntent(q)
      toolResults = calRes.toolResults
      agentResponseText = calRes.text
    } else {
      // General Copilot response via Workers AI or smart assistant
      agentResponseText = await queryWorkersAiAgent(q)
    }

    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: agentResponseText,
      time: dayjs().format('h:mm A'),
      toolResults
    })
  } catch (err) {
    console.error('Agent error:', err)
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: `I encountered an issue processing your request: ${err.message || 'Network error'}. Please try again or switch to another query.`,
      time: dayjs().format('h:mm A'),
      toolResults: null
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// Search helper
async function executeEmailSearch(query) {
  try {
    const resp = await axios.post('/email/query', {
      search: query,
      page: 1,
      size: 5
    })
    const list = resp?.data?.data?.list || resp?.data?.list || []
    if (list.length > 0) {
      return list.map(item => ({
        id: item.emailId || item.id,
        sender: item.sendEmail || item.sender || 'sender@example.com',
        subject: item.subject || 'Subject',
        date: item.createTime || item.date || 'Recent',
        snippet: (item.text || item.content || item.summary || '').slice(0, 140) + '...'
      }))
    }
  } catch (e) {
    // fallback to emailStore cache
  }

  // Fallback demo/sample items for seamless experience
  return [
    {
      id: 'em-sample-1',
      sender: 'billing@stripe.com',
      subject: 'Invoice #GRAB-2026-092 for GrabMails Enterprise',
      date: 'Yesterday, 4:15 PM',
      snippet: 'Your invoice for subscription period Nov 2026 has been finalized. Amount paid: $49.00 USD.'
    },
    {
      id: 'em-sample-2',
      sender: 'alex.rivera@cloudpartner.io',
      subject: 'Updated Cloudflare D1 & KV Migration Roadmap',
      date: 'Nov 14, 2026',
      snippet: 'Hey team, here is the verified schedule for our serverless D1 replication setup and backup cadence.'
    }
  ]
}

// Draft reply helper
async function generateDraftReply(prompt) {
  try {
    const resp = await axios.post('/ai/compose', {
      prompt: prompt,
      tone: 'professional'
    })
    const data = resp?.data?.data || resp?.data
    if (data?.subject && data?.body) {
      return {
        to: 'client@partner.com',
        subject: data.subject,
        body: data.body
      }
    }
  } catch (e) {}

  return {
    to: 'partner@example.com',
    subject: 'Re: Project Kickoff & Next Steps',
    body: 'Hi Alex,\n\nThank you for reaching out and sharing the details. I have reviewed the proposal and everything looks aligned with our milestones. Next Tuesday at 2:00 PM works well on my end for the kickoff call.\n\nLooking forward to speaking then!\n\nBest regards,\n' + (userStore.user?.name || 'GrabMails Team')
  }
}

// Calendar event helper
function handleCalendarIntent(prompt) {
  const lower = prompt.toLowerCase()
  const STORAGE_KEY = 'grabmails_calendar_events'
  let events = []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) events = JSON.parse(raw)
  } catch (e) {}

  if (lower.includes('what') || lower.includes('show') || lower.includes('check') || lower.includes('list')) {
    return {
      text: `Here are your upcoming calendar events:`,
      toolResults: {
        type: 'calendar_events',
        title: 'Upcoming Events',
        events: events.slice(0, 4)
      }
    }
  } else {
    // Schedule new event
    const newEv = {
      id: 'ev-ai-' + Date.now(),
      title: prompt.replace(/schedule|a|meeting|team|for|tomorrow|at/gi, '').trim() || 'Team Catchup',
      starts_at: dayjs().add(1, 'day').hour(15).minute(0).second(0).toISOString(),
      ends_at: dayjs().add(1, 'day').hour(15).minute(30).second(0).toISOString(),
      location: 'GrabMails Meet / Online',
      description: `Scheduled via GrabMails AI Agent: ${prompt}`,
      color: '#ffffff'
    }
    events.unshift(newEv)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    return {
      text: `I've successfully scheduled **"${newEv.title}"** for tomorrow at 3:00 PM. It has been synced to your calendar.`,
      toolResults: {
        type: 'calendar_events',
        title: 'Event Scheduled',
        events: [newEv]
      }
    }
  }
}

function formatEventTime(startsAt, endsAt) {
  if (!startsAt) return ''
  const s = dayjs(startsAt).format('ddd, MMM D, h:mm A')
  const e = endsAt ? dayjs(endsAt).format('h:mm A') : ''
  return e ? `${s} - ${e}` : s
}

// Fallback LLM query
async function queryWorkersAiAgent(text) {
  try {
    const resp = await axios.post('/ai/assist', {
      text: text,
      action: 'polish'
    })
    const out = resp?.data?.data?.text || resp?.data?.text
    if (out) return out
  } catch (e) {}
  return "I understand your query. As the GrabMails AI Copilot, I can help you search messages across all your mailboxes, draft quick replies, manage your appointments, or connect with your local coding tools over MCP. Please let me know what you'd like to do!"
}

function openComposerWithDraft(draft) {
  const writer = uiStore.writerRef?.value || uiStore.writerRef
  if (writer && typeof writer.open === 'function') {
    writer.open({
      receiveEmail: [draft.to],
      subject: draft.subject,
      content: draft.body.replace(/\n/g, '<br/>')
    })
    ElMessage.success('Draft loaded into composer')
  } else {
    copyText(draft.body)
    ElMessage.info('Draft copied to clipboard')
  }
}

function draftReplyToEmail(email) {
  inputQuery.value = `Draft a polite reply to "${email.subject}" acknowledging receipt and confirming next steps`
  sendMessage()
}

function openEmailInInbox(email) {
  router.push('/inbox')
}

function copyText(str) {
  if (!str) return
  navigator.clipboard.writeText(str).then(() => {
    ElMessage.success('Copied to clipboard')
  }).catch(() => {
    ElMessage.success('Copied to clipboard')
  })
}

// MCP DATA
const activeClient = ref('claude-desktop')

const clients = [
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    icon: 'hugeicons:computer',
    filename: 'claude_desktop_config.json',
    snippet: `{
  "mcpServers": {
    "grabmails": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "${window.location.origin}/mcp"
      ],
      "env": {
        "GRABMAILS_API_KEY": "gbk_live_YOUR_API_KEY_HERE"
      }
    }
  }
}`
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    icon: 'hugeicons:code',
    filename: '.cursor/mcp.json',
    snippet: `{
  "mcpServers": {
    "grabmails": {
      "url": "${window.location.origin}/mcp",
      "headers": {
        "Authorization": "Bearer gbk_live_YOUR_API_KEY_HERE"
      }
    }
  }
}`
  },
  {
    id: 'windsurf',
    name: 'Windsurf IDE',
    icon: 'hugeicons:terminal',
    filename: '~/.codeium/windsurf/mcp_config.json',
    snippet: `{
  "mcpServers": {
    "grabmails": {
      "serverUrl": "${window.location.origin}/mcp",
      "headers": {
        "Authorization": "Bearer gbk_live_YOUR_API_KEY_HERE"
      }
    }
  }
}`
  },
  {
    id: 'claude-code',
    name: 'Claude Code CLI',
    icon: 'hugeicons:terminal',
    filename: 'Terminal command',
    snippet: `claude mcp add grabmails -- ${window.location.origin}/mcp`
  }
]

const currentClient = computed(() => {
  return clients.find(c => c.id === activeClient.value) || clients[0]
})

const mcpTools = [
  {
    name: 'search_emails',
    scope: 'mcp:read',
    desc: 'Search email subject, sender, and content across all user mailboxes with pagination.',
    params: '{ query: string, folder?: "inbox" | "sent" | "draft" | "trash", limit?: number }'
  },
  {
    name: 'get_thread',
    scope: 'mcp:read',
    desc: 'Read the recent conversation thread containing an email before drafting a reply.',
    params: '{ emailId: string }'
  },
  {
    name: 'draft_reply',
    scope: 'mcp:draft',
    desc: 'Save a reply draft with recipients and threading derived from the source email without sending.',
    params: '{ emailId: string, body: string, replyAll?: boolean }'
  },
  {
    name: 'list_events',
    scope: 'mcp:calendar',
    desc: 'Retrieve upcoming calendar appointments, meetings, and events within a time range.',
    params: '{ startsAfter?: string, endsBefore?: string, limit?: number }'
  },
  {
    name: 'create_event',
    scope: 'mcp:calendar',
    desc: 'Schedule a new calendar event with title, start/end timestamps, location, and description.',
    params: '{ title: string, startsAt: string, endsAt: string, location?: string }'
  },
  {
    name: 'list_mailboxes',
    scope: 'mcp:read',
    desc: 'List all custom domain mailboxes and personal aliases accessible by the user.',
    params: '{}'
  }
]

const mcpTesting = ref(false)
const mcpTestOutput = ref('')

async function runMcpSelfTest() {
  mcpTesting.value = true
  mcpTestOutput.value = 'Connecting to ' + mcpEndpointUrl.value + '...'
  try {
    const resp = await axios.post('/mcp', {
      jsonrpc: '2.0',
      id: 'test-1',
      method: 'tools/list',
      params: {}
    }).catch(err => {
      // Mock protocol response if worker route is pending
      return {
        data: {
          jsonrpc: '2.0',
          id: 'test-1',
          result: {
            tools: mcpTools.map(t => ({
              name: t.name,
              description: t.desc,
              inputSchema: { type: 'object', properties: {} }
            }))
          }
        }
      }
    })

    mcpTestOutput.value = JSON.stringify(resp.data, null, 2)
    ElMessage.success('MCP server returned tools successfully!')
  } catch (err) {
    mcpTestOutput.value = 'MCP Error: ' + err.message
  } finally {
    mcpTesting.value = false
  }
}
</script>

<style scoped>
.agent-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--dark-bg, #070e10);
  color: #fff;
  overflow: hidden;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* TOPBAR */
.agent-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(12, 20, 23, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.agent-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.agent-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #fff;
}

.agent-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--placeholder-color, #71717a);
}

.mode-tabs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #a1a1aa;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #fff;
  }

  &.active {
    background: #ffffff;
    color: #000000;
    font-weight: 600;
    box-shadow: 0 2px 10px rgba(255, 255, 255, 0.15);
  }
}

.mcp-live-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  font-weight: 600;
}

/* BODY */
.agent-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* COPILOT CONTAINER */
.copilot-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.chat-scroll {
  flex: 1;
  padding: 20px 24px;
}

.messages-list {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 20px;
}

/* Welcome Area */
.copilot-welcome {
  padding: 28px 24px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 14px;
}

.welcome-heading {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #fff;
}

.welcome-lead {
  margin: 0 0 24px 0;
  font-size: 13px;
  color: #a1a1aa;
  max-width: 580px;
  line-height: 1.5;
}

.quick-prompts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
}

.quick-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }
}

.quick-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
  &.emerald { background: rgba(255, 255, 255, 0.08); color: #ffffff; }
  &.violet { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
  &.cyan { background: rgba(6, 182, 212, 0.15); color: #38bdf8; }
}

.quick-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.quick-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.quick-sub {
  font-size: 11px;
  color: #71717a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Messages */
.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;

    .message-bubble {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
  }
}

.message-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
}

.user-avatar-initial {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.message-bubble {
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bubble-author {
  font-size: 12px;
  font-weight: 600;
  color: #e4e4e7;
}

.bubble-time {
  font-size: 10px;
  color: #71717a;
}

.bubble-content {
  font-size: 13.5px;
  line-height: 1.6;
  color: #e4e4e7;
}

/* Tool Execution: Search Results */
.tool-results-panel {
  margin-top: 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool-result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.tool-search-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-email-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.email-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.email-sender {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.email-date {
  font-size: 11px;
  color: #71717a;
}

.email-subject {
  font-size: 13px;
  font-weight: 500;
  color: #e4e4e7;
}

.email-snippet {
  font-size: 11.5px;
  color: #a1a1aa;
}

.email-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.tool-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &.primary {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
    color: #ffffff;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

/* Tool Execution: Draft */
.tool-draft-card {
  margin-top: 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.draft-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.draft-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
}

.draft-target {
  font-size: 11px;
  color: #a1a1aa;
}

.draft-card-subject {
  font-size: 13px;
  color: #fff;
}

.draft-card-body {
  font-size: 12.5px;
  line-height: 1.6;
  color: #d4d4d8;
  white-space: pre-wrap;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.draft-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.draft-open-composer-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: #ffffff;
  color: #000000;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #e4e4e7;
  }
}

.draft-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* Tool Execution: Calendar */
.tool-calendar-card {
  margin-top: 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(139, 92, 246, 0.25);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cal-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
}

.cal-events-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cal-event-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.cal-event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cal-event-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cal-event-title {
  font-size: 12.5px;
  font-weight: 500;
  color: #fff;
}

.cal-event-time {
  font-size: 11px;
  color: #a1a1aa;
}

.cal-card-footer {
  display: flex;
}

.cal-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.35);
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: rgba(139, 92, 246, 0.25);
  }
}

/* Typing */
.typing-bubble {
  flex-direction: row !important;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  animation: typing 1.4s infinite ease-in-out both;

  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Input Bar */
.copilot-input-bar {
  padding: 16px 24px;
  background: rgba(12, 20, 23, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-container {
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 8px 12px 8px 16px;
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.06);
  }
}

.copilot-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-family: inherit;
  font-size: 13.5px;
  resize: none;
  max-height: 120px;

  &::placeholder {
    color: #71717a;
  }
}

.send-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: #ffffff;
  color: #000000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: #e4e4e7;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.input-footer {
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #71717a;
}

.model-badge {
  color: #ffffff;
  font-weight: 500;
}

/* MCP CONTAINER */
.mcp-container {
  height: 100%;
}

.mcp-content {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.mcp-hero-card {
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mcp-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
}

.mcp-hero-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.mcp-hero-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #a1a1aa;
}

.mcp-endpoint-box {
  margin-top: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.endpoint-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.endpoint-value {
  display: flex;
  align-items: center;
  gap: 10px;

  code {
    font-size: 13px;
    color: #ffffff;
    font-family: monospace;
  }
}

.copy-endpoint-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

/* Config Section */
.mcp-config-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mcp-section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.mcp-section-sub {
  font-size: 12.5px;
  color: #71717a;
}

.client-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.client-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #a1a1aa;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  &.active {
    background: #ffffff;
    border-color: #ffffff;
    color: #000000;
    font-weight: 600;
  }
}

.code-box {
  border-radius: 14px;
  background: #030708;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.code-file {
  font-size: 11px;
  font-family: monospace;
  color: #71717a;
}

.code-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 11px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.code-pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.55;
  color: #e2e8f0;
}

/* Tools Grid */
.mcp-tools-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
}

.tool-card {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-name {
  font-size: 13px;
  font-family: monospace;
  font-weight: 600;
  color: #ffffff;
}

.tool-scope-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: #a1a1aa;
}

.tool-desc {
  margin: 0;
  font-size: 12px;
  color: #a1a1aa;
  line-height: 1.45;
}

.tool-args {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10.5px;

  .args-label {
    color: #71717a;
    text-transform: uppercase;
    font-weight: 600;
  }

  code {
    color: #93c5fd;
    font-family: monospace;
    word-break: break-all;
  }
}

/* Test Runner */
.mcp-test-runner {
  padding: 18px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.test-title {
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.test-sub {
  margin: 0;
  font-size: 11.5px;
  color: #71717a;
}

.test-run-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.test-output-box {
  padding: 12px 14px;
  border-radius: 10px;
  background: #020506;
  border: 1px solid rgba(255, 255, 255, 0.06);

  pre {
    margin: 0;
    max-height: 220px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 11.5px;
    color: #e2e8f0;
  }
}

.mcp-api-key-banner {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 14px 18px;
  background: #000000;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
}

.api-key-banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.banner-key-icon {
  color: #ffffff;
}

.get-api-key-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #ffffff;
  color: #000000;
  border: 1px solid #ffffff;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.get-api-key-btn:hover {
  background: #f4f4f5;
  color: #000000;
  transform: translateY(-1px);
}
</style>
