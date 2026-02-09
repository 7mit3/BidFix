/**
 * Catalog — Main landing page showing roofing system categories and products
 * Design: Industrial-professional with category cards, collapsible sections (closed by default)
 */

import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Droplets,
  Shield,
  Layers,
  Box,
  SquareStack,
  Factory,
  ArrowRight,
  Clock,
  Calculator,
  ChevronDown,
  ChevronRight,
  Search,
  Database,
  FolderOpen,
} from "lucide-react";
import {
  SYSTEM_CATEGORIES,
  ROOFING_SYSTEMS,
  type SystemCategory,
  type RoofingSystem,
} from "@/lib/catalog-data";
import { motion, AnimatePresence } from "framer-motion";

const CATALOG_HERO_URL =
  "https://private-us-east-1.manuscdn.com/sessionFile/4Z30LxnCHTogOroU4WDQbl/sandbox/n5teAP13C4gGXpI1SDhoPD-img-1_1770596647000_na1fn_Y2F0YWxvZy1oZXJv.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNFozMEx4bkNIVG9nT3JvVTRXRFFibC9zYW5kYm94L241dGVBUDEzQzRnR1hwSTFTRGhvUEQtaW1nLTFfMTc3MDU5NjY0NzAwMF9uYTFmbl9ZMkYwWVd4dlp5MW9aWEp2LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=NYJJUq3EW8KSbdF56kgBSGyRB5d-MB~QfU~LSkRGa08P1~gW7nzLBPopMImwX6f7X-KhYK77E9CwReHURZXS0HD2PrMzuNCXmKMCVq5Kppv-tPnEuY09Y4xQ-BgXxkA9QDIs6qO5k91dK9dU5gssv942yuwcJJx8kmEzWPM8~CZzjNx2vPzvEGJXkZQVZko6EshW9q5X5yb665GMCf3NbEqTGIqNGzGFKf0Hv7yPsIbY~Buj1qMjUQR~KBxCQ7svAe1uJ7ZovXdtP9DnYqpARajFmxXOH3-AuO-m7IUcDweeCyptPe~VRx6YPh4LAbhVM8LdLlUNCWp~6umCLQhKvw__";

const iconMap: Record<string, React.ReactNode> = {
  Droplets: <Droplets className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  Brick: <Box className="w-5 h-5" />,
  SquareStack: <SquareStack className="w-5 h-5" />,
  Factory: <Factory className="w-5 h-5" />,
};

function SystemCard({ system }: { system: RoofingSystem }) {
  const isAvailable = system.status === "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={`overflow-hidden transition-all duration-200 h-full ${
          isAvailable
            ? "hover:shadow-lg hover:border-karnak-red/30 cursor-pointer"
            : "opacity-75"
        }`}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Left content */}
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {system.manufacturer}
                  </p>
                  <h4 className="font-heading text-base font-bold text-foreground leading-snug">
                    {system.name}
                  </h4>
                </div>
                {isAvailable ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0 text-xs">
                    <Calculator className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-xs"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Soon
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {system.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span className="font-medium">Substrate:</span>
                <span>{system.substrate}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {system.features.map((f) => (
                  <span
                    key={f}
                    className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {isAvailable && system.route ? (
                <Link href={system.route}>
                  <Button size="sm" className="bg-karnak-red hover:bg-karnak-red/90 text-white">
                    Open Estimator
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <Clock className="w-4 h-4 mr-1" />
                  Coming Soon
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CategorySection({ category }: { category: SystemCategory }) {
  const [isOpen, setIsOpen] = useState(false);
  const systems = ROOFING_SYSTEMS.filter(
    (s) => s.categorySlug === category.slug
  );
  const availableCount = systems.filter((s) => s.status === "available").length;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <div
          className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center text-white shrink-0`}
        >
          {iconMap[category.icon]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-heading text-lg font-bold text-foreground">
              {category.name}
            </h3>
            <span className="text-xs text-muted-foreground">
              {systems.length} system{systems.length !== 1 ? "s" : ""}
              {availableCount > 0 && (
                <span className="text-emerald-600 ml-1">
                  · {availableCount} ready
                </span>
              )}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {category.description}
          </p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {isOpen ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Separator />
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              {systems.map((system) => (
                <SystemCard key={system.id} system={system} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Catalog() {
  const [searchQuery, setSearchQuery] = useState("");

  const totalSystems = ROOFING_SYSTEMS.length;
  const availableSystems = ROOFING_SYSTEMS.filter(
    (s) => s.status === "available"
  ).length;

  // Filter categories based on search
  const filteredCategories = searchQuery.trim()
    ? SYSTEM_CATEGORIES.filter((cat) => {
        const systems = ROOFING_SYSTEMS.filter(
          (s) => s.categorySlug === cat.slug
        );
        const q = searchQuery.toLowerCase();
        return (
          cat.name.toLowerCase().includes(q) ||
          systems.some(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.manufacturer.toLowerCase().includes(q) ||
              s.substrate.toLowerCase().includes(q)
          )
        );
      })
    : SYSTEM_CATEGORIES;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${CATALOG_HERO_URL})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-karnak-dark/95 via-karnak-dark/80 to-karnak-dark/60" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-karnak-red" />

        <div className="relative container py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-karnak-red flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <span className="text-karnak-red font-semibold text-sm uppercase tracking-widest">
                Roofing Estimator
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Commercial Roofing
              <br />
              <span className="text-warm-300">Material Estimator</span>
            </h1>
            <p className="text-warm-300/90 text-base sm:text-lg leading-relaxed max-w-xl">
              Select a roofing system below to calculate material quantities,
              labor costs, and generate a complete project estimate. Browse by
              coating type or manufacturer.
            </p>

            <div className="flex items-center gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 text-warm-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  {availableSystems} estimator{availableSystems !== 1 ? "s" : ""}{" "}
                  ready
                </span>
              </div>
              <div className="flex items-center gap-2 text-warm-400">
                <div className="w-2 h-2 rounded-full bg-warm-500" />
                <span>{totalSystems} total systems</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search bar + Pricing DB link */}
      <div className="container -mt-6 relative z-10">
        <div className="flex items-center gap-3">
        <div className="bg-card border border-border rounded-xl shadow-lg p-2 max-w-xl flex-1">
          <div className="flex items-center gap-3 px-3">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search by system name, manufacturer, or substrate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <Link href="/saved">
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg whitespace-nowrap">
            <FolderOpen className="w-4 h-4" />
            Saved Estimates
          </button>
        </Link>
        <Link href="/pricing">
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-lg whitespace-nowrap">
            <Database className="w-4 h-4" />
            Pricing Database
          </button>
        </Link>
        </div>
      </div>

      {/* Category sections */}
      <main className="container py-10 flex-1">
        <div className="grid gap-4">
          {filteredCategories.map((category) => (
            <CategorySection key={category.slug} category={category} />
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No systems match "{searchQuery}"
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              Coverage rates are for estimating purposes only. Actual amounts may
              vary depending on roof conditions.
            </p>
            <p className="text-xs">
              Built for commercial roofing contractors
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
