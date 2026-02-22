/**
 * @file components/BrandingPreview/BrandingPreview.jsx
 * @description Live preview panel for tenant branding configuration.
 *
 * Shown in the Admin Portal's Branding settings page (Sprint 8).
 * As an admin edits brand colors/fonts, this component shows a real-time
 * preview of how the storefront will look with those settings applied.
 *
 * ─── How the preview works ────────────────────────────────────────────────────
 *
 * BrandingPreview renders a CONTAINED preview — it does NOT modify
 * document.documentElement. Instead, it injects inline CSS variables on a
 * wrapper div using the previewBranding prop values.
 *
 * This is critical: the admin editing the settings can see the preview
 * in real time WITHOUT the changes applying globally to the admin portal itself.
 *
 * ─── Component breakdown ─────────────────────────────────────────────────────
 *
 *   ColorSwatch         — Single color chip with hex label and contrast badge
 *   FontPreview         — Typography sample in the selected fonts
 *   UIPreview           — Mock storefront UI (navbar, product card, button, badge)
 *   ContrastReport      — WCAG contrast ratio results for each color pair
 *   BrandingPreview     — Orchestrates all sub-components, computes HSL values
 *
 * ─── WCAG 2.1 AA ─────────────────────────────────────────────────────────────
 *
 * WCAG 1.4.3: ContrastReport shows whether each color pair passes/fails.
 *   Violations are flagged with an alert icon and red text (not color alone).
 *
 * WCAG 1.4.1: Pass/fail is communicated via text + icon, not color only.
 *
 * WCAG 4.1.3: ContrastReport results are surfaced via role="status" so
 *   screen readers announce when results change (branding update in real time).
 *
 * @module components/BrandingPreview
 */

import React, { useMemo } from "react";
import {
  hexToHSL,
  getContrastRatio,
  getAccessibleForeground,
  isValidHex,
  checkContrast,
} from "../../utils/color";

// ─── ColorSwatch ──────────────────────────────────────────────────────────────

/**
 * A colored chip showing the brand color, its hex code, and WCAG contrast results.
 *
 * @param {object}  props
 * @param {string}  props.label     - e.g. "Primary"
 * @param {string}  props.hex       - e.g. "#10b981"
 * @param {string}  props.onHex     - Background to check contrast against
 */
function ColorSwatch({ label, hex, onHex = "#ffffff" }) {
  if (!isValidHex(hex)) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 p-3 text-sm text-gray-400">
        <div className="h-8 w-8 rounded-lg bg-gray-100 flex-shrink-0" />
        <span>{label}: invalid color</span>
      </div>
    );
  }

  const fg      = getAccessibleForeground(hex);
  const contrast = getContrastRatio(hex, onHex);
  const passes   = contrast !== null && contrast >= 4.5;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
      {/* Color chip */}
      <div
        className="h-10 w-10 rounded-lg flex-shrink-0 shadow-inner"
        style={{ backgroundColor: hex }}
        aria-label={`${label} color: ${hex}`}
        role="img"
      />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</div>
        <div className="font-mono text-xs text-gray-500">{hex}</div>
      </div>

      {/* Contrast badge — text + icon, not color alone (WCAG 1.4.1) */}
      <div
        className={[
          "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
          passes
            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        ].join(" ")}
        aria-label={`Contrast ratio: ${contrast ?? "unknown"}:1 ${passes ? "(passes WCAG AA)" : "(fails WCAG AA)"}`}
      >
        {/* Icon: check or x */}
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
          {passes
            ? <polyline points="20 6 9 17 4 12" />
            : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          }
        </svg>
        <span>{contrast ?? "?"  }:1</span>
      </div>
    </div>
  );
}

// ─── FontPreview ──────────────────────────────────────────────────────────────

/**
 * Shows a typography sample rendered in the configured heading and body fonts.
 *
 * @param {object}  props
 * @param {string}  [props.headingFont]
 * @param {string}  [props.bodyFont]
 */
function FontPreview({ headingFont, bodyFont }) {
  return (
    <section aria-labelledby="font-preview-heading" className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <h3 id="font-preview-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Typography Preview
      </h3>

      {/* Heading sample */}
      <p
        className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
        style={{ fontFamily: headingFont ?? "inherit" }}
      >
        Green Leaf Dispensary
      </p>

      {/* Subheading */}
      <p
        className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2"
        style={{ fontFamily: headingFont ?? "inherit" }}
      >
        Premium Cannabis Products
      </p>

      {/* Body copy */}
      <p
        className="text-sm leading-relaxed text-gray-600 dark:text-gray-400"
        style={{ fontFamily: bodyFont ?? "inherit" }}
      >
        Browse our curated selection of flower, edibles, concentrates, and more.
        All products are lab-tested and compliant with state regulations.
      </p>

      {/* Font names */}
      <div className="mt-3 flex flex-wrap gap-2">
        {headingFont && (
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-500 font-mono">
            Heading: {headingFont.split(",")[0]}
          </span>
        )}
        {bodyFont && (
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-500 font-mono">
            Body: {bodyFont.split(",")[0]}
          </span>
        )}
      </div>
    </section>
  );
}

