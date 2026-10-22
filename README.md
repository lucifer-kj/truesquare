# TrueSquare — Offline-First Construction Invoicing & Estimating Studio

> **Precision Invoicing, Construction Budgeting & Zero-Knowledge Encrypted Vault for Trade Contractors.**  
> Built with React 19, TypeScript, Tailwind CSS v4, WebCrypto AES-GCM-256, IndexedDB, Better Auth, and Neon Serverless PostgreSQL on Vercel.

---

## 🌟 Executive Overview

**TrueSquare** is an offline-first, client-side, zero-knowledge encrypted application engineered specifically for general contractors, carpenters, electricians, plumbers, framers, and masonry specialists. It allows trade operators to generate single-page estimates and tax invoices, run automated budget allocations against realistic construction catalogs, manage client directories, render print-ready vector PDFs directly in the browser, and synchronize records across devices with end-to-end encryption.

### Key Value Pillars
1. **Zero Telemetry & 100% Data Sovereignty**: All document drafting, customer databases, tax math, and PDF rendering occur 100% inside the contractor's local browser environment. No tracking scripts, analytics beacons, or remote error reporting.
2. **Zero-Knowledge Cloud Sync**: Optional multi-device backup transmits only opaque AES-GCM-256 encrypted blobs to Neon PostgreSQL via Vercel Serverless Functions. The server never sees client names, job addresses, or financial sums.
3. **Whole-Integer Financial Accuracy**: Eliminates floating-point drift by computing all monetary values (`unitPriceCents`, `subtotalCents`, `taxCents`, `totalCents`) in whole integer cents.
4. **Encrypted Local Vault**: Client contracts, contact records, and invoice histories are persisted in browser-native IndexedDB with WebCrypto PBKDF2 key derivation and AES-GCM-256 encryption.
5. **Instant Vault Portability**: Built-in `.bbvault` snapshot export and import ensures contractors can backup, restore, or migrate their business records between devices without third-party vendor lock-in.
6. **Adaptive Dual-Form Layout**: Seamlessly shifts between a high-efficiency **Desktop Studio** (segmented inspector + live canvas) and an ergonomic **Mobile Field Tool** (thumb-friendly 3-step wizard with zero scroll-trap canvas preview).
7. **Clean Slate Demo Engine**: Includes realistic trade sample documents with a 1-tap "Clear Sample Data & Start Fresh" action that permanently halts sample re-seeding.

---

## 🏗️ Architecture & Directory Map

```
truesquare/
├── api/                                # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── auth.ts                     # Better Auth configuration backed by Neon pool
│   │   └── db.ts                       # Neon PostgreSQL pool & auto-migrating vault table
│   ├── auth/
│   │   └── [...all].ts                 # Better Auth session & authentication endpoints
│   ├── sync/
│   │   ├── push.ts                     # Authenticated E2EE encrypted blob upsert
│   │   └── pull.ts                     # Authenticated E2EE encrypted blob retrieval
│   └── health.ts                       # Neon database connectivity probe
│
├── docs/                               # Production Architecture & Monetization Blueprints
│   └── truesquare_saas_ecosystem_stack.md # SaaS ecosystem, Stripe, Resend & Cloud tiers
│
├── src/
│   ├── domain/                         # Pure deterministic business logic (Zero DOM / I/O)
│   │   ├── money.ts                    # Integer cents arithmetic and locale currency formatting
│   │   ├── calculations.ts             # Subtotals, taxable basis point computations, balances
│   │   ├── types.ts                    # Strict TypeScript domain schemas & discriminated unions
│   │   ├── schemas.ts                  # Zod validation schemas for all persisted structures
│   │   ├── budget-proposal.ts          # Deterministic budget proposal & item allocation engine
│   │   ├── document-factory.ts         # Document initialization, sequence generation, defaults
│   │   └── invoice-template-mapper.ts  # Pre-print template mapping and payload normalization
│   │
│   ├── services/                       # Boundary adapters encapsulating external systems
│   │   ├── indexeddb-repository.ts     # Local-first IndexedDB repository, query filters, & backup
│   │   ├── vault-crypto-service.ts     # WebCrypto PBKDF2 + AES-GCM-256 client-side encryption
│   │   ├── zero-knowledge-cloud-sync.ts# E2EE push/pull adapter for Vercel/Neon serverless sync
│   │   ├── better-auth-client.ts       # Client Better Auth SDK integration
│   │   ├── catalog-service.ts          # Offline trade supply database (4 major trade divisions)
│   │   ├── local-storage-service.ts    # Fallback operator profile & session recovery storage
│   │   ├── cloud-backup-service.ts     # Append-only disaster backup snapshot abstraction
│   │   └── location-autocomplete-service.ts # Offline address & region suggestions
│   │
│   ├── components/                     # Modern UI components
│   │   ├── layout/                     # AppShell, CommandBar, AppSplashScreen, ErrorBoundary
│   │   ├── dashboard/                  # HomeDashboard, KPI Cards, DocumentRegistry, ClientDirectory
│   │   ├── editor/                     # DocumentMetaForm, ContractorProfileForm, ClientCustomerForm, LineItemsEditor
│   │   ├── invoice/                    # DocumentCanvas, InvoicePreviewFrame
│   │   └── primitives/                 # SkeletonLoaders, Tooltip, StatusBadge, CommandPalette
│   │
│   ├── hooks/                          # Custom React 19 hooks
│   │   ├── useDocumentDraft.ts         # Reactive document drafting, auto-save, and totals memo
│   │   └── useIsMobile.ts              # Breakpoint detection for desktop studio vs mobile wizard
│   │
│   ├── design-system/                  # Design tokens, spring motion curves, accessible palette
│   ├── main.tsx                        # Root entry point wrapped in ErrorBoundary
│   └── App.tsx                         # Core state controller and view coordinator
│
├── tests/                              # Comprehensive Vitest automated test suite (59 tests)
│   ├── domain.test.ts                  # Financial calculations and currency precision tests (11)
│   ├── indexeddb-repository.test.ts    # Repository CRUD, query filters, and demo lifecycle (11)
│   ├── budget-proposal.test.ts         # Budget allocator distribution and PRNG tests (7)
│   ├── persistence.test.ts             # Schema migration, corruption recovery, and storage tests (7)
│   ├── vault-crypto.test.ts            # WebCrypto AES-GCM-256 key derivation & tamper-rejection (5)
│   ├── auth-and-cloud-backup.test.ts   # Operator session auth & disaster backup snapshot tests (5)
│   ├── design-system.test.ts           # Spacing grid, typography scale, and motion physics (5)
│   ├── command-palette.test.ts         # Command Palette keyboard navigation & action dispatch (4)
│   ├── template-mapper.test.ts         # Payload serialization and print mapping (2)
│   └── zero-knowledge-cloud-sync.test.ts # E2EE wire security and ciphertext integrity tests (2)
│
├── vercel.json                         # Vercel deployment configuration
└── .vercelignore                       # Build exclusion list
```

