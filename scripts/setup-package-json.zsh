#!/usr/bin/env zsh
# ================================================================
# CannaSaas — Workspace package.json Scaffold + Full Rebuild
#
# 1. Writes all 9 package.json files
# 2. rm -rf node_modules in every package directory
# 3. npm install  in every package directory  (-> package-lock.json)
# 4. pnpm install from workspace root         (-> pnpm-lock.yaml)
#
# Safe to re-run — existing files are overwritten and
# node_modules is fully rebuilt from scratch each time.
#
# Directories rebuilt (9):
#   .                        (workspace root)
#   packages/types
#   packages/stores
#   packages/api-client
#   packages/ui
#   packages/utils
#   apps/storefront
#   apps/admin
#   apps/staff
#
# Usage:
#   chmod +x setup-package-json.zsh
#   ./setup-package-json.zsh                   # ~/cannasaas-platform
#   ./setup-package-json.zsh /path/to/repo     # custom root
# ================================================================

set -euo pipefail

PLATFORM_ROOT="${1:-$HOME/cannasaas-platform}"

print -P "%F{green}▶  CannaSaas — package.json workspace scaffold%f"
print -P "%F{cyan}   Target root: ${PLATFORM_ROOT}%f"
echo ""

# ── Directories ───────────────────────────────────────────────────
mkdir -p "${PLATFORM_ROOT}"
mkdir -p "${PLATFORM_ROOT}/apps/admin"
mkdir -p "${PLATFORM_ROOT}/apps/staff"
mkdir -p "${PLATFORM_ROOT}/apps/storefront"
mkdir -p "${PLATFORM_ROOT}/packages/api-client"
mkdir -p "${PLATFORM_ROOT}/packages/stores"
mkdir -p "${PLATFORM_ROOT}/packages/types"
mkdir -p "${PLATFORM_ROOT}/packages/ui"
mkdir -p "${PLATFORM_ROOT}/packages/utils"

print -P "%F{green}✓  Directories ready%f"
echo ""

# ── [01/9] package.json ──────────────────────────────
print -P "%F{cyan}  [01/9]  package.json%f"
cat > "${PLATFORM_ROOT}/package.json" << 'PKG_EOF'
{
  "name": "cannasaas-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "turbo": "^1.12.4",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.8.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.1"
}
PKG_EOF

# ── [02/9] packages/types/package.json ──────────────────────────────
print -P "%F{cyan}  [02/9]  packages/types/package.json%f"
cat > "${PLATFORM_ROOT}/packages/types/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
PKG_EOF

# ── [03/9] packages/stores/package.json ──────────────────────────────
print -P "%F{cyan}  [03/9]  packages/stores/package.json%f"
cat > "${PLATFORM_ROOT}/packages/stores/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/stores",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zustand": "^4.5.0",
    "@cannasaas/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "react": "^18.2.0"
  }
}
PKG_EOF

# ── [04/9] packages/api-client/package.json ──────────────────────────────
print -P "%F{cyan}  [04/9]  packages/api-client/package.json%f"
cat > "${PLATFORM_ROOT}/packages/api-client/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/api-client",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.5",
    "@cannasaas/types": "workspace:*",
    "@cannasaas/stores": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "react": "^18.2.0"
  }
}
PKG_EOF

# ── [05/9] packages/ui/package.json ──────────────────────────────
print -P "%F{cyan}  [05/9]  packages/ui/package.json%f"
cat > "${PLATFORM_ROOT}/packages/ui/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "lucide-react": "^0.314.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "@cannasaas/types": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@axe-core/react": "^4.8.2",
    "jsdom": "^24.0.0",
    "vitest": "^1.2.2",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
PKG_EOF

# ── [06/9] packages/utils/package.json ──────────────────────────────
print -P "%F{cyan}  [06/9]  packages/utils/package.json%f"
cat > "${PLATFORM_ROOT}/packages/utils/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/utils",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "react": "^18.2.0"
  }
}
PKG_EOF

# ── [07/9] apps/storefront/package.json ──────────────────────────────
print -P "%F{cyan}  [07/9]  apps/storefront/package.json%f"
cat > "${PLATFORM_ROOT}/apps/storefront/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/storefront",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.5",
    "lucide-react": "^0.314.0",
    "@cannasaas/types": "workspace:*",
    "@cannasaas/stores": "workspace:*",
    "@cannasaas/api-client": "workspace:*",
    "@cannasaas/ui": "workspace:*",
    "@cannasaas/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "vitest": "^1.2.2",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@axe-core/react": "^4.8.2",
    "jsdom": "^24.0.0",
    "@playwright/test": "^1.41.1",
    "axe-playwright": "^1.2.3"
  }
}
PKG_EOF

