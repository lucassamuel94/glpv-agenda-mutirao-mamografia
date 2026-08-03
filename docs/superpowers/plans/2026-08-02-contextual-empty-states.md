# Contextual Empty States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic empty-state fade with a contextual illustrated empty state for tables, searches, and availability views.

**Architecture:** Add a CSS/HTML illustration primitive with typed `kind` and `mode` variants, then make `EmptyState` render it with contextual title, description, and action content. Migrate real table/search empties to this primitive while keeping loading, errors, and internal combobox results outside the pattern.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, global CSS, Lucide icons, Vitest, Testing Library, ESLint.

## Global Constraints

- `no-data`, `no-results`, and `no-availability` are distinct modes.
- Search empty states expose a clear-search/filter action.
- Record empty states expose a contextual create action when available.
- The illustration is decorative with `aria-hidden="true"`.
- Motion is one-shot only; no React timers and no continuous loop.
- `prefers-reduced-motion: reduce` disables entry, stagger, and movement.
- Loading, errors, and combobox/multiselect option empties do not use the contextual illustration.
- Preserve existing table surfaces, navigation, copy intent, and data contracts.

---

### Task 1: Build the contextual illustration primitive

**Files:**
- Create: `apps/web/src/modules/common/empty-state-illustration.tsx`
- Create: `apps/web/src/modules/common/empty-state-illustration.test.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**

```ts
export type EmptyStateKind =
  | "search"
  | "patients"
  | "clinics"
  | "users"
  | "agenda"
  | "waiting-list"
  | "audit";

export type EmptyStateMode = "no-data" | "no-results" | "no-availability";

export function EmptyStateIllustration({
  kind,
  mode,
}: {
  kind: EmptyStateKind;
  mode: EmptyStateMode;
}): React.ReactElement;
```

- [ ] **Step 1: Write failing tests**

Render `EmptyStateIllustration` for `patients/no-data` and `search/no-results`. Assert that the root exposes `aria-hidden="true"`, has the shared illustration class, and includes the contextual `data-empty-state-kind` and `data-empty-state-mode` attributes.

- [ ] **Step 2: Run tests and verify the failure**

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state-illustration.test.tsx --reporter=verbose
```

Expected: FAIL because the component and classes do not exist.

- [ ] **Step 3: Implement the illustration**

Create a semantic `div` with decorative stacked cards, a front card, contextual Lucide icon, and skeleton bars. Use CSS classes for the one-shot entrance and staggered decorative elements. Keep all text outside the decorative tree.

- [ ] **Step 4: Add CSS motion and reduced-motion rules**

Replace the old generic `.animate-empty-state-enter` behavior with named illustration/state rules. The default motion must be a short fade/translate; the front card may scale once; reduced motion must set animation to none and transform to none.

- [ ] **Step 5: Run the focused tests and lint**

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state-illustration.test.tsx --reporter=verbose
./node_modules/.bin/eslint src/modules/common/empty-state-illustration.tsx src/modules/common/empty-state-illustration.test.tsx
```

### Task 2: Upgrade `EmptyState` API and visual composition

**Files:**
- Modify: `apps/web/src/modules/common/empty-state.tsx`
- Modify: `apps/web/src/modules/common/empty-state.test.tsx`
- Modify: `apps/web/src/modules/common/error-message.tsx`
- Modify: `apps/web/src/components/MultiSelectList.tsx`

**Interfaces:**

```ts
interface EmptyStateProps {
  kind?: EmptyStateKind;
  mode?: EmptyStateMode;
  query?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  animate?: boolean;
  compact?: boolean;
  className?: string;
  variant?: CardProps["variant"];
}
```

- [ ] **Step 1: Add failing API tests**

Extend the shared test to render `kind="patients"`, `mode="no-results"`, and an action. Assert that the illustration attributes, title, description, and button are present. Assert that `animate={false}` omits the motion class.

- [ ] **Step 2: Run the focused test and verify the failure**

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state.test.tsx --reporter=verbose
```

- [ ] **Step 3: Implement the API**

Default `kind` to `search` and `mode` to `no-data`, render `EmptyStateIllustration` before the heading, retain the existing optional Lucide icon only for compatibility where no contextual kind is supplied, and preserve the existing action button contract.

- [ ] **Step 4: Keep non-contextual states excluded**

