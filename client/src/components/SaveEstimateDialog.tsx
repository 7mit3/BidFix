/**
 * SaveEstimateDialog — Modal dialog for saving the current estimate to the database.
 *
 * Shows a name input, optional notes, and a save button.
 * If an existing estimate ID is provided, offers "Save As New" or "Overwrite".
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface SaveEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The estimator system slug, e.g. "karnak-metal-kynar" */
  system: string;
  /** Human-readable system label, e.g. "Karnak Metal Kynar" */
  systemLabel: string;
  /** Serialized JSON of the full estimator state */
  getEstimateData: () => string;
  /** Grand total for the summary snapshot */
  grandTotal?: number;
  /** Roof area for the summary snapshot */
  roofArea?: number;
  /** If editing an existing saved estimate, pass its ID and name */
  existingId?: number | null;
  existingName?: string;
  existingNotes?: string;
  /** Called after a successful save with the new/updated estimate ID */
  onSaved?: (id: number, name: string) => void;
  /** Optional breakdown state JSON to persist alongside the estimator state */
  breakdownState?: string;
}

export function SaveEstimateDialog({
  open,
  onOpenChange,
  system,
  systemLabel,
  getEstimateData,
  grandTotal,
  roofArea,
  existingId,
  existingName,
  existingNotes,
  onSaved,
  breakdownState,
}: SaveEstimateDialogProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  // Sync name and notes from props whenever the dialog opens or the loaded estimate changes
  useEffect(() => {
    if (open) {
      setName(existingName || "");
      setNotes(existingNotes || "");
      setSaved(false);
    }
  }, [open, existingName, existingNotes]);

  const saveMutation = trpc.estimates.save.useMutation();
  const updateMutation = trpc.estimates.update.useMutation();
  const utils = trpc.useUtils();

  const isSaving = saveMutation.isPending || updateMutation.isPending;

  const handleSaveNew = async () => {
    if (!name.trim()) return;
    try {
      const data = getEstimateData();
      const result = await saveMutation.mutateAsync({
        name: name.trim(),
        system,
        systemLabel,
        notes: notes.trim() || undefined,
        data,
        grandTotal: grandTotal?.toFixed(2),
        roofArea: roofArea?.toFixed(2),
        breakdownState: breakdownState || undefined,
      });
      utils.estimates.list.invalidate();
      setSaved(true);
      toast.success(`"${name.trim()}" has been saved successfully.`);
      onSaved?.(result.id, name.trim());
      setTimeout(() => {
        setSaved(false);
        onOpenChange(false);
      }, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleOverwrite = async () => {
    if (!existingId || !name.trim()) return;
    try {
      const data = getEstimateData();
      await updateMutation.mutateAsync({
        id: existingId,
        name: name.trim(),
        notes: notes.trim() || undefined,
        data,
        grandTotal: grandTotal?.toFixed(2),
        roofArea: roofArea?.toFixed(2),
        breakdownState: breakdownState || undefined,
      });
      utils.estimates.list.invalidate();
      setSaved(true);
      toast.success(`"${name.trim()}" has been updated.`);
      onSaved?.(existingId, name.trim());
      setTimeout(() => {
        setSaved(false);
        onOpenChange(false);
      }, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {existingId ? "Update Estimate" : "Save Estimate"}
          </DialogTitle>
          <DialogDescription>
            Save the current {systemLabel} estimate so you can revisit it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="estimate-name">Project Name *</Label>
            <Input
              id="estimate-name"
              placeholder="e.g. ABC Office Park — Building A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimate-notes">Notes (optional)</Label>
            <Textarea
              id="estimate-notes"
              placeholder="Any additional details about this estimate..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {grandTotal !== undefined && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">System</span>
                <span className="font-medium">{systemLabel}</span>
              </div>
              {roofArea !== undefined && roofArea > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Roof Area</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-US").format(roofArea)} sq. ft.
                  </span>
                </div>
              )}
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Grand Total</span>
                <span className="font-semibold text-primary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(grandTotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {existingId ? (
            <>
              <Button
                variant="outline"
                onClick={handleSaveNew}
                disabled={!name.trim() || isSaving}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save As New
              </Button>
              <Button
                onClick={handleOverwrite}
                disabled={!name.trim() || isSaving}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : saved ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saved ? "Saved!" : "Overwrite"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSaveNew}
              disabled={!name.trim() || isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : saved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saved ? "Saved!" : "Save Estimate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
