import { useState } from "react";

const COLORS = {
  forest: { hex: "#0A1F0A", name: "Deep Forest", usage: "Backgrounds, anchoring" },
  primary: { hex: "#1B5E20", name: "Canopy Green", usage: "Primary brand, structure" },
  accent: { hex: "#4CAF50", name: "New Growth", usage: "Active states, CTAs" },
  gold: { hex: "#C9A84C", name: "Harvest Gold", usage: "Premium, emphasis" },
  cream: { hex: "#F0F4E8", name: "Warm Cream", usage: "Backgrounds, text areas" },
  white: { hex: "#FFFFFF", name: "Pure White", usage: "Cards, clean surfaces" },
  dark: { hex: "#0D0D0D", name: "Near Black", usage: "Text, deep contrast" },
  mid: { hex: "#2E7D32", name: "Mid Green", usage: "Secondary, hover states" },
  lightGold: { hex: "#D4B86A", name: "Soft Gold", usage: "Highlights, borders" },
  muted: { hex: "#6B8E6B", name: "Sage", usage: "Muted text, disabled states" },
};

const FONT_STACK = {
  display: { family: "'Outfit', sans-serif", weight: "700", name: "Outfit Bold", role: "Headlines, hero text, logo wordmark" },
  heading: { family: "'Outfit', sans-serif", weight: "600", name: "Outfit SemiBold", role: "Section headings, navigation" },
  body: { family: "'DM Sans', sans-serif", weight: "400", name: "DM Sans Regular", role: "Body copy, descriptions, UI text" },
  bodyBold: { family: "'DM Sans', sans-serif", weight: "700", name: "DM Sans Bold", role: "Emphasis, labels, buttons" },
  mono: { family: "'JetBrains Mono', monospace", weight: "400", name: "JetBrains Mono", role: "Code, data, technical contexts" },
};

const TYPE_SCALE = [
  { name: "Display XL", size: "4rem", leading: "1.05", tracking: "-0.03em", font: "display", sample: "CannaSaas" },
  { name: "Display", size: "2.5rem", leading: "1.1", tracking: "-0.02em", font: "display", sample: "Grow Smarter" },
  { name: "H1", size: "2rem", leading: "1.2", tracking: "-0.015em", font: "heading", sample: "Dispensary Management" },
  { name: "H2", size: "1.5rem", leading: "1.25", tracking: "-0.01em", font: "heading", sample: "Compliance Built In" },
  { name: "H3", size: "1.125rem", leading: "1.3", tracking: "0", font: "heading", sample: "Metrc Integration" },
  { name: "Body", size: "1rem", leading: "1.6", tracking: "0", font: "body", sample: "The all-in-one platform for cannabis dispensary operations across NY, NJ, and CT." },
  { name: "Small", size: "0.875rem", leading: "1.5", tracking: "0.01em", font: "body", sample: "Starting at $299/mo" },
  { name: "Mono", size: "0.875rem", leading: "1.6", tracking: "0.02em", font: "mono", sample: "POST /api/v1/orders" },
];

