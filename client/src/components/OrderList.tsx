/**
 * OrderList — Detailed material order list with labor/equipment summary
 * Design: Clean table with product details, quantities, costs,
 *         plus labor/equipment subtotals and grand total in footer
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ClipboardList, Printer, Download } from "lucide-react";
import {
  type EstimateResult,
  formatCurrency,
  formatNumber,
} from "@/lib/karnak-data";
import type { LaborEquipmentTotals } from "@/lib/labor-equipment-data";
import { motion } from "framer-motion";

interface OrderListProps {
  estimate: EstimateResult | null;
  laborEquipmentTotals: LaborEquipmentTotals | null;
  projectTotal: number;
}

export function OrderList({
  estimate,
  laborEquipmentTotals,
  projectTotal,
}: OrderListProps) {
  if (!estimate) return null;

  const activeItems = estimate.lineItems.filter(
    (item) => item.quantityToOrder > 0
  );

  const laborCost = laborEquipmentTotals?.laborTotal ?? 0;
  const equipmentCost = laborEquipmentTotals?.equipmentTotal ?? 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Product",
      "Application Step",
      "Unit Size",
      "Coverage Rate",
      "Qty Needed (exact)",
      "Qty to Order",
      "Unit Price",
      "Line Total",
    ];
    const rows = activeItems.map((item) => [
      item.product.name,
      item.product.step,
      item.product.unitSize,
      item.product.coverageUnit,
      formatNumber(item.quantityNeeded, 2),
      item.quantityToOrder.toString(),
      item.unitPrice.toFixed(2),
      item.totalCost.toFixed(2),
    ]);

    const laborRows = (laborEquipmentTotals?.laborBreakdown ?? []).map((l) => [
      l.label,
      "Labor",
      l.detail,
      "",
      "",
      "",
      "",
      l.cost.toFixed(2),
    ]);

    const equipRows = (laborEquipmentTotals?.equipmentBreakdown ?? []).map(
      (e) => [e.label, "Equipment", e.detail, "", "", "", "", e.cost.toFixed(2)]
    );

    const csvContent = [
      `Karnak Project Estimate`,
      `Square Footage: ${estimate.inputs.squareFootage} sq.ft.`,
      `Vertical Seams: ${estimate.inputs.verticalSeamsLF} lin.ft.`,
      `Horizontal Seams: ${estimate.inputs.horizontalSeamsLF} lin.ft.`,
      ``,
      `--- MATERIALS ---`,
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      `Material Subtotal,,,,,,,$${estimate.totalMaterialCost.toFixed(2)}`,
      ``,
      `--- LABOR ---`,
      ...laborRows.map((r) => r.join(",")),
      `Labor Subtotal,,,,,,,$${laborCost.toFixed(2)}`,
      ``,
      `--- EQUIPMENT ---`,
      ...equipRows.map((r) => r.join(",")),
      `Equipment Subtotal,,,,,,,$${equipmentCost.toFixed(2)}`,
      ``,
      `TOTAL PROJECT ESTIMATE,,,,,,,$${projectTotal.toFixed(2)}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `karnak-estimate-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-2 border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-karnak-red" />
              Material Order List
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Input summary bar */}
          <div className="flex flex-wrap gap-4 mt-3 p-3 bg-muted/60 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">Area: </span>
              <span className="font-semibold font-mono-nums">
                {estimate.inputs.squareFootage.toLocaleString()} sq. ft.
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Vert. Seams: </span>
              <span className="font-semibold font-mono-nums">
                {estimate.inputs.verticalSeamsLF.toLocaleString()} lin. ft.
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Horiz. Seams: </span>
              <span className="font-semibold font-mono-nums">
                {estimate.inputs.horizontalSeamsLF.toLocaleString()} lin. ft.
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-heading font-semibold text-foreground w-[200px]">
                    Product
                  </TableHead>
                  <TableHead className="font-heading font-semibold text-foreground hidden sm:table-cell">
                    Step
                  </TableHead>
                  <TableHead className="font-heading font-semibold text-foreground">
                    Unit Size
                  </TableHead>
                  <TableHead className="font-heading font-semibold text-foreground text-right">
                    Exact Qty
                  </TableHead>
                  <TableHead className="font-heading font-semibold text-foreground text-right">
                    Order Qty
                  </TableHead>
                  <TableHead className="font-heading font-semibold text-foreground text-right">
                    Unit Price
                  </TableHead>
                  <TableHead className="font-heading font-semibold text-foreground text-right">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeItems.map((item, index) => (
                  <TableRow
                    key={item.product.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                          {item.product.coverageUnit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {item.product.step}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {item.product.unitSize}
                    </TableCell>
                    <TableCell className="text-right font-mono-nums text-sm text-muted-foreground">
                      {formatNumber(item.quantityNeeded)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded bg-karnak-red/10 text-karnak-red font-mono-nums font-bold text-sm">
                        {item.quantityToOrder}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono-nums text-sm">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono-nums font-semibold text-sm">
                      {formatCurrency(item.totalCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                {/* Material subtotal */}
                <TableRow className="bg-warm-200 hover:bg-warm-200 border-t-2 border-border">
                  <TableCell
                    colSpan={6}
                    className="font-heading font-semibold text-sm text-foreground"
                  >
                    Material Subtotal
                  </TableCell>
                  <TableCell className="text-right font-mono-nums font-bold text-sm text-foreground">
                    {formatCurrency(estimate.totalMaterialCost)}
                  </TableCell>
                </TableRow>

                {/* Labor subtotal */}
                {laborCost > 0 && (
                  <TableRow className="bg-warm-100 hover:bg-warm-100">
                    <TableCell
                      colSpan={6}
                      className="font-heading font-semibold text-sm text-foreground"
                    >
                      Labor Subtotal
                    </TableCell>
                    <TableCell className="text-right font-mono-nums font-bold text-sm text-foreground">
                      {formatCurrency(laborCost)}
                    </TableCell>
                  </TableRow>
                )}

                {/* Equipment subtotal */}
                {equipmentCost > 0 && (
                  <TableRow className="bg-warm-100 hover:bg-warm-100">
                    <TableCell
                      colSpan={6}
                      className="font-heading font-semibold text-sm text-foreground"
                    >
                      Equipment Subtotal
                    </TableCell>
                    <TableCell className="text-right font-mono-nums font-bold text-sm text-foreground">
                      {formatCurrency(equipmentCost)}
                    </TableCell>
                  </TableRow>
                )}

                {/* Grand total */}
                <TableRow className="bg-karnak-dark text-white hover:bg-karnak-dark">
                  <TableCell
                    colSpan={6}
                    className="font-heading font-bold text-base text-white"
                  >
                    Total Project Estimate
                  </TableCell>
                  <TableCell className="text-right font-mono-nums font-bold text-lg text-white">
                    {formatCurrency(projectTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