// ─── UIPreview ────────────────────────────────────────────────────────────────

/**
 * A contained mock storefront UI that uses inline CSS variables so it previews
 * the branding WITHOUT modifying the global document root.
 *
 * Uses CSS variables injected on the wrapper div:
 *   style={{ "--primary": hslChannels, "--accent": hslChannels }}
 *
 * Child elements reference them as:
 *   background: hsl(var(--primary))  ← applies the preview color
 *
 * @param {object}  props
 * @param {string}  [props.primaryHSL]    - HSL channels string
 * @param {string}  [props.primaryFg]     - Foreground on primary (hex)
 * @param {string}  [props.secondaryHSL]
 * @param {string}  [props.accentHSL]
 * @param {string}  [props.headingFont]
 * @param {string}  [props.bodyFont]
 * @param {string}  [props.orgName]
 * @param {string}  [props.logoUrl]
 */
function UIPreview({
  primaryHSL, primaryFg,
  secondaryHSL, accentHSL,
  headingFont, bodyFont,
  orgName = "Green Leaf",
  logoUrl,
}) {
  const previewVars = {
    "--preview-primary":   primaryHSL   ?? "160 84% 39%",
    "--preview-secondary": secondaryHSL ?? "239 84% 67%",
    "--preview-accent":    accentHSL    ?? "38 92% 50%",
  };

  return (
    <section
      aria-labelledby="ui-preview-heading"
      className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      // Preview CSS vars injected ONLY on this wrapper, not on document root
      style={previewVars}
    >
      <h3 id="ui-preview-heading" className="sr-only">
        UI Preview
      </h3>

      {/* Mock navbar */}
      <nav
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "hsl(var(--preview-primary))" }}
        aria-label="Storefront navbar preview"
      >
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" aria-hidden="true" className="h-7 w-7 rounded object-cover" />
          ) : (
            <div
              className="h-7 w-7 rounded-lg flex-shrink-0"
              style={{ backgroundColor: "hsl(var(--preview-primary) / 0.4)" }}
              aria-hidden="true"
            />
          )}
          <span
            className="text-sm font-bold"
            style={{
              color: primaryFg ?? "#fff",
              fontFamily: headingFont ?? "inherit",
            }}
          >
            {orgName}
          </span>
        </div>
        <div className="flex gap-2">
          <div
            className="h-6 w-16 rounded-full"
            style={{ backgroundColor: "hsl(var(--preview-primary) / 0.5)" }}
            aria-hidden="true"
          />
          <div
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor: "hsl(var(--preview-primary) / 0.5)" }}
            aria-hidden="true"
          />
        </div>
      </nav>

      {/* Mock content area */}
      <div className="bg-white dark:bg-gray-900 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Preview content
        </p>

        {/* Mock product card */}
        <div className="flex gap-3 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
          <div className="h-14 w-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5"
              style={{ fontFamily: headingFont ?? "inherit" }}
            >
              Blue Dream
            </div>
            <div
              className="text-xs text-gray-500 mb-2"
              style={{ fontFamily: bodyFont ?? "inherit" }}
            >
              Sativa dominant hybrid · 24.5% THC
            </div>
            <div className="flex items-center gap-2">
              {/* Primary button */}
              <button
                type="button"
                className="h-7 rounded-lg px-3 text-xs font-semibold"
                style={{
                  backgroundColor: "hsl(var(--preview-primary))",
                  color: primaryFg ?? "#fff",
                }}
              >
                Add to Cart
              </button>
              {/* Accent badge */}
              <span
                className="h-5 rounded-full px-2 text-xs font-medium inline-flex items-center"
                style={{ backgroundColor: "hsl(var(--preview-accent) / 0.15)", color: "hsl(var(--preview-accent))" }}
              >
                Sale
              </span>
            </div>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">$45</div>
        </div>

        {/* Mock secondary button */}
        <button
          type="button"
          className="w-full h-9 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: "hsl(var(--preview-secondary) / 0.1)",
            color: "hsl(var(--preview-secondary))",
          }}
        >
          View All Products →
        </button>
      </div>
    </section>
  );
}

// ─── ContrastReport ───────────────────────────────────────────────────────────

/**
 * Shows WCAG contrast ratios for each brand color against white and dark backgrounds.
 * Results update in real time as the admin changes color values.
 *
 * WCAG 1.4.1: Failures shown with text + icon (not color alone).
 * WCAG 4.1.3: Wrapped in role="status" aria-live="polite" so SR hears updates.
 *
 * @param {object}  props
 * @param {string}  [props.primaryHex]
 * @param {string}  [props.secondaryHex]
 * @param {string}  [props.accentHex]
 */
