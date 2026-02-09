/**
 * SystemInfo — Reference information about the roofing system
 * Design: Subtle info section with system details
 */

import { Info } from "lucide-react";

export function SystemInfo() {
  return (
    <div className="mt-12 p-6 bg-muted/50 rounded-xl border border-border">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-heading font-semibold text-foreground text-base">
            System Reference: METAL-KYNAR 702-404-501-210915.1
          </p>
          <p>
            <strong>White Reflective Coating System</strong> for metal roofs with
            weathered Kynar® finish. This estimator uses coverage rates from the
            official Karnak application guidelines (Section 2.9).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pt-2">
            <div>
              <span className="font-semibold text-foreground">Substrate:</span>{" "}
              Metal – Kynar® Finish
            </div>
            <div>
              <span className="font-semibold text-foreground">Mastic:</span>{" "}
              505MS Karna-Flex WB
            </div>
            <div>
              <span className="font-semibold text-foreground">Base Coat:</span>{" "}
              404 Corrosion Proof
            </div>
            <div>
              <span className="font-semibold text-foreground">Finish Coat:</span>{" "}
              501 Elasto-Brite White
            </div>
          </div>
          <p className="text-xs pt-2 border-t border-border/60">
            Coverage rates are for estimating purposes only. Actual amounts may
            vary depending on roof surface irregularity, porosity, measurements,
            and applicator installation. Contact{" "}
            <a
              href="https://www.karnakcorp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan hover:underline font-medium"
            >
              karnakcorp.com
            </a>{" "}
            for detailed product specifications.
          </p>
        </div>
      </div>
    </div>
  );
}