Set `animate={false}` and omit contextual illustration usage in `ErrorMessage` and `MultiSelectList`, since they represent errors and internal option filtering rather than page/table empties.

- [ ] **Step 5: Run focused tests and lint**

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state.test.tsx src/modules/common/empty-state-illustration.test.tsx --reporter=verbose
./node_modules/.bin/eslint src/modules/common/empty-state.tsx src/modules/common/empty-state.test.tsx src/modules/common/error-message.tsx src/components/MultiSelectList.tsx
```

### Task 3: Migrate shared table empty states

**Files:**
- Modify: `apps/web/src/views/Team.tsx`
- Modify: `apps/web/src/views/AdminAudit.tsx`

**Interfaces:**
- `Team.tsx` passes `kind="users"`, `mode="no-data"` when unfiltered, `mode="no-results"` when filtered, and preserves its invite action for `no-data`.
- `AdminAudit.tsx` passes `kind="audit"` and chooses `no-data` versus `no-results` from its active filters.

- [ ] **Step 1: Add contextual props and actions**

Pass the exact kind/mode values and provide `Limpar filtros` actions through the existing `clearFilters`/filter state handlers. Keep pagination and table surface classes intact.

- [ ] **Step 2: Run affected tests and lint**

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state.test.tsx --reporter=verbose
./node_modules/.bin/eslint src/views/Team.tsx src/views/AdminAudit.tsx
```

### Task 4: Migrate direct tables and searches

**Files:**
- Modify: `apps/web/src/views/Clinics.tsx`
- Modify: `apps/web/src/views/WaitingList.tsx`
- Modify: `apps/web/src/views/Patients.tsx`
- Modify: `apps/web/src/modules/patients/patient-search.tsx`
- Modify: `apps/web/src/views/Reports.tsx`
- Modify: `apps/web/src/views/Dashboard.tsx`
- Modify: `apps/web/src/views/SuperAdmin.tsx`
- Modify: `apps/web/src/modules/users/organization-switcher-dialog.tsx`
- Modify: `apps/web/src/modules/profile/profile-dialog.tsx`

**Interfaces:**
- Direct `<p>`, `<div>`, and table-cell empty branches become `EmptyState` instances or render the illustration/content inside their existing table surface.
- Search branches receive clear-search/filter actions that reset the existing state through current handlers.
- Unfiltered no-data branches receive existing create actions where the screen exposes them.

- [ ] **Step 1: Migrate no-data table states**

Use `clinics`, `waiting-list`, `patients`, `users`, or the corresponding contextual kind with `mode="no-data"`; retain current create buttons and add them to the empty state when already available.

- [ ] **Step 2: Migrate no-results search states**

Use `kind="search"` or the entity kind with `mode="no-results"`, show the active search term in the title/description, and wire `Limpar busca`/`Limpar filtros` to the existing state reset functions.

- [ ] **Step 3: Migrate availability states**

Use `kind="agenda"` and `mode="no-availability"` for empty slots, suggestions, and clinic balance states. Keep loading skeletons and the “choose a day” prerequisite message unchanged.

- [ ] **Step 4: Remove obsolete direct animation-only classes**

Remove the previous `animate-empty-state-enter`-only wrappers from direct states once they render the full contextual component. Keep the class only as an internal component implementation detail.

- [ ] **Step 5: Run lint on all migrated files**

```bash
./node_modules/.bin/eslint src/views/Clinics.tsx src/views/WaitingList.tsx src/views/Patients.tsx src/modules/patients/patient-search.tsx src/views/Reports.tsx src/views/Dashboard.tsx src/views/SuperAdmin.tsx src/modules/users/organization-switcher-dialog.tsx src/modules/profile/profile-dialog.tsx
```

### Task 5: Full verification

**Files:**
- No new files.

- [ ] **Step 1: Run all web tests**

```bash
./node_modules/.bin/vitest run
```

- [ ] **Step 2: Run the production build**

```bash
./node_modules/.bin/next build --webpack
```

- [ ] **Step 3: Check formatting and scope**

```bash
git diff --check
git status --short
```

- [ ] **Step 4: Inspect all contextual usages**

Confirm no loading, error, or multiselect empty branch receives the contextual illustration, and report browser visual validation separately if the browser environment is unavailable.
