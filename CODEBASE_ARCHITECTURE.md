# TrueSquare — Agent Architecture & Codebase Map

> **Purpose**: Dense, comprehensive technical reference for AI agents and engineers to understand the system architecture, file responsibilities, data flow, domain invariants, and extension points with minimal token overhead.

---

## 1. System Overview & Core Invariants

TrueSquare is an offline-first, client-side, zero-knowledge encrypted invoicing, estimating, and budgeting application engineered for trade contractors (framers, carpenters, electricians, plumbers, masons, and general contractors). 

It operates 100% locally in the browser with IndexedDB and WebCrypto, while supporting opt-in, end-to-end encrypted multi-device cloud synchronization via Vercel Serverless Functions and Neon PostgreSQL.

### Enforced Invariants
1. **Integer Cents**: All monetary values (`unitPriceCents`, `subtotalCents`, `taxCents`, `totalCents`, `depositPaidCents`) are whole integers. Zero floating-point drift.
2. **Domain-Specific Naming**: Strict domain types only (`InvoiceEstimateDocument`, `SupplyLineItem`, `ContractorBusinessProfile`, `ClientCustomerRecord`, `VaultEncryptionPayload`). No generic `data`, `item`, `res`, `obj`, `params`, or loose `any`.
3. **Decoupled Calculations**: Pure business logic (`src/domain/`) contains zero React, browser, DOM, or I/O side effects.
4. **Boundary Isolation**: IndexedDB, WebCrypto, LocalStorage, Better Auth, and Neon access live exclusively inside `src/services/` and `api/`.
5. **Print Single-Page Fidelity**: The document layout enforces Letter portrait single-page constraints ($\le 6$ line items recommended) with bottom-pinned terms and signatures.
6. **Zero Telemetry & E2EE Sovereignty**: No analytics, trackers, or network calls during document creation and export. Cloud sync transmits strictly opaque AES-GCM-256 ciphertext blobs; no plaintext contractor financials or client PII ever reaches the cloud database.

---

## 2. Architecture Map & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                              USER INPUT                                │
│          (Form Controls, Catalog Search, Budget Generator, Sync)       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  REACTIVE STATE HOOK (src/hooks/)                      │
│                         useDocumentDraft                               │
│  - Debounced auto-save (600ms) to IndexedDB repository                 │
│  - Memoized totals calculation (calculateDocumentTotals)               │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌──────────────────────────────┐        ┌────────────────────────────────┐
│   DOMAIN ENGINE (domain/)    │        │  BOUNDARY ADAPTERS (services/) │
│  - money.ts (cents math)     │        │  - indexeddb-repository.ts     │
│  - calculations.ts           │        │  - vault-crypto-service.ts     │
│  - budget-proposal.ts (PRNG) │        │  - catalog-service.ts          │
│  - document-factory.ts       │        │  - location-autocomplete.ts    │
│  - schemas.ts (Zod)          │        │  - zero-knowledge-cloud-sync.ts│
└──────────────┬───────────────┘        │  - better-auth-client.ts       │
               │                        └───────────────┬────────────────┘
               ▼                                        │
┌──────────────────────────────┐                        ▼
│      TEMPLATE MAPPER         │        ┌────────────────────────────────┐
│ (domain/invoice-template)    │        │  SERVERLESS EDGE (api/ Vercel) │
│ mapDocumentToInvoiceTemplate │        │  - /api/auth/[...all] (Auth)   │
└──────────────┬───────────────┘        │  - /api/sync/push (E2EE Blob)  │
               │                        │  - /api/sync/pull (E2EE Blob)  │
               ▼                        │  - /api/health (Health check)  │
┌──────────────────────────────┐        └───────────────┬────────────────┘
│      PREVIEW & PDF IFRAME    │                        │
│ (components/invoice/)        │                        ▼
│ - ResizeObserver dual-axis   │        ┌────────────────────────────────┐
│ - postMessage SYNC_DATA      │        │    NEON SERVERLESS DATABASE    │
│ - 1-Click Vector Print       │        │  - encrypted_contractor_docs   │
└──────────────────────────────┘        │  - Better Auth tables          │
                                        └────────────────────────────────┘