// SVG Logo Components
function LogoIcon({ size = 64, color = "#1B5E20", className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Geometric cannabis leaf constructed from precise segments */}
      <g transform="translate(60,60)">
        {/* Central stem / node */}
        <circle cx="0" cy="0" r="6" fill={color} opacity="0.9" />
        
        {/* Top leaf blade - largest */}
        <path d="M0,-8 C-4,-20 -14,-36 -8,-50 C-4,-56 4,-56 8,-50 C14,-36 4,-20 0,-8Z" fill={color} opacity="0.95" />
        
        {/* Upper-left blade */}
        <path d="M-5,-5 C-14,-12 -30,-22 -38,-16 C-44,-12 -42,-4 -36,0 C-26,6 -14,-1 -5,-5Z" fill={color} opacity="0.85" />
        
        {/* Upper-right blade */}
        <path d="M5,-5 C14,-12 30,-22 38,-16 C44,-12 42,-4 36,0 C26,6 14,-1 5,-5Z" fill={color} opacity="0.85" />
        
        {/* Lower-left blade */}
        <path d="M-4,2 C-12,6 -26,14 -30,24 C-32,30 -26,34 -20,32 C-12,28 -8,14 -4,2Z" fill={color} opacity="0.75" />
        
        {/* Lower-right blade */}
        <path d="M4,2 C12,6 26,14 30,24 C32,30 26,34 20,32 C12,28 8,14 4,2Z" fill={color} opacity="0.75" />
        
        {/* Stem */}
        <path d="M-1.5,6 L-1.5,38 C-1.5,40 1.5,40 1.5,38 L1.5,6Z" fill={color} opacity="0.7" />
        
        {/* Data node dots along the leaf - tech element */}
        <circle cx="0" cy="-32" r="2.5" fill={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)"} />
        <circle cx="-22" cy="-8" r="2" fill={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)"} />
        <circle cx="22" cy="-8" r="2" fill={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)"} />
        <circle cx="-14" cy="18" r="1.5" fill={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)"} />
        <circle cx="14" cy="18" r="1.5" fill={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)"} />
        
        {/* Connection lines between nodes - circuit trace feel */}
        <line x1="0" y1="-32" x2="-22" y2="-8" stroke={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.25)"} strokeWidth="0.8" />
        <line x1="0" y1="-32" x2="22" y2="-8" stroke={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.25)"} strokeWidth="0.8" />
        <line x1="-22" y1="-8" x2="-14" y2="18" stroke={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.25)"} strokeWidth="0.8" />
        <line x1="22" y1="-8" x2="14" y2="18" stroke={color === "#FFFFFF" || color === "#F0F4E8" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.25)"} strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function LogoFull({ height = 48, color = "#1B5E20", textColor = null }) {
  const tc = textColor || color;
  const iconScale = height / 48;
  const iconSize = 40 * iconScale;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: `${8 * iconScale}px` }}>
      <LogoIcon size={iconSize} color={color} />
      <span style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        fontSize: `${height * 0.55}px`,
        color: tc,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>
        Canna<span style={{ color: color === tc ? COLORS.accent.hex : color }}>Saas</span>
      </span>
    </div>
  );
}

// Brand Pattern Background
function BrandPattern({ opacity = 0.04, color = "#1B5E20" }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="brandGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1" fill={color} />
          <line x1="20" y1="0" x2="20" y2="40" stroke={color} strokeWidth="0.3" opacity="0.5" />
          <line x1="0" y1="20" x2="40" y2="20" stroke={color} strokeWidth="0.3" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#brandGrid)" />
    </svg>
  );
}

// Tab navigation
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "logos", label: "Logos" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "treatments", label: "Treatments" },
  { id: "guidelines", label: "Guidelines" },
];

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: "2rem", color: COLORS.forest.hex,
        letterSpacing: "-0.02em", margin: 0,
      }}>{children}</h2>
      {sub && <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: "1rem",
        color: COLORS.muted.hex, marginTop: 8, lineHeight: 1.6,
      }}>{sub}</p>}
    </div>
  );
}

