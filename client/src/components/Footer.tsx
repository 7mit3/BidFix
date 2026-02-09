/**
 * Footer — BidFix AI branded footer with logo and "Powered by RooFix AI" badge
 * Design: Minimal dark footer with brand badge linking to roofix.ai
 */

const BIDFIX_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663079448619/PWRGJsnfFcLrGXhj.png";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container py-6">
        <div className="flex flex-col items-center gap-4">
          {/* BidFix AI Logo */}
          <img
            src={BIDFIX_LOGO}
            alt="BidFix AI"
            className="h-8 w-auto opacity-80"
          />

          {/* Disclaimer */}
          <p className="text-sm text-muted-foreground text-center max-w-2xl">
            Material estimator based on manufacturer spec sheets — coverage rates are for estimating purposes only.
          </p>

          {/* Powered by RooFix AI badge */}
          <a
            href="https://www.roofix.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-cyan/20 bg-cyan/5 hover:bg-cyan/10 hover:border-cyan/40 transition-all duration-300"
          >
            <span className="text-xs text-muted-foreground tracking-wide uppercase">Powered by</span>
            <span className="flex items-center gap-1.5">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-cyan group-hover:scale-110 transition-transform duration-300"
              >
                <path
                  d="M3 21V7l9-4 9 4v14H3z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M3 7l9 4 9-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 11v10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
              <span className="text-sm font-semibold text-cyan group-hover:text-cyan-soft transition-colors duration-300">
                RooFi
              </span>
              <span className="text-sm font-semibold text-orange group-hover:text-orange/80 transition-colors duration-300 -ml-0.5">
                X
              </span>
              <span className="text-sm font-medium text-muted-foreground ml-0.5">
                AI
              </span>
            </span>
          </a>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} BidFix AI &mdash; All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