```

---

## 3. Directory & File Inventory

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
│   ├── data/
│   │   ├── catalog.local.json          # 112 pre-fetched construction supplies with integer-cent pricing
│   │   ├── catalogue-meta.json         # Catalog origin, version, and freshness timestamps
│   │   └── job-presets.ts              # 7 trade job templates (Drywall, Framing, Roofing, etc.)
│   │
│   ├── design-system/
│   │   ├── motion-tokens.ts            # Physics spring tiers (micro, productive, expressive)
│   │   ├── theme-tokens.ts             # 1.2 minor third typography scale & 8px spatial grid
│   │   ├── use-reduced-motion.ts       # Accessibility motion gates (prefers-reduced-motion)
│   │   └── index.ts                    # Unified design system exports
│   │
│   ├── domain/
│   │   ├── types.ts                    # Master type definitions (Documents, Items, Totals, Profiles)
│   │   ├── money.ts                    # Integer-cent math utilities (formatCents, parseCurrencyToCents)
│   │   ├── calculations.ts             # Pure calculation formulas (line totals, taxable splits, grand totals)
│   │   ├── invoice-number.ts           # Sequential identifier generator (EST-YYYY-XXXX / INV-YYYY-XXXX)
│   │   ├── document-factory.ts         # Default builders for clean drafts, client records & profiles
│   │   ├── budget-proposal.ts          # Deterministic PRNG budget allocation algorithm
│   │   ├── schemas.ts                  # Zod validation schemas & export validation checks
│   │   └── invoice-template-mapper.ts  # Serializes domain documents into print template payload
│   │
│   ├── services/
│   │   ├── indexeddb-repository.ts     # Local-first IndexedDB repository, query filters, .bbvault & demo lifecycle
│   │   ├── vault-crypto-service.ts     # WebCrypto PBKDF2 + AES-GCM-256 client-side encryption
│   │   ├── zero-knowledge-cloud-sync.ts# E2EE push/pull adapter for Vercel/Neon serverless sync
│   │   ├── better-auth-client.ts       # Client Better Auth SDK integration
│   │   ├── catalog-service.ts          # Offline catalog search and trade filtering
│   │   ├── local-storage-service.ts    # Fallback operator profile & session recovery storage
│   │   ├── cloud-backup-service.ts     # Append-only disaster backup snapshot abstraction
│   │   └── location-autocomplete-service.ts # Offline US regional hubs & client auto-complete
│   │
│   ├── hooks/
│   │   ├── useDocumentDraft.ts         # Primary state coordinator, CRUD actions & autosave engine
│   │   └── useIsMobile.ts              # Breakpoint detection for desktop studio vs mobile wizard
│   │
│   ├── components/
│   │   ├── primitives/
│   │   │   ├── AccordionSection.tsx    # Collapsible section with spring physics & completion checks
│   │   │   ├── BottomSheet.tsx         # Slide-up mobile drawer with drag handle & backdrop blur
│   │   │   ├── CommandPalette.tsx      # Ctrl+K modal overlay (catalog search, actions, US locations)
│   │   │   ├── SkeletonLoaders.tsx     # Shimmer skeleton states for KPI cards, rows, and canvas
│   │   │   ├── StatusBadge.tsx         # Context-wrapped badge for lifecycle states (draft, sent, paid)
│   │   │   └── Tooltip.tsx             # Accessible floating tooltips with keyboard shortcuts
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Main shell, responsive router, and navigation coordinator
│   │   │   ├── AppSplashScreen.tsx     # Animated cold boot splash screen with brand framing square
│   │   │   ├── DesktopStudio.tsx       # 2-pane Studio Canvas with accordion editor & sticky preview
│   │   │   ├── MobileFieldTool.tsx     # Thumb-zone bottom-nav & swipe wizard for field contractors
│   │   │   ├── CommandBar.tsx          # Minimalist top bar with document pill & search trigger
│   │   │   ├── StatusBar.tsx           # Persistent desktop bottom bar with financial totals
│   │   │   └── ErrorBoundary.tsx       # HardHat crash barrier with Emergency Vault Export
│   │   │
│   │   ├── dashboard/
│   │   │   ├── HomeDashboard.tsx       # Studio overview, KPI cards & Demo Workspace Banner
│   │   │   ├── DocumentRegistry.tsx    # Searchable/filterable document registry table
│   │   │   ├── ClientDirectory.tsx     # Customer directory with lifetime billed amounts
│   │   │   └── KpiOverviewCards.tsx    # Outstanding receivables, invoiced totals, active estimates
│   │   │
│   │   ├── editor/
│   │   │   ├── DocumentMetaForm.tsx    # Document type toggle, dates, document number, payment terms
│   │   │   ├── ContractorProfileForm.tsx # Collapsible business address, phone, email, tax config
│   │   │   ├── ClientCustomerForm.tsx  # Client contact, jobsite company & smart US location autocomplete
│   │   │   ├── LineItemsEditor.tsx     # Supply table, catalog search drawer & budget engine modal
│   │   │   └── TermsAndNotesForm.tsx   # Sales tax basis points, legal notes & summary cards
│   │   │
│   │   └── invoice/
│   │       ├── DocumentCanvas.tsx      # Paper-on-desk canvas wrapper with elevation drop shadow
│   │       └── InvoicePreviewFrame.tsx # Sandboxed iframe preview, auto-fit scaler, PDF print trigger
│   │
│   ├── App.tsx                         # Core view switchboard (Studio, Editor, Client Directory)
│   ├── main.tsx                        # Root entry point wrapped in ErrorBoundary
│   └── index.css                       # Tailwind CSS v4, paper elevation shadows & shimmer keyframes
│
├── tests/                              # Comprehensive Vitest automated test suite (59 tests)
│   ├── domain.test.ts                  # Financial calculations and currency precision tests (11)
│   ├── indexeddb-repository.test.ts    # Repository CRUD, query filters, and demo lifecycle (11)
│   ├── budget-proposal.test.ts         # Budget allocator distribution and PRNG tests (7)
│   ├── persistence.test.ts             # Schema migration, corruption recovery, and storage tests (7)
│   ├── vault-crypto.test.ts            # WebCrypto AES-GCM-256 key derivation & tamper-rejection (5)
│   ├── auth-and-cloud-backup.test.ts   # Operator session auth & disaster backup snapshot tests (5)
│   ├── design-system.test.ts           # Spacing grid, typography scale, and motion physics (5)
│   ├── command-palette.test.ts         # Command action routing and fuzzy keyboard triggers (4)
│   ├── template-mapper.test.ts         # Payload serialization and print mapping (2)
│   └── zero-knowledge-cloud-sync.test.ts # E2EE wire security and ciphertext integrity tests (2)
│
├── vercel.json                         # Vercel deployment configuration with clean URLs & API rewrites
├── .vercelignore                       # Build exclusion list for tests, node_modules, and git files
└── vite.config.ts                      # Vite 8 + React 19 + Tailwind v4 bundler config
```

