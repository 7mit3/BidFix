/**
 * Footer — BidFix AI branded footer
 * Design: Minimal dark footer with brand reference
 */

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Material estimator based on manufacturer spec sheets — coverage rates are for estimating purposes only
          </p>
          <p className="text-xs">
            BidFix AI — A <a href="https://www.roofix.ai" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan-soft transition-colors">RooFix AI</a> Module
          </p>
        </div>
      </div>
    </footer>
  );
}
