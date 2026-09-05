# 🇩🇿 DzDigital CRM

> **Ultra-fast, mobile-first CRM for Algerian digital product merchants and agency partners (Adem & Abdou).**  
> Tracks real net profit with parallel market "Square" exchange rates, attributes Meta ad spend per transaction, automates license delivery via WhatsApp, and synchronizes across devices with **Google Firebase Firestore (100% Free Tier)**.

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/dzdigital-crm.git
cd dzdigital-crm
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or desktop browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🚀 Key Features

* **📱 Mobile-First Workflow**: Engineered for single-thumb smartphone operation. Log a sale in under **10 seconds** via the glowing floating action button `(+)` while texting customers on WhatsApp or Instagram Direct.
* **💵 Real Net Profit Accounting**: Automatically calculates exact net profit per transaction:
  $$\text{Net Profit (DA)} = \text{Selling Price (DA)} - [\text{Product Cost (\$)} \times \text{Square Rate}] - [\text{Meta Ad Spend (\$)} \times \text{Square Rate}]$$
* **📈 Parallel "Square" Market Rate**: Built-in editable DZD/USD parallel exchange rate (default: `1 USD = 242 DZD`) with historical preservation per sale.
* **👥 Partner Attribution (Adem & Abdou)**: Persistent top header toggle for active partner selection, per-sale attribution, and real-time split of accumulated profits.
* **🔑 Digital License Key Vault**: Pre-load keys and login credentials for Canva Pro, Windows 11 OEM, IPTV, ChatGPT Plus, and CapCut. The CRM automatically attaches a free key upon sale!
* **💬 1-Click WhatsApp Delivery**: Auto-normalizes Algerian phone numbers (`05/06/07...` $\rightarrow$ `+213...`) and opens WhatsApp with a pre-filled greeting message containing order details and license keys.
* **☁️ 100% Free Cloud Sync (Google Firebase Firestore)**: Instant real-time multi-device sync via Firestore WebSockets (`onSnapshot`). Zero server management, zero monthly subscription costs.
* **💾 Offline-First Resilience**: Seamless local storage cache ensures the app works flawlessly even with poor mobile internet connectivity.
* **📦 Data Ownership**: 1-Click JSON export and restore for full data backups at any time.

---

## 📖 Comprehensive Documentation & Engineering History

For in-depth operational guides, equations, deployment workflows, and technical logs, refer to:

* 📘 [**Full Documentation & Operational Manual (`DOCUMENTATION.md`)**](DOCUMENTATION.md)
  * System Architecture & Directory Structure
  * Financial Formulas & Currency Engine
  * Step-by-Step Google Firebase Firestore Setup
  * PWA / "Add to Home Screen" Setup on iPhone & Android
  * Vercel Free Cloud Deployment
* 🛠️ [**Project Work Log & Changelog (`WORK_LOG.md`)**](WORK_LOG.md)
  * Chronological record of development phases & design pivots
  * Technical decision rationale (Firebase migration, mobile UX patterns)
  * Build verification & route test logs
  * Future roadmap

---

## 💻 Tech Stack

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript
* **Styling**: Tailwind CSS, Custom Glassmorphism, CSS Micro-animations
* **Icons**: Lucide React
* **Database**: Google Cloud Firebase Firestore (Free Spark Plan)
* **Offline Storage**: Browser `window.localStorage`
* **Target Platforms**: iOS Safari (PWA), Android Chrome (PWA), Modern Desktop Browsers

---

## 👥 Authors & License

Developed with ❤️ for **Adem & Abdou**.  
MIT License — Free to use, adapt, and deploy.