---

## 4. Module-by-Module Technical Specification

### 4.1. Serverless API Layer (`api/`)

#### `api/_lib/db.ts`
* Connection pool using `@neondatabase/serverless` connected via `DATABASE_URL`.
* `ensureEncryptedVaultTableExists()`: Auto-creates `encrypted_contractor_documents` table with `user_id` indexes. Strictly contains zero plaintext client fields.

#### `api/_lib/auth.ts`
* Configures `betterAuth` with Neon database pool, email/password support, and auto-derived session tokens.

#### `api/auth/[...all].ts`
* Vercel Serverless Function adapter using `toNodeHandler(auth)`.

#### `api/sync/push.ts`
* Authenticates contractor session via `auth.api.getSession`.
* Accepts encrypted payload envelope (`documentId`, `documentNumber`, `documentType`, `version`, `encryptedPayloadBase64`, `checksumSha256`).
* Upserts into Neon PostgreSQL table.

#### `api/sync/pull.ts`
* Authenticates contractor session.
* Returns all encrypted document records belonging to the authenticated user ID.

#### `api/health.ts`
* Health probe reporting database connectivity status, roundtrip latency, and zero-knowledge encryption invariants.

---

### 4.2. Services Layer (`src/services/`)

#### `zero-knowledge-cloud-sync.ts`
* `pushEncryptedDocumentToCloud(document, masterPasscode)`: Encrypts document locally via WebCrypto AES-GCM-256 $\rightarrow$ generates SHA-256 checksum $\rightarrow$ dispatches to `/api/sync/push`.
* `pullAndDecryptDocumentsFromCloud(masterPasscode)`: Retrieves encrypted records from `/api/sync/pull` $\rightarrow$ decrypts locally in browser $\rightarrow$ writes to IndexedDB.
* `syncAllLocalDocumentsToCloud(masterPasscode)`: Bulk syncs all local documents.

