/**
 * Karnak Material Cost Estimator — Home Page
 *
 * Design: Clean Construction Dashboard (Scandinavian Industrial)
 * - Warm neutrals grounded by Karnak red accent
 * - Card-based sections with generous padding
 * - Reactive real-time calculations
 * - Progressive disclosure: Input → Summary → Detail
 */

import { useEstimator } from "@/hooks/useEstimator";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { CostSummary } from "@/components/CostSummary";
import { OrderList } from "@/components/OrderList";
import { PricingEditor } from "@/components/PricingEditor";
import { LaborEquipmentSection } from "@/components/LaborEquipmentSection";
import { SystemInfo } from "@/components/SystemInfo";
import { Footer } from "@/components/Footer";

export default function Home() {
  const estimator = useEstimator();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroSection />

      <main className="flex-1 container py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs + Labor/Equipment + Pricing */}
          <div className="lg:col-span-5 space-y-6" data-print-hide>
            <InputSection
              squareFootage={estimator.squareFootage}
              setSquareFootage={estimator.setSquareFootage}
              verticalSeamsLF={estimator.verticalSeamsLF}
              setVerticalSeamsLF={estimator.setVerticalSeamsLF}
              horizontalSeamsLF={estimator.horizontalSeamsLF}
              setHorizontalSeamsLF={estimator.setHorizontalSeamsLF}
              onClear={estimator.clearAll}
              hasInputs={estimator.hasInputs}
            />
            <LaborEquipmentSection
              laborEquipment={estimator.laborEquipment}
              updateLaborItem={estimator.updateLaborItem}
              updateEquipmentItem={estimator.updateEquipmentItem}
              resetLaborEquipment={estimator.resetLaborEquipment}
            />
            <PricingEditor
              customPrices={estimator.customPrices}
              updatePrice={estimator.updatePrice}
              resetPrices={estimator.resetPrices}
            />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            <CostSummary
              estimate={estimator.estimate}
              laborEquipmentTotals={estimator.laborEquipmentTotals}
              projectTotal={estimator.projectTotal}
            />
            <OrderList
              estimate={estimator.estimate}
              laborEquipmentTotals={estimator.laborEquipmentTotals}
              projectTotal={estimator.projectTotal}
            />
          </div>
        </div>

        <SystemInfo />
      </main>

      <Footer />
    </div>
  );
}
