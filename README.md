<p align="center">
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="96" height="96" rx="28" fill="#000000" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
    <rect x="18" y="26" width="60" height="44" rx="12" fill="white" fill-opacity="0.08" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M20 32L44.8 50.6C46.72 52.04 49.28 52.04 51.2 50.6L76 32" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="48" cy="53" r="3.5" fill="#FFFFFF" />
  </svg>
  <h1 align="center">GrabMails</h1>
  <p align="center">
    <a href="https://grabby-mail.grabbymark.workers.dev" target="_blank">
      <img src="https://img.shields.io/badge/Live_Worker-grabby--mail-000000?style=flat-square&logo=cloudflare&logoColor=white" alt="Live Cloudflare Worker" />
    </a>
    <a href="https://workers.cloudflare.com/" target="_blank">
      <img src="https://img.shields.io/badge/Compute-Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white&style=flat-square" alt="Cloudflare Workers" />
    </a>
    <a href="https://developers.cloudflare.com/d1/" target="_blank">
      <img src="https://img.shields.io/badge/Database-Cloudflare_D1-000000?style=flat-square" alt="Cloudflare D1" />
    </a>
    <a href="https://modelcontextprotocol.io/" target="_blank">
      <img src="https://img.shields.io/badge/Protocol-MCP_2024--11--05-000000?style=flat-square" alt="Model Context Protocol" />
    </a>
    <a href="LICENSE" target="_blank">
      <img src="https://img.shields.io/badge/License-MIT-000000?style=flat-square" alt="License" />
    </a>
  </p>
</p>

---

## Tech Stack

### Edge Infrastructure & Storage
- **Cloudflare Workers**: V8 isolate serverless edge runtime with global zero-cold-start execution.
- **Cloudflare D1**: Distributed SQLite edge database with read replication.
- **Cloudflare KV**: Ultra-low-latency key-value store for session state, API key caches, and system configurations.
- **Cloudflare R2**: S3-compatible zero-egress blob storage for encrypted attachments and wallpaper assets.
- **Cloudflare Workers AI**: Edge inference engine running `@cf/meta/llama-3.1-8b-instruct-fast`.
- **Cloudflare Email Routing**: Inbound email pipeline with catch-all MIME parser.
- **Resend API & Amazon SES**: Outbound SMTP / REST delivery pipeline.
- **Cloudflare Turnstile**: Cryptographic CAPTCHA-free bot verification.

### Protocols & Backend Architecture
- **Hono.js**: Lightweight Web Standards framework powering the edge HTTP router.
- **Model Context Protocol (MCP)**: Streamable HTTP and JSON-RPC 2.0 (v2024-11-05) implementation.
- **Drizzle ORM**: Type-safe relational schema mapping for D1 SQLite.
- **JOSE / JWT**: Asymmetric and symmetric JSON Web Token validation.
- **bcryptjs**: Cryptographic API key hashing (SHA-256 and salted hash verification).

### Frontend Architecture
- **Vue 3**: Composition API (`<script setup>`) with single-file components.
- **Vite 7**: ESM bundler with code-splitting, tree-shaking, and PWA generation.
- **Pinia**: Reactive state management with persisted local storage integration.
- **Vue Router 4**: Dynamic RBAC route guards and asynchronous view chunking.
- **Element Plus**: Modern dark-mode UI component system.
- **Tailwind CSS & CSS Variables**: Theme tokens for Curved Urban UI palette.
- **TinyMCE 7**: Full-suite rich text WYSIWYG editor.
- **Iconify & Hugeicons**: Offline SVG icon collection.
- **Dayjs**: Immutable date/time and recurrence parser.
- **Dexie.js**: Client-side IndexedDB persistence layer.

---

## Features

### Apps
- **Email**: Custom domain mailboxes, personal or shared, with access you control. Send and receive with Cloudflare Email, Resend or Amazon SES.
- **Routing rules**: Store, forward, reject or sort incoming mail.
- **Calendar**: Repeating events with time zones. Attendees get email invitations.
- **Booking**: Share a public link so anyone can book a free time on your calendar.
- **Drive**: Store and share files.
- **AI agents**: Search mail, draft replies and manage events. Connect other AI tools over MCP.
- **Admin**: Users, API keys, webhooks, audit logs and backups.
- **Import**: Bring in mail from IMAP, Gmail Takeout, .eml and .mbox files.

---

## Model Context Protocol (MCP) Integration

GrabMails exposes a Model Context Protocol endpoint at `/mcp` supporting tools:
- `search_emails`: Search subject, sender, and email body across mailboxes.
- `get_thread`: Retrieve full conversational message threads.
- `draft_reply`: Generate and save structured response drafts.
- `list_events`: Query calendar events and upcoming schedules.
- `create_event`: Schedule calendar appointments with timestamps and locations.
- `list_mailboxes`: Enumerate accessible custom domain mailboxes and personal aliases.

### Configuration Snippets

#### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "grabmails": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://grabby-mail.grabbymark.workers.dev/mcp"
      ],
      "env": {
        "GRABMAILS_API_KEY": "gbk_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

#### Cursor IDE (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "grabmails": {
      "url": "https://grabby-mail.grabbymark.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer gbk_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

#### Claude Code CLI
```bash
claude mcp add grabmails -- https://grabby-mail.grabbymark.workers.dev/mcp
```

---

## Deployment

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Cloudflare Resources (`mail-worker/wrangler.toml`)
```toml
name = "grabby-mail"
main = "src/index.js"
compatibility_date = "2025-06-04"

[[d1_databases]]
binding = "db"
database_name = "grabby_mail_db"
database_id = "<YOUR_D1_DATABASE_ID>"

[[kv_namespaces]]
binding = "kv"
id = "<YOUR_KV_NAMESPACE_ID>"

[ai]
binding = "ai"
```

### 3. Build & Deploy
```bash
# Build Vue frontend
pnpm --prefix mail-vue run build

# Deploy Cloudflare Worker & Static Assets
cd mail-worker
pnpm exec wrangler deploy
```

---

## License
MIT &copy; GrabMails
