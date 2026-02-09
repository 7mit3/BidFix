/**
 * PricingEditor — Collapsible section for editing unit prices
 * Design: Compact accordion-style card with editable price fields
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KARNAK_PRODUCTS } from "@/lib/karnak-data";
import { Settings2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface PricingEditorProps {
  customPrices: Record<string, number>;
  updatePrice: (productId: string, price: number) => void;
  resetPrices: () => void;
}

export function PricingEditor({
  customPrices,
  updatePrice,
  resetPrices,
}: PricingEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Adjust Unit Prices
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetPrices();
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        {!isOpen && (
          <p className="text-xs text-muted-foreground mt-1">
            Click to customize material prices for your region
          </p>
        )}
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          {KARNAK_PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {product.shortName}
                </p>
                <p className="text-xs text-muted-foreground">
                  per {product.unitSize.toLowerCase()}
                </p>
              </div>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrices[product.id] ?? product.defaultPrice}
                  onChange={(e) =>
                    updatePrice(
                      product.id,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="pl-7 h-9 text-sm font-mono-nums bg-card text-right"
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Default prices are estimates. Adjust to match your supplier quotes for accurate cost projections.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
