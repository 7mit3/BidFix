/**
 * HeroSection — BidFix AI branded header with metal roof hero image
 * Design: Cyan accent bar + hero image with overlay text + back navigation
 */

import { Calculator, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const HERO_IMAGE = "https://private-us-east-1.manuscdn.com/sessionFile/4Z30LxnCHTogOroU4WDQbl/sandbox/30ceNhIJEkXTMJLgLbEUed-img-1_1770593120000_na1fn_a2FybmFrLWhlcm8.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNFozMEx4bkNIVG9nT3JvVTRXRFFibC9zYW5kYm94LzMwY2VOaElKRWtYVE1KTGdMYkVVZWQtaW1nLTFfMTc3MDU5MzEyMDAwMF9uYTFmbl9hMkZ5Ym1GckxXaGxjbTguanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=TDp0ohGP3LorVZBmK5FbYw7tv-f3MfT5OOT6~CaTFhh9T6jMxGRWlLYUF2hV0y288p04iRei6EATVCMPStn9b1qFINKo~sLUal7CbD~rcQfjzsYWlJ2rw-t0PmAOPSqN4a4BMKi4~kqeAafEfN38-j1UgnlIBJj-J9D6bhXjN0O95qUZhI8H~Yxn6Zew2cgpshAYuUxaOTfnnCzDnpOL5RCSIEGjo1zffSECI7le57C~TLzGuXH3QItrHLM1v82PvnsXb1gQVkFezT3qKQxXXOAzrjhjggZjzeqnYfmdG19PWuP-5s9n9EldP-uEY9PZXjqromPpeeh1iXgArUJ2HA__";

export function HeroSection() {
  return (
    <header className="relative">
      {/* Red brand bar */}
      <div className="bg-cyan h-1.5" />

      {/* Hero image section */}
      <div className="relative h-[220px] sm:h-[260px] lg:h-[300px] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Metal roofing system with white reflective coating"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />

        {/* Content */}
        <div className="relative h-full container flex flex-col justify-center">
          {/* Back to catalog */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-muted hover:text-foreground text-sm mb-4 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            All Roofing Systems
          </Link>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan flex items-center justify-center shadow-lg">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <span className="text-cyan-light font-heading font-semibold text-sm tracking-wide uppercase">
                Material Estimator
              </span>
            </div>
            <h1 className="font-heading text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
              Karnak Metal Kynar
              <br />
              <span className="text-cyan">Coating System</span>
            </h1>
            <p className="mt-3 text-slate-text/90 text-sm sm:text-base max-w-lg leading-relaxed">
              White Reflective Coating System (702-404-501) — Calculate material quantities and costs for your metal roof restoration project.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