---

## 🔒 Security & Privacy Guarantees

- **Rule 1: Domain-Specific Naming**: Strict domain types prevent ambiguous states (`supplyLineItem`, `contractorBusinessProfile`, `vaultExportBackupPackage`).
- **Rule 4: Valid States Only**: Currency cannot exist in an ambiguous state; all rates and prices are validated through Zod schemas before storage or rendering.
- **Rule 6: Actionable & Safe Error Handling**: The root `ErrorBoundary` intercepts render glitches, protects user data, provides safe diagnostics without leaking system paths, and includes an **Emergency Vault Export** button to save records even during unexpected UI exceptions.
- **Rule 8: Zero Telemetry & E2EE**: Absolutely no data packets leave the contractor's device during invoice drafting, catalog search, or PDF export. Multi-device sync uses client-side AES-GCM-256 encryption.

---

## 📱 Mobile Field Experience

Field contractors working on job sites need fast, touch-friendly interfaces:
- **3-Step Mobile Wizard**:
  - **Step 1: Details**: Contractor profile, client selection, document numbers, and payment terms.
  - **Step 2: Supplies & Pricing**: Rapid catalog item addition, custom line-item insertion, tax toggles, and note inputs.
  - **Step 3: Review & Preview**: Live canvas preview scaled with dual-axis bounding ($\min(\frac{W-16}{816}, \frac{H-16}{1056})$), guaranteeing **zero horizontal or vertical scrollbar trapping**.
- **Ergonomic Virtual Keyboard & Touch Envelopes**: Optimized `inputMode="decimal"`, `numeric`, `tel`, with 44px touch envelopes and `autoCorrect="off"` attributes.
- **1-Tap Estimate Conversion**: Convert approved estimates into active invoices with a single tap.

---

## 🛠️ Development & Build Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) package manager (`pnpm` is strictly enforced)

### 1. Installation
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```
Access the application locally at `http://localhost:5173/`.

### 3. Run Automated Tests
```bash
pnpm vitest run
```
Executes all **59 automated unit tests** across financial mathematics, crypto encryption, and cloud sync.

### 4. Production Build
```bash
pnpm build
```
Generates an optimized, type-safe production bundle in `dist/`.

---

## 🚀 Deployment to Vercel

TrueSquare is configured for zero-friction deployment to Vercel with serverless functions:

1. **Push to GitHub** or run:
   ```bash
   pnpm dlx vercel --prod
   ```
2. **Configure Environment Variables** in your Vercel Dashboard:
   - `DATABASE_URL`: Your Neon Serverless PostgreSQL connection string (`postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require`)
   - `BETTER_AUTH_SECRET`: Random 32+ character string (e.g. `openssl rand -hex 32`)
   - `BETTER_AUTH_URL`: Your production URL (e.g. `https://truesquare.vercel.app`)

---

## 📄 License & Compliance

TrueSquare is proprietary software engineered for contractor private operations. All intellectual property, calculation engines, and styling tokens are governed by internal contractor guidelines.
