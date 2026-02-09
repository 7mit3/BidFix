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

## Estimate Breakdown Page
- [x] Review current estimator data structures (materials, labor, equipment, penetrations)
- [x] Create EstimateBreakdown page with consolidated view of all cost items
- [x] Implement toggle on/off for each line item (materials, labor, equipment, penetrations)
- [x] Implement editable quantities and prices for each line item
- [x] Show section subtotals and grand total that update reactively
- [x] Add "View Full Breakdown" button to each estimator (Karnak, Carlisle TPO, GAF TPO)
- [x] Pass estimator state to breakdown page via sessionStorage
- [x] Add Export CSV and Print capability from the breakdown page
- [x] Test the full workflow from Carlisle TPO estimator — verified in browser
- [x] Write vitest tests for breakdown utilities (28 tests, 57 total)

## Excel Export
- [x] Install xlsx (SheetJS) library for Excel export
- [x] Update EstimateBreakdown page Export CSV button to Export Excel (.xlsx)
- [x] Update both header and footer export buttons
- [x] Multi-sheet workbook: Summary, Materials, Penetrations, Labor, Equipment

## Tax & Profit on Breakdown Page
- [x] Add tax % and profit % state with toggles for each section (Materials, Penetrations, Labor, Equipment)
- [x] Show tax and profit line items in each section's footer with editable percentages (amber for tax, green for profit)
- [x] Include section-level tax and profit in section subtotals with "Section Total (incl. Tax & Profit)" row
- [x] Add tax and profit to the grand total summary card (shows Subtotal before Tax & Profit, Total Tax, Total Profit)
- [x] Include tax and profit in Excel export
- [x] All 57 tests passing

## Save/Load Estimates
- [x] Design database schema for saved estimates (name, system type, estimator state JSON, timestamps)
- [x] Create drizzle schema and run migrations (saved_estimates table)
- [x] Build backend tRPC procedures: save, list, load, delete, rename, update
- [x] Create SaveEstimateDialog component (name, notes, system info, Save/Update/Save As New)
- [x] Create SavedEstimates page listing all saved projects with search/filter/rename/delete
- [x] Add save/load to Karnak estimator with loaded estimate banner
- [x] Add save/load to Carlisle TPO estimator with loaded estimate banner
- [x] Add save/load to GAF TPO estimator with loaded estimate banner
- [x] Add /saved route in App.tsx and Saved Estimates link on Catalog page
- [x] Test save/load workflow end-to-end in browser — verified on Carlisle TPO
- [x] Write vitest tests for estimate serializers (12 tests, 69 total)

## Editable Quantities & Custom Items on Breakdown Page
- [x] Make all labor item quantities editable (currently some show "—" when disabled)
- [x] Make all item quantities editable across all sections (Materials, Penetrations, Labor, Equipment)
- [x] Add "Add Item" button to Materials section for custom line items
- [x] Add "Add Item" button to Penetrations section for custom line items
- [x] Add "Add Item" button to Labor section for custom line items
- [x] Add "Add Item" button to Equipment section for custom line items
- [x] Custom items should have editable name, quantity, price, and auto-calculated total
- [x] Test in browser — verified all quantities editable and Add Item works in all sections
- [x] Update vitest tests — 69 tests passing

## Sheet Metal Flashing (Penetrations & Additions)
- [x] Create sheet metal flashing data model (metal types, gauges/thicknesses, flashing items)
- [x] Metal type selection: Steel, Aluminum, Stainless Steel, Copper, Galvalume
- [x] Gauge/thickness selection per metal type (Steel: 28ga-16ga, Aluminum: .032"-.063", Stainless: 26ga-20ga, Copper: 16oz-24oz, Galvalume: 26ga-22ga)
- [x] Common flashing items: Drip Edge, Gravel Stop, Coping Cap, Counter Flashing, Edge Metal, Reglet, Through-Wall, Parapet Cap, Valley, Step, Custom
- [x] Add Sheet Metal Flashing UI section within RoofAdditions component
- [x] Integrate into all three estimators (Karnak, Carlisle TPO, GAF TPO)
- [x] Add flashing items to Estimate Breakdown page (via breakdown serializers)
- [x] Add flashing products to pricing database (all-products.ts)
- [x] Update estimate serialization/deserialization for save/load
- [x] Write vitest tests for sheet metal flashing — 27 tests passing (96 total)
- [x] Test in browser across all estimators — verified Karnak, Carlisle TPO, GAF TPO

## Prefinished Steel Metal Type
- [x] Add "Prefinished Steel" to METAL_TYPES in sheet-metal-flashing-data.ts
- [x] Update tests and verify — 97 tests passing
