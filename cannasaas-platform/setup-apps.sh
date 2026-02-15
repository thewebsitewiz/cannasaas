#!/bin/bash
# =============================================================
# CannaSaas App Setup Script
# Run from the monorepo root: ./setup-apps.sh
# Sets up Tailwind v3, shadcn/ui prereqs, path aliases,
# and Vite config for each app that still needs it.
# =============================================================

set -e

APPS=("storefront" "admin" "staff")

for app in "${APPS[@]}"; do
  echo ""
  echo "========================================="
  echo "  Setting up apps/$app"
  echo "========================================="
  cd "apps/$app"

  # ----- 1. Remove Tailwind v4 if present, install v3 pinned -----
  echo "→ Installing dependencies..."
  pnpm remove tailwindcss postcss autoprefixer 2>/dev/null || true
  pnpm add tailwindcss@3 postcss autoprefixer

  # ----- 2. Radix UI primitives + utility libs -----
  pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
    @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast
  pnpm add class-variance-authority clsx tailwind-merge

  # ----- 3. Node types for path resolution in vite.config -----
  pnpm add -D @types/node

  # ----- 4. Tailwind config with content paths -----
  echo "→ Writing tailwind.config.js..."
  cat > tailwind.config.js << 'TAILWIND'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
TAILWIND

  # ----- 5. PostCSS config -----
  echo "→ Writing postcss.config.js..."
  cat > postcss.config.js << 'POSTCSS'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSS

  # ----- 6. Tailwind directives in CSS (replaces Vite defaults) -----
  echo "→ Writing src/index.css with Tailwind directives..."
  cat > src/index.css << 'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;
CSS

  # ----- 7. tsconfig.json with path aliases -----
  echo "→ Writing tsconfig.json with path aliases..."
  cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
TSCONFIG

  # ----- 8. Inject paths into tsconfig.app.json if missing -----
  if ! grep -q '"paths"' tsconfig.app.json 2>/dev/null; then
    echo "→ Adding paths to tsconfig.app.json..."
    # Use node to safely merge JSON
    node -e "
      const fs = require('fs');
      const cfg = JSON.parse(fs.readFileSync('tsconfig.app.json', 'utf8'));
      cfg.compilerOptions = cfg.compilerOptions || {};
      cfg.compilerOptions.baseUrl = '.';
      cfg.compilerOptions.paths = { '@/*': ['./src/*'] };
      fs.writeFileSync('tsconfig.app.json', JSON.stringify(cfg, null, 2) + '\n');
    "
  fi

  # ----- 9. Vite config with @ alias -----
  echo "→ Writing vite.config.ts with @ path alias..."
  cat > vite.config.ts << 'VITE'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
VITE

  echo "✅ apps/$app setup complete"
  cd ../..
done

# ----- 10. Install everything from root -----
echo ""
echo "========================================="
echo "  Running pnpm install from root"
echo "========================================="
pnpm install

echo ""
echo "========================================="
echo "  All apps configured!"
echo "========================================="
echo ""
echo "Next step: cd into each app and run:"
echo "  pnpx shadcn@latest init"
echo ""
echo "Use these shadcn options:"
echo "  TypeScript:    Yes"
echo "  Style:         Default"
echo "  Base color:    Slate"
echo "  CSS file:      src/index.css"
echo "  CSS variables: Yes"
echo "  Tailwind cfg:  tailwind.config.js"
echo "  Components:    @/components"
echo "  Utils:         @/lib/utils"
