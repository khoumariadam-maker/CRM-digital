# DzDigital CRM — Full Documentation & Operational Manual

**DzDigital CRM** is a mobile-first, zero-cost sales management system engineered specifically for Algerian digital product merchants and digital agency partners (**Adem & Abdou**).

It eliminates spreadsheet friction, tracks parallel market "Square" exchange rates (DZD/USD), attributes Meta ad spend per transaction, automates license key delivery via WhatsApp, and provides real-time multi-device cloud synchronization powered by Google Firebase Firestore.

---

## Table of Contents

1. [System Architecture & Stack](#1-system-architecture--stack)
2. [Financial Engine & Algerian Market Math](#2-financial-engine--algerian-market-math)
3. [Partner Attribution System (Adem & Abdou)](#3-partner-attribution-system-adem--abdou)
4. [Mobile Workflow & Fast Sale Logging](#4-mobile-workflow--fast-sale-logging)
5. [Digital Product & License Key Vault](#5-digital-product--license-key-vault)
6. [Cloud Backend (Google Firebase Firestore)](#6-cloud-backend-google-firebase-firestore)
7. [Offline-First & Local Storage Engine](#7-offline-first--local-storage-engine)
8. [Data Backup, Export & Restore](#8-data-backup-export--restore)
9. [Mobile App Experience (PWA / Add to Home Screen)](#9-mobile-app-experience-pwa--add-to-home-screen)
10. [Production Deployment Guide](#10-production-deployment-guide)

---

## 1. System Architecture & Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server-side rendering, fast routing, modern React 19 support |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type safety for financial calculations & data contracts |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism | Ultra-modern dark aesthetic, high contrast emerald green metrics |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, lightweight SVG icons |
| **Cloud Database** | [Google Firebase Firestore](https://firebase.google.com/) | 100% free Spark tier, instant real-time websocket sync (`onSnapshot`) |
| **Offline Cache** | `window.localStorage` | Zero latency, operates seamlessly even without cellular data |
| **Hosting** | Vercel or Firebase Hosting | Free hosting with automated global edge deployment |

### Directory Structure

```
d:/projex/crm/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Global fonts, metadata & AppShell wrapper
│   │   ├── page.tsx           # Mobile-first Dashboard & metrics
│   │   ├── orders/page.tsx    # Order stream, filter by partner, 1-click WhatsApp
│   │   ├── products/page.tsx  # Product catalog, stock alerts & key vault
│   │   └── settings/page.tsx  # Firebase credentials, exchange rate & backup JSON
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx   # Client wrapper managing global modals & tabs
│   │   │   ├── MobileNav.tsx  # Mobile bottom bar with floating (+) quick action
│   │   │   ├── TopHeader.tsx  # Sticky header with Adem/Abdou toggle & rate editor
│   │   │   └── Sidebar.tsx    # Desktop sidebar navigation
│   │   └── modals/
│   │       ├── FastSaleModal.tsx      # Streamlined <10s sale logging modal
│   │       └── CreateProductModal.tsx # Dynamic product & license vault creator
│   ├── context/
│   │   ├── CRMDataContext.tsx # State provider for sales, products, Firestore listener
│   │   └── CurrencyContext.tsx# State provider for DZD/USD toggle & Square rate
│   ├── lib/
│   │   ├── calculations.ts    # Financial arithmetic, phone normalization & WhatsApp links
│   │   ├── firebase.ts        # Firestore client initialization & credentials helper
│   │   └── mockData.ts        # Algerian market seed data (Canva, IPTV, ChatGPT, Windows)
│   └── types/
│       └── crm.ts             # Core TypeScript interfaces & schemas
├── DOCUMENTATION.md           # This comprehensive guide
├── WORK_LOG.md                # Engineering history & chronological milestones
└── README.md                  # Project overview & quick start
```

---

## 2. Financial Engine & Algerian Market Math

The Algerian digital goods market operates under a dual-currency reality:
- **Sourcing & Advertising Costs**: Paid in foreign currency (**USD** or **EUR**) via international cards (Paysera, Wise, RedotPay, Pyypl).
- **Customer Revenue**: Collected in Algerian Dinars (**DZD / DA**) via local peer-to-peer payment methods (**BaridiMob**, **CCP**, or cash).

### The Parallel Market "Square" Exchange Rate
Official bank rates do not reflect market reality. The app features a live, user-editable parallel market rate (default: `1 USD = 242 DZD`).

You can edit this rate at any time directly from the top header or in **Settings**. When the rate is changed:
- Existing recorded sales preserve the exact historical exchange rate (`exchangeRateUsed`) they were completed under.
- New sales and active cost calculations immediately adopt the updated rate.

### Per-Sale Real Net Profit Formula

For every single sale logged, the system computes the exact net profit in real time:

$$\text{Product Cost (DA)} = \text{Product Cost (USD)} \times \text{Square Rate}$$

$$\text{Meta Ad Spend (DA)} = \text{Meta Ad Spend (USD)} \times \text{Square Rate}$$

$$\text{Net Profit (DA)} = \text{Selling Price (DA)} - \text{Product Cost (DA)} - \text{Meta Ad Spend (DA)}$$

$$\text{Profit Margin (\%)} = \left( \frac{\text{Net Profit (DA)}}{\text{Selling Price (DA)}} \right) \times 100$$

#### Example Calculation:
- **Product**: Canva Pro 1 Year Subscription
- **Selling Price**: `2,800 DA` (paid via BaridiMob)
- **Product Cost**: `$3.00`
- **Meta Ad Cost**: `$1.50` (estimated ad spend to acquire this customer)
- **Exchange Rate**: `242 DA / $`
- $\text{Total Cost (DA)} = (3.00 + 1.50) \times 242 = 4.50 \times 242 = 1,089\text{ DA}$
- $\mathbf{Net\ Profit} = 2,800 - 1,089 = \mathbf{1,711\text{ DA}}$ (Margin: **61%**)

---

## 3. Partner Attribution System (Adem & Abdou)

The CRM is purpose-built for two partners: **Adem** and **Abdou**.

### Partner Switcher in Header
At the top of every screen, an interactive pill toggle allows switching between:
- **Adem** (Emerald theme indicator)
- **Abdou** (Cyan/Sky theme indicator)

When an active partner is selected:
1. Any new sale logged via the floating `+` button is automatically attributed to that partner (`soldBy`).
2. The switcher can still be manually overridden per-sale inside the modal if needed.

### Dashboard Performance Split
The dashboard displays both aggregated business totals and individual partner metrics:
- **Real Net Profit Hero Card**: Displays combined net profit, margin %, and total volume.
- **Partner Split Breakdown**:
  - **Adem**: Total sales count & total accumulated net profit (DA).
  - **Abdou**: Total sales count & total accumulated net profit (DA).
- **Orders Filter**: The Orders page allows filtering transactions by `All`, `Adem`, or `Abdou` to verify who closed each deal and audit revenue.

---

## 4. Mobile Workflow & Fast Sale Logging

DzDigital CRM was designed for single-thumb mobile usage, allowing sellers to log a completed deal in under **10 seconds** while texting a buyer on Instagram Direct or WhatsApp.

### Floating Action Button (FAB)
A persistent glowing floating button `(+) Log Sale` is fixed at the bottom center of the mobile screen.

### Fast Sale Modal Fields

1. **Product Selection**: One-tap select from catalog or quick-type a custom product name. Selecting an existing product auto-fills its default selling price and sourcing cost.
2. **Selling Price (DA)**: The amount paid by the customer (e.g. `2,800 DA`).
3. **Product Cost ($ USD)**: Sourcing cost in dollars (e.g. `$3.00`).
4. **Meta Ad Spend ($ USD)**: Direct ad spend attributed to this lead (e.g. `$1.20`, or `$0` for organic/referral sales).
5. **Payment Method**: One-tap pills for `BaridiMob`, `CCP`, `Paysera`, `Wise`, or `Cash`.
6. **Live Profit Badge**: As values are entered, an interactive badge displays the projected net profit in DA and margin % before submitting.

### Optional Details (Accordions)
To keep the primary flow lightning-fast, non-critical details are tucked into clean expandable accordions:
- **Customer Details**:
  - Customer Name
  - Customer Phone (accepts standard formats like `0555123456`, `06...`, `07...`)
- **Digital Key / Account Credentials**:
  - License key or login details to be delivered. If stock exists in the product vault, the modal automatically draws an available key!
- **Notes**: Extra reminders or warranty details.

### Algerian Phone Normalization & 1-Click WhatsApp
- When a phone number is entered (e.g., `0550 12 34 56`), the CRM automatically normalizes it to international standard `+213550123456`.
- From the **Orders** screen, clicking the green **WhatsApp** icon automatically launches WhatsApp with a pre-composed greeting message containing their order reference and license key.

---

## 5. Digital Product & License Key Vault

Navigate to the **Products** page (`/products`) to manage recurring offerings:

### Available Default Products:
- **Canva Pro (1 Year)** — Design suite invite/account
- **Windows 11 Pro OEM** — 25-character digital activation key
- **IPTV Premium (12 Months)** — M3U playlist & Xtream codes
- **ChatGPT Plus (Shared/Private)** — OpenAI subscription
- **CapCut Pro (1 Year)** — Video editing subscription

### Creating a New Product:
1. Click **+ Add Product**.
2. Enter **Product Name** & **Category** (e.g., *SaaS, Streaming, Gaming, Utility*).
3. Set **Default Purchase Cost ($ USD)**.
4. Set **Default Customer Price (DA)**.
5. Watch the **Projected Net Margin Preview** calculate profit automatically.
6. Paste initial license keys or account credentials (one per line).
7. Click **Save Product**.

### Vault Inventory Depletion:
- Every product displays a stock badge (e.g., `5 keys in vault` or `Out of stock`).
- When a sale is completed using a vaulted product, one key is automatically pulled and attached to the customer's sale record.
- You can deposit additional keys at any time via the **+ Add Keys** button.

---

## 6. Cloud Backend (Google Firebase Firestore)

The CRM uses **Google Cloud Firebase (Firestore)** as its primary real-time database, utilizing Firebase's generous **100% Free Spark Plan** (50,000 document reads, 20,000 writes per day — far exceeding normal CRM requirements).

### Why Firebase?
- **Real-Time WebSockets (`onSnapshot`)**: When Adem logs a sale on his phone, Abdou's screen updates instantly without refreshing.
- **Zero Server Management**: No backend server to deploy, maintain, or pay for.
- **No Credit Card Required**: The Firebase Spark plan is permanently free.

### Step-by-Step Firebase Setup:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **Create a project**, name it (e.g. `dz-digital-crm`), and click Continue (Google Analytics is optional).
3. In your project dashboard, navigate to **Build** $\rightarrow$ **Firestore Database**.
4. Click **Create database**, select a location close to Algeria (e.g. `europe-west1` in Belgium or `europe-west3` in Frankfurt), and choose **Start in test mode** (or production with read/write access for authenticated apps).
5. In your project overview, click the **Web icon (`</>`)** to register a web app.
6. Name the web app `DzDigital CRM` and click **Register app**.
7. Firebase will display your `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "dz-digital-crm.firebaseapp.com",
     projectId: "dz-digital-crm",
     storageBucket: "dz-digital-crm.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

### Connecting to DzDigital CRM:

#### Method A: Via In-App Settings (Easiest)
1. Open DzDigital CRM on your phone or browser.
2. Navigate to **Settings** (`/settings`).
3. Under **Google Firebase Configuration**, paste the corresponding values:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
4. Click **Save & Connect Firebase**. The status badge will immediately turn green: `Connected to Cloud`.

#### Method B: Via `.env.local` File (For Permanent Deployments)
In your project root, create or edit `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dz-digital-crm.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dz-digital-crm
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dz-digital-crm.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 7. Offline-First & Local Storage Engine

If Firebase credentials are not yet configured or if you are temporarily offline without cellular service, DzDigital CRM automatically operates on its high-speed **LocalStorage Engine**:
- All sales, products, and exchange rates persist locally on the device.
- Initial launch loads realistic mock data so you can test all features immediately.
- As soon as Firebase is connected, the app can sync your records to the cloud.

---

## 8. Data Backup, Export & Restore

To ensure total peace of mind and data ownership:

1. Go to **Settings** $\rightarrow$ **Data Management**.
2. Click **Export JSON Backup**: A timestamped file (e.g. `dzdigital-crm-backup-2026-09-05.json`) downloads instantly containing all sales, products, and rate configs.
3. Click **Restore Backup**: Allows importing any previously saved JSON file to restore the database in seconds.
4. **Reset to Mock Data**: Resets the local environment with sample Algerian sales for testing.

---

## 9. Mobile App Experience (PWA / Add to Home Screen)

You can run DzDigital CRM as a standalone native app on any iPhone or Android device:

### On iPhone (Safari):
1. Open the deployed URL in Safari.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. The CRM icon will appear on your iPhone home screen with fullscreen native behavior (no browser URL bar).

### On Android (Chrome):
1. Open the deployed URL in Google Chrome.
2. Tap the three-dot menu icon in the top right.
3. Tap **Install app** or **Add to Home screen**.
4. Confirm by tapping **Add**.

---

## 10. Production Deployment Guide

Deploy DzDigital CRM for free on **Vercel** in under 2 minutes:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "DzDigital CRM production ready"
   git push origin main
   ```
2. Visit [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository `crm`.
4. In the **Environment Variables** section, paste your Firebase keys (optional if you prefer entering them via the Settings UI):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. Click **Deploy**. Your CRM is now live with global HTTPS!

---

*Documentation maintained by Adem & Abdou. Built with Next.js 15, Tailwind CSS, and Google Firebase.*
