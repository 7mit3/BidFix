/**
 * Karnak Material Cost Estimator — Home Page
 *
 * Design: Clean Construction Dashboard (Scandinavian Industrial)
 * - Warm neutrals grounded by Karnak red accent
 * - Card-based sections with generous padding
 * - Reactive real-time calculations
 * - Progressive disclosure: Input → Summary → Detail
 */

import { useCallback } from "react";
import { useLocation } from "wouter";
import { useEstimator } from "@/hooks/useEstimator";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { CostSummary } from "@/components/CostSummary";
import { OrderList } from "@/components/OrderList";
import { PricingEditor } from "@/components/PricingEditor";
import { LaborEquipmentSection } from "@/components/LaborEquipmentSection";
import { SystemInfo } from "@/components/SystemInfo";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { storeBreakdownData } from "@/lib/estimate-breakdown";
import { serializeKarnakBreakdown } from "@/lib/breakdown-serializers";

export default function Home() {
  const [, navigate] = useLocation();
  const estimator = useEstimator();

  const handleViewBreakdown = useCallback(() => {
    if (!estimator.estimate) return;
    const breakdownData = serializeKarnakBreakdown(
      estimator.estimate,
      estimator.laborEquipment,
    );
    storeBreakdownData(breakdownData);
    navigate("/breakdown");
  }, [estimator.estimate, estimator.laborEquipment, navigate]);

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
            {estimator.estimate && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleViewBreakdown}
                  className="bg-karnak-red hover:bg-karnak-red/90 text-white gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  View Full Breakdown
                </Button>
              </div>
            )}
          </div>
        </div>

        <SystemInfo />
      </main>

      <Footer />
    </div>
  );
}
