<p align="center">
  <img src="doc/demo/logo.png" width="80px" alt="GrabMails Logo" />
  <h1 align="center">GrabMails</h1>
  <p align="center"><strong>Next-Generation Privacy-First Serverless Webmail Platform</strong></p>
  <p align="center">
    <a href="https://grabby.qzz.io" target="_blank">
      <img src="https://img.shields.io/badge/Live-grabby.qzz.io-2563eb?style=flat-square" alt="Live Demo" />
    </a>
    <a href="https://workers.cloudflare.com/" target="_blank">
      <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white&style=flat-square" alt="Cloudflare Workers" />
    </a>
    <a href="https://developers.cloudflare.com/d1/" target="_blank">
      <img src="https://img.shields.io/badge/Storage-Cloudflare_D1_%2B_KV-success?style=flat-square" alt="D1 and KV" />
    </a>
    <a href="LICENSE" target="_blank">
      <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
    </a>
  </p>
</p>

---

## 🌟 Overview

**GrabMails** is a high-performance, privacy-focused serverless webmail service engineered to run entirely on the **Cloudflare Serverless ecosystem** at zero server cost.

Inspired by Edward Snowden’s privacy vision (*"Arguing that you don't care about the right to privacy because you have nothing to hide is no different than saying you don't care about free speech because you have nothing to say"*), GrabMails provides user-empowered email accounts with multi-alias support, end-to-end encryption, tracking protection, client-side auto-lock, and private AI email assistance without phone numbers, personal IDs, or surveillance.

---

## ⚡ Tech Stack Architecture

GrabMails is built on a modern, decoupled edge architecture:

### 1. Edge Backend & Compute
- **Runtime**: [Cloudflare Workers](https://developers.cloudflare.com/workers/) — ultra-low latency V8 isolate execution at edge colos worldwide.
- **API Framework**: [Hono.js](https://hono.dev/) — ultra-fast, lightweight web standard router with middleware pipeline.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) — type-safe SQLite schema management.
- **Authentication**: JWT-based session tokens with role-based access control (RBAC).
- **Email Ingestion**: Cloudflare Email Routing with catch-all worker pipelines.
- **Email Delivery**: Cloudflare Email Service & [Resend API](https://resend.com/).

### 2. Databases & Storage (Zero-Cost Serverless)
- **Primary Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) — serverless SQLite distributed at edge with instant read replication.
- **Key-Value Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/) — high-frequency cache for system configurations, user preferences, security state, and wallpaper catalogs.
- **Object Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (optional/S3-compatible) for encrypted attachments and media storage.

### 3. Edge AI & Intelligence
- **LLM Engine**: [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) powered by `@cf/meta/llama-3.1-8b-instruct-fast`.
- **Capabilities**:
  - Automatic OTP / verification code extraction.
  - One-click smart email summarization.
  - Private AI reply & composition assistant.
  - Tone polish (formal, neutral, direct) with zero training retention.

### 4. Modern Curved Urban Frontend
- **Framework**: [Vue 3](https://vuejs.org/) (Composition API) with [Vite](https://vitejs.dev/).
- **UI Architecture**: *Curved Urban UI* design system featuring pitch-black canvas (`#000000`), Vanilla Cream (`#F0E7D5`), and Soft Lilac (`#D4BCC8`) accents.
- **Components**: [Element Plus](https://element-plus.org/) & [Iconify](https://iconify.design/).
- **Rich Text Editor**: [TinyMCE 7](https://www.tiny.cloud/) full WYSIWYG suite with customizable themes and oxide skins.
- **State & Routing**: Pinia + Vue Router with SPA asset fallback handling on Cloudflare Assets.

---

## 🔐 Key Features

- **🛡️ Privacy-First Foundation**:
  - No phone numbers, real-name requirements, or surveillance tracking.
  - Remote pixel & email beacon tracker blocking with isolated image proxies.
  - Automatic session timeout & screen auto-lock (1 to 60 minutes) protected with master password.
  - End-to-End Encryption (E2EE) support for inter-domain messaging.
- **💌 Multi-Alias & Routing**:
  - Create up to 10 distinct email aliases per account on your own custom domain (e.g. `@grabby.qzz.io`).
  - Seamless catch-all inbound routing.
- **✍️ Full Rich Text Composer**:
  - TinyMCE WYSIWYG editor with formatting, typography, links, and code blocks.
  - 3-second undo send capability.
  - Attachment handling and automated draft autosaving.
- **🤖 Built-in Edge AI**:
  - Instant verification code badge recognition directly in your inbox.
  - Email summarization, multilingual translation, and AI draft generation.
- **🌍 Internationalization (i18n)**:
  - Supports 8+ languages (English, 中文, Español, Français, Deutsch, etc.) with instant live locale switching.
- **🎨 Visual Customization**:
  - Dynamic wallpaper catalog with customizable opacity and contrast modes.
  - Seamless Light/Dark theme switching with continuous curvature aesthetic.

---

## 🚀 Quick Start & Deployment

### Prerequisites
- Node.js `>= 18.0.0`
- [Cloudflare Account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)

### 1. Clone the Repository
```bash
git clone https://github.com/GrabbyGrabby/GrabMails.git
cd GrabMails
```

### 2. Configure Cloudflare Resources
In `mail-worker/wrangler.toml`:
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

[assets]
binding = "assets"
directory = "./dist"
not_found_handling = "single-page-application"
run_worker_first = true

[vars]
domain = '["yourdomain.com"]'
jwt_secret = "your-custom-jwt-secret"
default_reg_key = "FREESnowden"
admin_email = "admin@yourdomain.com"
title = "GrabMails"
```

### 3. Initialize Database Schema
Deploy the Worker, then trigger the schema initialization:
```bash
curl https://yourdomain.com/api/init/<YOUR_JWT_SECRET>
```

### 4. Deploy
```bash
cd mail-worker
npx wrangler deploy
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