// ─── OVERVIEW ──────────────────────────────
function OverviewTab() {
  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.forest.hex} 0%, ${COLORS.primary.hex} 100%)`,
        borderRadius: 16, padding: "56px 48px", marginBottom: 40, position: "relative", overflow: "hidden",
      }}>
        <BrandPattern opacity={0.06} color="#4CAF50" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <LogoFull height={56} color="#FFFFFF" textColor="#FFFFFF" />
          <p style={{
            fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.8)",
            fontSize: "1.125rem", marginTop: 20, maxWidth: 540, lineHeight: 1.7,
          }}>
            The all-in-one dispensary management platform for cannabis operators in NY, NJ, and CT. Built for compliance. Designed for growth.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            {["SaaS Platform", "Multi-Tenant", "Metrc Integrated", "Tri-State"].map(tag => (
              <span key={tag} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 700,
                color: COLORS.gold.hex, background: "rgba(201,168,76,0.12)",
                padding: "6px 14px", borderRadius: 100, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Pillars */}
      <SectionTitle sub="The four principles that guide every brand decision.">Brand Pillars</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
        {[
          { icon: "◆", title: "Cultivated", desc: "Rooted in the plant, elevated by design. We honor the industry while moving it forward." },
          { icon: "⬡", title: "Precise", desc: "Every detail is intentional. From color values to kerning, nothing is arbitrary." },
          { icon: "◎", title: "Trustworthy", desc: "Clean, professional, compliant. The brand communicates reliability at every touchpoint." },
          { icon: "▲", title: "Approachable", desc: "Enterprise-grade without the enterprise coldness. Warm, human, ready to help." },
        ].map(p => (
          <div key={p.title} style={{
            background: COLORS.cream.hex, borderRadius: 12, padding: 28,
            border: `1px solid rgba(27,94,32,0.08)`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 12, color: COLORS.primary.hex }}>{p.icon}</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "1.125rem", color: COLORS.forest.hex, margin: "0 0 8px" }}>{p.title}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: COLORS.muted.hex, lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick palette + type preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "1rem", color: COLORS.forest.hex, marginBottom: 16 }}>Core Palette</h3>
          <div style={{ display: "flex", gap: 4, borderRadius: 12, overflow: "hidden", height: 64 }}>
            {["forest", "primary", "accent", "gold", "cream"].map(k => (
              <div key={k} style={{ flex: 1, background: COLORS[k].hex, display: "flex", alignItems: "flex-end", padding: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: k === "cream" ? COLORS.forest.hex : "#fff", opacity: 0.8 }}>{COLORS[k].hex}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "1rem", color: COLORS.forest.hex, marginBottom: 16 }}>Type System</h3>
          <div style={{ background: COLORS.cream.hex, borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: COLORS.forest.hex, letterSpacing: "-0.02em" }}>Outfit Bold</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: COLORS.muted.hex, marginTop: 4 }}>DM Sans for body copy</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: COLORS.accent.hex, marginTop: 4 }}>JetBrains Mono for code</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOGOS ──────────────────────────────
function LogosTab() {
  return (
    <div>
      <SectionTitle sub="The CannaSaas mark combines a geometric cannabis leaf with data-node connectivity patterns.">Logo System</SectionTitle>

      {/* Primary Logo */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Primary Lockup</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{
          background: "#fff", border: `1px solid rgba(27,94,32,0.1)`,
          borderRadius: 12, padding: 40, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <LogoFull height={52} color={COLORS.primary.hex} />
        </div>
        <div style={{
          background: COLORS.forest.hex,
          borderRadius: 12, padding: 40, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <LogoFull height={52} color="#FFFFFF" textColor="#FFFFFF" />
        </div>
      </div>

      {/* Icon Mark */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Icon Mark</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { bg: "#fff", color: COLORS.primary.hex, label: "Primary" },
          { bg: COLORS.forest.hex, color: "#fff", label: "Reversed" },
          { bg: COLORS.cream.hex, color: COLORS.forest.hex, label: "On Cream" },
          { bg: COLORS.primary.hex, color: "#fff", label: "On Primary" },
        ].map(v => (
          <div key={v.label} style={{
            background: v.bg, borderRadius: 12, padding: 32,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            border: v.bg === "#fff" ? `1px solid rgba(27,94,32,0.1)` : "none",
          }}>
            <LogoIcon size={56} color={v.color} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: v.bg === "#fff" || v.bg === COLORS.cream.hex ? COLORS.muted.hex : "rgba(255,255,255,0.6)" }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Wordmark */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Wordmark Only</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{
          background: "#fff", border: `1px solid rgba(27,94,32,0.1)`,
          borderRadius: 12, padding: 36, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 700,
            fontSize: 36, color: COLORS.primary.hex, letterSpacing: "-0.02em",
          }}>Canna<span style={{ color: COLORS.accent.hex }}>Saas</span></span>
        </div>
        <div style={{
          background: COLORS.forest.hex,
          borderRadius: 12, padding: 36, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 700,
            fontSize: 36, color: "#fff", letterSpacing: "-0.02em",
          }}>Canna<span style={{ color: COLORS.accent.hex }}>Saas</span></span>
        </div>
      </div>

      {/* Clear Space */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Minimum Clear Space</h3>
      <div style={{
        background: COLORS.cream.hex, borderRadius: 12, padding: 40,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          border: `2px dashed ${COLORS.accent.hex}40`,
          padding: "24px 32px", borderRadius: 8, position: "relative",
        }}>
          <LogoFull height={44} color={COLORS.primary.hex} />
          <span style={{
            position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.accent.hex,
          }}>1x height min clearance on all sides</span>
        </div>
      </div>
    </div>
  );
}

// ─── COLORS ──────────────────────────────
function ColorsTab() {
  const [copied, setCopied] = useState(null);
  const copy = (hex) => {
    navigator.clipboard?.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1200);
  };

  const colorGroups = [
    { title: "Primary", keys: ["forest", "primary", "mid"] },
    { title: "Accent", keys: ["accent", "gold", "lightGold"] },
    { title: "Neutral", keys: ["cream", "white", "dark", "muted"] },
  ];

  return (
    <div>
      <SectionTitle sub="A palette rooted in deep forest greens with gold premium accents. Every value is intentional.">Color System</SectionTitle>

      {colorGroups.map(group => (
        <div key={group.title} style={{ marginBottom: 36 }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{group.title}</h3>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${group.keys.length}, 1fr)`, gap: 12 }}>
            {group.keys.map(k => {
              const c = COLORS[k];
              const isLight = ["cream", "white", "lightGold"].includes(k);
              return (
                <div key={k} onClick={() => copy(c.hex)} style={{
                  borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  border: isLight ? `1px solid rgba(0,0,0,0.08)` : "none",
                  transition: "transform 0.15s", transform: copied === c.hex ? "scale(0.97)" : "scale(1)",
                }}>
                  <div style={{ background: c.hex, height: 80, display: "flex", alignItems: "flex-end", padding: 10 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      color: isLight ? COLORS.forest.hex : "#fff", opacity: 0.8,
                    }}>{copied === c.hex ? "Copied!" : c.hex}</span>
                  </div>
                  <div style={{ background: "#fff", padding: "10px 12px" }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.8rem", color: COLORS.forest.hex }}>{c.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", color: COLORS.muted.hex, marginTop: 2 }}>{c.usage}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Gradient Ramps */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Gradients</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { name: "Primary Depth", grad: `linear-gradient(135deg, ${COLORS.forest.hex}, ${COLORS.primary.hex})` },
          { name: "Growth", grad: `linear-gradient(135deg, ${COLORS.primary.hex}, ${COLORS.accent.hex})` },
          { name: "Premium", grad: `linear-gradient(135deg, ${COLORS.forest.hex}, ${COLORS.gold.hex})` },
        ].map(g => (
          <div key={g.name} style={{ borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: g.grad, height: 56 }} />
            <div style={{ background: "#fff", padding: "8px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: COLORS.muted.hex }}>{g.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TYPOGRAPHY ──────────────────────────
function TypographyTab() {
  return (
    <div>
      <SectionTitle sub="A three-tier type system: Outfit for display authority, DM Sans for readable body text, JetBrains Mono for technical precision.">Typography</SectionTitle>

      {/* Font specimens */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 40 }}>
        {Object.entries(FONT_STACK).filter(([k]) => ["display", "body", "mono"].includes(k)).map(([k, f]) => (
          <div key={k} style={{ background: COLORS.cream.hex, borderRadius: 12, padding: 24 }}>
            <div style={{ fontFamily: f.family, fontWeight: f.weight, fontSize: k === "display" ? "2.5rem" : "1.75rem", color: COLORS.forest.hex, lineHeight: 1.1, marginBottom: 12 }}>
              Aa
            </div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.8rem", color: COLORS.primary.hex }}>{f.name}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: COLORS.muted.hex, marginTop: 4 }}>{f.role}</div>
            <div style={{ fontFamily: f.family, fontWeight: f.weight, fontSize: "0.7rem", color: COLORS.muted.hex, marginTop: 12, lineHeight: 1.5 }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
              abcdefghijklmnopqrstuvwxyz<br/>
              0123456789 !@#$%
            </div>
          </div>
        ))}
      </div>

      {/* Type Scale */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Type Scale</h3>
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid rgba(27,94,32,0.08)`, overflow: "hidden" }}>
        {TYPE_SCALE.map((t, i) => (
          <div key={t.name} style={{
            display: "grid", gridTemplateColumns: "120px 1fr 100px",
            alignItems: "baseline", padding: "16px 24px",
            borderBottom: i < TYPE_SCALE.length - 1 ? `1px solid rgba(27,94,32,0.06)` : "none",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.primary.hex }}>{t.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted.hex }}>{t.size}</span>
            </div>
            <span style={{
              fontFamily: FONT_STACK[t.font].family,
              fontWeight: FONT_STACK[t.font].weight,
              fontSize: `min(${t.size}, 2rem)`,
              lineHeight: t.leading,
              letterSpacing: t.tracking,
              color: COLORS.forest.hex,
            }}>{t.sample}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted.hex, textAlign: "right" }}>
              {t.leading} / {t.tracking}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TREATMENTS ──────────────────────────
function TreatmentsTab() {
  return (
    <div>
      <SectionTitle sub="Logo and brand applied across contexts — cards, badges, marketing surfaces, and UI components.">Brand Treatments</SectionTitle>

      {/* App Bar Treatment */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>App Navigation Bar</h3>
      <div style={{
        background: COLORS.forest.hex, borderRadius: 12, padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32,
      }}>
        <LogoFull height={32} color="#fff" textColor="#fff" />
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["Dashboard", "Orders", "Products", "Compliance"].map(item => (
            <span key={item} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
              color: item === "Dashboard" ? "#fff" : "rgba(255,255,255,0.5)",
              fontWeight: item === "Dashboard" ? 700 : 400,
            }}>{item}</span>
          ))}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.accent.hex}, ${COLORS.primary.hex})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff",
          }}>DL</div>
        </div>
      </div>

      {/* Marketing Card */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Marketing Card</h3>
      <div style={{
        background: `linear-gradient(160deg, ${COLORS.forest.hex} 0%, ${COLORS.primary.hex} 60%, ${COLORS.mid.hex} 100%)`,
        borderRadius: 16, padding: 48, marginBottom: 32, position: "relative", overflow: "hidden",
      }}>
        <BrandPattern opacity={0.05} color="#4CAF50" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem",
            color: COLORS.gold.hex, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16,
          }}>Starting at $299/mo</div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 700,
            fontSize: "2.25rem", color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em",
            margin: "0 0 16px", maxWidth: 400,
          }}>Run your dispensary<br/>like it's 2026.</h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "1rem",
            color: "rgba(255,255,255,0.7)", maxWidth: 360, lineHeight: 1.6, margin: "0 0 28px",
          }}>Compliance, inventory, POS, and analytics — one platform for NY, NJ, and CT operators.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.875rem",
              background: COLORS.accent.hex, color: "#fff", border: "none",
              padding: "12px 28px", borderRadius: 8, cursor: "pointer",
            }}>Get Started</button>
            <button style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.875rem",
              background: "rgba(255,255,255,0.08)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "12px 28px", borderRadius: 8, cursor: "pointer",
            }}>Book a Demo</button>
          </div>
        </div>
        <div style={{ position: "absolute", right: 30, bottom: 20, opacity: 0.08 }}>
          <LogoIcon size={200} color="#fff" />
        </div>
      </div>

      {/* Badge / Tag Treatments */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Badges & Tags</h3>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
        {[
          { label: "Active", bg: `${COLORS.accent.hex}18`, color: COLORS.accent.hex },
          { label: "Pending Sync", bg: `${COLORS.gold.hex}18`, color: COLORS.gold.hex },
          { label: "Compliant", bg: `${COLORS.primary.hex}15`, color: COLORS.primary.hex },
          { label: "Enterprise", bg: COLORS.forest.hex, color: COLORS.gold.hex },
          { label: "Metrc Synced", bg: `${COLORS.accent.hex}10`, color: COLORS.accent.hex, mono: true },
        ].map(b => (
          <span key={b.label} style={{
            fontFamily: b.mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
            fontWeight: 700, fontSize: "0.75rem",
            background: b.bg, color: b.color,
            padding: "6px 14px", borderRadius: 6, letterSpacing: "0.02em",
          }}>{b.label}</span>
        ))}
      </div>

      {/* Favicon / App Icon */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>App Icon / Favicon</h3>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 32 }}>
        {[64, 48, 32, 16].map(s => (
          <div key={s} style={{
            width: s, height: s,
            background: `linear-gradient(135deg, ${COLORS.forest.hex}, ${COLORS.primary.hex})`,
            borderRadius: s > 24 ? 12 : s > 16 ? 8 : 4,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LogoIcon size={s * 0.72} color="#fff" />
          </div>
        ))}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.muted.hex, marginLeft: 8 }}>64 · 48 · 32 · 16px</span>
      </div>

      {/* Pricing Tier Card */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Pricing Card Treatment</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { name: "Starter", price: "$299", desc: "Single location", featured: false },
          { name: "Growth", price: "$599", desc: "Up to 3 locations", featured: true },
          { name: "Enterprise", price: "Custom", desc: "Unlimited locations", featured: false },
        ].map(tier => (
          <div key={tier.name} style={{
            background: tier.featured ? `linear-gradient(160deg, ${COLORS.forest.hex}, ${COLORS.primary.hex})` : "#fff",
            border: tier.featured ? "none" : `1px solid rgba(27,94,32,0.1)`,
            borderRadius: 14, padding: 28, position: "relative", overflow: "hidden",
          }}>
            {tier.featured && <BrandPattern opacity={0.05} color="#4CAF50" />}
            <div style={{ position: "relative", zIndex: 1 }}>
              {tier.featured && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: COLORS.gold.hex, background: "rgba(201,168,76,0.15)",
                  padding: "3px 10px", borderRadius: 4, letterSpacing: "0.08em", textTransform: "uppercase",
                }}>Popular</span>
              )}
              <h4 style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "1rem",
                color: tier.featured ? "#fff" : COLORS.forest.hex, margin: `${tier.featured ? 12 : 0}px 0 4px`,
              }}>{tier.name}</h4>
              <div style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "2rem",
                color: tier.featured ? "#fff" : COLORS.primary.hex, letterSpacing: "-0.02em",
              }}>{tier.price}<span style={{ fontSize: "0.875rem", fontWeight: 400, opacity: 0.6 }}>{tier.price !== "Custom" ? "/mo" : ""}</span></div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
                color: tier.featured ? "rgba(255,255,255,0.6)" : COLORS.muted.hex, marginTop: 6,
              }}>{tier.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GUIDELINES ──────────────────────────
function GuidelinesTab() {
  return (
    <div>
      <SectionTitle sub="Rules and boundaries to maintain brand integrity across every touchpoint.">Usage Guidelines</SectionTitle>

      {/* Do's */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.accent.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>✓ Do</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {[
          { title: "Use the bi-color wordmark", desc: "'Canna' in primary/white, 'Saas' in accent green. This split is core to recognition." },
          { title: "Maintain clear space", desc: "Always allow minimum 1x icon height of clear space around the full logo lockup." },
          { title: "Use on brand backgrounds", desc: "Primary on white/cream, reversed on forest/primary. Gold sparingly for premium emphasis." },
          { title: "Pair Outfit + DM Sans", desc: "Outfit for headlines and navigation, DM Sans for body. JetBrains Mono for code/data only." },
        ].map(d => (
          <div key={d.title} style={{
            background: `${COLORS.accent.hex}08`, border: `1px solid ${COLORS.accent.hex}20`,
            borderRadius: 10, padding: 20,
          }}>
            <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.forest.hex, margin: "0 0 6px" }}>{d.title}</h4>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: COLORS.muted.hex, lineHeight: 1.5, margin: 0 }}>{d.desc}</p>
          </div>
        ))}
      </div>

      {/* Don'ts */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#C62828", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>✗ Don't</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {[
          { title: "Stretch or distort the logo", desc: "The mark and wordmark have fixed proportions. Never compress, stretch, or skew." },
          { title: "Use bright/neon greens", desc: "Avoid recreational-feeling neon or lime greens. The palette is forest-rooted and serious." },
          { title: "Set body text in Outfit", desc: "Outfit is a display face. Long-form text must use DM Sans for readability." },
          { title: "Place logo on busy backgrounds", desc: "The logo requires clean surfaces. Never overlay on photos or patterned backgrounds without a backing shape." },
        ].map(d => (
          <div key={d.title} style={{
            background: "#C6282808", border: "1px solid #C6282820",
            borderRadius: 10, padding: 20,
          }}>
            <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.forest.hex, margin: "0 0 6px" }}>{d.title}</h4>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: COLORS.muted.hex, lineHeight: 1.5, margin: 0 }}>{d.desc}</p>
          </div>
        ))}
      </div>

      {/* CSS Variables */}
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: COLORS.muted.hex, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>CSS Design Tokens</h3>
      <div style={{
        background: COLORS.forest.hex, borderRadius: 12, padding: 24,
        fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", lineHeight: 2,
      }}>
        <div style={{ color: COLORS.muted.hex }}>:root {"{"}</div>
        {[
          ["--cs-forest", COLORS.forest.hex],
          ["--cs-primary", COLORS.primary.hex],
          ["--cs-mid", COLORS.mid.hex],
          ["--cs-accent", COLORS.accent.hex],
          ["--cs-gold", COLORS.gold.hex],
          ["--cs-gold-light", COLORS.lightGold.hex],
          ["--cs-cream", COLORS.cream.hex],
          ["--cs-muted", COLORS.muted.hex],
          ["--cs-dark", COLORS.dark.hex],
          ["", ""],
          ["--cs-font-display", "'Outfit', sans-serif"],
          ["--cs-font-body", "'DM Sans', sans-serif"],
          ["--cs-font-mono", "'JetBrains Mono', monospace"],
          ["", ""],
          ["--cs-radius-sm", "6px"],
          ["--cs-radius-md", "10px"],
          ["--cs-radius-lg", "14px"],
          ["--cs-radius-xl", "16px"],
        ].map(([k, v], i) =>
          k ? (
            <div key={i} style={{ paddingLeft: 24 }}>
              <span style={{ color: COLORS.accent.hex }}>{k}</span>
              <span style={{ color: COLORS.muted.hex }}>: </span>
              <span style={{ color: COLORS.gold.hex }}>{v}</span>
              <span style={{ color: COLORS.muted.hex }}>;</span>
            </div>
          ) : <div key={i} style={{ height: 8 }} />
        )}
        <div style={{ color: COLORS.muted.hex }}>{"}"}</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────
export default function BrandBook() {
  const [tab, setTab] = useState("overview");

  const renderTab = () => {
    switch (tab) {
      case "overview": return <OverviewTab />;
      case "logos": return <LogosTab />;
      case "colors": return <ColorsTab />;
      case "typography": return <TypographyTab />;
      case "treatments": return <TreatmentsTab />;
      case "guidelines": return <GuidelinesTab />;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#FAFBF7", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=DM+Sans:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: `1px solid rgba(27,94,32,0.06)`,
        padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <LogoIcon size={28} color={COLORS.primary.hex} />
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1rem",
            color: COLORS.forest.hex, letterSpacing: "-0.01em",
          }}>Brand Guide</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: COLORS.muted.hex, background: COLORS.cream.hex,
            padding: "3px 8px", borderRadius: 4,
          }}>v1.0</span>
        </div>
        <div style={{ display: "flex", gap: 2, background: COLORS.cream.hex, borderRadius: 8, padding: 3 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: tab === t.id ? 700 : 400,
                fontSize: "0.8rem",
                color: tab === t.id ? COLORS.forest.hex : COLORS.muted.hex,
                background: tab === t.id ? "#fff" : "transparent",
                border: "none", borderRadius: 6, padding: "7px 16px",
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px 80px" }}>
        {renderTab()}
      </div>
    </div>
  );
}
