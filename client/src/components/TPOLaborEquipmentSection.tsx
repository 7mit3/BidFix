/**
 * TPOLaborEquipmentSection — Editable labor and equipment cost inputs for TPO estimators
 * Design: Card with toggleable line items, matching the TPO estimator style
 * Shared between Carlisle TPO and GAF TPO estimators
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HardHat,
  Wrench,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { TPOLaborEquipmentState } from "@/lib/tpo-labor-equipment-data";

interface TPOLaborEquipmentSectionProps {
  laborEquipment: TPOLaborEquipmentState;
  updateLaborItem: (
    id: string,
    field: "rate" | "quantity" | "enabled",
    value: number | boolean
  ) => void;
  updateEquipmentItem: (
    id: string,
    field: "rate" | "quantity" | "enabled",
    value: number | boolean
  ) => void;
  resetLaborEquipment: () => void;
  accentColor?: "blue" | "emerald";
}

export function TPOLaborEquipmentSection({
  laborEquipment,
  updateLaborItem,
  updateEquipmentItem,
  resetLaborEquipment,
  accentColor = "blue",
}: TPOLaborEquipmentSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const accentClasses = {
    blue: {
      icon: "text-cyan",
      subIcon: "text-cyan",
      enabledBorder: "border-border bg-card",
      disabledBorder: "border-border bg-muted/30/50",
    },
    emerald: {
      icon: "text-success",
      subIcon: "text-success",
      enabledBorder: "border-border bg-card",
      disabledBorder: "border-border bg-muted/30/50",
    },
  };

  const colors = accentClasses[accentColor];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader
        className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <HardHat className={`w-5 h-5 ${colors.icon}`} />
            Labor & Equipment
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetLaborEquipment();
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
          <p className="text-sm text-muted-foreground mt-1">
            Configure labor rates and equipment rental costs
          </p>
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-5">
          {/* Labor Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HardHat className={`w-4 h-4 ${colors.subIcon}`} />
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Labor
              </h4>
            </div>
            <div className="space-y-4">
              {laborEquipment.laborItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    item.enabled ? colors.enabledBorder : colors.disabledBorder
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          item.enabled
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) =>
                        updateLaborItem(item.id, "enabled", checked)
                      }
                    />
                  </div>

                  {item.enabled && (
                    <div className="flex items-center gap-3 mt-3">
                      {/* Rate */}
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground block mb-1">
                          {item.rateType === "per_sqft"
                            ? "Rate ($/sq. ft.)"
                            : item.rateType === "per_hour"
                              ? "Rate ($/hr)"
                              : item.rateType === "per_lf"
                                ? "Rate ($/LF)"
                                : "Amount ($)"}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step={item.rateType === "per_sqft" || item.rateType === "per_lf" ? "0.01" : "1"}
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              updateLaborItem(
                                item.id,
                                "rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="pl-6 h-8 text-sm tabular-nums text-right"
                          />
                        </div>
                      </div>

                      {/* Quantity (only for per_hour) */}
                      {item.rateType === "per_hour" && (
                        <div className="w-24">
                          <label className="text-xs text-muted-foreground block mb-1">
                            Hours
                          </label>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLaborItem(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm tabular-nums text-right"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Equipment Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className={`w-4 h-4 ${colors.subIcon}`} />
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Equipment
              </h4>
            </div>
            <div className="space-y-4">
              {laborEquipment.equipmentItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    item.enabled ? colors.enabledBorder : colors.disabledBorder
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          item.enabled
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) =>
                        updateEquipmentItem(item.id, "enabled", checked)
                      }
                    />
                  </div>

                  {item.enabled && (
                    <div className="flex items-center gap-3 mt-3">
                      {/* Rate */}
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground block mb-1">
                          {item.rateType === "per_day"
                            ? "Rate ($/day)"
                            : "Amount ($)"}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              updateEquipmentItem(
                                item.id,
                                "rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="pl-6 h-8 text-sm tabular-nums text-right"
                          />
                        </div>
                      </div>

                      {/* Quantity (only for per_day) */}
                      {item.rateType === "per_day" && (
                        <div className="w-24">
                          <label className="text-xs text-muted-foreground block mb-1">
                            Days
                          </label>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updateEquipmentItem(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm tabular-nums text-right"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Toggle items on/off and adjust rates to match your project. Per sq.
            ft. and per LF rates auto-calculate based on your measurements.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
