/**
 * Footer — Simple branded footer
 * Design: Minimal with Karnak reference
 */

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Material estimator based on Karnak spec sheet METAL-KYNAR 702-404-501
          </p>
          <p className="text-xs">
            Estimates only — verify with your Karnak representative
          </p>
        </div>
      </div>
    </footer>
  );
}
