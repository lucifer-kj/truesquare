# BuildBill — Agent Rules & Engineering Standards

These rules are strictly enforced across all development phases, refactors, and future implementations.

---

## 1. Domain-Specific Naming & Intent-Driven Code (No Generic Identifiers)
- **NEVER** use vague or generic variable names or types:
  - ❌ `data`, `item`, `res`, `obj`, `params`, `info`, `val`, `temp`, `record`, `elem`, `list`
- **ALWAYS** use concrete, project-specific domain names that communicate clear business intent:
  - ✅ `invoiceDocument`, `supplyLineItem`, `contractorBusinessProfile`, `clientCustomerRecord`
  - ✅ `catalogSupplyProduct`, `calculatedDocumentTotals`, `budgetAllocationProposal`
  - ✅ `buildingTradeCategory`, `documentExportValidationResult`, `persistedStoragePayload`
- **Type Safety**: Strictly avoid `any` or loose `Record<string, unknown>`. Use schema-backed types or discriminant unions.

---

## 2. Guard Clauses & Flat Code Flow (Keep the Main Path Easy to Follow)
- Prefer early exits with guard clauses (`if (!condition) return;`) over deeply nested `if/else` ladders.
- Keep the happy path at the top level of indentation for effortless readability and minimal cognitive load.

---

## 3. Boundary Encapsulation for External Systems
- Keep external service dependencies, third-party libraries, browser APIs, and storage layers behind clean boundary adapters (`services/` and `domain/`).
- External API changes or storage schema evolutions must be absorbed inside the boundary layer so they never ripple across UI components or domain calculations.

---

## 4. Represent Valid States Only (Make Invalid States Unrepresentable)
- Use strict TypeScript discriminated unions, integer representations (e.g., integer cents for currency), and bounded domain types.
- A document cannot exist in an ambiguous financial state: money values must always be whole integers, preventing floating-point drift and invalid arithmetic states.

---

## 5. Separation of Decisions from Actions
- Strictly decouple pure business calculations (decisions: totals derivation, budget pruning, pricing math) from side-effects (actions: localStorage I/O, DOM printing, iframe postMessage).
- Business calculation functions must remain 100% pure and deterministic, allowing direct unit testing without mocks.

---

## 6. Actionable & Safe Error Handling
- Errors and validation results must produce structured, machine-readable validation keys alongside clear, human-readable contractor messages.
- Never leak sensitive credentials, internal file paths, or private business identifiers in error displays.

---

## 7. Atomic & Focused Evolution
- Every change, refactor, and task must focus on a single logical responsibility.
- Keep modifications small, verifiable, and bounded so they are easy to inspect, test, and safely roll back if required.

---

## 8. Zero Telemetry & Privacy Preservation
- BuildBill is an internal, client-side, local-first contractor application.
- **NEVER** introduce external telemetry, analytics, metrics beacons, Sentry, Google Analytics, Mixpanel, remote error reporting, or tracking scripts.
- **NEVER** initiate background network calls during normal document drafting or PDF generation. All catalogue searches, totals calculations, local persistence, and PDF rendering must happen 100% inside the browser.

---

## 9. Phase Verification Gate
- Run automated tests (`pnpm vitest run`) and production build checks (`pnpm build`) after every phase.
- Code must pass with zero TypeScript errors and zero warnings before declaring any phase complete.