#### `indexeddb-repository.ts`
* Dual-store IndexedDB database (`invoice_estimate_documents` and `contractor_clients`).
* **Demo Lifecycle Engine**:
  - `SAMPLE_DATA_LIFECYCLE_STORAGE_KEY`: Tracks contractor demo state (`"active" | "purged"`).
  - `purgeDemoDocumentsFromRepository()`: Permanently removes demo records and stops auto-reseeding.
  - `forceSeedSampleContractorDocuments()`: Seeds 3 realistic trade sample documents on demand.
* **1-Tap Conversion**: `convertEstimateToInvoiceInRepository(estimateId)` instantly clones an approved estimate into an active invoice.
* `.bbvault` Import/Export: Standalone whole-vault backup packages with Zod schema verification.

#### `vault-crypto-service.ts`
* 100,000 PBKDF2 iterations with SHA-256 for key derivation.
* 96-bit random initialization vector (IV) and 128-bit salt per encryption envelope.
* Hardware-accelerated WebCrypto AES-GCM-256 encryption and decryption.

---

### 4.3. State & Presentation Layer (`src/hooks/` & `src/components/`)

#### `useDocumentDraft.ts`
* Primary state container for `activeDocument` and `contractorProfile`.
* 600ms debounced autosave timer against IndexedDB.
* Actions: `updateDocumentType`, `updateContractorProfile`, `updateClientRecord`, `updateDates`, `addSupplyLineItem`, `updateSupplyLineItem`, `removeSupplyLineItem`, `updateTaxSettings`, `applyProposedLineItems`, `startNewBlankDocument`.

#### `AppSplashScreen.tsx`
* Cold boot animated splash screen featuring the TrueSquare framing square logo and responsive progress bar.

#### `SkeletonLoaders.tsx`
* Zero-layout-shift shimmer placeholders for KPI metric cards, document table rows, mobile cards, and preview canvas.

#### `Tooltip.tsx`
* Keyboard-accessible floating tooltip system displaying contextual help and hotkey hints (`Alt+P`, `Ctrl+K`, etc.).

---

## 5. Print & PDF Template Mechanics (`public/invoice-template-preview.html`)

The document template is completely decoupled from the React build pipeline to guarantee print reproducibility:

1. **Page Box**: `@page { size: Letter portrait; margin: 8mm 10mm; }`.
2. **Fixed Height Canvas**: `.page { width: 8.5in; height: 11in; display: flex; flex-direction: column; }`.
3. **Bottom-Pinned Elements**:
   - Items and totals sit in `.items-and-totals-block` (top/middle).
   - Terms, remittance, and signature sit in `.footer-pinned-block` with `margin-top: auto; flex-shrink: 0;`.
4. **Hydration Mechanism**:
   - Live update: Listens to `window.addEventListener('message')` for `SYNC_INVOICE_DATA`. Updates DOM in $<5\text{ms}$.
   - Print trigger: Listens for `TRIGGER_PRINT` and invokes `iframe.contentWindow.print()`.

---

## 6. Test Suite & Verification Reference

```bash
# Run entire automated test suite
pnpm vitest run

# Run production build check
pnpm build
```

| Test File | Target Module | Passing Tests |
| :--- | :--- | :---: |
| `tests/domain.test.ts` | Calculations, integer cents math, sequential numbers, Zod schemas | 11 |
| `tests/indexeddb-repository.test.ts` | Repository CRUD, query filters, demo data lifecycle, .bbvault export | 11 |
| `tests/budget-proposal.test.ts` | Budget allocator PRNG distribution, supply capping, target limit | 7 |
| `tests/persistence.test.ts` | Local storage schema recovery, corrupt data resilience | 7 |
| `tests/vault-crypto.test.ts` | WebCrypto AES-GCM-256 key derivation, tampering rejection | 5 |
| `tests/auth-and-cloud-backup.test.ts` | Operator authentication sessions & disaster backup snapshots | 5 |
| `tests/design-system.test.ts` | Theme tokens, typography scale, physics springs, reduced-motion | 5 |
| `tests/command-palette.test.ts` | Command Palette keyboard navigation, fuzzy filtering, action dispatch | 4 |
| `tests/template-mapper.test.ts` | Domain document to print template payload normalization | 2 |
| `tests/zero-knowledge-cloud-sync.test.ts` | Zero-knowledge wire security & encrypted envelope pull/decrypt | 2 |
| **Total** | | **59 passing (100%)** |
