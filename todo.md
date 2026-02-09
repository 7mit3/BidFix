# Project TODO

## Reminders
- DB pricing sync: useState initializer only runs once, so we use useEffect to sync DB prices when they arrive
- The system prefix for pricing DB is: karnak, carlisle-tpo, gaf-tpo (stripped when passed to estimators)
- userEditedPrices ref tracks which prices the user has manually changed so DB sync doesn't overwrite them

## Completed
- [x] Pricing database schema (products table with manufacturer, category, unit price, last updated)
- [x] Backend API for pricing CRUD operations
- [x] Pricing management page UI with search, filter, edit capabilities
- [x] Integrate pricing database with Karnak, Carlisle TPO, and GAF TPO estimators
- [x] Price history tracking
- [x] Fix pricing sync across all three estimators (useEffect pattern for async DB data)

## In Progress
- [x] Quote request feature: Generate a quote request document (CSV/PDF) with all materials for a distributor
- [x] Import distributor pricing: Upload CSV with updated prices to bulk-update the pricing database
- [x] Enhance Pricing Database page with quote request and import workflows (Products tab + Quote Requests tab)
- [x] Write vitest tests for pricing integration (16 tests passing)

## Labor & Equipment Sections
- [x] Review Karnak labor/equipment implementation (useEstimator hook, LaborEquipmentSection component)
- [x] Add labor & equipment data model and defaults for TPO estimators (shared tpo-labor-equipment-data.ts)
- [x] Add labor & equipment UI section to Carlisle TPO estimator page
- [x] Add labor & equipment totals to Carlisle TPO cost summary and order list
- [x] Add labor & equipment UI section to GAF TPO estimator page
- [x] Add labor & equipment totals to GAF TPO cost summary and order list
- [x] TypeScript compilation verified — no errors
- [x] Write vitest tests for TPO labor/equipment (13 tests passing, 29 total)

## Bug Fixes
- [x] Fix nested button error on /estimator/carlisle-tpo — button cannot contain a nested button (was in RoofAdditions.tsx: reset button nested inside header button)
