import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Database,
  Search,
  Download,
  Upload,
  RotateCcw,
  History,
  FileSpreadsheet,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Package,
  RefreshCw,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getAllProducts, SYSTEM_OPTIONS, type PricingProduct } from "@/lib/all-products";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface PriceEditState {
  productId: string;
  value: string;
}

interface ImportRow {
  productId: string;
  name: string;
  newPrice: string;
  currentPrice: string;
  diff: string;
  diffPercent: number;
}

type Tab = "products" | "quotes";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: <FileText className="w-3.5 h-3.5" /> },
  sent: { label: "Sent", color: "bg-cyan/20 text-cyan", icon: <Send className="w-3.5 h-3.5" /> },
  received: { label: "Received", color: "bg-orange/20 text-orange", icon: <Inbox className="w-3.5 h-3.5" /> },
  applied: { label: "Applied", color: "bg-success/20 text-success", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

// ─── Main Component ─────────────────────────────────────────────────

export default function PricingDatabase() {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [editingPrice, setEditingPrice] = useState<PriceEditState | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importSource, setImportSource] = useState("");
  const [importQuoteId, setImportQuoteId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProductId, setHistoryProductId] = useState("");
  const [historyProductName, setHistoryProductName] = useState("");
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [newQuoteName, setNewQuoteName] = useState("");
  const [newQuoteSystem, setNewQuoteSystem] = useState("all");
  const [newQuoteDistributor, setNewQuoteDistributor] = useState("");
  const [seeded, setSeeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importForQuoteRef = useRef<number | null>(null);

  // tRPC queries
  const pricingQuery = trpc.pricing.list.useQuery(
    systemFilter !== "all" ? { system: systemFilter } : undefined,
  );
  const historyQuery = trpc.pricing.history.useQuery(
    { productId: historyProductId },
    { enabled: !!historyProductId },
  );
  const quotesQuery = trpc.pricing.quotes.useQuery();

  // tRPC mutations
  const updatePriceMutation = trpc.pricing.updatePrice.useMutation({
    onSuccess: () => {
      pricingQuery.refetch();
      setEditingPrice(null);
      toast.success("Price updated");
    },
  });
  const bulkUpdateMutation = trpc.pricing.bulkUpdate.useMutation({
    onSuccess: (result) => {
      pricingQuery.refetch();
      setShowImportModal(false);
      setImportData([]);
      // If this import was linked to a quote, update its status
      if (importQuoteId) {
        updateQuoteStatusMutation.mutate({ id: importQuoteId, status: "applied" });
        setImportQuoteId(null);
      }
      toast.success(`${result.succeeded} prices updated successfully`);
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} updates failed`);
      }
    },
  });
  const resetMutation = trpc.pricing.resetToDefault.useMutation({
    onSuccess: () => {
      pricingQuery.refetch();
      toast.success("Price reset to default");
    },
  });
  const seedMutation = trpc.pricing.seed.useMutation({
    onSuccess: () => {
      setSeeded(true);
      pricingQuery.refetch();
    },
  });
  const createQuoteMutation = trpc.pricing.createQuote.useMutation({
    onSuccess: () => {
      quotesQuery.refetch();
      setShowNewQuoteModal(false);
      setNewQuoteName("");
      setNewQuoteDistributor("");
      toast.success("Quote request created");
    },
  });
  const updateQuoteStatusMutation = trpc.pricing.updateQuoteStatus.useMutation({
    onSuccess: () => {
      quotesQuery.refetch();
    },
  });

  // Get all products from local data models
  const allLocalProducts = useMemo(() => getAllProducts(), []);

  // Seed database with default pricing if empty
  useEffect(() => {
    if (pricingQuery.data && pricingQuery.data.length === 0 && !seeded && !seedMutation.isPending) {
      seedMutation.mutate({ products: allLocalProducts });
    }
  }, [pricingQuery.data, seeded]);

  // Merge DB pricing with local products for display
  const products = useMemo(() => {
    const dbMap = new Map(
      (pricingQuery.data || []).map((p) => [p.productId, p]),
    );

    if (dbMap.size > 0) {
      return Array.from(dbMap.values()).map((p) => ({
        productId: p.productId,
        system: p.system,
        manufacturer: p.manufacturer,
        category: p.category,
        name: p.name,
        unit: p.unit,
        unitPrice: parseFloat(p.unitPrice),
        defaultPrice: parseFloat(p.defaultPrice),
        priceSource: p.priceSource || "Default",
        lastPriceUpdate: p.lastPriceUpdate,
      }));
    }

    const filtered = systemFilter !== "all"
      ? allLocalProducts.filter((p) => p.system === systemFilter)
      : allLocalProducts;

    return filtered.map((p) => ({
      ...p,
      defaultPrice: p.unitPrice,
      priceSource: "Default",
      lastPriceUpdate: null as Date | null,
    }));
  }, [pricingQuery.data, allLocalProducts, systemFilter]);

  // Filter by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredProducts>();
    for (const p of filteredProducts) {
      const key = `${p.system}|${p.category}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [filteredProducts]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(grouped.keys()));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // ─── Export CSV for Quote Request ─────────────────────────────────

  const exportQuoteCSV = useCallback((targetSystem?: string, quoteName?: string) => {
    const exportProducts = targetSystem && targetSystem !== "all"
      ? products.filter((p) => p.system === targetSystem)
      : filteredProducts;

    const rows = [
      ["Product ID", "System", "Manufacturer", "Category", "Product Name", "Unit", "Current Price", "New Price (fill in)"],
    ];
    for (const p of exportProducts) {
      rows.push([
        p.productId,
        p.system,
        p.manufacturer,
        p.category,
        p.name,
        p.unit,
        p.unitPrice.toFixed(2),
        "",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = quoteName || SYSTEM_OPTIONS.find((s) => s.value === (targetSystem || systemFilter))?.label || "All";
    a.download = `quote-request-${label.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${exportProducts.length} products to CSV`);
  }, [filteredProducts, products, systemFilter]);

  // ─── Import CSV ───────────────────────────────────────────────────

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          toast.error("CSV file appears to be empty");
          return;
        }

        const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
        const productIdIdx = header.findIndex((h) => h.includes("product id"));
        const newPriceIdx = header.findIndex((h) => h.includes("new price"));
        const nameIdx = header.findIndex((h) => h.includes("product name") || h === "name");

        if (productIdIdx === -1 || newPriceIdx === -1) {
          toast.error("CSV must contain 'Product ID' and 'New Price' columns");
          return;
        }

        const dbMap = new Map(products.map((p) => [p.productId, p]));
        const rows: ImportRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
          const productId = cols[productIdIdx];
          const newPrice = cols[newPriceIdx];
          if (!productId || !newPrice || isNaN(parseFloat(newPrice))) continue;

          const existing = dbMap.get(productId);
          const currentPrice = existing ? existing.unitPrice.toFixed(2) : "N/A";
          const diffPercent = existing
            ? ((parseFloat(newPrice) - existing.unitPrice) / existing.unitPrice) * 100
            : 0;
          const diff = existing
            ? (diffPercent >= 0 ? "+" : "") + diffPercent.toFixed(1) + "%"
            : "New";

          rows.push({
            productId,
            name: cols[nameIdx] || existing?.name || productId,
            newPrice: parseFloat(newPrice).toFixed(2),
            currentPrice,
            diff,
            diffPercent,
          });
        }

        if (rows.length === 0) {
          toast.error("No valid price updates found in the CSV");
          return;
        }

        // Check if we're importing for a specific quote
        if (importForQuoteRef.current) {
          setImportQuoteId(importForQuoteRef.current);
          importForQuoteRef.current = null;
        }

        setImportData(rows);
        setShowImportModal(true);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [products],
  );

  const applyImport = () => {
    const updates = importData.map((r) => ({
      productId: r.productId,
      newPrice: r.newPrice,
      source: importSource || "CSV Import",
    }));
    bulkUpdateMutation.mutate({ updates });
  };

  // ─── Quote Request Handlers ───────────────────────────────────────

  const createQuoteRequest = () => {
    const targetProducts = newQuoteSystem !== "all"
      ? products.filter((p) => p.system === newQuoteSystem)
      : products;
    const totalValue = targetProducts.reduce((sum, p) => sum + p.unitPrice, 0);

    createQuoteMutation.mutate({
      name: newQuoteName || `Quote Request - ${new Date().toLocaleDateString()}`,
      system: newQuoteSystem,
      distributor: newQuoteDistributor || undefined,
      productCount: targetProducts.length,
      totalValue: totalValue.toFixed(2),
    });

    // Auto-export CSV
    exportQuoteCSV(newQuoteSystem, newQuoteName);
  };

  const handleQuoteImport = (quoteId: number) => {
    importForQuoteRef.current = quoteId;
    fileInputRef.current?.click();
  };

  // ─── Price Edit Handlers ──────────────────────────────────────────

  const startEdit = (productId: string, currentPrice: number) => {
    setEditingPrice({ productId, value: currentPrice.toFixed(2) });
  };

  const saveEdit = () => {
    if (!editingPrice) return;
    updatePriceMutation.mutate({
      productId: editingPrice.productId,
      newPrice: editingPrice.value,
      source: "Manual Edit",
    });
  };

  const cancelEdit = () => setEditingPrice(null);

  const showHistory = (productId: string, name: string) => {
    setHistoryProductId(productId);
    setHistoryProductName(name);
    setShowHistoryModal(true);
  };

  // ─── Stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = filteredProducts.length;
    const customPriced = filteredProducts.filter((p) => p.priceSource !== "Default").length;
    const priceIncreases = filteredProducts.filter((p) => p.unitPrice > p.defaultPrice).length;
    const priceDecreases = filteredProducts.filter((p) => p.unitPrice < p.defaultPrice).length;
    return { total, customPriced, priceIncreases, priceDecreases };
  }, [filteredProducts]);

  // Import summary stats
  const importStats = useMemo(() => {
    if (importData.length === 0) return null;
    const increases = importData.filter((r) => r.diffPercent > 0);
    const decreases = importData.filter((r) => r.diffPercent < 0);
    const unchanged = importData.filter((r) => r.diffPercent === 0);
    const avgChange = importData.reduce((sum, r) => sum + r.diffPercent, 0) / importData.length;
    return { increases: increases.length, decreases: decreases.length, unchanged: unchanged.length, avgChange };
  }, [importData]);

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-navy-deep text-white">
        <div className="container py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-muted hover:text-foreground text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pricing Database</h1>
                <p className="text-slate-muted text-sm">
                  Manage material pricing across all estimators. Request quotes, import distributor pricing.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === "products"
                  ? "bg-card text-foreground"
                  : "text-slate-muted hover:text-foreground hover:bg-navy-surface"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products ({stats.total})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("quotes")}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === "quotes"
                  ? "bg-card text-foreground"
                  : "text-slate-muted hover:text-foreground hover:bg-navy-surface"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Quote Requests
                {quotesQuery.data && quotesQuery.data.length > 0 && (
                  <span className="bg-success text-white text-xs px-1.5 py-0.5 rounded-full">
                    {quotesQuery.data.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="container py-8 space-y-6">
        {/* ─── PRODUCTS TAB ──────────────────────────────────────── */}
        {activeTab === "products" && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="text-sm text-muted-foreground">Total Products</div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="text-sm text-muted-foreground">Custom Priced</div>
                <div className="text-2xl font-bold text-success">{stats.customPriced}</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-destructive" /> Price Increases
                </div>
                <div className="text-2xl font-bold text-destructive">{stats.priceIncreases}</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-success" /> Price Decreases
                </div>
                <div className="text-2xl font-bold text-success">{stats.priceDecreases}</div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                  <input
                    type="text"
                    placeholder="Search products by name, ID, manufacturer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                  className="px-4 py-2.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SYSTEM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => exportQuoteCSV()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/80 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Quote
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan text-white rounded-lg text-sm font-medium hover:bg-cyan-soft transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Import Pricing
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <button
                    onClick={expandedCategories.size > 0 ? collapseAll : expandAll}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {expandedCategories.size > 0 ? "Collapse All" : "Expand All"}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading state */}
            {pricingQuery.isLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-success mr-3" />
                <span className="text-muted-foreground">Loading pricing data...</span>
              </div>
            )}

            {/* Product Table grouped by category */}
            {!pricingQuery.isLoading && Array.from(grouped.entries()).map(([key, items]) => {
              const [system, category] = key.split("|");
              const isExpanded = expandedCategories.has(key);
              const systemLabel = SYSTEM_OPTIONS.find((s) => s.value === system)?.label || system;
              const customCount = items.filter((p) => p.priceSource !== "Default").length;

              return (
                <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => toggleCategory(key)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-muted" />
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{category}</div>
                        <div className="text-xs text-muted-foreground">{systemLabel} — {items.length} products</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {customCount > 0 && (
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                          {customCount} custom
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {items.length} items
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                            <th className="text-left px-5 py-3 font-medium">Product</th>
                            <th className="text-left px-3 py-3 font-medium">Unit</th>
                            <th className="text-right px-3 py-3 font-medium">Default</th>
                            <th className="text-right px-3 py-3 font-medium">Current Price</th>
                            <th className="text-left px-3 py-3 font-medium">Source</th>
                            <th className="text-left px-3 py-3 font-medium">Updated</th>
                            <th className="text-center px-3 py-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((p) => {
                            const isEditing = editingPrice?.productId === p.productId;
                            const priceChanged = p.unitPrice !== p.defaultPrice;
                            const priceUp = p.unitPrice > p.defaultPrice;
                            const priceDown = p.unitPrice < p.defaultPrice;

                            return (
                              <tr
                                key={p.productId}
                                className="border-t border-slate-50 hover:bg-muted/30/50 transition-colors"
                              >
                                <td className="px-5 py-3">
                                  <div className="font-medium text-foreground text-sm">{p.name}</div>
                                  <div className="text-xs text-slate-muted font-mono">{p.productId}</div>
                                </td>
                                <td className="px-3 py-3 text-muted-foreground">{p.unit}</td>
                                <td className="px-3 py-3 text-right text-slate-muted font-mono-nums">
                                  ${p.defaultPrice.toFixed(2)}
                                </td>
                                <td className="px-3 py-3 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="text-slate-muted">$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editingPrice.value}
                                        onChange={(e) =>
                                          setEditingPrice({ ...editingPrice, value: e.target.value })
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") saveEdit();
                                          if (e.key === "Escape") cancelEdit();
                                        }}
                                        className="w-24 px-2 py-1 border border-emerald-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-nums"
                                        autoFocus
                                      />
                                      <button
                                        onClick={saveEdit}
                                        className="p-1 text-success hover:bg-success/10 rounded"
                                        disabled={updatePriceMutation.isPending}
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="p-1 text-slate-muted hover:bg-muted rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span
                                        className={`font-semibold font-mono-nums ${
                                          priceUp ? "text-destructive" : priceDown ? "text-success" : "text-foreground"
                                        }`}
                                      >
                                        ${p.unitPrice.toFixed(2)}
                                      </span>
                                      {priceChanged && (
                                        <span className={`text-xs ${priceUp ? "text-destructive" : "text-success"}`}>
                                          {priceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      p.priceSource === "Default"
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-success/10 text-success"
                                    }`}
                                  >
                                    {p.priceSource}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-xs text-slate-muted">
                                  {p.lastPriceUpdate
                                    ? new Date(p.lastPriceUpdate).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    {!isEditing && (
                                      <button
                                        onClick={() => startEdit(p.productId, p.unitPrice)}
                                        className="p-1.5 text-slate-muted hover:text-success hover:bg-success/10 rounded transition-colors"
                                        title="Edit price"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {priceChanged && (
                                      <button
                                        onClick={() => resetMutation.mutate({ productId: p.productId })}
                                        className="p-1.5 text-slate-muted hover:text-orange hover:bg-orange/10 rounded transition-colors"
                                        title="Reset to default"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => showHistory(p.productId, p.name)}
                                      className="p-1.5 text-slate-muted hover:text-cyan hover:bg-cyan/10 rounded transition-colors"
                                      title="View price history"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {!pricingQuery.isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-text mx-auto mb-3" />
                <p className="text-muted-foreground">No products found matching your search.</p>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-muted/30 rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-success" />
                How to Update Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground mb-1">1. Export Quote Request</div>
                  <p>
                    Click "Export Quote" to download a CSV with all products and current prices. The "New Price" column is blank for your distributor to fill in.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">2. Get Distributor Pricing</div>
                  <p>
                    Send the CSV to your distributor or supplier. They fill in the "New Price" column with their quoted prices and return the file.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">3. Import Updated Pricing</div>
                  <p>
                    Click "Import Pricing" and upload the completed CSV. Review the changes, then apply them. All estimators will use the new prices.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── QUOTES TAB ────────────────────────────────────────── */}
        {activeTab === "quotes" && (
          <>
            {/* Quote Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Quote Requests</h2>
                <p className="text-sm text-muted-foreground">
                  Track quote requests sent to distributors and import their pricing responses.
                </p>
              </div>
              <button
                onClick={() => setShowNewQuoteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Quote Request
              </button>
            </div>

            {/* Quote List */}
            {quotesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-success mr-3" />
                <span className="text-muted-foreground">Loading quotes...</span>
              </div>
            ) : quotesQuery.data && quotesQuery.data.length > 0 ? (
              <div className="space-y-4">
                {quotesQuery.data.map((quote) => {
                  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                  const systemLabel = SYSTEM_OPTIONS.find((s) => s.value === quote.system)?.label || quote.system;

                  return (
                    <div key={quote.id} className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{quote.name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              {systemLabel}
                            </span>
                            {quote.distributor && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                {quote.distributor}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {new Date(quote.createdAt).toLocaleDateString()}
                            </span>
                            {quote.productCount && (
                              <span>{quote.productCount} products</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status progression buttons */}
                          {quote.status === "draft" && (
                            <>
                              <button
                                onClick={() => {
                                  exportQuoteCSV(quote.system, quote.name);
                                  updateQuoteStatusMutation.mutate({ id: quote.id, status: "sent" });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan text-white rounded-lg text-xs font-medium hover:bg-cyan-soft transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Export & Mark Sent
                              </button>
                            </>
                          )}
                          {quote.status === "sent" && (
                            <>
                              <button
                                onClick={() => updateQuoteStatusMutation.mutate({ id: quote.id, status: "received" })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors"
                              >
                                <Inbox className="w-3.5 h-3.5" />
                                Mark Received
                              </button>
                            </>
                          )}
                          {(quote.status === "received" || quote.status === "sent") && (
                            <button
                              onClick={() => handleQuoteImport(quote.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium hover:bg-success/80 transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Import Pricing
                            </button>
                          )}
                          {quote.status === "applied" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-success text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Pricing Applied
                            </span>
                          )}
                          {/* Re-export for any status */}
                          <button
                            onClick={() => exportQuoteCSV(quote.system, quote.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted transition-colors"
                            title="Re-export CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <FileSpreadsheet className="w-12 h-12 text-slate-text mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No Quote Requests Yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Create a quote request to generate a CSV file you can send to your distributor. When they return it with updated pricing, import it here.
                </p>
                <button
                  onClick={() => setShowNewQuoteModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create First Quote Request
                </button>
              </div>
            )}

            {/* Workflow explanation */}
            <div className="bg-muted/30 rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-success" />
                Quote Request Workflow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">1</div>
                  <div>
                    <div className="font-medium text-foreground">Create</div>
                    <p className="text-muted-foreground">Name your quote, select a system, and specify the distributor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center shrink-0 text-sm font-bold text-cyan">2</div>
                  <div>
                    <div className="font-medium text-foreground">Export & Send</div>
                    <p className="text-muted-foreground">Download the CSV and email it to your distributor for pricing.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange/20 flex items-center justify-center shrink-0 text-sm font-bold text-orange">3</div>
                  <div>
                    <div className="font-medium text-foreground">Receive</div>
                    <p className="text-muted-foreground">When the distributor returns the CSV with prices, mark it received.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0 text-sm font-bold text-success">4</div>
                  <div>
                    <div className="font-medium text-foreground">Import & Apply</div>
                    <p className="text-muted-foreground">Upload the completed CSV to update all prices across your estimators.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ─── New Quote Modal ───────────────────────────────────────── */}
      {showNewQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-success" />
                New Quote Request
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create a quote request and export a CSV to send to your distributor.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Quote Name
                </label>
                <input
                  type="text"
                  value={newQuoteName}
                  onChange={(e) => setNewQuoteName(e.target.value)}
                  placeholder={`Quote Request - ${new Date().toLocaleDateString()}`}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  System
                </label>
                <select
                  value={newQuoteSystem}
                  onChange={(e) => setNewQuoteSystem(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SYSTEM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Distributor (optional)
                </label>
                <input
                  type="text"
                  value={newQuoteDistributor}
                  onChange={(e) => setNewQuoteDistributor(e.target.value)}
                  placeholder="e.g., ABC Supply, QXO, Beacon"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                <p>
                  This will create a quote request and automatically download a CSV file with{" "}
                  {newQuoteSystem !== "all"
                    ? `${products.filter((p) => p.system === newQuoteSystem).length} products`
                    : `all ${products.length} products`
                  }{" "}
                  for your distributor to fill in pricing.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewQuoteModal(false);
                  setNewQuoteName("");
                  setNewQuoteDistributor("");
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createQuoteRequest}
                disabled={createQuoteMutation.isPending}
                className="px-6 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/80 transition-colors disabled:opacity-50"
              >
                {createQuoteMutation.isPending ? "Creating..." : "Create & Export CSV"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Import Preview Modal ──────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan" />
                Import Pricing — Preview Changes
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {importData.length} products with new pricing found. Review before applying.
              </p>
            </div>

            {/* Import Summary */}
            {importStats && (
              <div className="px-6 pt-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-foreground">{importData.length}</div>
                    <div className="text-xs text-muted-foreground">Total Changes</div>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-destructive flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {importStats.increases}
                    </div>
                    <div className="text-xs text-destructive">Increases</div>
                  </div>
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-success flex items-center justify-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      {importStats.decreases}
                    </div>
                    <div className="text-xs text-success">Decreases</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-muted-foreground flex items-center justify-center gap-1">
                      <Minus className="w-4 h-4" />
                      {importStats.unchanged}
                    </div>
                    <div className="text-xs text-muted-foreground">Unchanged</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto p-6">
              {/* Source input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Price Source (e.g., "ABC Supply Quote 2/9/2026")
                </label>
                <input
                  type="text"
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value)}
                  placeholder="Enter the source of this pricing..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-xs uppercase">
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-right px-3 py-2">Current</th>
                    <th className="text-right px-3 py-2">New</th>
                    <th className="text-right px-3 py-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row) => {
                    const isIncrease = row.diffPercent > 0;
                    const isDecrease = row.diffPercent < 0;
                    return (
                      <tr key={row.productId} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground">{row.name}</div>
                          <div className="text-xs text-slate-muted font-mono">{row.productId}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground font-mono-nums">${row.currentPrice}</td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground font-mono-nums">
                          ${row.newPrice}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isIncrease
                                ? "text-destructive"
                                : isDecrease
                                  ? "text-success"
                                  : "text-slate-muted"
                            }`}
                          >
                            {isIncrease && <TrendingUp className="w-3 h-3" />}
                            {isDecrease && <TrendingDown className="w-3 h-3" />}
                            {row.diff}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {importStats && (
                  <span>
                    Average change:{" "}
                    <span className={importStats.avgChange > 0 ? "text-destructive font-medium" : importStats.avgChange < 0 ? "text-success font-medium" : "text-muted-foreground"}>
                      {importStats.avgChange >= 0 ? "+" : ""}{importStats.avgChange.toFixed(1)}%
                    </span>
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData([]);
                    setImportQuoteId(null);
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyImport}
                  disabled={bulkUpdateMutation.isPending}
                  className="px-6 py-2 bg-cyan text-white text-sm font-medium rounded-lg hover:bg-cyan-soft transition-colors disabled:opacity-50"
                >
                  {bulkUpdateMutation.isPending ? "Applying..." : `Apply ${importData.length} Price Updates`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── History Modal ─────────────────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[60vh] flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-cyan" />
                Price History
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{historyProductName}</p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {historyQuery.isLoading ? (
                <div className="text-center py-8 text-slate-muted">Loading history...</div>
              ) : historyQuery.data && historyQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {historyQuery.data.map((h) => {
                    const oldP = parseFloat(h.oldPrice);
                    const newP = parseFloat(h.newPrice);
                    const pctChange = ((newP - oldP) / oldP) * 100;
                    const isUp = newP > oldP;

                    return (
                      <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <div className="text-sm text-muted-foreground font-mono-nums">
                            ${h.oldPrice} → <span className="font-semibold text-foreground">${h.newPrice}</span>
                          </div>
                          <div className="text-xs text-slate-muted">
                            {h.source} • {new Date(h.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            isUp ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                          }`}
                        >
                          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isUp ? "+" : ""}{pctChange.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-muted">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No price changes recorded yet.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistoryProductId("");
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
