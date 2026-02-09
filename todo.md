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

## Price Per Square Foot on Breakdown Page
- [x] Show $/sq.ft. next to Grand Total in the top sticky summary bar
- [x] Show $/sq.ft. below Grand Total in the bottom summary card
- [x] Calculate as Grand Total ÷ Total Roof Area (from user input)
- [x] Test in browser and verify — confirmed $7.54/sq.ft. for 80,000 sq.ft. TPO estimate

## RooFix AI Rebranding → BidFix AI
- [x] Extract exact color scheme from roofix.ai (dark navy #0a0f1e, cyan #00E5FF, orange #ff6b00)
- [x] Propose module name options — user chose BidFix AI
- [x] Generate BidFix AI logo matching RooFix X styling
- [x] Overhaul index.css with dark theme (navy base, cyan accent, OKLCH colors)
- [x] Update index.html with Inter font and BidFix AI title
- [x] Switch App.tsx to dark theme
- [x] Rewrite Catalog page with BidFix AI branding
- [x] Rewrite HeroSection with BidFix AI branding
- [x] Rewrite Footer with BidFix AI branding
- [x] Update all component colors (CostSummary, InputSection, OrderList, LaborEquipment, PricingEditor, RoofAdditions)
- [x] Fix remaining light backgrounds (PricingDatabase, NotFound, SavedEstimates, TPOEstimator)
- [x] Remove all karnak-red, warm-, stone- color references
- [x] All 97 tests passing, zero TypeScript errors
- [x] Verified in browser across Catalog, Estimators, Pricing Database

## Powered by RooFix AI Badge
- [x] Add "Powered by RooFix AI" badge to Footer component with link to roofix.ai

## BidFix AI Logo (from RooFix reference)
- [x] Generate BidFix AI logo: replace "Roo" with "Bid" in same blue/angular font, keep "Fix" and "AI" identical
- [x] Upload and integrate into the app (Catalog hero, Catalog footer, main Footer)

## Transparent Logo Background
- [x] Remove black background from BidFix AI logo, make transparent
- [x] Upload and update all references in the app (Footer, Catalog hero, Catalog footer)

## Fix Save Functionality (Bug)
- [x] Investigate what data is being lost — penetrations, sheet metal flashing, wall measurements not captured
- [x] Fix serialization to capture all data (penetrations, sheet metal flashing via RoofAdditions ref)
- [x] Fix deserialization to restore all data (initialState prop + forwardRef on RoofAdditions)
- [x] Wire save/load in all 3 estimators (Karnak, Carlisle TPO, GAF TPO)
- [x] Write roundtrip tests for save/load — 14 new tests, 111 total passing
- [x] Test in browser — app running, no errors

## Fix Save/Overwrite Bugs (Bug Report)
- [x] Bug 1: Project name pre-fills correctly (was already working — useEffect syncs existingName on open)
- [x] Bug 2: Root cause was missing assembly config in serialization (see below)
- [x] Investigated SaveEstimateDialog — props and loadedEstimate flow is correct
- [x] Investigated getEstimateData — closure captures latest state correctly
- [x] Tested fix in browser — full save/load cycle verified

## Fix Assembly Config Not Saved (Root Cause of Bug 2)
- [x] Add assembly config to TPOSaveState interface in estimate-state-serializers.ts
- [x] Update serializeTPOState to include assembly config
- [x] Update deserializeTPOState to return assembly config
- [x] Update GAF TPO getEstimateData to pass assembly config
- [x] Update GAF TPO load effect to restore assembly config
- [x] Update Carlisle TPO getEstimateData to pass assembly config
- [x] Update Carlisle TPO load effect to restore assembly config
- [x] Remove debug console.log statements from getEstimateData
- [x] Update vitest tests for assembly config roundtrip (4 new tests, 115 total passing)
- [x] Test in browser — full save/load cycle with assembly changes verified
