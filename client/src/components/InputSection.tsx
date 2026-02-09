/**
 * InputSection — Measurement input form
 * Design: Card with warm background, clear labels, large input fields
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Ruler, ArrowDownUp, ArrowLeftRight, RotateCcw } from "lucide-react";

interface InputSectionProps {
  squareFootage: string;
  setSquareFootage: (v: string) => void;
  verticalSeamsLF: string;
  setVerticalSeamsLF: (v: string) => void;
  horizontalSeamsLF: string;
  setHorizontalSeamsLF: (v: string) => void;
  onClear: () => void;
  hasInputs: boolean;
}

export function InputSection({
  squareFootage,
  setSquareFootage,
  verticalSeamsLF,
  setVerticalSeamsLF,
  horizontalSeamsLF,
  setHorizontalSeamsLF,
  onClear,
  hasInputs,
}: InputSectionProps) {
  const handleNumericInput = (
    value: string,
    setter: (v: string) => void
  ) => {
    // Allow empty, digits, and one decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  return (
    <Card className="border-2 border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Ruler className="w-5 h-5 text-cyan" />
            Roof Measurements
          </CardTitle>
          {hasInputs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your roof dimensions to calculate material quantities.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Square Footage */}
        <div className="space-y-2">
          <Label
            htmlFor="sqft"
            className="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded bg-cyan/10 flex items-center justify-center">
              <Ruler className="w-3.5 h-3.5 text-cyan" />
            </div>
            Total Roof Area
          </Label>
          <div className="relative">
            <Input
              id="sqft"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 10,000"
              value={squareFootage}
              onChange={(e) =>
                handleNumericInput(e.target.value, setSquareFootage)
              }
              className="pr-14 h-12 text-lg font-mono-nums bg-card border-2 focus:border-cyan focus:ring-cyan/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              sq. ft.
            </span>
          </div>
        </div>

        {/* Vertical Seams */}
        <div className="space-y-2">
          <Label
            htmlFor="vseams"
            className="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded bg-cyan/10 flex items-center justify-center">
              <ArrowDownUp className="w-3.5 h-3.5 text-cyan" />
            </div>
            Vertical Seams
          </Label>
          <div className="relative">
            <Input
              id="vseams"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 500"
              value={verticalSeamsLF}
              onChange={(e) =>
                handleNumericInput(e.target.value, setVerticalSeamsLF)
              }
              className="pr-14 h-12 text-lg font-mono-nums bg-card border-2 focus:border-cyan focus:ring-cyan/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              lin. ft.
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-8">
            Standing seam joints running vertically down the roof panels
          </p>
        </div>

        {/* Horizontal Seams */}
        <div className="space-y-2">
          <Label
            htmlFor="hseams"
            className="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded bg-cyan/10 flex items-center justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan" />
            </div>
            Horizontal Seams
          </Label>
          <div className="relative">
            <Input
              id="hseams"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 200"
              value={horizontalSeamsLF}
              onChange={(e) =>
                handleNumericInput(e.target.value, setHorizontalSeamsLF)
              }
              className="pr-14 h-12 text-lg font-mono-nums bg-card border-2 focus:border-cyan focus:ring-cyan/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              lin. ft.
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-8">
            Lap seams, penetrations, and cracks running horizontally
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