function ContrastReport({ primaryHex, secondaryHex, accentHex }) {
  const WHITE = "#ffffff";
  const DARK  = "#111827";  // gray-900

  const checks = [
    { label: "Primary on white",  fg: primaryHex,   bg: WHITE },
    { label: "Primary on dark",   fg: primaryHex,   bg: DARK  },
    { label: "Secondary on white", fg: secondaryHex, bg: WHITE },
    { label: "Accent on white",   fg: accentHex,    bg: WHITE },
  ].filter((c) => isValidHex(c.fg));

  const allPass = checks.every((c) => checkContrast(c.fg, c.bg, 4.5).passes);

  return (
    <section
      aria-labelledby="contrast-report-heading"
      role="status"
      aria-live="polite"
      aria-label="WCAG contrast check results — updates as you change colors"
      className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          id="contrast-report-heading"
          className="text-xs font-semibold uppercase tracking-wider text-gray-400"
        >
          WCAG Contrast (4.5:1 AA)
        </h3>
        {/* Overall status — text + icon */}
        <span
          className={[
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
            allPass
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          ].join(" ")}
          aria-label={allPass ? "All color pairs pass WCAG AA" : "Some color pairs fail WCAG AA"}
        >
          {allPass ? "✓ All pass" : "⚠ Issues found"}
        </span>
      </div>

      {checks.length === 0 ? (
        <p className="text-sm text-gray-400">Enter valid hex colors to see contrast results.</p>
      ) : (
        <ul role="list" className="space-y-2">
          {checks.map(({ label, fg, bg }) => {
            const result = checkContrast(fg, bg, 4.5);
            return (
              <li
                key={label}
                role="listitem"
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span
                  className={[
                    "flex items-center gap-1 font-mono font-semibold",
                    result.passes
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  ].join(" ")}
                  aria-label={`${result.ratio ?? "unknown"} to 1 ratio — ${result.passes ? "passes" : "fails"} WCAG AA`}
                >
                  {result.passes
                    ? <span aria-hidden="true">✓</span>
                    : <span aria-hidden="true">✗</span>
                  }
                  {result.ratio ?? "?"}:1
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── BrandingPreview ──────────────────────────────────────────────────────────

/**
 * The main branding preview panel aggregating all sub-components.
 *
 * @param {object}  props
 * @param {object}  props.branding     - Branding config being previewed (not yet saved)
 * @param {string}  [props.orgName]    - Organization name for the mock navbar
 */
export function BrandingPreview({ branding, orgName }) {
  const colors = branding?.colors ?? {};
  const fonts  = branding?.fonts  ?? {};

  // Compute HSL channels for the preview vars
  const primaryHex   = isValidHex(colors.primary)   ? colors.primary   : null;
  const secondaryHex = isValidHex(colors.secondary) ? colors.secondary : null;
  const accentHex    = isValidHex(colors.accent)    ? colors.accent    : null;

  const primaryHSL   = primaryHex   ? hexToHSL(primaryHex)   : null;
  const secondaryHSL = secondaryHex ? hexToHSL(secondaryHex) : null;
  const accentHSL    = accentHex    ? hexToHSL(accentHex)    : null;
  const primaryFg    = primaryHex   ? getAccessibleForeground(primaryHex) : "#ffffff";

  return (
    <aside
      aria-labelledby="branding-preview-title"
      className="flex flex-col gap-4 w-full"
    >
      <h2
        id="branding-preview-title"
        className="text-base font-bold text-gray-800 dark:text-white"
      >
        Live Preview
      </h2>

      {/* Color swatches */}
      <section aria-labelledby="colors-preview-heading">
        <h3
          id="colors-preview-heading"
          className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
        >
          Brand Colors
        </h3>
        <div className="space-y-2">
          <ColorSwatch label="Primary"   hex={primaryHex   ?? "#10b981"} onHex="#ffffff" />
          <ColorSwatch label="Secondary" hex={secondaryHex ?? "#6366f1"} onHex="#ffffff" />
          <ColorSwatch label="Accent"    hex={accentHex    ?? "#f59e0b"} onHex="#ffffff" />
        </div>
      </section>

      {/* Typography sample */}
      <FontPreview
        headingFont={fonts.heading}
        bodyFont={fonts.body}
      />

      {/* Contrast report */}
      <ContrastReport
        primaryHex={primaryHex}
        secondaryHex={secondaryHex}
        accentHex={accentHex}
      />

      {/* UI preview (uses contained CSS vars) */}
      <UIPreview
        primaryHSL={primaryHSL}
        primaryFg={primaryFg}
        secondaryHSL={secondaryHSL}
        accentHSL={accentHSL}
        headingFont={fonts.heading}
        bodyFont={fonts.body}
        orgName={orgName}
        logoUrl={branding?.logo?.url}
      />
    </aside>
  );
}
