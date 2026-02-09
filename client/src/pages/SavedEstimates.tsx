/**
 * Saved Estimates Page
 *
 * Lists all saved project estimates with search, filter by system,
 * and actions to load, rename, or delete.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Search,
  FolderOpen,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  Calendar,
  DollarSign,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";

const SYSTEM_OPTIONS = [
  { value: "all", label: "All Systems" },
  { value: "karnak-metal-kynar", label: "Karnak Metal Kynar" },
  { value: "carlisle-tpo", label: "Carlisle TPO" },
  { value: "gaf-tpo", label: "GAF TPO" },
];

const SYSTEM_COLORS: Record<string, string> = {
  "karnak-metal-kynar": "bg-red-600",
  "carlisle-tpo": "bg-blue-600",
  "gaf-tpo": "bg-emerald-600",
};

function fmt(amount: string | number | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num == null || isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function fmtArea(area: string | number | null | undefined): string {
  const num = typeof area === "string" ? parseFloat(area) : area;
  if (num == null || isNaN(num) || num === 0) return "—";
  return new Intl.NumberFormat("en-US").format(num) + " sq. ft.";
}

function fmtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SavedEstimates() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: estimates, isLoading } = trpc.estimates.list.useQuery(
    {
      system: systemFilter === "all" ? undefined : systemFilter,
      search: search.trim() || undefined,
    },
    { refetchOnWindowFocus: false },
  );

  const renameMutation = trpc.estimates.rename.useMutation();
  const deleteMutation = trpc.estimates.delete.useMutation();
  const utils = trpc.useUtils();

  const handleLoad = (id: number, system: string) => {
    // Navigate to the estimator with the saved estimate ID as a query param
    const estimatorPath =
      system === "karnak-metal-kynar"
        ? "/estimator/karnak-metal-kynar"
        : system === "carlisle-tpo"
          ? "/estimator/carlisle-tpo"
          : "/estimator/gaf-tpo";
    navigate(`${estimatorPath}?loadEstimate=${id}`);
  };

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return;
    try {
      await renameMutation.mutateAsync({ id: renameId, name: renameName.trim() });
      utils.estimates.list.invalidate();
      toast.success("Estimate renamed");
      setRenameId(null);
    } catch {
      toast.error("Failed to rename estimate");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      utils.estimates.list.invalidate();
      toast.success("Estimate deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete estimate");
    }
  };

  const deleteTarget = estimates?.find((e) => e.id === deleteId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 text-white">
        <div className="container py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Saved Estimates</h1>
              <p className="text-white/70 text-sm">
                {estimates?.length ?? 0} saved project estimate{estimates?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="container pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !estimates || estimates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No saved estimates</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                {search || systemFilter !== "all"
                  ? "No estimates match your filters. Try adjusting your search."
                  : "Save an estimate from any estimator to see it here."}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
                Go to Estimators
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {estimates.map((est) => (
              <Card
                key={est.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleLoad(est.id, est.system)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* System badge */}
                    <div
                      className={`hidden sm:flex h-12 w-12 rounded-lg items-center justify-center text-white text-xs font-bold shrink-0 ${SYSTEM_COLORS[est.system] || "bg-gray-600"}`}
                    >
                      {est.system === "karnak-metal-kynar"
                        ? "KRN"
                        : est.system === "carlisle-tpo"
                          ? "CRL"
                          : "GAF"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                            {est.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{est.systemLabel}</p>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setRenameId(est.id);
                              setRenameName(est.name);
                            }}
                            title="Rename"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(est.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {est.notes && (
                        <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-1">
                          {est.notes}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {fmt(est.grandTotal)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {fmtArea(est.roofArea)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(est.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameId !== null} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Estimate</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Project name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameName.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
