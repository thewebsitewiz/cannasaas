# CLAUDE.md — apps/admin

Back-office for dispensary owners, managers, and staff with admin permissions. Inherits all rules from the root `CLAUDE.md`.

**Port:** `:5174`
**Audience:** authenticated dispensary staff with admin role
**Auth:** required everywhere (login is the entry point)

---

## Tenant resolution

Admin resolves the dispensary from the **authenticated user's claims** (JWT). Users may belong to multiple dispensaries within an organization — show a dispensary picker on login if `user.dispensaries.length > 1`.

`CurrentDispensaryService` (signal-based) holds the active dispensary. All GraphQL operations read its value. Switching dispensaries is a deliberate UI action — never silent.

---

## Theme

**Single internal theme.** Admin does not adopt the per-tenant theme system. It uses one consistent theme (`dark` or `modern` — final pick lives in `app.config.ts`).

- No `theme_configs` queries from this app.
- No `data-theme` attribute toggling.
- Components reference `@cannasaas/ui` tokens only — same tokens as the rest, but the chosen theme is fixed.

---

## RBAC

Every admin route is guarded by both `authGuard` and a role-based guard:

```ts
{ path: 'taxes', canMatch: [authGuard, hasRoleGuard('admin', 'super_admin')] }
```

Role checks are functional guards reading from `AuthService.roles()`. Don't reach for `*ngIf` equivalents in templates to hide UI based on roles — split into separate components or use route-level enforcement.

---

## Common patterns this app uses

### Drag-to-reorder

Menu Categories, product display order, etc. Use **`@angular/cdk/drag-drop`** (CDK is permitted in admin even though the rest of the app avoids Material). Persist order via a single mutation per drag end — debounce if users drag rapidly.

### Bulk operations

Tables in admin frequently support multi-select + bulk actions (publish, archive, price-adjust). Use a signal-based selection model:

```ts
readonly selected = signal<Set<string>>(new Set());
toggle(id: string) {
  this.selected.update(s => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}
```

### Heavy forms

Settings, dispensary configuration, tax rules. **Reactive Forms with strict typing.** Break long forms into stepper or sectioned forms — never one 50-field flat form. Use `effect()` to wire form state into derived signals (e.g., "form is dirty" indicators).

### Tables with server-side pagination/sort/filter

Default pattern: a feature service holds query params as signals, `rxResource()` fetches on changes:

```ts
readonly query = signal({ page: 0, sort: 'name', filter: '' });
readonly products = rxResource({
  request: () => this.query(),
  loader: ({ request }) => this.api.queryProducts(request),
});
```

---

## App-specific forbidden patterns

- Per-tenant dynamic theme injection (this is a storefront concern, not admin).
- Public/unauthenticated routes other than `/login` and `/forgot-password`.
- Payment processor SDK imports — admin views read transaction data through GraphQL, never integrates the processor directly.
- Storefront components imported directly (`@cannasaas/ui` is the bridge).

---

## Tailwind v4 setup specifics

`src/styles.css`:

```css
@import 'tailwindcss';
@import '@cannasaas/ui/themes/theme.dark.css'; /* fixed theme — adjust if final pick differs */

@source './**/*.{ts,html}';
@source '../../packages/ui/src/**/*.{ts,html,css}';
```

No `all-themes.css`, no `data-theme` switching — admin loads a single theme statically.

---

## Testing notes

- Mock `AuthService` and `CurrentDispensaryService` for every feature test.
- RBAC guards are critical-path; cover allow + deny for every protected route.
- Forms with cross-field validation: assert validators fire in both directions.
