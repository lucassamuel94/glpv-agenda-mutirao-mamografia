# Empty State Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a consistent one-shot entrance animation to every real empty-content state in the web app.

**Architecture:** Define one global `empty-state-enter` animation with a reduced-motion override. The shared `EmptyState` component will opt in by default, while direct empty renderings will receive the same utility only when they represent missing records or availability—not loading, errors, or filtered search results.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, global CSS keyframes, Vitest, Testing Library, ESLint.

## Global Constraints

- Animation runs once on mount; it must not loop.
- Loading, error, and filtered-search empty states must not receive the animation.
- `prefers-reduced-motion: reduce` removes movement and perceptible transition.
- Do not change copy, data contracts, actions, or navigation.
- Preserve the existing continuous-surface/table layout.

---

### Task 1: Add the shared animation contract

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/modules/common/empty-state.tsx`
- Create: `apps/web/src/modules/common/empty-state.test.tsx`

**Interfaces:**
- Produces the reusable CSS class `.animate-empty-state-enter`.
- `EmptyState` applies the class by default and exposes `animate?: boolean` for filtered states that must opt out.

- [ ] **Step 1: Write the failing test**

Render `EmptyState` with its default props and with `animate={false}`. Assert that the default root has `animate-empty-state-enter` and the opt-out root does not.

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `apps/web`:

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state.test.tsx --reporter=verbose
```

Expected: the test fails because `animate` and the class do not exist yet.

- [ ] **Step 3: Implement the minimal shared behavior**

Add `animate?: boolean` with default `true`, merge `animate-empty-state-enter` into the `Card` class only when enabled, and add this global CSS:

```css
@keyframes emptyStateEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-empty-state-enter {
  animation: emptyStateEnter 0.32s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .animate-empty-state-enter {
    animation: none;
  }
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run the same Vitest command. Expected: 2 tests pass.

### Task 2: Exclude filtered shared empty states

**Files:**
- Modify: `apps/web/src/views/Team.tsx`
- Modify: `apps/web/src/views/AdminAudit.tsx`

**Interfaces:**
- Both screens pass `animate={false}` only when their active filters/search make the empty result a filtered result.

- [ ] **Step 1: Add the focused assertions**

Extend the shared empty-state test or view tests to cover the explicit `animate={false}` contract; do not add browser-only tests for network-backed views.

- [ ] **Step 2: Implement the conditional opt-out**

Use `animate={activeFiltersCount === 0}` in `Team.tsx` and a boolean derived from `filters.outcome`, `filters.cross_tenant`, and `filters.entity` in `AdminAudit.tsx`.

- [ ] **Step 3: Run focused tests and lint**

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state.test.tsx --reporter=verbose
./node_modules/.bin/eslint src/views/Team.tsx src/views/AdminAudit.tsx src/modules/common/empty-state.tsx
```

### Task 3: Animate direct record and availability empty states

**Files:**
- Modify: `apps/web/src/modules/agenda/clinic-balance-bar.tsx`
- Modify: `apps/web/src/modules/agenda/day-slots-panel.tsx`
- Modify: `apps/web/src/modules/agenda/suggestions-panel.tsx`
- Modify: `apps/web/src/views/Patients.tsx`
- Modify: `apps/web/src/views/Reports.tsx`
- Modify: `apps/web/src/views/Dashboard.tsx`
- Modify: `apps/web/src/views/SuperAdmin.tsx`
- Modify: `apps/web/src/views/WaitingList.tsx`
- Modify: `apps/web/src/views/Clinics.tsx`
- Modify: `apps/web/src/modules/users/organization-switcher-dialog.tsx`
- Modify: `apps/web/src/modules/profile/profile-dialog.tsx`

**Interfaces:**
- Direct empty elements use `.animate-empty-state-enter` without changing their current surface, spacing, or copy.
- Search-result messages in `Reports.tsx` and `patient-search.tsx` remain unanimated.
- Table rows animate only for unfiltered no-record states; filtered rows remain unchanged.

- [ ] **Step 1: Add the class to real no-record states**

Apply the class to the empty paragraph/card/table-row wrappers for unavailable clinics, appointments, slots, suggestions, organizations, profile links, and unfiltered table empties.

- [ ] **Step 2: Keep filtered and loading branches unchanged**

Do not add the class to messages containing search terms, active-filter explanations, loading text, or error components.

- [ ] **Step 3: Run TypeScript/lint checks for the touched files**

```bash
./node_modules/.bin/eslint src/modules/agenda/clinic-balance-bar.tsx src/modules/agenda/day-slots-panel.tsx src/modules/agenda/suggestions-panel.tsx src/views/Patients.tsx src/views/Reports.tsx src/views/Dashboard.tsx src/views/SuperAdmin.tsx src/modules/users/organization-switcher-dialog.tsx src/modules/profile/profile-dialog.tsx
```

### Task 4: Full verification

**Files:**
- No new files.

- [ ] **Step 1: Run the focused empty-state test**

```bash
./node_modules/.bin/vitest run src/modules/common/empty-state.test.tsx --reporter=verbose
```

- [ ] **Step 2: Run the web test suite**

```bash
pnpm --filter @ez-starter-kit/web test
```

- [ ] **Step 3: Run the web build**

```bash
pnpm --filter @ez-starter-kit/web build
```

- [ ] **Step 4: Check the final diff**

```bash
git diff --check
git status --short
```

Report any environment limitations separately from product failures.