# ── [08/9] apps/admin/package.json ──────────────────────────────
print -P "%F{cyan}  [08/9]  apps/admin/package.json%f"
cat > "${PLATFORM_ROOT}/apps/admin/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/admin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.5",
    "lucide-react": "^0.314.0",
    "recharts": "^2.10.3",
    "@cannasaas/types": "workspace:*",
    "@cannasaas/stores": "workspace:*",
    "@cannasaas/api-client": "workspace:*",
    "@cannasaas/ui": "workspace:*",
    "@cannasaas/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "vitest": "^1.2.2",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "jsdom": "^24.0.0"
  }
}
PKG_EOF

# ── [09/9] apps/staff/package.json ──────────────────────────────
print -P "%F{cyan}  [09/9]  apps/staff/package.json%f"
cat > "${PLATFORM_ROOT}/apps/staff/package.json" << 'PKG_EOF'
{
  "name": "@cannasaas/staff",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5175",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.5",
    "lucide-react": "^0.314.0",
    "@cannasaas/types": "workspace:*",
    "@cannasaas/stores": "workspace:*",
    "@cannasaas/api-client": "workspace:*",
    "@cannasaas/ui": "workspace:*",
    "@cannasaas/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "vitest": "^1.2.2",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "jsdom": "^24.0.0"
  }
}
PKG_EOF

# ── All directories that own a package.json ───────────────────────
WORKSPACE_DIRS=(
  "${PLATFORM_ROOT}"
  "${PLATFORM_ROOT}/packages/types"
  "${PLATFORM_ROOT}/packages/stores"
  "${PLATFORM_ROOT}/packages/api-client"
  "${PLATFORM_ROOT}/packages/ui"
  "${PLATFORM_ROOT}/packages/utils"
  "${PLATFORM_ROOT}/apps/storefront"
  "${PLATFORM_ROOT}/apps/admin"
  "${PLATFORM_ROOT}/apps/staff"
)

# ── Step 1: rm -rf node_modules in every package dir ──────────────
echo ""
print -P "%F{yellow}▶  Cleaning node_modules …%f"
for dir in "${WORKSPACE_DIRS[@]}"; do
  if [[ -d "${dir}/node_modules" ]]; then
    print -P "%F{red}    rm -rf ${dir}/node_modules%f"
    rm -rf "${dir}/node_modules"
  else
    print -P "%F{cyan}    skip (no node_modules): ${dir}%f"
  fi
done
print -P "%F{green}✓  node_modules cleaned%f"

# ── Step 2: npm install in every package dir ───────────────────────
echo ""
print -P "%F{yellow}▶  Running npm install in each directory …%f"
echo "   (generates package-lock.json per package)"
echo ""
for dir in "${WORKSPACE_DIRS[@]}"; do
  print -P "%F{cyan}  → npm install  in ${dir}%f"
  (cd "${dir}" && npm install) || {
    print -P "%F{red}  ✗  npm install failed in ${dir}%f"
    exit 1
  }
  print -P "%F{green}  ✓  ${dir}%f"
  echo ""
done
print -P "%F{green}✓  npm install complete in all directories%f"

# ── Step 3: pnpm install from workspace root ──────────────────────
echo ""
print -P "%F{yellow}▶  Running pnpm install from workspace root …%f"
echo "   (resolves workspace:* links + generates pnpm-lock.yaml)"
echo ""
(cd "${PLATFORM_ROOT}" && pnpm install) || {
  print -P "%F{red}✗  pnpm install failed — check output above%f"
  exit 1
}
print -P "%F{green}✓  pnpm install complete%f"

# ── Summary ───────────────────────────────────────────────────────
echo ""
print -P "%F{green}════════════════════════════════════════════%f"
print -P "%F{green}✓  All done%f"
print -P "%F{green}════════════════════════════════════════════%f"
echo ""
print -P "%F{cyan}package.json + lockfiles written in:%f"
for dir in "${WORKSPACE_DIRS[@]}"; do
  echo "  ${dir}"
done
echo ""
print -P "%F{cyan}Workspace package resolution:%f"
echo "  @cannasaas/types      → packages/types"
echo "  @cannasaas/stores     → packages/stores"
echo "  @cannasaas/api-client → packages/api-client"
echo "  @cannasaas/ui         → packages/ui"
echo "  @cannasaas/utils      → packages/utils"
echo ""
print -P "%F{yellow}Start dev servers:%f"
echo "  cd ${PLATFORM_ROOT} && pnpm dev"

